from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
import json
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from dotenv import load_dotenv
import os

# 환경 변수 로딩 (.env 파일에 OPENAI_API_KEY 넣는 걸 권장)
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))  # 또는 직접 키 입력

# 메뉴 로드
with open('/Users/hyunsuk/Desktop/documents/LLMKIOSK/front/menu.json', "r", encoding="utf-8") as f:
    menu_data = json.load(f)

# 메뉴 설명 임베딩 사전 생성
def get_embedding(text):
    response = client.embeddings.create(
        input=text,
        model="text-embedding-ada-002"
    )
    return response.data[0].embedding

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

    return jsonify({"recommendations": recommendations})

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)
