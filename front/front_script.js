$(document).ready(function () {
    // 메뉴 보기 버튼 클릭 시 이동
    $("#menuBtn").on("click", function () {
        window.location.href = "menupage.html";
    });

    let btn_state = 0;
    const $slideContainer = $(".slide-container");
    const $slides = $(".slide-box");
    const totalSlides = $slides.length - 1;
    const slideWidth = 260; // 슬라이드 하나 너비

    function updateSlidePosition() {
        $slideContainer.css({
            transform: `translateX(-${btn_state * slideWidth}px)`,
            transition: "transform 0.5s ease"
        });
    }

    // 다음 버튼 클릭
    $(".next-btn").on("click", function () {
        btn_state++;
        if (btn_state >= totalSlides) {
            btn_state = 0;
        }
        updateSlidePosition();
    });

    // 이전 버튼 클릭
    $(".before-btn").on("click", function () {
        btn_state--;
        if (btn_state < 0) {
            btn_state = totalSlides - 1;
        }
        updateSlidePosition();
    });

    // 자동 슬라이드 (3초마다)
    setInterval(function () {
        btn_state++;
        if (btn_state >= totalSlides) {
            btn_state = 0;
        }
        updateSlidePosition();
    }, 3000);

    // 텍스트 전송 함수
    function sendText() {
        let text = $("#textInput").val().trim();
        if (text === "") return;

        $.ajax({ //RESTful 적용 반영
            url: "http://localhost:5000/api/v1/recommendations",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({ query: text, temperature: null, quantity: 1 }),
            success: function (response) {
                // 새 포맷 : data: { intent, recommendations }}
                const data = response && response.data;
                if (!data) { //에러 메세지 백->프론트로 이동
                    $("#responseText").text("응답 형식이 올바르지 않습니다.");
                    return;
                }
                //response 백-> 프론트로 이동
              $("#responseText").text("추천 메뉴를 안내해드릴게요!");
              $("#textInput").val("");

              if (data.recommendations && data.recommendations.length > 0) {
                displayRecommendations(data.recommendations);
              }
            },
            error: function (xhr) { //RESTful 표준 에러 처리
                const errMsg =
                (xhr.responseJSON && xhr.responseJSON.error && xhr.responseJSON.error.message) ||
                "서버와 연결할 수 없습니다.";      
                $("#responseText").text(errMsg);
            }
        });
    }
    function displayRecommendations(recs) {
        const $box = $("#recommendationBox");
        $box.empty().removeClass("d-none");

        const main = recs[0];
        const others = recs.slice(1);

        // 메인 추천 메뉴
        const mainHTML = `
        <div class="text-center">
            <h4>${main.name}</h4>
            <img src="img/${main.image}" class="img-fluid rounded" style="max-width: 200px;" />
            <p class="mt-2">${main.description}</p>
            <button class="btn btn-success mt-3" id="addToCartBtn">🛍 "${main.name}" 담기</button>
        </div>
    `;
        $box.append(mainHTML);

        // 2~3순위 추천
        if (others.length > 0) {
            let otherHTML = `
            <div class="mt-4">
                <small>혹시 이것을 찾으셨나요?</small>
                <div class="d-flex justify-content-center gap-3 mt-2">`;

            others.forEach((item) => {
                otherHTML += `
                <div class="text-center alt-item" style="cursor:pointer;">
                    <img src="img/${item.image}" class="img-thumbnail" style="width:100px;" />
                    <div>${item.name}</div>
                </div>`;
            });

            otherHTML += `</div></div>`;
            $box.append(otherHTML);
        }

        // 클릭 이벤트
        $(".alt-item").on("click", function () {
            const name = $(this).find("div").text();
            const selected = recs.find((r) => r.name === name);
            if (selected) {
                const newList = [selected, ...recs.filter((r) => r.name !== name)];
                displayRecommendations(newList);
            }
        });

        // 장바구니 담기 버튼
        $("#addToCartBtn").on("click", function () {
            alert(`🛒 ${main.name} 메뉴를 장바구니에 담았습니다!`);
        });
    }

    // 주문 버튼 클릭 및 엔터 키 입력
    $("#sendBtn").on("click", sendText);
    $("#textInput").on("keypress", function (event) {
        if (event.which === 13) {
            event.preventDefault();
            sendText();
        }
    });
});
