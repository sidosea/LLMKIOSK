$(document).ready(function () {
  // URL에서 주문 번호 가져오기 (있으면 사용, 없으면 랜덤 생성)
  const urlParams = new URLSearchParams(window.location.search);
  let orderNumber = urlParams.get('orderNumber');

  if (!orderNumber) {
    // 주문 번호가 없으면 1~999 사이 랜덤 번호 생성
    orderNumber = Math.floor(Math.random() * 999) + 1;
  }

  $("#order-number").text(orderNumber);

  // 처음으로 돌아가기 버튼 클릭 이벤트
  $("#order-done").on("click", function () {
    window.location.href = "index.html";
  });

  // 5초 후 자동으로 메인 페이지로 이동
  setTimeout(function () {
    window.location.href = "index.html";
  }, 5000); // 5000ms = 5초
});
