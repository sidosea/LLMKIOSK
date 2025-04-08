$(document).ready(function () {
  const cartItems = JSON.parse(localStorage.getItem("cart")) || [];
  const $orderSummary = $("#order-summary");
  const $totalPrice = $("#total-price");

  let total = 0;
  $.each(cartItems, function (index, item) {
    const $li = $(`
      <li class="list-group-item d-flex justify-content-between align-items-center">
        ${item.name} x${item.quantity}
        <span>₩${(item.price * item.quantity).toLocaleString()}</span>
      </li>
    `);
    $orderSummary.append($li);
    total += item.price * item.quantity;
  });

  $totalPrice.text(`총액: ₩${total.toLocaleString()}`);

  // 결제 방식 클릭 이벤트
  $("#card-payment").click(function () {
    handlePayment("일반 카드 결제");
  });

  $("#easy-payment").click(function () {
    handlePayment("네이버페이 / 카카오페이");
  });

  $("#cash-payment").click(function () {
    handlePayment("현금 결제");
  });

  function handlePayment(method) {
    alert(`${method}로 결제를 진행합니다. 🧾`);

    // 결제 후 장바구니 비우기
    localStorage.removeItem("cart");

    // 결제 완료 페이지로 이동
    window.location.href = "order_complete.html";
  }
});
