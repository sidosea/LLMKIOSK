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


# 모든 메뉴 설명 임베딩화
for item in menu_data:
    item["embedding"] = get_embedding(item["description"])

# Flask 설정
app = Flask(__name__)
CORS(app)

@app.route('/send_text', methods=['POST'])
def recommend_menu():
    data = request.json
    user_input = data.get("text", "")
    print(f"사용자 입력: {user_input}")

    # 사용자 입력 임베딩
    user_embedding = get_embedding(user_input)

    # 각 메뉴와 유사도 계산
    similarities = []
    for item in menu_data:
        sim = cosine_similarity(
            [user_embedding],
            [item["embedding"]]
        )[0][0]
        similarities.append((item, sim))

    # 유사도 순 정렬 후 상위 3개 추출
    top_items = sorted(similarities, key=lambda x: x[1], reverse=True)[:3]
    #print(f"추천된 상위 3개 메뉴: {top_items}")  # 추천 메뉴를 출력 -- 확인 완료

    recommendations = [
        {
            "name": item["name"],
            "image": item["image"],
            "price": item["price"],
            "description": item["description"],
            "score": round(score, 3)
        }
        for item, score in top_items
    ]

    # 추천 결과가 제대로 출력되었는지 확인
    print(f"추천 결과: {recommendations}")

    return jsonify({"recommendations": recommendations})


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)
