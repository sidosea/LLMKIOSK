// 가격 포맷 함수
function formatPrice(price) {
  return "₩" + price.toLocaleString();
}

// 메뉴 이름에서 온도 정보 추출
function getTemperatureLabel(name) {
  if (name.includes("따뜻하게")) return "따뜻하게";
  if (name.includes("차갑게")) return "차갑게";
  return "기본";
}

// 메뉴 이름에서 실제 메뉴 이름만 추출
function getMenuName(name) {
  return name.replace(/\s*\([^)]*\)/, "").trim();
}

$(document).ready(function () {
  // URL에서 cart 파라미터 가져오기
  const urlParams = new URLSearchParams(window.location.search);
  const cartParam = urlParams.get('cart');
  const cart = cartParam ? JSON.parse(decodeURIComponent(cartParam)) : {};

  const $orderList = $("#order-list");
  const $totalPrice = $("#total-price");
  let total = 0;

  // 주문 항목 렌더링
  $.each(cart, function (name, item) {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    const menuName = getMenuName(name);
    const tempLabel = getTemperatureLabel(name);

    const $orderItem = $(`
      <div class="order-item">
        <div class="order-item-header">
          <p class="order-item-name">${menuName}</p>
          <p class="order-item-price">${formatPrice(itemTotal)}</p>
        </div>
        <div class="order-item-meta">
          <p class="order-item-temp">${tempLabel} x ${item.quantity}</p>
          <div class="order-item-controls">
            <button type="button" class="order-qty-btn" data-name="${name}" data-action="decrease">
              <img src="https://www.figma.com/api/mcp/asset/69c5e272-ed68-417d-84ec-3738346a0630" alt="감소" />
            </button>
            <span class="order-qty-value">${item.quantity}</span>
            <button type="button" class="order-qty-btn" data-name="${name}" data-action="increase">
              <img src="https://www.figma.com/api/mcp/asset/1f27a4e2-a4a1-4a1a-9b24-25f5ac240d70" alt="증가" />
            </button>
          </div>
        </div>
      </div>
    `);

    $orderList.append($orderItem);
  });

  // 총액 업데이트
  $totalPrice.text(formatPrice(total));

  // 수량 조절 버튼 이벤트
  $(document).on("click", ".order-qty-btn", function () {
    const name = $(this).data("name");
    const action = $(this).data("action");
    const $item = $(this).closest(".order-item");
    const $qtyValue = $item.find(".order-qty-value");
    const $price = $item.find(".order-item-price");
    let currentQty = parseInt($qtyValue.text(), 10);
    const itemPrice = cart[name].price;

    if (action === "decrease" && currentQty > 1) {
      currentQty--;
      cart[name].quantity = currentQty;
      $qtyValue.text(currentQty);
      $price.text(formatPrice(itemPrice * currentQty));
      updateTotal();
    } else if (action === "increase") {
      currentQty++;
      cart[name].quantity = currentQty;
      $qtyValue.text(currentQty);
      $price.text(formatPrice(itemPrice * currentQty));
      updateTotal();
    }
  });

  // 총액 업데이트 함수
  function updateTotal() {
    let newTotal = 0;
    $.each(cart, function (name, item) {
      newTotal += item.price * item.quantity;
    });
    $totalPrice.text(formatPrice(newTotal));
  }

  // 결제 방식 클릭 이벤트
  $("#card-payment").on("click", function () {
    handlePayment("일반 카드 결제");
  });

  $("#naver-payment").on("click", function () {
    handlePayment("네이버페이");
  });

  $("#kakao-payment").on("click", function () {
    handlePayment("카카오페이");
  });

  function handlePayment(method) {
    // 업데이트된 장바구니 데이터를 URL에 포함하여 전달
    const cartData = encodeURIComponent(JSON.stringify(cart));
    // 주문 번호 생성 (1~999 랜덤)
    const orderNumber = Math.floor(Math.random() * 999) + 1;
    window.location.href = `orderdonepage.html?cart=${cartData}&orderNumber=${orderNumber}`;
  }
});
