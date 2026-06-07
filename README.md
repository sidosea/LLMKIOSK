<div align="center">
  <h1>이지오더 (EasyOrder)</h1>
  <p><strong>자연스럽게 묘사하는 말만으로 원하는 주문을 이해하는 키오스크 시스템</strong></p>
  <br />
  <div style="display: flex; gap: 2%; justify-content: center;">
    <img width="32%" alt="Kiosk UI 1" src="https://github.com/user-attachments/assets/fbfe7809-de45-40bc-83dc-e5111e617c95" />
    <img width="32%" alt="Kiosk UI 2" src="https://github.com/user-attachments/assets/72596c44-21d5-44f6-978a-28c7b454fd1a" />
    <img width="32%" alt="Kiosk UI 3" src="https://github.com/user-attachments/assets/64a49cfc-ce52-4504-991c-9078380d9361" />
  </div>
</div>

<br />

## 프로젝트 소개

**이지오더**는 사용자가 정해진 메뉴명을 정확히 입력하지 않아도, 자연어 묘사만으로 의도를 파악하고 원하는 주문을 처리하는 시스템입니다. 

기존 키오스크의 복잡한 조작법, 직관적이지 않은 메뉴 구성으로 인해 불편함을 겪는 일반 사용자 및 디지털 취약 계층에게 혁신적인 주문 경험을 제공하는 것을 목표로 합니다.

<br />

## 기술 스택 

### Frontend
<img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white"> <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white"> <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black">

### Backend
<img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white"> <img src="https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white"> 

### AI & Data
<img src="https://img.shields.io/badge/OpenAI_API-412991?style=for-the-badge&logo=openai&logoColor=white"> <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white"> <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white"> <img src="https://img.shields.io/badge/pgvector-336791?style=for-the-badge&logo=postgresql&logoColor=white">

### DevOps / Infra
<img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white"> 

<br />

## 기존의 문제와 해결책 

<table width="100%">
  <thead>
    <tr>
      <th width="50%">기존 키오스크 (AS-IS)</th>
      <th width="50%">이지오더 (TO-BE)</th>
    </tr>
  </thead>
  <tbody>
    <tr valign="top">
      <td>
        <br>
        <p><strong>비교하기 어려운 메뉴 구성으로 인한 잦은 주문 실수</strong></p>
        <p>글씨 크기가 커서 한 화면에 메뉴 이름이 다 들어오지 않거나, 카테고리 단위로만 엄격하게 나뉘어 있습니다.</p>
        <p>이로 인해 "바닐라 라떼"를 시키려다 "바닐라 아메리카노"를 누르거나, 새로 나온 "말차 크림 라떼"를 시키려다 기존의 "아이스 말차"를 잘못 고르는 등 헷갈리고 주문 실수가 발생하기 쉽습니다.</p>
      </td>
      <td>
        <br>
        <p><strong>유사 메뉴 비교를 통한 주문 실수 0%</strong></p>
        <p>사용자의 요청에 맞춰 베이스(에스프레소, 라떼 등)가 다르더라도 이름이나 속성이 비슷하다면 한 화면에 모아서 보여줍니다.</p>
        <p>유사한 메뉴들을 서로 직관적으로 비교할 수 있게 되어 주문 실수를 원천적으로 방지합니다.</p>
      </td>
    </tr>
    <tr valign="top">
      <td>
        <br>
        <p><strong>직관적이지 않고 파편화된 메뉴명</strong></p>
        <p>프랜차이즈마다 메뉴 이름이 제각각입니다.</p>
        <p>"원조커피"가 믹스커피인지 단번에 알기 어렵고, "미드나잇 버... 어 뭐지? 그 보라색 신메뉴" 처럼 이름이 정확히 기억나지 않으면 메뉴를 찾을 수 없습니다.</p>
      </td>
      <td>
        <br>
        <p><strong>자연어 묘사만으로 주문 가능</strong></p>
        <p>"보라색 신메뉴 주세요", "카페인 없는 달달한 거 추천해 줘" 등 자연스러운 묘사만으로도 AI가 문맥을 이해하고 가장 알맞은 메뉴를 찾아냅니다.</p>
      </td>
    </tr>
    <tr valign="top">
      <td>
        <br>
        <p><strong>복잡한 메뉴 위치와 커스텀의 어려움</strong></p>
        <p>"아이스티에 샷 추가"를 하고 싶을 때, 아이스티가 어느 탭에 있는지 헤매고, 샷 추가 옵션은 또 어디서 선택해야 하는지 화면을 여러 번 이동하며 찾아야 합니다.</p>
      </td>
      <td>
        <br>
        <p><strong>대화 속에서 유연한 커스텀 처리</strong></p>
        <p>"아이스티에 샷 추가해 줘"라는 문장 하나면, 흩어져 있는 메뉴와 옵션을 AI가 한 번에 파악하여 장바구니에 일괄적으로 담아줍니다.</p>
      </td>
    </tr>
  </tbody>
</table>

<br />

## 시스템 동작 방식 

### 1. 주문 추론 프로세스 

<img width="80%" alt="System Architecture" src="https://github.com/user-attachments/assets/bc95ef3a-e196-40d1-89b7-3b382f756610" />

1. 사용자가 음성(Speech-to-Text) 또는 텍스트로 자연어 주문을 입력합니다.
2. LLM(GPT)이 사용자의 문장에서 임베딩 검색이 필요한 묘사나 단어, 그리고 명확한 지시어(명령어)를 분리합니다.
3. 분리된 키워드를 벡터로 변환(Embedding)하여, PostgreSQL(pgvector)에 저장된 메뉴 데이터와 유사도 검색(Vector Search)을 수행합니다.
4. 가장 유사도가 높은 메뉴와 옵션을 조합하여 최종 영수증을 생성하고 결제를 진행합니다.

### 2. 메뉴 임베딩 과정 (Embedding Process)

메뉴의 이름뿐만 아니라 그 메뉴가 가진 속성(맛, 재료, 느낌 등)을 1536차원의 벡터로 변환하여 저장합니다.

<div style="display: flex; gap: 10px;">
  <img width="48%" alt="Embedding Concept 1" src="https://github.com/user-attachments/assets/8c2b6239-3b26-460b-bc42-81adb036c661" />
  <img width="48%" alt="Embedding Concept 2" src="https://github.com/user-attachments/assets/79bcb56f-05d3-4552-bc4c-fb6921511443" />
</div>

- ChatGPT API를 활용하여 각 메뉴에 대한 바리스타 관점의 상세한 설명을 생성합니다.
- 생성된 설명 텍스트를 OpenAI의 `text-embedding-ada-002` 모델을 사용하여 임베딩하고 벡터 DB에 적재합니다.

<br />

## 기여자 (Contributors)
- **김현석**: 전체 기획 및 개발
- **유소은**: UI/UX 디자인 - [seoddonni@gmail.com]

<br />

## 개발 일지
<img src="https://img.shields.io/badge/Notion-000000?style=flat-square&logo=Notion&logoColor=white"/> 

[개발 일지 보러가기](https://tin-oak-590.notion.site/1d18d7c109668042950df1845b779f11)