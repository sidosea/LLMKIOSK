//통합 자바 스크립트
// 전역 장바구니 객체
const cart = {};
let highlightedItemKey = null;
let menuCatalog = [];
let detailOptions = { mild: false, extraShots: 0 };

//배포 후 연결 || 로컬에서 테스트
// ngrok 사용 시 자동으로 현재 도메인 사용, 그 외에는 URL 파라미터 또는 localStorage 사용
function getApiBaseUrl() {
  // 1. URL 파라미터 확인 (예: ?server=https://abc123.ngrok.io)
  const urlParams = new URLSearchParams(window.location.search);
  const serverParam = urlParams.get('server');
  if (serverParam) {
    const apiUrl = serverParam.startsWith('http') ? serverParam : `http://${serverParam}`;
    localStorage.setItem('api_base_url', apiUrl);
    return apiUrl;
  }
  
  // 2. localStorage 확인
  const savedUrl = localStorage.getItem('api_base_url');
  if (savedUrl) {
    return savedUrl;
  }
  
  // 3. ngrok 사용 시 자동 감지 (현재 도메인이 localhost가 아닌 경우)
  const currentHost = window.location.hostname;
  if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
    // ngrok이나 다른 도메인을 사용 중이면 현재 도메인 사용
    const protocol = window.location.protocol;
    const port = window.location.port ? `:${window.location.port}` : '';
    const apiUrl = `${protocol}//${currentHost}${port}`;
    console.log('🌐 ngrok/외부 도메인 감지, API URL:', apiUrl);
    return apiUrl;
  }
  
  // 4. 기본값 (로컬호스트)
  return 'http://localhost:5002';
}

const API_BASE_URL = getApiBaseUrl();
console.log('🌐 API 서버 주소:', API_BASE_URL);
// const API_BASE_URL = 'https://kiosk-server-env.eba-as7cmwjg.ap-northeast-2.elasticbeanstalk.com';

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
  detailOptions = { mild: false, extraShots: 0 };

  $("#detailModalLabel").text(item.name);
  $("#detail-image").attr("src", "img/" + item.image).attr("alt", item.name);
  $("#detail-description").text(item.description || "");
  $("#shots-value").text("0");
  $("#option-mild").removeClass("active");

  const $options = $("#hot-ice-options").empty();
  const hotAvailable = item.hot === "Y";

  const hotBtn = $(`
    <button type="button" class="pill-btn temperature-btn temperature-hot" data-temp="hot" ${hotAvailable ? "" : "disabled"}>
      HOT
    </button>
  `);

  const iceBtn = $(`
    <button type="button" class="pill-btn temperature-btn temperature-ice active" data-temp="ice">
      ICE
    </button>
  `);

  $options.append(hotBtn, iceBtn);

  $(".temperature-btn").off("click").on("click", function () {
    if ($(this).prop("disabled")) return;
    $(".temperature-btn").removeClass("active");
    $(this).addClass("active");
    currentTemp = $(this).data("temp");
  });

  $("#option-mild").off("click").on("click", function () {
    detailOptions.mild = !detailOptions.mild;
    $(this).toggleClass("active", detailOptions.mild);
  });

  $("#shots-minus").off("click").on("click", function () {
    if (detailOptions.extraShots > 0) {
      detailOptions.extraShots--;
      $("#shots-value").text(detailOptions.extraShots);
      updateDetailPriceDisplay();
    }
  });

  $("#shots-plus").off("click").on("click", function () {
    detailOptions.extraShots++;
    $("#shots-value").text(detailOptions.extraShots);
    updateDetailPriceDisplay();
  });

  $("#add-to-cart-detail").off("click").on("click", function () {
    if (!currentTemp) {
      alert("온도를 선택하세요!");
      return;
    }
    addToCartDetail();
  });

  $("#detail-pay-now").off("click").on("click", function () {
    if (!currentTemp) {
      alert("온도를 선택하세요!");
      return;
    }
    addToCartDetail({ skipToast: true });
    proceedToPayment();
  });

  updateDetailPriceDisplay();
  new bootstrap.Modal($("#detailModal")[0]).show();
}

function updateDetailPriceDisplay() {
  if (!currentDetailItem) return;
  const adjusted = currentDetailItem.price + detailOptions.extraShots * 500;
  $("#detail-price").text(formatPrice(adjusted));
}

