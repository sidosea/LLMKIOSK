//통합 자바 스크립트
// 전역 장바구니 객체
const cart = {};

// 가격 포맷
function formatPrice(price) {
  return "\\" + price.toLocaleString();
}

// 🧾 메뉴 출력
function renderMenu(menuItems) {
  const $menuGrid = $("#menu-grid");
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

    $col.find(".card").on("click", function () {
      openDetailModal(item);
    });

    $menuGrid.append($col);
  });
}

let currentDetailItem = null;
let currentTemp = null;
let currentQty = 1;

function openDetailModal(item) {
  currentDetailItem = item;
  currentQty = 1;
  currentTemp = "ice";

  $("#detailModalLabel").text(item.name);
  $("#detail-image").attr("src", "img/" + item.image).attr("alt", item.name);
  $("#detail-description").text(item.description);
  $("#detail-price").text(formatPrice(item.price));
  $("#qty-input").val(1);

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

  $(".temperature-btn").off("click").on("click", function () {
    if ($(this).prop("disabled")) return;
    $(".temperature-btn").removeClass("active btn-danger").addClass("btn-outline-primary");
    $(this).addClass("active btn-danger").removeClass("btn-outline-primary");
    currentTemp = $(this).data("temp");
  });

  $("#qty-minus").off("click").on("click", function () {
    if (currentQty > 1) {
      currentQty--;
      $("#qty-input").val(currentQty);
    }
  });

  $("#qty-plus").off("click").on("click", function () {
    currentQty++;
    $("#qty-input").val(currentQty);
  });

  $("#add-to-cart-detail").off("click").on("click", function () {
    if (!currentTemp) {
      alert("온도를 선택하세요!");
      return;
    }
    addToCartDetail();
    $("#detailModal").modal("hide");
  });

  new bootstrap.Modal($("#detailModal")[0]).show();
}

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

function updateCart() {
  const $cartItems = $("#cart-items");
  const $cartCount = $("#cart-count");
  const $cartTotal = $("#cart-total");

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

function showToast(itemName) {
  const $toastLive = $("#toast");
  const toastBootstrap = new bootstrap.Toast($toastLive[0]);
  $("#toast .toast-body").text(`🛒 ${itemName}가(이) 장바구니에 담겼습니다!`);
  toastBootstrap.show();
}

function loadMenu() {
  fetch("menu.json")
    .then((res) => res.json())
    .then(renderMenu);
}

// 추천 응답 표시
function displayRecommendations(recs) {
  const $box = $("#recommendationBox");
  $box.empty().removeClass("d-none");

  const main = recs[0];
  const others = recs.slice(1);

  const mainHTML = `
    <div class="text-center">
        <h4>${main.name}</h4>
        <img src="img/${main.image}" class="img-fluid rounded" style="max-width: 200px;" />
        <p class="mt-2">${main.description}</p>
        <button class="btn btn-success mt-3" id="addToCartBtn">🛍 "${main.name}" 담기</button>
    </div>
  `;
  $box.append(mainHTML);

  if (others.length > 0) {
    let otherHTML = `
      <div class="mt-4">
          <small>혹시 이것을 찾으셨나요?</small>
          <div class="d-flex justify-content-center gap-3 mt-2">`;

    others.forEach((item) => {
      otherHTML += `
        <div class="text-center alt-item" style="cursor:pointer;">
            <img src="img/${item.image}" class="img-thumbnail" style="width:100px;" />
            <div>${item.name}</div>
        </div>`;
    });

    otherHTML += `</div></div>`;
    $box.append(otherHTML);
  }

  $(".alt-item").on("click", function () {
    const name = $(this).find("div").text();
    const selected = recs.find((r) => r.name === name);
    if (selected) {
      const newList = [selected, ...recs.filter((r) => r.name !== name)];
      displayRecommendations(newList);
    }
  });

  $("#addToCartBtn").on("click", function () {
    alert(`🛒 ${main.name} 메뉴를 장바구니에 담았습니다!`);
  });
}

function sendText() {
  const text = $("#textInput").val().trim();
  if (!text) return;

  $.ajax({
    url: "http://localhost:5000/send_text",
    type: "POST",
    contentType: "application/json",
    data: JSON.stringify({ text }),
    success: function (response) {
      $("#responseText").text(response.message);
      $("#textInput").val("");
      if (response.recommendations?.length > 0) {
        displayRecommendations(response.recommendations);
      }
    },
    error: function () {
      $("#responseText").text("서버와 연결할 수 없습니다.");
    }
  });
}

// 메인 실행
$(document).ready(function () {
  // 페이지 이동
  $("#menuBtn").on("click", function () {
    window.location.href = "menupage.html";
  });

  // 슬라이드
  let btn_state = 0;
  const $slideContainer = $(".slide-container");
  const $slides = $(".slide-box");
  const totalSlides = $slides.length - 1;
  const slideWidth = 260;

  function updateSlidePosition() {
    $slideContainer.css({
      transform: `translateX(-${btn_state * slideWidth}px)`,
      transition: "transform 0.5s ease"
    });
  }

  $(".next-btn").on("click", function () {
    btn_state = (btn_state + 1) % totalSlides;
    updateSlidePosition();
  });

  $(".before-btn").on("click", function () {
    btn_state = (btn_state - 1 + totalSlides) % totalSlides;
    updateSlidePosition();
  });

  setInterval(function () {
    btn_state = (btn_state + 1) % totalSlides;
    updateSlidePosition();
  }, 3000);

  // 텍스트 전송
  if ($("#sendBtn").length) {
    $("#sendBtn").on("click", sendText);
    $("#textInput").on("keypress", function (e) {
      if (e.which === 13) {
        e.preventDefault();
        sendText();
      }
    });
  }

  // 장바구니 기능
  $("#cart-button").on("click", function () {
    new bootstrap.Modal($("#cartModal")[0]).show();
  });

  $("#clear-cart").on("click", clearCart);

  $("#cart-items").on("click", ".decrease-btn", function () {
    decreaseQuantity($(this).data("name"));
  });
  $("#cart-items").on("click", ".increase-btn", function () {
    increaseQuantity($(this).data("name"));
  });
  $("#cart-items").on("click", ".remove-btn", function () {
    removeFromCart($(this).data("name"));
  });

  $(".btn-success").on("click", function () {
    if ($(this).attr("id") === "addToCartBtn" || $(this).attr("id") === "add-to-cart-detail") return;
    const cartData = encodeURIComponent(JSON.stringify(cart));
    window.location.href = `paymentpage.html?cart=${cartData}`;
  });

  // 메뉴 불러오기
  if ($("#menu-grid").length) {
    loadMenu();
  }
});
