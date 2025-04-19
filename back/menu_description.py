import json
import openai
import time

# OpenAI API 키 설정
openai.api_key = "API_KEY"

# 메뉴 JSON 불러오기
with open("menu.json", "r", encoding="utf-8") as f:
    menu_items = json.load(f)

# 메뉴 설명 생성 함수
def generate_description(menu_name):
    prompt = f"'{menu_name}'라는 음료 메뉴에 대해 스타벅스 스타일로 한 줄 설명을 해줘. 고객이 어떤 음료인지 잘 이해할 수 있게 간단하고 자연스럽게 설명해줘."
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4.1", # 모델 선택
            max_tokens=100,  # 최대 토큰 수, 과부하 방지
            messages=[
                {"role": "system", "content": "당신은 메뉴 설명을 잘하는 바리스타입니다."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )
        return response.choices[0].message["content"].strip()
    except Exception as e:
        print(f"[오류] {menu_name} 처리 중 문제 발생: {e}")
        return ""

# 모든 메뉴에 description 추가
for item in menu_items:
    if "description" not in item or not item["description"]:
        desc = generate_description(item["name"])
        print(f"{item['name']} → {desc}")
        item["description"] = desc
        time.sleep(1)  # API rate limit 방지

# 저장
with open("menu_with_description.json", "w", encoding="utf-8") as f:
    json.dump(menu_items, f, ensure_ascii=False, indent=2)

print("description 추가 완료!")
