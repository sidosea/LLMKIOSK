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
# DB 기반 시스템으로 전환 완료 - JSON 파일 경로 제거

# 사용자 입력 로깅 설정
user_input_logger = logging.getLogger("user_input")
if not user_input_logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter("[%(asctime)s] %(levelname)s - %(message)s")
    handler.setFormatter(formatter)
    user_input_logger.addHandler(handler)
user_input_logger.setLevel(logging.INFO)
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

# 여러 주문 추출 (GPT 사용)
def extract_multiple_orders(user_input):
    """사용자 입력에서 여러 개의 주문을 추출합니다."""
    system_prompt = """
너는 카페 주문 분석기야. 사용자의 문장에서 여러 개의 주문을 찾아서 각각의 메뉴 이름(query), 온도(temperature), 수량(quantity)을 추출해줘.

예시:
- "아아 두잔 콜라보 한잔" → [{"query": "아아", "temperature": "ice", "quantity": 2}, {"query": "콜라보", "temperature": null, "quantity": 1}]
- "아메리카노 3개 라떼 하나" → [{"query": "아메리카노", "temperature": null, "quantity": 3}, {"query": "라떼", "temperature": null, "quantity": 1}]

결과는 반드시 아래 JSON 형식으로 줘 (배열):
[
  {
    "query": "메뉴 핵심 단어",
    "temperature": "hot | ice | null",
    "quantity": 정수 (기본 1)
  }
]

주문이 하나만 있어도 배열로 반환해줘.
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
        # 배열이 아닌 경우 배열로 변환
        if not isinstance(parsed, list):
            parsed = [parsed]
        return parsed
    except Exception as e:
        app_logger = logging.getLogger("recommendations")
        app_logger.exception(f"❌ GPT 호출 실패 (여러 주문 추출): {e}")
        # 실패 시 기본값: 하나의 주문으로 처리
        return [{
            "query": user_input,
            "temperature": None,
            "quantity": 1
        }]

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

    print(f"데이터 로드 완료: 총 {len(menu_data)}개 메뉴")
except Exception as e:
    print(f"데이터 로드 실패, 서버 시작 불가 : {e}")
    exit(1)

# Flask 설정
# 프론트엔드 정적 파일 서빙을 위한 설정
frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'front')
app = Flask(__name__, static_folder=frontend_path, static_url_path='')
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

def _find_best_menu_match(query_text):
    """입력 텍스트로 가장 유사한 메뉴 한 개를 반환합니다."""
    if not menu_data:
        return None, 0.0
    user_embedding = get_embedding(query_text)
    if not user_embedding:
        return None, 0.0
    best_item = None
    best_score = -1.0
    for item in menu_data:
        sim = cosine_similarity([user_embedding], [item["embedding"]])[0][0]
        if sim > best_score:
            best_score = sim
            best_item = item
    return best_item, float(best_score)

def _parse_order_from_text(text):
    """자연어에서 의도와 수량을 추출합니다. (단일 주문용)"""
    intent = extract_user_intent(text)
    query = intent.get("query") or text
    quantity = intent.get("quantity") or 1
    try:
        quantity = int(quantity)
    except Exception:
        quantity = 1
    if quantity <= 0:
        quantity = 1
    temperature = intent.get("temperature")
    return {"query": query, "quantity": quantity, "temperature": temperature}

def _parse_orders_from_text(text):
    """자연어에서 여러 개의 주문을 추출합니다."""
    orders = extract_multiple_orders(text)
    parsed_orders = []
    for order in orders:
        query = order.get("query") or text
        quantity = order.get("quantity") or 1
        try:
            quantity = int(quantity)
        except Exception:
            quantity = 1
        if quantity <= 0:
            quantity = 1
        temperature = order.get("temperature")
        parsed_orders.append({
            "query": query,
            "quantity": quantity,
            "temperature": temperature
        })
    return parsed_orders

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

    user_input_logger.info(
        "POST /api/v1/recommendations - query=%s, temperature=%s, quantity=%s, body=%s",
        query,
        temperature,
        quantity,
        body,
    )

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

@api_v1.post("/orders/text")
def create_order_from_text():
    """자연어 입력(예: '아아 2잔 콜라보 한잔')으로 여러 주문을 생성하고 결제 진입 정보를 반환합니다."""
    body = request.get_json(silent=True) or {}
    text = body.get("text")
    user_input_logger.info("POST /api/v1/orders/text - raw_text=%s", text)
    if not text:
        return jsonify({"error": {"code": "VALIDATION_ERROR", "message": "text is required"}}), 400

    # 여러 주문 파싱
    parsed_orders = _parse_orders_from_text(text)

    if not parsed_orders:
        return jsonify({"error": {"code": "NO_ORDERS_FOUND", "message": "주문을 추출할 수 없습니다."}}), 400

    # 각 주문에 대해 메뉴 매칭
    order_results = []
    errors = []

    for idx, parsed in enumerate(parsed_orders):
        query = parsed["query"]
        quantity = parsed["quantity"]
        temperature = parsed["temperature"]

        # 메뉴 매칭
        matched_menu, score = _find_best_menu_match(query)
        if not matched_menu:
            errors.append({
                "index": idx,
                "query": query,
                "error": "해당하는 메뉴를 찾지 못했습니다."
            })
            continue

        order_results.append({
            "intent": {
                "query": query,
                "temperature": temperature,
                "quantity": quantity
            },
            "match": {
                "menuId": matched_menu.get("id"),
                "name": matched_menu.get("name"),
                "unitPrice": matched_menu.get("price") or 0,
                "image": matched_menu.get("image_url"),
                "temperature": temperature
            },
            "similarityScore": float(score)
        })

    # 일부 주문만 성공한 경우도 반환 (경고 포함)
    if not order_results:
        return jsonify({
            "error": {
                "code": "ALL_ORDERS_FAILED",
                "message": "모든 주문에서 메뉴를 찾지 못했습니다.",
                "details": errors
            }
        }), 404

    response_data = {
        "data": {
            "orders": order_results
        }
    }

    # 일부 실패한 경우 경고 추가
    if errors:
        response_data["warnings"] = {
            "message": "일부 주문에서 메뉴를 찾지 못했습니다.",
            "failedOrders": errors
        }

    return jsonify(response_data), 200


# Blueprint 등록
app.register_blueprint(api_v1)

# 프론트엔드 메인 페이지 라우트
@app.route('/')
def index():
    """프론트엔드 메인 페이지를 서빙합니다."""
    return app.send_static_file('index.html')

@app.route('/<path:path>')
def serve_static(path):
    """프론트엔드 정적 파일을 서빙합니다."""
    try:
        return app.send_static_file(path)
    except Exception:
        # 파일이 없으면 404
        return "File not found", 404

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 서버가 시작되었습니다!")
    print("="*60)
    print(f"💻 로컬 접속:")
    print(f"   http://localhost:5002")
    print(f"\n📡 API 엔드포인트:")
    print(f"   http://localhost:5002/api/v1/menus")
    print(f"   새 터미널에서 실행: ngrok http 5002")
    print("="*60 + "\n")
    
    app.run(host="0.0.0.0", port=5002, debug=True)