function addToCartDetail({ skipToast = false, closeModal = true } = {}) {
  if (!currentDetailItem) return null;
  const tempLabel = currentTemp === "hot" ? "따뜻하게" : "차갑게";
  const optionKey = `mild:${detailOptions.mild ? 1 : 0}|shots:${detailOptions.extraShots}`;
  const key = `${currentDetailItem.name}|${currentTemp}|${optionKey}`;
  const unitPrice = currentDetailItem.price + detailOptions.extraShots * 500;

  if (cart[key]) {
    cart[key].quantity += currentQty;
  } else {
    cart[key] = {
      ...currentDetailItem,
      displayName: currentDetailItem.name,
      displayLabel: `${currentDetailItem.name} (${tempLabel})`,
      temperature: currentTemp,
      temperatureLabel: tempLabel,
      options: { mild: detailOptions.mild, extraShots: detailOptions.extraShots },
      basePrice: currentDetailItem.price,
      price: unitPrice,
      name: key,
      quantity: currentQty
    };
  }
  updateCart();
  if (!skipToast) {
    showToast(currentDetailItem.name);
  }
  if (closeModal) {
    $("#detailModal").modal("hide");
  }
  return key;
}

function createOptionSummary(item) {
  if (!item || !item.options) return "";
  const summary = [];
  if (item.options.mild) summary.push("연하게");
  if (item.options.extraShots) summary.push(`샷 +${item.options.extraShots}`);
  return summary.join(" · ");
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

    const optionSummary = createOptionSummary(item);
    const optionHtml = optionSummary ? `<div class="text-muted small">${optionSummary}</div>` : "";
    const $itemDiv = $(`
      <div class="d-flex justify-content-between align-items-center mb-3">
        <div class="d-flex align-items-center">
          <img src="img/${item.image}" alt="${name}" class="cart-item-image me-2" style="width: 40px; height: 40px; object-fit: cover;">
          <div>
            <div>${item.displayLabel || item.displayName || name}</div>
            <div class="text-muted small">${formatPrice(item.price)} x ${item.quantity}</div>
            ${optionHtml}
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

  updateOrderCardSummary(total, count);
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

function proceedToPayment() {
  if (!Object.keys(cart).length) {
    $("#responseText").text("장바구니가 비어 있습니다.");
    return;
  }
  const cartData = encodeURIComponent(JSON.stringify(cart));
  window.location.href = `paymentpage.html?cart=${cartData}`;
}

function getTemperatureLabel(item) {
  if (!item) return "";
  if (item.temperatureLabel) return item.temperatureLabel;
  if (item.temperature === "hot") return "따뜻하게";
  if (item.temperature === "ice") return "차갑게";
  const match = item.name && item.name.match(/\(([^)]+)\)/);
  return match ? match[1] : "기본";
}

function getOptionDetails(item) {
  const details = [];
  if (item?.options?.mild) details.push("연하게");
  if (item?.options?.extraShots) details.push(`샷 +${item.options.extraShots}`);
  return details.length ? ` · ${details.join(" · ")}` : "";
}

function toggleOrderCardControls(disabled) {
  $("#order-card-minus, #order-card-plus, #order-card-cancel, #order-card-checkout").prop("disabled", disabled);
}

function setHighlightedItem(key) {
  if (!cart[key]) return;
  highlightedItemKey = key;
  const item = cart[key];
  const tempLabel = getTemperatureLabel(item);
  $("#order-selected-name").text(item.displayName || item.name);
  $("#order-selected-meta").text(`${tempLabel} x ${item.quantity}${getOptionDetails(item)}`);
  $("#order-card-qty").text(item.quantity);
  $("#order-card-items .order-item-row").removeClass("active").filter(function () {
    return $(this).data("key") === key;
  }).addClass("active");
}

function updateOrderCardSummary(total, count) {
  const $list = $("#order-card-items");
  if (!$list.length) return;
  $list.empty();

  if (count === 0) {
    highlightedItemKey = null;
    $list.append('<p class="order-item order-empty">담긴 메뉴가 없습니다</p>');
    $("#order-selected-name").text("담긴 메뉴가 없습니다");
    $("#order-selected-meta").text("메뉴를 담아주세요");
    $("#order-card-qty").text("0");
    $("#order-card-total").text("₩0");
    toggleOrderCardControls(true);
    // 플로팅 상태 해제
    $(".order-card").removeClass("floating");
    $("#recommendation-shell").removeClass("has-floating-cart");
    return;
  }

  $("#order-card-total").text(formatPrice(total));
  toggleOrderCardControls(false);

  const keys = Object.keys(cart);
  if (!highlightedItemKey || !cart[highlightedItemKey]) {
    highlightedItemKey = keys[0];
  }

  keys.forEach((key) => {
    const item = cart[key];
    const tempLabel = getTemperatureLabel(item);
    const optionDetails = getOptionDetails(item);
    const $row = $(`
      <div class="order-item-row${key === highlightedItemKey ? " active" : ""}">
        <div>
          <p class="order-item">${item.displayName || item.name}</p>
          <p class="order-meta">${tempLabel} x ${item.quantity}${optionDetails}</p>
        </div>
        <p class="order-line-price">${formatPrice(item.price * item.quantity)}</p>
      </div>
    `).attr("data-key", key);
    $list.append($row);
  });

  setHighlightedItem(highlightedItemKey);
}

function loadMenu() {
  fetch(`${API_BASE_URL}/api/v1/menus`)
    .then((res) => res.json())
    .then((response) => {
      if (response.data) {
        menuCatalog = response.data;
        renderMenu(menuCatalog);
      } else {
        console.error("메뉴 데이터를 가져올 수 없습니다:", response.error);
      }
    })
    .catch((error) => {
      console.error("메뉴 로딩 실패:", error);
    });
}

function ensureMenuCatalog() {
  if (menuCatalog.length) {
    return Promise.resolve(menuCatalog);
  }
  return fetch(`${API_BASE_URL}/api/v1/menus`)
    .then(res => res.json())
    .then(response => {
      if (!response.data) {
        throw new Error("메뉴 데이터를 가져올 수 없습니다.");
      }
      menuCatalog = response.data;
      return menuCatalog;
    });
}

function renderRecommendationCard(item) {
  const description = item.description || "상세 설명을 준비 중입니다.";
  return `
    <article class="recommendation-card">
      <img src="img/${item.image}" alt="${item.name}" />
      <div class="card-body">
        <p class="card-title">${item.name}</p>
        <p class="card-desc">${description}</p>
        <div class="card-footer">
          <span class="card-price">${formatPrice(item.price)}</span>
          <button type="button" class="card-action js-open-detail" data-menu="${item.name}">추가하기</button>
        </div>
      </div>
    </article>
  `;
}

function renderCollabCard(item) {
  const description = item.description || "풍성한 기쁨을 느껴보세요.";
  const template = `
    <div class="collab-thumb">
      <img src="img/${item.image}" alt="${item.name}" />
    </div>
    <div class="card-content">
      <p class="card-title">${item.name}</p>
      <p class="card-desc">${description}</p>
      <div class="card-footer">
        <span class="card-price">${formatPrice(item.price)}</span>
        <button type="button" class="card-action js-open-detail" data-menu="${item.name}">추가하기</button>
      </div>
    </div>
  `;
  $("#collab-card").html(template);
}

// 추천 응답 표시
function displayRecommendations(recs, userInputText = "") {
  const $shell = $("#recommendation-shell");
  const $collabSection = $("#collab-section");
  const $specialSection = $("#special-section");
  const $list = $("#recommendation-list");

  ensureMenuCatalog()
    .then((menuItems) => {
      const resolved = recs
        .map((rec) => {
          const found = menuItems.find((item) => item.name === rec.name);
          if (!found) return null;
          return {
            ...found,
            description: found.description || rec.description || ""
          };
        })
        .filter(Boolean);

      if (!resolved.length) return;

      $shell.removeClass("d-none");
      if (userInputText) {
        $("#collab-title").text(userInputText);
      }
      renderCollabCard(resolved[0]);
      $collabSection.removeClass("d-none");

      const specials = resolved.slice(1, 4);
      $list.empty();
      specials.forEach((item) => {
        $list.append(renderRecommendationCard(item));
      });
      $specialSection.toggleClass("d-none", specials.length === 0);

      // 주문 카드를 플로팅으로 변경
      $(".order-card").addClass("floating");
      // 추천 섹션에 플로팅 장바구니를 위한 여백 추가
      $shell.addClass("has-floating-cart");

      // 자동 스크롤 다운 (추천 섹션으로)
      setTimeout(() => {
        $shell[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    })
    .catch((error) => {
      console.error(error);
    });
}

  // 텍스트 기반 주문 → 장바구니 담기
  function sendText() {
    let text = $("#textInput").val().trim();
    if (text === "") return;

    $.ajax({
      url: `${API_BASE_URL}/api/v1/orders/text`,
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify({ text }),
      success: function (response) {
        const data = response && response.data;

        // 새로운 형식: data.orders 배열 확인
        if (!data || !data.orders || !Array.isArray(data.orders) || data.orders.length === 0) {
          $("#responseText").text("응답 형식이 올바르지 않습니다.");
          return;
        }

        // 경고 메시지가 있으면 표시
        if (response.warnings) {
          console.warn("일부 주문 실패:", response.warnings);
        }

        // 여러 주문 처리
        let successCount = 0;
        let addedItems = [];

        // 메뉴 목록 먼저 로드
        ensureMenuCatalog()
          .then(menuItems => {
            // 각 주문에 대해 장바구니에 추가
            data.orders.forEach(order => {
              const intent = order.intent || {};
              const match = order.match || {};
              const quantity = parseInt(intent.quantity || 1, 10) || 1;
              const temperature = intent.temperature === "hot" ? "hot" : "ice";
              const temperatureLabel = temperature === "hot" ? "따뜻하게" : "차갑게";

              const menuItem = menuItems.find(item => item.name === match.name);
              const resolvedItem = menuItem || {
                name: match.name,
                image: match.image || "placeholder.png",
                price: match.unitPrice || 0,
                description: ""
              };

              const optionKey = "mild:0|shots:0";
              const key = `${resolvedItem.name}|${temperature}|${optionKey}`;
              const displayLabel = `${resolvedItem.name} (${temperatureLabel})`;

              if (cart[key]) {
                cart[key].quantity += quantity;
              } else {
                cart[key] = {
                  ...resolvedItem,
                  displayName: resolvedItem.name,
                  displayLabel,
                  temperature,
                  temperatureLabel,
                  options: { mild: false, extraShots: 0 },
                  basePrice: resolvedItem.price,
                  price: resolvedItem.price,
                  name: key,
                  quantity: quantity
                };
              }

              successCount++;
              addedItems.push(`${resolvedItem.name} ${quantity}개`);
            });

            updateCart();

            // 성공 메시지 표시
            if (successCount === 1) {
              showToast(addedItems[0].split(' ')[0]);
              $("#responseText").text(`🛒 "${addedItems[0]}"를 장바구니에 담았습니다.`);
            } else {
              showToast(`${successCount}개 주문 추가됨`);
              $("#responseText").text(`🛒 ${successCount}개 주문을 장바구니에 담았습니다: ${addedItems.join(', ')}`);
            }

            $("#textInput").val("");

            // 추천 박스 표시: 첫 번째 주문 기준으로 추천
            if (data.orders.length > 0) {
              const firstOrder = data.orders[0];
              const recPayload = {
                query: firstOrder.intent?.query || firstOrder.match?.name || text,
                temperature: firstOrder.intent?.temperature || null,
                quantity: firstOrder.intent?.quantity || 1
              };
              $.ajax({
                url: `${API_BASE_URL}/api/v1/recommendations`,
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify(recPayload),
                success: function (recRes) {
                  const recData = recRes && recRes.data;
                  if (recData && Array.isArray(recData.recommendations) && recData.recommendations.length) {
                    displayRecommendations(recData.recommendations, text);
                  }
                }
              });
            }
          })
          .catch(() => {
            $("#responseText").text("메뉴 정보를 가져오지 못했습니다.");
          });
      },
      error: function (xhr) {
        const errMsg =
          (xhr.responseJSON && xhr.responseJSON.error && xhr.responseJSON.error.message) ||
          "서버와 연결할 수 없습니다.";
        $("#responseText").text(errMsg);
      }
    });
  }
  window.sendText = sendText;

// 메인 실행
$(document).ready(function () {
  toggleOrderCardControls(true);
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

  // 입력창 엔터로 전송
  if ($("#textInput").length) {
    $("#textInput").on("keypress", function (e) {
      if (e.which === 13) {
        e.preventDefault();
        sendText();
      }
    });
  }

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

  $("#order-card-minus").on("click", function () {
    if (highlightedItemKey) {
      decreaseQuantity(highlightedItemKey);
    }
  });
  $("#order-card-plus").on("click", function () {
    if (highlightedItemKey) {
      increaseQuantity(highlightedItemKey);
    }
  });
  $("#order-card-items").on("click", ".order-item-row", function () {
    const key = $(this).data("key");
    if (cart[key]) {
      setHighlightedItem(key);
    }
  });
  $("#order-card-cancel").on("click", clearCart);

  // 💳 결제하기 버튼
  $("#payment-btn, #order-card-checkout").on("click", function (e) {
    e.preventDefault();
    proceedToPayment();
  });

  $(document).on("click", ".js-open-detail", function () {
    const name = $(this).data("menu");
    ensureMenuCatalog().then((menuItems) => {
      const found = menuItems.find((menu) => menu.name === name);
      if (found) {
        openDetailModal(found);
      }
    });
  });

  // 메뉴 불러오기
  if ($("#menu-grid").length) {
    loadMenu();
  }
});
