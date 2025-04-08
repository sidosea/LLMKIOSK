// 🛒 장바구니 데이터 저장용
const cart = {};

// 📦 요소 가져오기
const menuGrid = document.getElementById('menu-grid');
const cartCount = document.getElementById('cart-count');
const cartItems = document.getElementById('cart-items');
const cartTotal = document.getElementById('cart-total');
const toastLive = document.getElementById('toast');
const toastBootstrap = new bootstrap.Toast(toastLive);

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
  menuItems.forEach(item => {
    const col = document.createElement('div');
    col.className = 'col-6 col-md-4 col-lg-3 mb-4';
    col.innerHTML = `
      <div class="card h-100 shadow-sm menu-card" style="cursor:pointer;">
        <img src="img/${item.image}" class="card-img-top" alt="${item.name}">
        <div class="card-body text-center">
          <h5 class="card-title mb-2">${item.name}</h5>
          <p class="card-text text-primary fw-bold">${formatPrice(item.price)}</p>
        </div>
      </div>
    `;
    col.querySelector('.card').addEventListener('click', () => addToCart(item));
    menuGrid.appendChild(col);
  });
}

// ➕ 장바구니에 추가
function addToCart(item) {
  if (cart[item.name]) {
    cart[item.name].quantity += 1;
  } else {
    cart[item.name] = { ...item, quantity: 1 }; // 가격, 이미지 다 저장
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
  Object.keys(cart).forEach(name => delete cart[name]);
  updateCart();
}

// 🔄 장바구니 업데이트
function updateCart() {
  cartItems.innerHTML = '';
  let total = 0;
  let count = 0;

  for (const [name, item] of Object.entries(cart)) {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    count += item.quantity;

    const itemDiv = document.createElement('div');
    itemDiv.className = "d-flex justify-content-between align-items-center mb-3";
    itemDiv.innerHTML = `
      <div class="d-flex align-items-center">
        <img src="img/${item.image}" alt="${name}" class="cart-item-image me-2" style="width: 40px; height: 40px; object-fit: cover;">
        <div>
          <div>${name}</div>
          <div class="text-muted small">${formatPrice(item.price)} x ${item.quantity}</div>
        </div>
      </div>
      <div class="d-flex align-items-center">
        <button class="btn btn-sm btn-outline-secondary me-2" onclick="decreaseQuantity('${name}')">-</button>
        <button class="btn btn-sm btn-outline-secondary me-2" onclick="increaseQuantity('${name}')">+</button>
        <button class="btn btn-sm btn-danger" onclick="removeFromCart('${name}')">삭제</button>
      </div>
    `;
    cartItems.appendChild(itemDiv);
  }

  cartTotal.textContent = total > 0 ? `총액: ${formatPrice(total)}` : '장바구니가 비었습니다';
  cartCount.textContent = count;
}

// 🔔 담겼을 때 토스트 보여주기
function showToast(itemName) {
  document.querySelector('#toast .toast-body').textContent = `🛒 ${itemName}가(이) 장바구니에 담겼습니다!`;
  toastBootstrap.show();
}

// 🛍️ 모달 열기
document.getElementById('cart-button').addEventListener('click', () => {
  const cartModal = new bootstrap.Modal(document.getElementById('cartModal'));
  cartModal.show();
});

// 🧹 초기화 버튼
document.getElementById('clear-cart').addEventListener('click', clearCart);

// 🚀 메뉴 처음 불러오기
loadMenu();
