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

        $.ajax({
            url: "http://localhost:5000/send_text",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({ text: text }),
            success: function (response) {
                $("#responseText").text(response.message);
                $("#textInput").val("");
            },
            error: function () {
                $("#responseText").text("서버와 연결할 수 없습니다.");
            }
        });
    }
    function displayRecommendations(recs) {
        const $recommendBox = $("#recommendationBox");
        $recommendBox.empty();

        const main = recs[0];
        const others = recs.slice(1);

        // 1순위 메인 추천 메뉴
        const mainHTML = `
            <div id="mainMenu" class="text-center mb-4">
                <img src="img/${main.image}" alt="${main.name}" class="img-fluid rounded mb-2" style="max-width: 200px;">
                <h3>${main.name}</h3>
                <p>${main.description}</p>
                <button class="btn btn-success" id="addToCartBtn">🛒 ${main.name} 메뉴를 담으시겠습니까?</button>
            </div>
        `;

        $recommendBox.append(mainHTML);

        // 2, 3순위 메뉴 추천
        if (others.length > 0) {
            let otherHTML = `<div id="otherSuggestions"><h5>혹시 이것을 찾으셨나요?</h5><div class="d-flex gap-3 justify-content-center">`;
            others.forEach((item) => {
                otherHTML += `
                    <div class="text-center alt-item" style="cursor: pointer;">
                        <img src="img/${item.image}" alt="${item.name}" class="img-thumbnail" style="width:100px;">
                        <div>${item.name}</div>
                    </div>
                `;
            });
            otherHTML += `</div></div>`;
            $recommendBox.append(otherHTML);
        }

        // 이벤트: 다른 메뉴 클릭 시 메인으로 올리기
        $(".alt-item").on("click", function () {
            const selectedName = $(this).find("div").text();
            const selected = recs.find((r) => r.name === selectedName);
            if (selected) displayRecommendations([selected, ...recs.filter((r) => r.name !== selected.name)]);
        });

        // 장바구니 버튼 클릭
        $("#addToCartBtn").on("click", function () {
            alert(`🛒 ${main.name} 메뉴를 장바구니에 담았습니다!`);
            // 여기에 실제 장바구니 기능 추가 가능
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
