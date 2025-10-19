// 🛒 장바구니 데이터 저장용
const cart = {};

// 📦 요소 가져오기
const $menuGrid = $("#menu-grid");
const $cartCount = $("#cart-count");
const $cartItems = $("#cart-items");
const $cartTotal = $("#cart-total");
const $toastLive = $("#toast");
const toastBootstrap = new bootstrap.Toast($toastLive[0]);

// 📄 메뉴 로드
async function loadMenu() {
  const response = await fetch('http://localhost:5001/api/v1/menus');
  const menuData = await response.json();
  renderMenu(menuData.data);
  renderMenu(menuItems);
}

// 💸 가격 포맷 (천 단위 콤마 + 원화 기호)
function formatPrice(price) {
  return "\\" + price.toLocaleString();
}

// 🍔 메뉴 출력
function renderMenu(menuItems) {
  $.each(menuItems, function (_, item) {
    const $col = $(`
      <div class="col-6 col-md-4 col-lg-3 mb-4">
        <div class="card h-100 shadow-sm menu-card" style="cursor:pointer;">
          <img src="img/${item.image}" class="card-img-top" alt="${item.name}">
          <div class="card-body text-center">
            <h5 class="card-title mb-2">${item.name}</h5>
            <p class="card-text text-primary fw-bold">${formatPrice(item.price)}</p>
          </div>
        </div>
      </div>
    `);

    // 상세 모달 띄우기
    $col.find(".card").on("click", function () {
      openDetailModal(item);
    });

    $menuGrid.append($col);
  });
}
let currentDetailItem = null;
let currentTemp = null;
let currentQty = 1;

// 상세 모달 열기
function openDetailModal(item) {
  currentDetailItem = item;
  currentQty = 1;
  currentTemp = "ice"; // 기본값 차갑게

  // 제목, 이미지, 설명, 가격
  $("#detailModalLabel").text(item.name);
  $("#detail-image")
    .attr("src", "img/" + item.image)
    .attr("alt", item.name);
  $("#detail-description").text(item.description);
  $("#detail-price").text(formatPrice(item.price));
  $("#qty-input").val(1);

  // 온도 선택 (hot/ice)
  const $options = $("#hot-ice-options").empty();

  const hotAvailable = item.hot === "Y";

  const hotBtn = $(`
    <button type="button" class="btn btn-outline-primary temperature-btn"
            data-temp="hot" ${hotAvailable ? "" : "disabled"}>
      따뜻하게
    </button>
  `);

  const iceBtn = $(`
    <button type="button" class="btn btn-outline-primary temperature-btn active btn-danger"
            data-temp="ice">
      차갑게
    </button>
  `);

  $options.append(iceBtn, hotBtn);

  // 온도 버튼 클릭 처리
  $(".temperature-btn").off("click").on("click", function () {
    if ($(this).prop("disabled")) return;

    $(".temperature-btn").removeClass("active btn-danger").addClass("btn-outline-primary");
    $(this).addClass("active btn-danger").removeClass("btn-outline-primary");
    currentTemp = $(this).data("temp");
  });

  // 수량 조절
  $("#qty-minus")
    .off("click")
    .on("click", function () {
      if (currentQty > 1) {
        currentQty--;
        $("#qty-input").val(currentQty);
      }
    });
  $("#qty-plus")
    .off("click")
    .on("click", function () {
      currentQty++;
      $("#qty-input").val(currentQty);
    });

  // 담기 버튼
  $("#add-to-cart-detail")
    .off("click")
    .on("click", function () {
      if (!currentTemp) {
        alert("온도를 선택하세요!");
        return;
      }
      addToCartDetail();
      $("#detailModal").modal("hide");
    });

  // 모달 열기
  const detailModal = new bootstrap.Modal($("#detailModal")[0]);
  detailModal.show();
}


