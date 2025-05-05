$(document).ready(function () {
  // URL에서 cart 파라미터 가져오기
  const urlParams = new URLSearchParams(window.location.search);
  const cartParam = urlParams.get('cart');
  const cart = cartParam ? JSON.parse(decodeURIComponent(cartParam)) : {};

  const $orderSummary = $("#order-summary");
  const $totalPrice = $("#total-price");

  let total = 0;
  $.each(cart, function (name, item) {
    const $li = $(`
      <li class="list-group-item d-flex justify-content-between align-items-center">
        ${name} x${item.quantity}
        <span>₩${(item.price * item.quantity).toLocaleString()}</span>
      </li>
    `);
    $orderSummary.append($li);
    total += item.price * item.quantity;
  });

  $totalPrice.text(`총액: ₩${total.toLocaleString()}`);

  // 결제 방식 클릭 이벤트
  $("#card-payment").on("click", function () {
    handlePayment("일반 카드 결제");
  });

  $("#easy-payment").on("click", function () {
    handlePayment("네이버페이 / 카카오페이");
  });

  $("#cash-payment").on("click", function () {
    handlePayment("현금 결제");
  });

  function handlePayment(method) {
    alert(`${method}로 결제를 진행합니다. 🧾`);
    window.location.href = "orderdonepage.html";
  }
});
