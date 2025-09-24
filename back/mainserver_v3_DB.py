#pip install -r requirements.txt

from flask import Flask, request, jsonify, Blueprint
from flask_cors import CORS
from openai import OpenAI
import json
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from dotenv import load_dotenv
import os
import logging
from supabase import create_client, Client

# 환경 변수 로딩 (.env OPENAI_API_KEY)
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Supabase 클라이언트 초기화
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL과 SUPABASE_KEY 환경변수가 필요합니다.")
supabase: Client = create_client(supabase_url, supabase_key)

# DB 기반 시스템으로 전환 완료 - JSON 파일 경로 제거

# 메뉴 설명 임베딩 사전 생성
def get_embedding(text):
    try:
        response = client.embeddings.create(
            input=text,
            model="text-embedding-ada-002"
        )
        return response.data[0].embedding
    except Exception as e: # OpenAI API 호출 중 오류 발생
        app_logger = logging.getLogger("recommendations") #logger 적용으로 restful api 호출 시 오류 로깅
        app_logger.exception(f"임베딩 생성 중 오류 발생: {e}")
        return []

# 사용자 의도 추출 (GPT 사용)
def extract_user_intent(user_input):
    system_prompt = """
너는 카페 음료 추천을 위한 입력 분석기야. 사용자의 문장에서 메뉴 추론에 쓸 핵심 키워드(query), 온도(temperature), 수량(quantity)을 분리해줘. 없으면 null로 둬.

결과는 반드시 아래 JSON 형식으로 줘:
{
  "query": "메뉴 핵심 단어",
  "temperature": "hot | ice | null",
  "quantity": 정수 (기본 1)
}
"""
    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_input}
            ],
            temperature=0.2
        )
        content = response.choices[0].message.content
        parsed = json.loads(content)
        return parsed
    except Exception as e:
        app_logger = logging.getLogger("recommendations")
        app_logger.exception(f"❌ GPT 호출 실패: {e}")
        return {
            "query": user_input,
            "temperature": None,
            "quantity": 1
        }

# DB 연결 테스트 함수
def test_db_connection():
    """DB 연결을 테스트합니다."""
    try:
        # 실제 데이터를 가져와서 행 개수를 확인
        response = supabase.table('menus').select('id').execute()
        menu_count = len(response.data) if response.data else 0
        print(f"DB 연결 성공, 메뉴 개수: {menu_count}")
        return True
    except Exception as e:
        print(f"DB 연결 실패: {e}")
        return False

# DB에서 메뉴 데이터 로딩 함수
def load_menu_data_from_db():
    """DB에서 메뉴 데이터와 임베딩을 로드합니다."""
    try:
        # 임베딩을 포함한 모든 데이터 조회
        response = supabase.table('menus').select('*').execute()
        if response.data:
            # 임베딩 데이터를 올바른 형태로 변환
            for item in response.data:
                if item.get('embedding'):
                    embedding = item['embedding']
                    if isinstance(embedding, str):
                        # 문자열을 파싱하여 숫자 배열로 변환
                        import ast
                        try:
                            item['embedding'] = ast.literal_eval(embedding)
                        except (ValueError, SyntaxError) as e:
                            # 파싱 실패 시 치명적 오류로 처리
                            error_msg = f"임베딩 데이터 파싱 실패 - 메뉴: {item.get('name', 'Unknown')}, 오류: {e}"
                            logging.getLogger("recommendations").error(error_msg)
                            print(f"{error_msg}")
                            print("서버를 시작 불가, DB의 임베딩 데이터에서 문제가 확인 되었습니다.")
                            exit(1)
            return response.data
        else:
            logging.getLogger("recommendations").warning("DB에서 메뉴 데이터를 찾을 수 없습니다.")
            return [] # 빈칸이라 warning
    except Exception as e:
        logging.getLogger("recommendations").error(f"DB에서 메뉴 데이터 로딩 실패: {e}")
        raise Exception(f"DB 데이터 로딩 실패: {e}")  # 연결 실패 error 

# DB 연결 테스트 및 메뉴 데이터 로딩
print("DB 연결 테스트 진행중...")
if not test_db_connection():
    print("DB 연결 실패, 서버 종료")
    exit(1)

