// This part was done by Arvind Ramakrishnan in collaboration with Anantha Krishna

// ── Auth Gate ─────────────────────────────────
if (!auth.isLoggedIn()) {
  window.location.href = './login/';
}

document.addEventListener('DOMContentLoaded', () => {
  const user = auth.getCurrentUser();
  if (!user) return;

  // ── Theme Setup ─────────────────────────────
  const htmlEl = document.documentElement;
  const savedTheme = localStorage.getItem('fp_theme') || 'dark';
  htmlEl.setAttribute('data-bs-theme', savedTheme);

  // ── Populate Navbar ─────────────────────────
  const navRight = document.getElementById('nav-right');
  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  navRight.innerHTML = `
    <button class="btn btn-sm theme-toggle" id="theme-toggle" title="Toggle theme">
      <i class="bi ${savedTheme === 'dark' ? 'bi-moon-fill' : 'bi-sun-fill'}" id="theme-icon"></i>
    </button>
    <div class="d-flex align-items-center gap-2">
      <div class="user-avatar">${initials}</div>
      <div class="d-none d-sm-block lh-1">
        <div class="small fw-semibold">${escapeHtml(user.name)}</div>
        <div class="text-accent" style="font-size:0.65rem;font-weight:700;text-transform:uppercase;">${user.role}</div>
      </div>
    </div>
    <button class="btn btn-sm btn-outline-secondary" id="btn-logout" title="Logout">
      <i class="bi bi-box-arrow-right"></i>
    </button>
  `;

  // Theme toggle handler
  document.getElementById('theme-toggle').addEventListener('click', () => {
    const current = htmlEl.getAttribute('data-bs-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    htmlEl.setAttribute('data-bs-theme', next);
    document.getElementById('theme-icon').className = next === 'dark' ? 'bi bi-moon-fill' : 'bi bi-sun-fill';
    localStorage.setItem('fp_theme', next);
  });

  // Logout
  document.getElementById('btn-logout').addEventListener('click', () => auth.logout());

  // ── Welcome Greeting ────────────────────────
  const welcomeEl = document.getElementById('welcome-heading');
  const hour = new Date().getHours();
  let greeting = 'Good evening';
  if (hour < 12) greeting = 'Good morning';
  else if (hour < 17) greeting = 'Good afternoon';

  const firstName = user.name.split(' ')[0];
  welcomeEl.textContent = user.role === 'admin'
    ? `${greeting}, Admin`
    : `${greeting}, ${firstName}!`;

  // ── Cart & Modal ────────────────────────────
  const cart = [];
  const orderModal = new bootstrap.Modal(document.getElementById('orderModal'));
  const orderList = document.getElementById('orderList');
  const orderCount = document.getElementById('orderCount');
  const orderTotal = document.getElementById('orderTotal');

  function renderCart() {
    if (cart.length === 0) {
      orderCount.textContent = 'No items added yet. Click a dish to add.';
      orderList.innerHTML = '';
      orderTotal.textContent = '';
      return;
    }

    orderCount.textContent = `${cart.length} item(s) in your order:`;
    orderList.innerHTML = cart.map((item, i) => `
      <div class="order-item">
        <span class="fw-medium">${escapeHtml(item.name)}</span>
        <span>
          <span class="text-muted">₹${item.price}</span>
          <button class="remove-item-btn" data-index="${i}" title="Remove">×</button>
        </span>
      </div>
    `).join('');

    // Remove handlers
    orderList.querySelectorAll('.remove-item-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        cart.splice(parseInt(btn.dataset.index), 1);
        renderCart();
      });
    });

    const total = cart.reduce((sum, item) => sum + item.price, 0);
    orderTotal.textContent = `Total: ₹${total}`;
  }

  // Open modal
  document.getElementById('orderBtn').addEventListener('click', () => {
    renderCart();
    orderModal.show();
  });

  // ── Render Menu ─────────────────────────────
  const menuData = [
    { name: 'Classic Burger', icon: '🍔', price: 199, desc: 'Juicy beef patty, lettuce, cheese' },
    { name: 'Margherita Pizza', icon: '🍕', price: 349, desc: 'Fresh mozzarella, basil, tomato' },
    { name: 'Pasta Alfredo', icon: '🍝', price: 279, desc: 'Creamy white sauce, parmesan' },
    { name: 'Veg Wrap', icon: '🌯', price: 149, desc: 'Grilled veggies, mint chutney' },
    { name: 'Chicken Biryani', icon: '🍚', price: 329, desc: 'Aromatic basmati, spiced chicken' },
    { name: 'Masala Dosa', icon: '🥞', price: 129, desc: 'Crispy crepe, potato filling, chutneys' },
    { name: 'Mango Lassi', icon: '🥭', price: 89, desc: 'Fresh mango, yogurt, cardamom' },
    { name: 'Chocolate Brownie', icon: '🍫', price: 159, desc: 'Warm fudge, vanilla ice cream' }
  ];

  const grid = document.getElementById('menu-grid');
  if (grid) {
    grid.innerHTML = menuData.map(item => `
      <div class="col-6 col-md-4 col-lg-3">
        <div class="card menu-card h-100" data-name="${item.name}" data-price="${item.price}">
          <div class="card-body d-flex flex-column">
            <span class="menu-emoji">${item.icon}</span>
            <h6 class="card-title fw-semibold mb-1">${item.name}</h6>
            <p class="card-text text-muted small flex-grow-1">${item.desc}</p>
            <div class="d-flex justify-content-between align-items-center mt-2">
              <span class="fw-bold text-accent">₹${item.price}</span>
              <button class="btn btn-sm btn-outline-secondary rounded-circle add-btn" title="Add to order">
                <i class="bi bi-plus"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  // Add item via card click or + button
  document.querySelectorAll('.menu-card').forEach(card => {
    function addItem() {
      const name = card.dataset.name;
      const price = parseInt(card.dataset.price);
      cart.push({ name, price });

      // Brief highlight
      card.classList.add('item-added');
      setTimeout(() => card.classList.remove('item-added'), 500);

      showToast(`${name} added`, 'info');
      renderCart();
      orderModal.show();
    }

    const addBtn = card.querySelector('.add-btn');
    if (addBtn) {
      addBtn.addEventListener('click', (e) => { e.stopPropagation(); addItem(); });
    }
    card.addEventListener('click', (e) => {
      if (e.target.closest('.add-btn')) return;
      addItem();
    });
  });

  // Clear cart
  document.getElementById('clearCartBtn').addEventListener('click', () => {
    cart.length = 0;
    renderCart();
  });

  // Place order
  document.getElementById('confirmBtn').addEventListener('click', () => {
    if (cart.length === 0) {
      showToast('Please add at least one item.', 'danger');
      return;
    }

    const total = cart.reduce((sum, item) => sum + item.price, 0);
    const order = auth.saveOrder({
      items: cart.map(i => ({ name: i.name, price: i.price })),
      total: total,
      type: 'dine-in'
    });

    if (order) {
      showToast(`Order placed! Total: ₹${total} 🍳`, 'success');
      cart.length = 0;
      renderCart();
      orderModal.hide();
      renderOrderHistory();
      renderAdminOrders();
    } else {
      showToast('Failed to place order.', 'danger');
    }
  });

  // ── Order History (Customer) ────────────────
  function renderOrderHistory() {
    const section = document.getElementById('history-section');
    const list = document.getElementById('history-list');
    const empty = document.getElementById('history-empty');
    const countBadge = document.getElementById('history-count');

    if (user.role === 'admin') { section.style.display = 'none'; return; }
    section.style.display = 'block';

    const orders = auth.getOrders();
    countBadge.textContent = `${orders.length} order${orders.length !== 1 ? 's' : ''}`;

    if (orders.length === 0) {
      list.innerHTML = '';
      empty.style.display = 'block';
      return;
    }

    empty.style.display = 'none';
    const sorted = [...orders].reverse();
    list.innerHTML = sorted.map(order => {
      const date = new Date(order.placedAt);
      const dateStr = date.toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
      const items = order.items.map(i => i.name).join(', ');

      return `
        <div class="history-card">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <span class="text-muted small">${dateStr}</span>
            <span class="badge ${order.status === 'placed' ? 'bg-warning-subtle text-warning-emphasis' : 'bg-success-subtle text-success-emphasis'} small">${order.status}</span>
          </div>
          <div class="small text-muted mb-1">${escapeHtml(items)}</div>
          <div class="fw-bold text-accent">₹${order.total}</div>
        </div>
      `;
    }).join('');
  }

  // ── Admin Orders ────────────────────────────
  function renderAdminOrders() {
    const section = document.getElementById('admin-section');
    const list = document.getElementById('admin-list');
    const countBadge = document.getElementById('admin-count');

    if (user.role !== 'admin') { section.style.display = 'none'; return; }
    section.style.display = 'block';

    const allOrders = auth.getAllOrders();
    countBadge.textContent = `${allOrders.length} order${allOrders.length !== 1 ? 's' : ''}`;

    if (allOrders.length === 0) {
      list.innerHTML = '<p class="text-muted small py-3">No customer orders yet.</p>';
      return;
    }

    list.innerHTML = allOrders.map(order => {
      const date = new Date(order.placedAt);
      const dateStr = date.toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
      const items = order.items.map(i => i.name).join(', ');

      return `
        <div class="history-card">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <span class="fw-semibold small">${escapeHtml(order.customerName)} <span class="text-muted fw-normal">(${escapeHtml(order.customerEmail)})</span></span>
            <span class="text-muted small">${dateStr}</span>
          </div>
          <div class="small text-muted mb-1">${escapeHtml(items)}</div>
          <div class="fw-bold text-accent">₹${order.total}</div>
        </div>
      `;
    }).join('');
  }

  // ── Init Views ──────────────────────────────
  renderOrderHistory();
  renderAdminOrders();

  // ── Toast Helper (Bootstrap) ────────────────
  function showToast(message, type = 'info') {
    const toastArea = document.getElementById('toast-area');
    const iconMap = { success: 'bi-check-circle-fill', danger: 'bi-exclamation-triangle-fill', info: 'bi-info-circle-fill' };
    const bgMap = { success: 'text-bg-success', danger: 'text-bg-danger', info: 'text-bg-info' };

    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center ${bgMap[type] || bgMap.info} border-0`;
    toastEl.setAttribute('role', 'alert');
    toastEl.innerHTML = `
      <div class="d-flex">
        <div class="toast-body"><i class="bi ${iconMap[type] || iconMap.info} me-2"></i>${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>`;
    toastArea.appendChild(toastEl);
    const bsToast = new bootstrap.Toast(toastEl, { delay: 3000 });
    bsToast.show();
    toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
  }
});

// ── Utility ───────────────────────────────────
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
