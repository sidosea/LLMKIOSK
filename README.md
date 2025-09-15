<<작성중>>
---
일지
https://tin-oak-590.notion.site/1d18d7c109668042950df1845b779f11?source=copy_link

Readme.md 노션에서 읽기
https://tin-oak-590.notion.site/LLM-26f8d7c1096680ce8937eee3e641bbb7?pvs=73
---
LLM 대화 추론 키오스크

제가 발표할 프로젝트는 **대화 추론형 AI를 적용한 키오스크**입니다 

<img width="661" height="379" alt="Image" src="https://github.com/user-attachments/assets/fe8f2c43-00e1-4acf-a35d-c0ed6c2c4800" />


사용자가 정해진 명령어를 입력하는 방식이 아니라, **자연스럽게 묘사하는 말만으로도 원하는 주문을 이해하는 키오스크를 의미합니다.**

---

## **선정 배경**

지난 겨울 방학 동안 다양한 국가의 많은 가게의 키오스크를 사용해보면서, 직원에게 주문하는 것보다 불편하게 느껴지는 이유가 무엇일까 고민했습니다.

<img width="988" height="560" alt="Image" src="https://github.com/user-attachments/assets/7dca2d3c-d1e4-4d60-b084-d5cf2028d67b" />

그 결과,

- **조작법이 복잡하고 응답 지연이 발생하는 UI**,
- **직관적이지 않은 메뉴 구성**,
- **디지털 취약 계층 및 외국인의 사용 어렵다는**

등의 문제를 발견했습니다.

---

## **프로젝트의 주요 기능**

<img width="549" height="436" alt="Image" src="https://github.com/user-attachments/assets/5bccbbd3-f410-4ef6-abd7-a7b9ad865bbf" />

---

## **프랜차이즈마다 다른 이름**
<img width="1021" height="512" alt="Image" src="https://github.com/user-attachments/assets/d0ab864a-5ce4-4f70-817a-3eb1c5aa86bf" />

예를 들어, 한 할아버지가 믹스커피 맛이 나는 음료를 마시고 싶어서 카페에 들어갔다고 가정해 보겠습니다.

그런데 키오스크에는 "**원조커피**" 또는 "**레트로커피**"라는 이름만 있을 뿐, 이것이 믹스커피인지 아닌지 알기 어렵습니다.

설사 한 카페에서 원조커피가 믹스커피라는 걸 알았다고 해도, 다른 카페에서는 또 다른 이름으로 표기되어 있어 같은 경험을 반복해야 합니다.

이런 문제는 디지털 취약 계층만 겪는 것이 아닙니다.

<img width="517" height="610" alt="Image" src="https://github.com/user-attachments/assets/2044033f-a6c5-4312-a46f-7723a43a2480" />

스타벅스에서 신메뉴가 나왔을 때, 정확한 이름을 기억하지 못해 **"미드나잇 버... 어 뭐지? 그 보라색 신메뉴 주세요."**

이렇게 주문해본 경험이 있을 것입니다.

또는 "**카페인 없는 달달한 거 주세요**", "**그냥 잘 팔리는 거 주세요**" 같은 요청도 직원에게는 자연스럽지만, 기존 키오스크에서는 불가능합니다.

또한, "**아이스티에 샷을 추가하고 싶은데, 아이스티가 아이스 메뉴에 있는지, 시즌 메뉴인지, 따로 샷 추가 메뉴가 있는지**"

이런 식으로 메뉴의 위치와 구성이 복잡해 주문이 어려운 경험도 많습니다.

---

## **기대 효과**

**가게에 대화 추론형 AI 키오스크**를 도입할 경우

<img width="976" height="525" alt="Image" src="https://github.com/user-attachments/assets/0719e18d-b7e2-4b18-885f-f13878e5564d" />

---

# 임베딩이란?
<img width="618" height="237" alt="Image" src="https://github.com/user-attachments/assets/8c2b6239-3b26-460b-bc42-81adb036c661" />
<img width="548" height="332" alt="Image" src="https://github.com/user-attachments/assets/79bcb56f-05d3-4552-bc4c-fb6921511443" />

이 벡터 값을 활용하면 각 문자들 사이의 유사도에 대해 측정할 수 있는데, 망고 바나나 고양이 이 3가지 단어의 유사도를 좌표 평면에 나타내면 망고와 바나나는 유사하지만 고양이는 멀리 떨어져 있는 것을 볼 수있습니다.

즉 망고와 바나나는 과일이라는 속성을 갖고있기에 비슷한 값을 지니는데, 이러한 데이터를 바탕으로한 서비스에 “사과주스 있어?”라고 물어보면 “망고나 바나나는 있습니다”라는 답변을 들을 수 있다는 것입니다.

