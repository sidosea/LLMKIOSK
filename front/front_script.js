// 슬라이드 관련 변수 설정
let currentSlide = 0;
const slideContainer = document.querySelector(".slide-container");
const slides = document.querySelectorAll(".slide-box");
const totalSlides = slides.length;
const slideWidth = 260; // 슬라이드 한 칸 너비(px)

// 슬라이드 이동 함수
function updateSlidePosition() {
    slideContainer.style.transform = `translateX(-${currentSlide * slideWidth}px)`;
}

// 다음 슬라이드 버튼
document.querySelector(".next-btn").addEventListener("click", () => {
    if (currentSlide < totalSlides - 1) {
        currentSlide++;
        updateSlidePosition();
    }
});

// 이전 슬라이드 버튼
document.querySelector(".before-btn").addEventListener("click", () => {
    if (currentSlide > 0) {
        currentSlide--;
        updateSlidePosition();
    }
});

// 텍스트 전송 함수
function sendText() {
    const text = $("#textInput").val().trim();
    if (text === "") return;

    $.ajax({
        url: "http://localhost:5000/send_text", // 서버 주소
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({ text }),
        success: function (response) {
            $("#responseText").text(response.message);
            $("#textInput").val(""); // 입력창 초기화
        },
        error: function () {
            $("#responseText").text("서버와 연결할 수 없습니다.");
        }
    });
}

// 이벤트 리스너 등록
$("#sendBtn").click(sendText);
$("#textInput").keypress(function (event) {
    if (event.which === 13) { // Enter 키 감지
        event.preventDefault();
        sendText();
    }
});

// (추후 기능) 음성 입력 버튼 클릭 이벤트 (구현 예정)
// $("#voiceBtn").click(startVoiceRecognition);

// (추후 기능) 메뉴보기 버튼 클릭 이벤트 (구현 예정)
// $("#lookBtn").click(showMenu);
