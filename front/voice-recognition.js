// 음성 인식 기능 (Web Speech API)
class VoiceRecognition {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.init();
    }

    init() {
        // 브라우저 호환성 확인
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.error('이 브라우저는 음성 인식을 지원하지 않습니다.');
            this.showError('이 브라우저는 음성 인식을 지원하지 않습니다.');
            return;
        }

        // Speech Recognition 객체 생성
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();

        // 설정
        this.recognition.continuous = false; // 한 번만 인식
        this.recognition.interimResults = false; // 최종 결과만
        this.recognition.lang = 'ko-KR'; // 한국어
        this.recognition.maxAlternatives = 1; // 최고 결과만

        // 이벤트 리스너
        this.recognition.onstart = () => {
            console.log('음성 인식 시작');
            this.isListening = true;
            this.updateButton('듣고 있습니다...', 'btn-warning');
        };

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            console.log('인식된 텍스트:', transcript);
            this.onResult(transcript);
        };

        this.recognition.onerror = (event) => {
            console.error('음성 인식 오류:', event.error);
            this.showError('음성 인식을 다시 시도해주세요.');
            this.updateButton('🎤음성', 'btn-secondary');
        };

        this.recognition.onend = () => {
            console.log('음성 인식 종료');
            this.isListening = false;
            this.updateButton('🎤음성', 'btn-secondary');
        };
    }

    startListening() {
        if (!this.recognition) {
            this.showError('이 브라우저는 음성 인식을 지원하지 않습니다.');
            return;
        }

        if (this.isListening) {
            this.stopListening();
            return;
        }

        try {
            this.recognition.start();
        } catch (error) {
            console.error('음성 인식 시작 실패:', error);
            this.showError('음성 인식 시작에 실패했습니다.');
        }
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }

    onResult(transcript) {
        // 인식된 텍스트를 입력창에 설정
        const textInput = document.getElementById('textInput');
        if (textInput) {
            textInput.value = transcript;
            // 입력 이벤트 발생시키기
            textInput.dispatchEvent(new Event('input'));
        }

        // 성공 메시지 표시
        this.showSuccess(`"${transcript}" 인식되었습니다.`);
    }

    updateButton(text, className) {
        const button = document.getElementById('voiceBtn');
        if (button) {
            button.textContent = text;
            button.className = `btn ${className}`;
        }
    }

    showError(message) {
        const responseText = document.getElementById('responseText');
        if (responseText) {
            responseText.textContent = message;
            responseText.className = 'mt-3 text-danger';
        }
    }

    showSuccess(message) {
        const responseText = document.getElementById('responseText');
        if (responseText) {
            responseText.textContent = message;
            responseText.className = 'mt-3 text-success';
        }
    }
}

// 전역 인스턴스
const voiceRecognition = new VoiceRecognition();

// 음성 인식 버튼 이벤트 (jQuery와 통합)
$(document).ready(function() {
    $('#voiceBtn').on('click', function() {
        voiceRecognition.startListening();
    });
});
