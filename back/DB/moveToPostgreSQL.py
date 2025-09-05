import os
import json
from supabase import create_client, Client
from dotenv import load_dotenv

# .env 파일에서 환경 변수 불러오기
load_dotenv()

# Supabase 클라이언트 생성
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

# 1. 세 개의 JSON 파일 모두 불러오기
try:
    with open('menu_raw.json', 'r', encoding='utf-8') as f:
        raw_data = json.load(f)
    with open('menu_texts.json', 'r', encoding='utf-8') as f:
        texts_data = json.load(f)
    with open('menu_with_embedding.json', 'r', encoding='utf-8') as f:
        embedding_data = json.load(f)
except FileNotFoundError as e:
    print(f"파일 오류: {e}. JSON 파일들이 스크립트 위치 확인")
    exit()

# 2. 빠른 조회를 위해 text와 embedding 데이터를 딕셔너리로 변환
# 메뉴 이름을 key로 사용
texts_dict = {item['name']: item['text'] for item in texts_data}
embeddings_dict = {item['name']: item['embedding'] for item in embedding_data}

print("병합 업로딩 시작")

# 3. raw_data를 기준으로 데이터 병합 및 DB에 삽입
for raw_item in raw_data:
    item_name = raw_item.get('name')
    if not item_name:
        print("이름 없음")
        continue

    # 딕셔너리에서 데이터 조회
    search_text = texts_dict.get(item_name)
    embedding_vector = embeddings_dict.get(item_name)
    
    # 병합에 필요한 데이터가 누락된 경우 건너뛰기
    if not all([search_text, embedding_vector]):
        print(f"'{item_name}'의 text 또는 embedding 없음")
        continue

    # DB에 맞게 데이터 재구성
    data_to_insert = {
        'name': item_name,
        'image_url': raw_item.get('image'),
        'price': raw_item.get('price'),
        'is_hot': True if raw_item.get('hot') == 'Y' else False,
        'caffeine_mg': raw_item.get('caffine'),
        'sugar_g': raw_item.get('suger'),
        'description': raw_item.get('description'),
        'aliases': raw_item.get('aka'),
        'search_text': search_text,
        'embedding': embedding_vector
    }

    try:
        # 데이터 삽입
        data, count = supabase.table('menus').insert(data_to_insert).execute()
        print(f"성공: {data_to_insert['name']}")
    except Exception as e:
        print(f"실패: {data_to_insert['name']} - {e}")

print("\n데이터 처리가 완료")