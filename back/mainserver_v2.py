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
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# 파일 경로
MENU_FILE = "back/menu_raw.json"  # 수정되지 않는 상세 메뉴 파일
EMBED_FILE = "back/menu_with_embedding.json"  # 임베딩 저장 파일

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
        print(f"❌ GPT 호출 실패: {e}")
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
    print("⚠️ menu_with_embedding.json 파일이 없습니다. advanced_embeddings.py를 먼저 실행해주세요.")
    menu_data = []
    menu_dict = {}

# Flask 설정
app = Flask(__name__)
CORS(app)

@app.route('/send_text', methods=['POST'])
def recommend_menu():
    data = request.json
    user_input = data.get("text", "")
    print(f"사용자 입력: {user_input}")

    # GPT로 의도 추출
    intent = extract_user_intent(user_input)
    print(f"🔍 추출된 의도: {json.dumps(intent, ensure_ascii=False)}")

    query_text = intent["query"]

    # query 기준으로 임베딩 생성
    user_embedding = get_embedding(query_text)
    similarities = []

    for item in menu_data:
        sim = cosine_similarity([user_embedding], [item["embedding"]])[0][0]
        similarities.append((item, sim))

    top_items = sorted(similarities, key=lambda x: x[1], reverse=True)[:3]

    result = {
        "message": "추천 메뉴를 안내해드릴게요!",
        "intent": intent,
        "recommendations": [
            {
                "name": item[0]["name"],
                "description": item[0]["text"],
                "image": menu_dict.get(item[0]["name"], {}).get("image", "img/placeholder.jpg")
            }
            for item in top_items
        ]
    }

    print(result)
    return jsonify(result)

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)