// 상세에서 장바구니에 담기
function addToCartDetail() {
  const key = `${currentDetailItem.name} (${currentTemp === "hot" ? "따뜻하게" : "차갑게"})`;
  if (cart[key]) {
    cart[key].quantity += currentQty;
  } else {
    cart[key] = {
      ...currentDetailItem,
      name: key,
      quantity: currentQty
    };
  }
  updateCart();
  showToast(key);
}

// ➕ 장바구니에 추가
function addToCart(item) {
  if (cart[item.name]) {
    cart[item.name].quantity += 1;
  } else {
    cart[item.name] = { ...item, quantity: 1 };
  }
  updateCart();
  showToast(item.name);
}

// ➖ 장바구니 수량 감소
function decreaseQuantity(name) {
  if (cart[name]) {
    cart[name].quantity -= 1;
    if (cart[name].quantity <= 0) {
      delete cart[name];
    }
    updateCart();
  }
}

// ➕ 장바구니 수량 증가
function increaseQuantity(name) {
  if (cart[name]) {
    cart[name].quantity += 1;
    updateCart();
  }
}

// ❌ 장바구니에서 제거
function removeFromCart(name) {
  if (cart[name]) {
    delete cart[name];
    updateCart();
  }
}

// 🧹 장바구니 비우기
function clearCart() {
  for (let name in cart) {
    delete cart[name];
  }
  updateCart();
}

// 🔄 장바구니 업데이트
function updateCart() {
  $cartItems.empty();
  let total = 0;
  let count = 0;

  $.each(cart, function (name, item) {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    count += item.quantity;

    const $itemDiv = $(`
      <div class="d-flex justify-content-between align-items-center mb-3">
        <div class="d-flex align-items-center">
          <img src="img/${item.image}" alt="${name}" class="cart-item-image me-2" style="width: 40px; height: 40px; object-fit: cover;">
          <div>
            <div>${name}</div>
            <div class="text-muted small">${formatPrice(item.price)} x ${item.quantity}</div>
          </div>
        </div>
        <div class="d-flex align-items-center">
          <button class="btn btn-sm btn-outline-secondary me-2 decrease-btn" data-name="${name}">-</button>
          <button class="btn btn-sm btn-outline-secondary me-2 increase-btn" data-name="${name}">+</button>
          <button class="btn btn-sm btn-danger remove-btn" data-name="${name}">삭제</button>
        </div>
      </div>
    `);

    $cartItems.append($itemDiv);
  });

  $cartTotal.text(total > 0 ? `총액: ${formatPrice(total)}` : "장바구니가 비었습니다");
  $cartCount.text(count);
}

// 🔔 담겼을 때 토스트 보여주기
function showToast(itemName) {
  $("#toast .toast-body").text(`🛒 ${itemName}가(이) 장바구니에 담겼습니다!`);
  toastBootstrap.show();
}

// 🛍️ 모달 열기
$("#cart-button").on("click", function () {
  const cartModal = new bootstrap.Modal($("#cartModal")[0]);
  cartModal.show();
});

// 🧹 초기화 버튼
$("#clear-cart").on("click", clearCart);

// ➖➕❌ 수량 조절, 삭제 버튼
$cartItems.on("click", ".decrease-btn", function () {
  const name = $(this).data("name");
  decreaseQuantity(name);
});
$cartItems.on("click", ".increase-btn", function () {
  const name = $(this).data("name");
  increaseQuantity(name);
});
$cartItems.on("click", ".remove-btn", function () {
  const name = $(this).data("name");
  removeFromCart(name);
});

// 💳 결제하기 버튼
$(".btn-success").on("click", function () {
  // 장바구니 정보를 JSON으로 직렬화
  const cartData = encodeURIComponent(JSON.stringify(cart));
  window.location.href = `paymentpage.html?cart=${cartData}`;
});

// 🚀 메뉴 처음 불러오기
$(document).ready(function () {
  loadMenu();
});