print("메뉴 데이터 로딩 중...")
try:
    menu_data = load_menu_data_from_db()
    if not menu_data:
        print("메뉴 데이터가 빈칸, 서버를 종료.")
        exit(1)
    
    menu_dict = {item["name"]: item for item in menu_data}
    print(f"데이터 로드 완료: 총 {len(menu_data)}개 메뉴")
except Exception as e:
    print(f"데이터 로드 실패, 서버 시작 불가 : {e}")
    exit(1)

# Flask 설정
app = Flask(__name__)
CORS(app)

# 리소스 기반 경로 변경
def _compute_recommendations(query_text):
    if not menu_data:
        return None, {"error": {"code": "MENU_DATA_UNAVAILABLE", "message": "메뉴 데이터가 준비되지 않았습니다."}}, 500

    user_embedding = get_embedding(query_text)
    if not user_embedding:
        return None, {"error": {"code": "EMBEDDING_SERVICE_ERROR", "message": "임베딩 생성에 실패했습니다."}}, 502

    similarities = []

    for item in menu_data:
        sim = cosine_similarity([user_embedding], [item["embedding"]])[0][0]
        similarities.append((item, sim))

    top_items = sorted(similarities, key=lambda x: x[1], reverse=True)[:3]
    recommendations = [
        {
            "name": item[0]["name"],
            "description": item[0]["search_text"],  # DB의 search_text 필드 사용
            "image": item[0].get("image_url", "img/placeholder.jpg")  # DB에서는 image_url 필드 사용
        }
        for item in top_items
    ]

    return recommendations, None, 200


# Blueprint 적용
api_v1 = Blueprint("api_v1", __name__, url_prefix="/api/v1")

@api_v1.get("/menus")
def get_menus():
    """모든 메뉴 목록을 반환합니다."""
    try:
        # DB에서 메뉴 데이터 조회 (임베딩 제외)
        response = supabase.table('menus').select('id, name, image_url, price, is_hot, caffeine_mg, sugar_g, description, aliases').execute()
        
        if response.data:
            # 프론트엔드에서 필요한 형식으로 변환
            menus = []
            for item in response.data:
                menu = {
                    "name": item["name"],
                    "image": item["image_url"],
                    "price": item["price"],
                    "hot": "Y" if item["is_hot"] else "N",
                    "caffeine": item["caffeine_mg"],
                    "sugar": item["sugar_g"],
                    "description": item["description"],
                    "aka": item["aliases"]
                }
                menus.append(menu)
            
            return jsonify({"data": menus}), 200
        else:
            return jsonify({"error": {"code": "NO_MENUS_FOUND", "message": "메뉴 데이터를 찾을 수 없습니다."}}), 404
            
    except Exception as e:
        logging.getLogger("recommendations").error(f"메뉴 목록 조회 실패: {e}")
        return jsonify({"error": {"code": "MENU_FETCH_ERROR", "message": "메뉴 목록을 가져오는데 실패했습니다."}}), 500

@api_v1.get("/recommendations")
def get_recommendations():
    query = request.args.get("q") # 사용자 입력
    temperature = request.args.get("temperature")  # HOT|ICE
    quantity = request.args.get("quantity", default=1, type=int) # 기본 정수형 

    if not query: # 사용자 입력 없으면 400 에러 추가
        return jsonify({"error": {"code": "VALIDATION_ERROR", "message": "q is required"}}), 400

    recommendations, err, status = _compute_recommendations(query) 
    if err: 
        return jsonify(err), status

    return jsonify({
        "data": {
            "intent": {"query": query, "temperature": temperature, "quantity": quantity},
            "recommendations": recommendations
        }
    }), 200

#POST 방식 적용
@api_v1.post("/recommendations")
def post_recommendations():
    body = request.get_json(silent=True) or {}
    query = body.get("query")
    temperature = body.get("temperature")
    quantity = body.get("quantity", 1)

    if not query:
        return jsonify({"error": {"code": "VALIDATION_ERROR", "message": "query is required"}}), 400

    recommendations, err, status = _compute_recommendations(query)
    if err:
        return jsonify(err), status

    return jsonify({
        "data": {
            "intent": {"query": query, "temperature": temperature, "quantity": quantity},
            "recommendations": recommendations
        }
    }), 200


# Blueprint 등록
app.register_blueprint(api_v1)

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=False)
