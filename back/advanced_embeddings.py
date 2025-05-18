import os
import json
import openai
import time

openai.api_key = "API_KEY"

## price 와 image 는 사용하지 않고 embdding 생성, 두가지를 제외하여 자연어로 변환, json 파일로 저장
## 만약 이미 자연어 파일이 존재한다면 새로운 jsoon 자연어는 생성하지 않고 기존 json 파일을 사용하여 임베딩 값 생성

# 텍스트 변환 함수
def menu_to_text(item):
    name = item.get("name", "")
    description = item.get("description", "")
    aka = ", ".join(item.get("aka", []))
    hot = "따뜻" if item.get("hot", "Y") == "Y" else "차가움"
    caffeine = item.get("caffine", 0)
    sugar = item.get("suger", 0)

    return f"메뉴 이름: {name}. {description} 별명: {aka}. 이 음료는 {hot}하며, 카페인은 {caffeine}mg, 당은 {sugar}g입니다."

# 파일 경로
MENU_FILE = "menu_with_description.json"
TEXT_FILE = "menu_texts.json"
EMBED_FILE = "menu_with_embedding.json"

# Step 1: menu_texts.json 생성 또는 불러오기
if not os.path.exists(TEXT_FILE):
    print("🔹 텍스트 파일이 없어 새로 생성합니다.")
    with open(MENU_FILE, "r", encoding="utf-8") as f:
        menu_items = json.load(f)

    texts = []
    for item in menu_items:
        text = menu_to_text(item)
        texts.append({"name": item["name"], "text": text})
    
    with open(TEXT_FILE, "w", encoding="utf-8") as f:
        json.dump(texts, f, ensure_ascii=False, indent=2)
    print("✅ menu_texts.json 생성 완료!")
else:
    print("✅ 기존 텍스트 파일이 있어 그대로 사용합니다.")
    with open(TEXT_FILE, "r", encoding="utf-8") as f:
        texts = json.load(f)

# Step 2: 임베딩 생성 및 저장
embedded_items = []
for item in texts:
    try:
        response = openai.Embedding.create(
            model="text-embedding-ada-002",
            input=item["text"]
        )
        embedding = response["data"][0]["embedding"]
    except Exception as e:
        print(f"[오류] {item['name']} 임베딩 실패: {e}")
        embedding = []

    embedded_items.append({
        "name": item["name"],
        "text": item["text"],
        "embedding": embedding
    })

    print(f"임베딩 완료: {item['name']}")
    time.sleep(1)  # rate limit 방지

# 저장
with open(EMBED_FILE, "w", encoding="utf-8") as f:
    json.dump(embedded_items, f, ensure_ascii=False, indent=2)

print("🎉 모든 임베딩 생성 완료!")
