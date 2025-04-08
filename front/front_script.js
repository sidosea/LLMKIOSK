$(document).ready(function () {
    const $slideContainer = $('.slide-container');
    const $slides = $('.slide-box');
    const $prevBtn = $('.before-btn');
    const $nextBtn = $('.next-btn');

    let currentIndex = 0;
    const slideWidth = $slides.first().outerWidth(); // 첫 번째 슬라이드의 실제 width 가져오기

    // 슬라이드 전체 너비 설정
    $slideContainer.css('width', slideWidth * $slides.length + 'px');

    // 이전 버튼 클릭
    $prevBtn.on('click', function () {
        if (currentIndex > 0) {
            currentIndex--;
        } else {
            currentIndex = $slides.length - 1; // 처음 슬라이드에서 뒤로 가면 맨 끝으로
        }
        updateSlidePosition();
    });

    // 다음 버튼 클릭
    $nextBtn.on('click', function () {
        if (currentIndex < $slides.length - 1) {
            currentIndex++;
        } else {
            currentIndex = 0; // 마지막 슬라이드에서 앞으로 가면 맨 처음으로
        }
        updateSlidePosition();
    });

    function updateSlidePosition() {
        $slideContainer.css('transform', `translateX(-${slideWidth * currentIndex}px)`);
    }
});

// ✉️ 텍스트 전송 함수
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

// 🛒 주문 버튼 클릭 이벤트
$("#sendBtn").click(sendText);

// ⌨️ 엔터키 입력 이벤트
$("#textInput").keypress(function (event) {
    if (event.which === 13) {
        event.preventDefault();
        sendText();
    }
});

// (추후 기능) 음성 입력 버튼 클릭 이벤트 (구현 예정)
// $("#voiceBtn").click(startVoiceRecognition);

// (추후 기능) 메뉴보기 버튼 클릭 이벤트 (구현 예정)
// $("#lookBtn").click(showMenu);
