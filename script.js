
const menu = [
  { id: 1, name: "Kopi Susu", desc: "Espresso dan susu creamy", price: 18000, emoji: "☕" },
  { id: 2, name: "Americano", desc: "Kopi hitam pilihan", price: 15000, emoji: "🧊" },
  { id: 3, name: "Cappuccino", desc: "Kopi dengan foam susu", price: 22000, emoji: "🥛" },
  { id: 4, name: "Matcha Latte", desc: "Matcha dan susu segar", price: 23000, emoji: "🍵" },
  { id: 5, name: "Croissant", desc: "Pastry renyah dan lembut", price: 17000, emoji: "🥐" },
  { id: 6, name: "Kentang Goreng", desc: "Camilan gurih", price: 16000, emoji: "🍟" }
];

const params = new URLSearchParams(window.location.search);
const table = params.get("meja") || "Online";
const isAdmin = params.get("admin") === "1";
const cart = {};

const rupiah = value =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(value);

const safe = value => String(value).replace(/[&<>"']/g, char => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}[char]));

const customerPage = document.getElementById("customerPage");
const adminPage = document.getElementById("adminPage");

if (isAdmin) {
  customerPage.hidden = true;
  adminPage.hidden = false;
  renderOrders();
} else {
  document.getElementById("tableLabel").textContent =
    table === "Online" ? "Pesanan online" : "Meja " + table;

  renderMenu();
  renderCart();
}

function renderMenu() {
  document.getElementById("menuList").innerHTML = menu.map(item => `
    <article class="menu-card">
      <div style="font-size:42px">${item.emoji}</div>
      <h3>${item.name}</h3>
      <p>${item.desc}</p>
      <div class="price">${rupiah(item.price)}</div>
      <button class="add-btn" onclick="addToCart(${item.id})">
        + Tambah
      </button>
    </article>
  `).join("");
}

function addToCart(id) {
  cart[id] = (cart[id] || 0) + 1;
  renderCart();
}

function changeQty(id, amount) {
  cart[id] = (cart[id] || 0) + amount;
  if (cart[id] <= 0) delete cart[id];
  renderCart();
}

function renderCart() {
  const items = menu.filter(item => cart[item.id]);
  const total = items.reduce(
    (sum, item) => sum + item.price * cart[item.id], 0
  );

  document.getElementById("cartList").innerHTML = items.length
    ? items.map(item => `
      <div class="cart-row">
        <div>
          <strong>${item.name}</strong><br>
          ${rupiah(item.price * cart[item.id])}
        </div>
        <div>
          <button class="secondary" onclick="changeQty(${item.id},-1)">−</button>
          ${cart[item.id]}
          <button class="secondary" onclick="changeQty(${item.id},1)">+</button>
        </div>
      </div>
    `).join("")
    : "Belum ada pesanan.";

  document.getElementById("total").textContent = rupiah(total);
}

document.getElementById("orderForm").addEventListener("submit", event => {
  event.preventDefault();

  const items = menu.filter(item => cart[item.id]).map(item => ({
    name: item.name,
    price: item.price,
    qty: cart[item.id]
  }));

  if (!items.length) {
    alert("Pilih menu terlebih dahulu!");
    return;
  }

  const order = {
    id: Date.now(),
    name: document.getElementById("customerName").value.trim(),
    table,
    notes: document.getElementById("notes").value.trim(),
    items,
    total: items.reduce((sum, item) => sum + item.price * item.qty, 0),
    status: "Menunggu",
    time: new Date().toLocaleString("id-ID")
  };

  if (!order.name) {
    alert("Masukkan nama pelanggan!");
    return;
  }

  // Penyimpanan lokal untuk demo.
  // Belum mengirim pesanan ke perangkat lain.
  const orders = JSON.parse(localStorage.getItem("cafeOrders") || "[]");
  orders.unshift(order);
  localStorage.setItem("cafeOrders", JSON.stringify(orders));

  document.getElementById("message").textContent =
    "Pesanan berhasil disimpan di browser demo. Nomor pesanan: " + order.id;

  Object.keys(cart).forEach(id => delete cart[id]);
  renderCart();
  event.target.reset();
});

function renderOrders() {
  const orders = JSON.parse(localStorage.getItem("cafeOrders") || "[]");
  const target = document.getElementById("ordersList");

  if (!orders.length) {
    target.innerHTML = "<p>Belum ada pesanan tersimpan di browser ini.</p>";
    return;
  }

  target.innerHTML = orders.map(order => `
    <article class="order-row">
      <h3>Pesanan #${order.id}</h3>
      <p><strong>${safe(order.name)}</strong> · Meja ${safe(order.table)}</p>
      <p>${safe(order.time)}</p>
      <p>${order.items.map(item =>
        `${safe(item.name)} × ${item.qty}`
      ).join("<br>")}</p>
      <p>Catatan: ${safe(order.notes || "-")}</p>
      <h3>${rupiah(order.total)}</h3>
      <p class="status">Status: ${safe(order.status)}</p>
      <button class="secondary" onclick="updateStatus(${order.id})">
        Ubah status
      </button>
    </article>
  `).join("");
}

function updateStatus(id) {
  const orders = JSON.parse(localStorage.getItem("cafeOrders") || "[]");
  const order = orders.find(item => item.id === id);
  if (!order) return;

  const statuses = ["Menunggu", "Diproses", "Siap disajikan", "Selesai"];
  const current = statuses.indexOf(order.status);
  order.status = statuses[(current + 1) % statuses.length];

  localStorage.setItem("cafeOrders", JSON.stringify(orders));
  renderOrders();
}

document.getElementById("refreshOrders")
  .addEventListener("click", renderOrders);
