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

# 환경 변수 로딩 (.env OPENAI_API_KEY)
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# 파일 경로 (os로 절대경로화)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MENU_FILE = os.path.join(BASE_DIR, "menu_raw.json")  # 수정되지 않는 상세 메뉴 파일
EMBED_FILE = os.path.join(BASE_DIR, "menu_with_embedding.json")  # 임베딩 저장 파일

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

# 임베딩 데이터와 원본 메뉴 데이터 로딩
if os.path.exists(EMBED_FILE):
    with open(EMBED_FILE, "r", encoding="utf-8") as f:
        menu_data = json.load(f)
    with open(MENU_FILE, "r", encoding="utf-8") as f:
        original_menu = json.load(f)
        # 메뉴 이름을 키로 하는 딕셔너리 생성
        menu_dict = {item["name"]: item for item in original_menu}
else:
    logging.getLogger("recommendations").warning(f"menu_with_embedding.json 파일이 없습니다. 경로: {EMBED_FILE} | advanced_embeddings.py를 먼저 실행해주세요.")
    menu_data = []
    menu_dict = {}

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
            "description": item[0]["text"],
            "image": menu_dict.get(item[0]["name"], {}).get("image", "img/placeholder.jpg")
        }
        for item in top_items
    ]

    return recommendations, None, 200


# Blueprint 적용
api_v1 = Blueprint("api_v1", __name__, url_prefix="/api/v1")

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
    app.run(host="0.0.0.0", port=5000, debug=True)
