$(document).ready(function () {
  const orderNumber = 1; //샘플넘버
  $("#order-number").text(orderNumber);

  // 5초 후 자동으로 메인 페이지로 이동
  setTimeout(function () {
    window.location.href = "Frontpage.html"; // 메인페이지로 이동
  }, 5000); // 5000ms = 5초
});
