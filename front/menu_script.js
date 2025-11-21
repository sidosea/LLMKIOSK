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
  const response = await fetch('menu.json');
  const menuItems = await response.json();
  renderMenu(menuItems);
}

// 💸 가격 포맷 (천 단위 콤마 + 원화 기호)
function formatPrice(price) {
  return "₩" + price.toLocaleString();
}

// 🍔 메뉴 출력
function renderMenu(menuItems) {
  // 메뉴 페이지 스타일인지 확인 (menu-grid-section 부모가 있는 경우)
  const isMenuPage = $menuGrid.parent().hasClass("menu-grid-section") || $menuGrid.hasClass("menu-grid");

  $.each(menuItems, function (_, item) {
    let $col;

    if (isMenuPage) {
      // 메뉴 페이지 스타일 (Figma 디자인)
      $col = $(`
        <div class="menu-item-card">
          <div class="menu-item-image">
            <img src="img/${item.image}" alt="${item.name}">
          </div>
          <p class="menu-item-name">${item.name}</p>
          <p class="menu-item-price">${formatPrice(item.price)}</p>
        </div>
      `);

      $col.on("click", function () {
        openDetailModal(item);
      });
    } else {
      // 기존 Bootstrap 그리드 스타일
      $col = $(`
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

      $col.find(".card").on("click", function () {
        openDetailModal(item);
      });
    }

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
  const isMenuPage = $options.parent().hasClass("detail-group"); // Figma 스타일 모달인지 확인

  const hotAvailable = item.hot === "Y";

  let hotBtn, iceBtn;

  if (isMenuPage) {
    // Figma 스타일 (pill 버튼)
    hotBtn = $(`
      <button type="button" class="pill-btn temperature-btn"
              data-temp="hot" ${hotAvailable ? "" : "disabled"}>
        HOT
      </button>
    `);

    iceBtn = $(`
      <button type="button" class="pill-btn temperature-btn active"
              data-temp="ice">
        ICE
      </button>
    `);
  } else {
    // 기존 Bootstrap 스타일
    hotBtn = $(`
      <button type="button" class="btn btn-outline-primary temperature-btn"
              data-temp="hot" ${hotAvailable ? "" : "disabled"}>
        따뜻하게
      </button>
    `);

    iceBtn = $(`
      <button type="button" class="btn btn-outline-primary temperature-btn active btn-danger"
              data-temp="ice">
        차갑게
      </button>
    `);
  }

  // 버튼을 DOM에 추가한 후 이벤트 핸들러 연결
  $options.append(iceBtn, hotBtn);

  // 온도 버튼 클릭 처리 (버튼 추가 후 연결)
  if (isMenuPage) {
    // Figma 스타일 이벤트 처리
    $options.find(".temperature-btn").off("click").on("click", function () {
      if ($(this).prop("disabled")) return;
      $options.find(".temperature-btn").removeClass("active");
      $(this).addClass("active");
      currentTemp = $(this).data("temp");
    });
  } else {
    // 기존 Bootstrap 스타일 이벤트 처리
    $options.find(".temperature-btn").off("click").on("click", function () {
      if ($(this).prop("disabled")) return;
      $options.find(".temperature-btn").removeClass("active btn-danger").addClass("btn-outline-primary");
      $(this).addClass("active btn-danger").removeClass("btn-outline-primary");
      currentTemp = $(this).data("temp");
    });
  }

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

  // 주문 카드 업데이트 (메뉴 페이지용)
  updateOrderCard(total, count);
}

// 주문 카드 업데이트 (Figma 디자인용)
function updateOrderCard(total, count) {
  const $orderCardItems = $("#order-card-items");
  const $orderCardTotal = $("#order-card-total");
  const $orderSelectedName = $("#order-selected-name");
  const $orderSelectedMeta = $("#order-selected-meta");
  const $orderCardQty = $("#order-card-qty");

  if (!$orderCardItems.length) return; // 주문 카드가 없으면 스킵

  $orderCardTotal.text(formatPrice(total));
  $orderCardQty.text(count);

  if (count === 0) {
    $orderCardItems.empty();
    $orderCardItems.append('<p class="order-item order-empty">담긴 메뉴가 없습니다</p>');
    $orderSelectedName.text("담긴 메뉴가 없습니다");
    $orderSelectedMeta.text("메뉴를 담아주세요");
    return;
  }

  // 첫 번째 아이템 표시
  const firstItemKey = Object.keys(cart)[0];
  const firstItem = cart[firstItemKey];
  const tempLabel = firstItemKey.includes("따뜻하게") ? "따뜻하게" : "차갑게";

  $orderSelectedName.text(firstItem.name.replace(/\s*\([^)]*\)/, "")); // 괄호 제거
  $orderSelectedMeta.text(`${tempLabel} x ${firstItem.quantity}`);

  // 주문 목록 업데이트
  $orderCardItems.empty();
  $.each(cart, function (name, item) {
    const itemTempLabel = name.includes("따뜻하게") ? "따뜻하게" : "차갑게";
    const $row = $(`
      <div class="order-item-row">
        <div>
          <p class="order-item">${item.name.replace(/\s*\([^)]*\)/, "")}</p>
          <p class="order-meta">${itemTempLabel} x ${item.quantity}</p>
        </div>
        <p class="order-line-price">${formatPrice(item.price * item.quantity)}</p>
      </div>
    `);
    $orderCardItems.append($row);
  });
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
$(".btn-success, #order-card-checkout").on("click", function () {
  // 장바구니 정보를 JSON으로 직렬화
  const cartData = encodeURIComponent(JSON.stringify(cart));
  window.location.href = `paymentpage.html?cart=${cartData}`;
});

// 주문 취소 버튼
$("#order-card-cancel").on("click", function () {
  clearCart();
});

// 주문 카드 수량 조절 버튼
$("#order-card-minus").on("click", function () {
  const firstItemKey = Object.keys(cart)[0];
  if (firstItemKey) {
    decreaseQuantity(firstItemKey);
  }
});

$("#order-card-plus").on("click", function () {
  const firstItemKey = Object.keys(cart)[0];
  if (firstItemKey) {
    increaseQuantity(firstItemKey);
  }
});

// 🚀 메뉴 처음 불러오기
$(document).ready(function () {
  loadMenu();
});
