#pip install -r requirements.txt

from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
import json
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from dotenv import load_dotenv
import os

# 환경 변수 로딩 (.env OPENAI_API_KEY)
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))  # 또는 직접 키 입력

# 상대경로로 menu.json 불러오기
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MENU_PATH = os.path.join(BASE_DIR, "../front/menu.json")
EMBEDDED_MENU_PATH = os.path.join(BASE_DIR, "menu_with_embedding.json")

with open(MENU_PATH, "r", encoding="utf-8") as f:
    menu_data = json.load(f)

# 메뉴 설명 임베딩 사전 생성
def get_embedding(text):
    try:
        response = client.embeddings.create(
            input=text,
            model="text-embedding-ada-002"
        )
        return response.data[0].embedding
    except Exception as e: # OpenAI API 호출 중 오류 발생
        print(f"임베딩 생성 중 오류 발생: {e}")
        return []  # 빈 리스트 반환
#추가 정보 입력
def enrich_description(item):
    desc = item["description"]
    caffeine_info = f"카페인 함량은 {item['caffeine']}mg이며"
    sugar_info = f"당분은 {item['suger']}g입니다."
    return f"{desc}. {caffeine_info}, {sugar_info}"

# 임베딩 데이터 로딩 또는 생성
if os.path.exists(EMBEDDED_MENU_PATH):
    with open(EMBEDDED_MENU_PATH, "r", encoding="utf-8") as f:
        menu_data = json.load(f)
else:
    with open(MENU_PATH, "r", encoding="utf-8") as f:
        menu_data = json.load(f)

    for item in menu_data:
        enriched_desc = enrich_description(item)
        item["embedding"] = get_embedding(enriched_desc)

    # 저장
    with open(EMBEDDED_MENU_PATH, "w", encoding="utf-8") as f:
        json.dump(menu_data, f, ensure_ascii=False, indent=2)

# Flask 설정
app = Flask(__name__)
CORS(app)

@app.route('/send_text', methods=['POST'])
def recommend_menu():
    data = request.json
    user_input = data.get("text", "")
    print(f"사용자 입력: {user_input}")

    user_embedding = get_embedding(user_input) # 입력값으로 임베딩 생성
    similarities = []

    for item in menu_data:
        sim = cosine_similarity([user_embedding], [item["embedding"]])[0][0]
        similarities.append((item, sim))

    top_items = sorted(similarities, key=lambda x: x[1], reverse=True)[:3]

    # 전체 메뉴 정보는 프론트가 필요할 때 따로 요청
    # 여기선 순위별 이름만 추출
    result = {
    "message": "추천 메뉴를 안내해드릴게요!",
    "recommendations": [
        {
            "name": item[0]["name"],
            "image": item[0]["image"],
            "description": item[0]["description"]
        }
        for item in top_items
    ]
}

    print(result)
    return jsonify(result)



if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)
