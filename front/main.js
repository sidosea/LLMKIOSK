//통합 자바 스크립트
// 전역 장바구니 객체
const cart = {};

//배포 후 연결 || 로컬에서 테스트
// const API_BASE_URL = 'http://localhost:5000';
const API_BASE_URL = 'http://kiosk-server-env.eba-as7cmwjg.ap-northeast-2.elasticbeanstalk.com';

// 가격 포맷
function formatPrice(price) {
  return "₩" + price.toLocaleString();
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

// 장바구니 관련 함수들 추가
function clearCart() {
  Object.keys(cart).forEach(key => delete cart[key]);
  updateCart();
  $("#cartModal").modal("hide");
}

function decreaseQuantity(name) {
  if (cart[name].quantity > 1) {
    cart[name].quantity--;
  } else {
    delete cart[name];
  }
  updateCart();
}

function increaseQuantity(name) {
  cart[name].quantity++;
  updateCart();
}

function removeFromCart(name) {
  delete cart[name];
  updateCart();
}

function loadMenu() {
  fetch("${API_BASE_URL}/api/v1/menus")
    .then((res) => res.json())
    .then((response) => {
      if (response.data) {
        renderMenu(response.data);
      } else {
        console.error("메뉴 데이터를 가져올 수 없습니다:", response.error);
      }
    })
    .catch((error) => {
      console.error("메뉴 로딩 실패:", error);
    });
}

// 추천 응답 표시
function displayRecommendations(recs) {
  const $box = $("#recommendationBox");
  $box.empty().removeClass("d-none");

  // API에서 메뉴 정보 가져오기
  fetch("${API_BASE_URL}/api/v1/menus")
    .then(res => res.json())
    .then(response => {
      if (!response.data) {
        console.error("메뉴 데이터를 가져올 수 없습니다:", response.error);
        return;
      }
      const menuItems = response.data;
      const main = menuItems.find(item => item.name === recs[0].name);
      if (!main) return; // 메뉴를 찾지 못한 경우

      const mainHTML = `
        <div class="text-center">
            <h4>${main.name}</h4>
            <img src="img/${main.image}" class="img-fluid rounded" style="max-width: 200px; cursor: pointer;" id="main-recommendation" />
            <p class="mt-2">${main.description}</p>
            <button class="btn btn-success mt-3" id="addToCartBtn">🛍 "${main.name}" 담기</button>
        </div>
      `;
      $box.append(mainHTML);

      if (recs.length > 1) {
        let otherHTML = `
          <div class="mt-4">
              <small>혹시 이것을 찾으셨나요?</small>
              <div class="d-flex justify-content-center gap-3 mt-2">`;

        recs.slice(1).forEach((rec) => {
          const item = menuItems.find(menu => menu.name === rec.name);
          if (item) {
            otherHTML += `
              <div class="text-center alt-item" style="cursor:pointer;">
                  <img src="img/${item.image}" class="img-thumbnail" style="width:100px;" />
                  <div>${item.name}</div>
              </div>`;
          }
        });

        otherHTML += `</div></div>`;
        $box.append(otherHTML);
      }

      // 메인 추천 메뉴 클릭 시 상세 모달 열기
      $("#main-recommendation").on("click", function() {
        openDetailModal(main);
      });

      // 담기 버튼 클릭 시 상세 모달 열기
      $("#addToCartBtn").on("click", function() {
        openDetailModal(main);
      });

      $(".alt-item").on("click", function () {
        const name = $(this).find("div").text();
        const selected = menuItems.find(item => item.name === name);
        if (selected) {
          const newList = [selected, ...recs.filter(r => r.name !== name)];
          displayRecommendations(newList);
        }
      });
    });
}

  // 텍스트 전송 함수
    function sendText() {
        let text = $("#textInput").val().trim();
        if (text === "") return;

        $.ajax({ //RESTful 적용 반영
            url: "${API_BASE_URL}/api/v1/menus",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({ query: text, temperature: null, quantity: 1 }),
            success: function (response) {
                // 새 포맷 : data: { intent, recommendations }}
                const data = response && response.data;
                if (!data) { //에러 메세지 백->프론트로 이동
                    $("#responseText").text("응답 형식이 올바르지 않습니다.");
                    return;
                }
                //response 백-> 프론트로 이동
              $("#responseText").text("추천 메뉴를 안내해드릴게요!");
              $("#textInput").val("");

              if (data.recommendations && data.recommendations.length > 0) {
                displayRecommendations(data.recommendations);
              }
            },
            error: function (xhr) { //RESTful 표준 에러 처리
                const errMsg =
                (xhr.responseJSON && xhr.responseJSON.error && xhr.responseJSON.error.message) ||
                "서버와 연결할 수 없습니다.";      
                $("#responseText").text(errMsg);
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
  let slideInterval;

  function updateSlidePosition() {
    $slideContainer.css({
      transform: `translateX(-${btn_state * slideWidth}px)`,
      transition: "transform 0.5s ease"
    });
  }

  function startSlideInterval() {
    if (slideInterval) return;
    slideInterval = setInterval(function () {
      btn_state = (btn_state + 1) % totalSlides;
      updateSlidePosition();
    }, 3000);
  }

  function stopSlideInterval() {
    if (slideInterval) {
      clearInterval(slideInterval);
      slideInterval = null;
    }
  }

  $(".next-btn").on("click", function () {
    stopSlideInterval();
    btn_state = (btn_state + 1) % totalSlides;
    updateSlidePosition();
    startSlideInterval();
  });

  $(".before-btn").on("click", function () {
    stopSlideInterval();
    btn_state = (btn_state - 1 + totalSlides) % totalSlides;
    updateSlidePosition();
    startSlideInterval();
  });

  // 슬라이드 자동 전환 시작
  startSlideInterval();

  // 입력창 이벤트 처리
  if ($("#textInput").length) {
    $("#textInput").on("input", function() {
      if ($(this).val().trim()) {
        stopSlideInterval();
      } else {
        startSlideInterval();
      }
    });
  }

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

  // 💳 결제하기 버튼
  $(".btn-success").on("click", function () {
    if ($(this).attr("id") === "addToCartBtn" || $(this).attr("id") === "add-to-cart-detail") return;
    // 장바구니 정보를 JSON으로 직렬화
    const cartData = encodeURIComponent(JSON.stringify(cart));
    window.location.href = `paymentpage.html?cart=${cartData}`;
  });

  // 메뉴 불러오기
  if ($("#menu-grid").length) {
    loadMenu();
  }
});
