// 🛒 장바구니 데이터 저장용
const cart = {};

// 📦 요소 가져오기
const $menuGrid = $('#menu-grid');
const $cartCount = $('#cart-count');
const $cartItems = $('#cart-items');
const $cartTotal = $('#cart-total');
const $toastLive = $('#toast');
const toastBootstrap = new bootstrap.Toast($toastLive[0]);

// 📄 메뉴 로드
async function loadMenu() {
  const response = await fetch('menu.json');
  const menuItems = await response.json();
  renderMenu(menuItems);
}

// 💸 가격 포맷 (천 단위 콤마 + 원화 기호)
function formatPrice(price) {
  return '\\' + price.toLocaleString();
}

// 🍔 메뉴 출력
function renderMenu(menuItems) {
  $.each(menuItems, function(_, item) {
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

    $col.find('.card').on('click', function() {
      addToCart(item);
    });

    $menuGrid.append($col);
  });
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

  $.each(cart, function(name, item) {
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

  $cartTotal.text(total > 0 ? `총액: ${formatPrice(total)}` : '장바구니가 비었습니다');
  $cartCount.text(count);
}

// 🔔 담겼을 때 토스트 보여주기
function showToast(itemName) {
  $('#toast .toast-body').text(`🛒 ${itemName}가(이) 장바구니에 담겼습니다!`);
  toastBootstrap.show();
}

// 🛍️ 모달 열기
$('#cart-button').on('click', function() {
  const cartModal = new bootstrap.Modal($('#cartModal')[0]);
  cartModal.show();
});

// 🧹 초기화 버튼
$('#clear-cart').on('click', clearCart);

// ➖➕❌ 수량 조절, 삭제 버튼
$cartItems.on('click', '.decrease-btn', function() {
  const name = $(this).data('name');
  decreaseQuantity(name);
});
$cartItems.on('click', '.increase-btn', function() {
  const name = $(this).data('name');
  increaseQuantity(name);
});
$cartItems.on('click', '.remove-btn', function() {
  const name = $(this).data('name');
  removeFromCart(name);
});

// 💳 결제하기 버튼
$('.btn-success').on('click', function() {
  // 장바구니 정보를 JSON으로 직렬화
  const cartData = encodeURIComponent(JSON.stringify(cart));
  window.location.href = `paymentpage.html?cart=${cartData}`;
});

// 🚀 메뉴 처음 불러오기
$(document).ready(function() {
  loadMenu();
});