<img width="576" height="458" alt="Image" src="https://github.com/user-attachments/assets/8f010a4b-c8b8-453b-a2c6-85c1d14bf7bf" />

그렇다면 기준축이 두개 이상인 경우는 어떨까요?

샤와르마는 샌드위치와 비슷하게 생긴 중동요리로 다양한 속성에서 샌드위치와 유사합니다, 그렇다면 피자는 어떨까요? 빵과 채소, 고기라는 점은 어느정도 통하지만 핫도그보다는 적다고 판단되지 않나요?

축이 하나라면 이렇게 애매해지는 부분이 생기는데 축을 여러개 추가하면 조금 더 정확도를 올릴 수 있습니다. 이런 방식으로 1536차원으로 이뤄진 인경 신경망의 도움으로 사용자의 묘사를 이해하고 동작하게 됩니다.

---

# 임베딩 적용

<img width="405" height="206" alt="Image" src="https://github.com/user-attachments/assets/49f052cf-9d75-4b48-b9b9-376c3f3e3027" />
먼저 삽입할 데이터를 JSON 형식에 맞춰 생성합니다.

<img width="725" height="309" alt="Image" src="https://github.com/user-attachments/assets/0497ed8a-643b-4aac-95d9-96a552f0091e" />

이 정보를 chatGPT API를 사용하여 AI에게 바리스타라는 역할과 설명을 만드는 프롬프트를 사용해

`menu_description.py`를 사용하여 JSON 파일을 새로 생성합니다.

<img width="664" height="165" alt="Image" src="https://github.com/user-attachments/assets/0af2a1bb-daa8-46af-9cfb-b172156f0fbb" />

이렇게 생성된 텍스트 파일을 `advanced_embeddings.py`에서 OpenAI의 `text-embedding-ada-002` 모델을 사용해 임베딩합니다.


<img width="420" height="190" alt="Image" src="https://github.com/user-attachments/assets/21bc2c10-fa67-4151-9ec9-cfa1a53f4a2f" />

*완성된 벡터 값*

---

# 주문을 이해하는 방식

그렇다면 이제 어떤 방식으로 이 프로그램이 동작하는 지에 관하여 설명드리겠습니다.

<img width="941" height="808" alt="Image" src="https://github.com/user-attachments/assets/9596cdbd-6cca-4ffe-8866-5af801defd85" />

먼저 사용자가 음성인식 혹은 키보드를 활용하여 자연어를 통해 주문하면, 이를 LLM이 받아 사용자의 주문중, 임베딩이 필요한 단어와 그 자체로 명령어인 것을 분리합니다.

분리된 단어는 그자리에서 임베딩 한후, 미리 임베딩 해둔 벡터값을 저장한 DB에서 가장 유사한 값을 가진 메뉴를 탐색 후 출력합니다.

이렇게 받아진 결과와 기존 명령어를 합친후 완성된 영수증을 출력합니다.

---

### 최근 변경 사항 (25.09 기준)

JSON 파일 구조로 동작하던 기존 방식을 PostgreSQL로 마이그레이션 했습니다.(`moveToPostgreSQL.py`)

기존에는 MySQL과 Chroma DB로 각각 기본 DB, 벡터값 저장을 따로따로 하려하였으나 데이터 일관성의 문제와 성능 저하의 문제로 벡터값도 처리가 가능한 RDBMS인 PostgreSQL에 PGVector를 설치하여 처리하는 방식으로 변경하였습니다.

개발 환경을 데스크탑과 맥북 두개를 사용하기 때문에 데이터 일관성 문제가 생겨, 이를 해결하기 위해 Supabase를 사용해 DB 호스팅을 받았습니다. 

이외에도 코드의 가독성을 올리기 위해 RESTful API를 적용하는 등 전체적인 코드 리팩토링을 진행하였으며 현재 안정화된 버전으로 MVC 패턴을 적용 및 배포의 편리함을 위해 Docker를 사용하는 과정에 있으며 메인 서버는 컨테이너화를 완료했습니다.

---

## **개발 환경**

- **서버**: Flask (Python 기반 웹 서버)
- **음성 인식**: OpenAI Whisper 사용 예정
- **AI 모델**:
    - Open AI Embeddings 를 사용해 벡터 값을 도출
    - 현재는 GPT를 사용하여 주문 분리 기능을 처리 중
- **데이터베이스**:
    - PostgreSQL (Supabase 호스팅)
        - PGVector Extension
