import os
import json
import openai
import time
from tqdm import tqdm # 진행 상황 표시

openai.api_key = "API_KEY"

## price 와 image 는 사용하지 않고 embdding 생성, 두가지를 제외하여 자연어로 변환, json 파일로 저장
## 만약 이미 자연어 파일이 존재한다면 새로운 jsoon 자연어는 생성하지 않고 기존 json 파일을 사용하여 임베딩 값 생성

# 파일 경로
MENU_FILE = "menu_raw.json" #수정되지 않는 상세 메뉴 파일
TEXT_FILE = "menu_texts.json" # 자연어로 변환된 메뉴 파일
EMBED_FILE = "menu_with_embedding.json" # 임베딩 저장 파일

# 텍스트 변환 함수
def menu_to_text(item):
    name = item.get("name", "")
    description = item.get("description", "")
    aka = ", ".join(item.get("aka", []))
    hot = "따뜻" if item.get("hot", "Y") == "Y" else "차가움"
    caffeine = item.get("caffine", 0)
    sugar = item.get("suger", 0)

    return f"메뉴 이름: {name}. {description} 별명: {aka}. 이 음료는 {hot}하며, 카페인은 {caffeine}mg, 당은 {sugar}g입니다."

# Step 1: menu_texts.json 생성 또는 불러오기
def load_or_create_texts():
    if os.path.exists(TEXT_FILE):
        print("✅ menu_texts.json 파일이 있어 그대로 사용합니다.")
        with open(TEXT_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    else:
        print("🔹 텍스트 파일이 없어 새로 생성합니다.")
        with open(MENU_FILE, "r", encoding="utf-8") as f:
            menu_items = json.load(f)
        texts = [{"name": item["name"], "text": menu_to_text(item)} for item in menu_items]
        with open(TEXT_FILE, "w", encoding="utf-8") as f:
            json.dump(texts, f, ensure_ascii=False, indent=2)
        print("✅ menu_texts.json 생성 완료!")
        return texts
    

# Step 2: 임베딩 생성
def get_embedding(text, retry=3):
    for attempt in range(retry):
        try:
            response = openai.Embedding.create(
                model="text-embedding-ada-002",
                input=text
            )
            return response["data"][0]["embedding"]
        except Exception as e:
            print(f"⚠️ 임베딩 실패 (시도 {attempt+1}/{retry}): {e}")
            time.sleep(2)  # 잠시 대기 후 재시도
    return []

# Step 3: 저장
def generate_embeddings(texts):
    embedded_items = []

    # 기존 임베딩 결과가 있으면 불러옴 (중복 방지)
    if os.path.exists(EMBED_FILE):
        with open(EMBED_FILE, "r", encoding="utf-8") as f:
            embedded_items = json.load(f)
        done_names = {item["name"] for item in embedded_items}
    else:
        done_names = set()

    for item in tqdm(texts, desc="임베딩 생성 중"):
        if item["name"] in done_names:
            continue
        embedding = get_embedding(item["text"])
        embedded_items.append({
            "name": item["name"],
            "text": item["text"],
            "embedding": embedding
        })
        time.sleep(1)  # Rate limit 방지

    with open(EMBED_FILE, "w", encoding="utf-8") as f:
        json.dump(embedded_items, f, ensure_ascii=False, indent=2)
    print("🎉 모든 임베딩 생성 완료!")
    return embedded_items
# 메인 함수로 실행
def main():
    texts = load_or_create_texts()
    generate_embeddings(texts)

if __name__ == "__main__":
    main()
