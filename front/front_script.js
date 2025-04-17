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

    // 주문 버튼 클릭 및 엔터 키 입력
    $("#sendBtn").on("click", sendText);
    $("#textInput").on("keypress", function (event) {
        if (event.which === 13) {
            event.preventDefault();
            sendText();
        }
    });
});
