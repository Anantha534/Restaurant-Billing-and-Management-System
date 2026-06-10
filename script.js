const orderBtn = document.getElementById("orderBtn");
const modalOverlay = document.getElementById("modalOverlay");
const cancelBtn = document.getElementById("cancelBtn");
const confirmBtn = document.getElementById("confirmBtn");
const orderList = document.getElementById("orderList");
const orderCount = document.getElementById("orderCount");
const orderTotal = document.getElementById("orderTotal");

const cart = [];

// Open modal on "Order Now"
orderBtn.addEventListener("click", () => {
  renderCart();
  modalOverlay.classList.remove("hidden");
});

// Add item when a menu card is clicked
document.querySelectorAll(".menu-card").forEach((card) => {
  card.addEventListener("click", () => {
    const name = card.dataset.name;
    const price = parseInt(card.dataset.price);
    cart.push({ name, price });
    renderCart();
    modalOverlay.classList.remove("hidden");
  });
});

function renderCart() {
  if (cart.length === 0) {
    orderCount.textContent = "No items added yet. Click a dish to add.";
    orderList.innerHTML = "";
    orderTotal.textContent = "";
    return;
  }

  orderCount.textContent = `${cart.length} item(s) in your order:`;
  orderList.innerHTML = cart
    .map(
      (item) =>
        `<div class="order-item">
          <span>${item.name}</span>
          <span>₹${item.price}</span>
        </div>`
    )
    .join("");

  const total = cart.reduce((sum, item) => sum + item.price, 0);
  orderTotal.textContent = `Total: ₹${total}`;
}

cancelBtn.addEventListener("click", () => {
  modalOverlay.classList.add("hidden");
});

confirmBtn.addEventListener("click", () => {
  if (cart.length === 0) {
    alert("Please add at least one item.");
    return;
  }
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  alert(`Order placed! Total: ₹${total}. Preparing your food...`);
  cart.length = 0;
  renderCart();
  modalOverlay.classList.add("hidden");
});