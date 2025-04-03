from flask import Flask, request, jsonify
from flask_cors import CORS  # CORS 허용 (프론트엔드에서 접근 가능하도록)

app = Flask(__name__)
CORS(app)  # CORS 활성화

@app.route('/send_text', methods=['POST'])
def receive_text():
    data = request.json
    user_input = data.get("text", "")
    
    print(f"클라이언트에서 '{user_input}'가 왔습니다.")  # 서버에서 출력
    
    return jsonify({"message": f"서버에서 '{user_input}'를 받았습니다."})

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)
