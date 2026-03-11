// ===================== GLOBAL STATE =====================
let coins = parseFloat(localStorage.getItem("coins"));
if (isNaN(coins) || coins < 0) coins = 100;

let inventory = JSON.parse(localStorage.getItem("inventory")) || [];
let recentDrops = JSON.parse(localStorage.getItem("recentDrops")) || [];
let cases = [];
let currentCase = null;

// Admin password system
let adminMode = false;
const ADMIN_PASSWORD = "LeyLey";

// ===================== INIT =====================
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("admin-give-btn").onclick = adminGiveItem;
  updateCoins();
  renderInventory();
  renderTopDrops();
  loadCases();
  populateCoinflipDropdown();

  // Buttons
  document.getElementById("sell-all-btn").onclick = sellAllItems;
  document.getElementById("add-coins-btn").onclick = () => { coins += 50.00 ; updateCoins(); };
  document.getElementById("remove-coins-btn").onclick = () => { coins = Math.max(0, coins - 50.00); updateCoins(); };
  document.getElementById("coinflip-btn").onclick = () => {
    const select = document.getElementById("coinflip-select");
    const index = parseInt(select.value);
    if (!isNaN(index)) coinflipItem(index);
  };
  document.getElementById("open-btn").onclick = openCase;
  document.getElementById("show-case-items-btn").onclick = toggleCaseItems;
});

// ===================== COINS =====================
function updateCoins() {
  document.getElementById("coins").textContent = `Balance: ${coins.toFixed(2)}`;
  localStorage.setItem("coins", coins);
}

// ===================== INVENTORY =====================
function saveInventory() {
  localStorage.setItem("inventory", JSON.stringify(inventory));
  localStorage.setItem("recentDrops", JSON.stringify(recentDrops));
}

function renderInventory() {
  const container = document.getElementById("inventory");
  container.innerHTML = "";

  inventory.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = `inv-item ${item.rarity.toLowerCase()}`;
    div.innerHTML = `
      <img src="${item.image}">
      <p>${item.name}</p>
      <small>${item.price.toFixed(2)} coins</small>
      <button class="sell-btn theme-btn">Sell</button>
    `;
    div.querySelector(".sell-btn").onclick = () => sellItem(index);
    container.appendChild(div);
  });
}

function sellItem(index) {
  coins += inventory[index].price;
  inventory.splice(index, 1);
  saveInventory();
  updateCoins();
  renderInventory();
  populateCoinflipDropdown();
}

function sellAllItems() {
  if (inventory.length === 0) return alert("Backpack empty.");
  const total = inventory.reduce((sum, i) => sum + i.price, 0);
  coins += total;
  inventory = [];
  saveInventory();
  updateCoins();
  renderInventory();
  populateCoinflipDropdown();
  alert(`Sold everything for ${total.toFixed(2)} coins.`);
}

// ===================== SHOW CASE ITEMS =====================
function toggleCaseItems() {
  const list = document.getElementById("case-items-list");
  if (!currentCase) return;

  if (list.style.display === "block") {
    list.style.display = "none";
    return;
  }

  list.style.display = "block";
  list.innerHTML = "";

  const totalWeight = currentCase.items.reduce((sum, i) => sum + i.weight, 0);
  const sortedItems = [...currentCase.items].sort((a, b) => b.price - a.price);

  sortedItems.forEach(item => {
    const dropRate = ((item.weight / totalWeight) * 100).toFixed(2);
    const div = document.createElement("div");
    div.className = `inv-item ${item.rarity.toLowerCase()}`;
    div.innerHTML = `
      <img src="${item.image}">
      <p>${item.name}</p>
      <small>${item.price.toFixed(2)} coins</small>
      <small style="font-size:14px; margin-top:5px;">🎯 ${dropRate}% chance</small>
    `;
    list.appendChild(div);
  });
}

// ===================== TOP DROPS =====================
function renderTopDrops() {
  const container = document.getElementById("top-drops");
  container.innerHTML = "";

  [...recentDrops]
    .sort((a, b) => b.price - a.price)
    .slice(0, 8)
    .forEach(item => {
      const div = document.createElement("div");
      div.className = `top-drop ${item.rarity.toLowerCase()}`;
      div.innerHTML = `
        <img src="${item.image}">
        <p>${item.name}</p>
        <strong>${item.price.toFixed(2)} coins</strong>
      `;
      container.appendChild(div);
    });
}

// ===================== COINFLIP =====================
function populateCoinflipDropdown() {
  const select = document.getElementById("coinflip-select");
  select.innerHTML = "";

  if (inventory.length === 0) {
    select.innerHTML = `<option>No items available</option>`;
    select.disabled = true;
    return;
  }

  select.disabled = false;
  inventory.forEach((item, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = `${item.name} (${item.price.toFixed(2)} coins)`;
    select.appendChild(option);
  });
}

function coinflipItem(index) {
  const item = inventory[index];
  const coin = document.getElementById("coin");
  const flipBtn = document.getElementById("coinflip-btn");
  flipBtn.disabled = true;

  const win = Math.random() < 0.5;
  const finalClass = win ? "head" : "tail";

  let flips = 0;
  const totalFlips = 10;

  const flipInterval = setInterval(() => {
    coin.classList.toggle("head");
    coin.classList.toggle("tail");
    flips++;

    if (flips > totalFlips) {
      clearInterval(flipInterval);
      coin.classList.remove("head", "tail");
      coin.classList.add(finalClass);

      if (win) {
        inventory.push({ ...item });
        alert(`You won another ${item.name} 🎉!`);
      } else {
        inventory.splice(index, 1);
        alert(`You lost, your ${item.name} was destroyed.`);
      }

      saveInventory();
      renderInventory();
      populateCoinflipDropdown();
      flipBtn.disabled = false;
    }
  }, 150);
}

// ===================== CASE SYSTEM =====================
function loadCases() {
  fetch("data/cases.json")
    .then(res => res.json())
    .then(data => {
      cases = data.cases;
      const display = document.getElementById("case-select-display");
      const options = document.getElementById("case-select-options");
      options.innerHTML = "";

      cases.forEach(c => {
        const div = document.createElement("div");
        div.innerHTML = `<img src="${c.image}"><span>${c.name} (${c.price.toFixed(2)} coins)</span>`;
        div.onclick = () => {
          selectCase(c.id);
          options.style.display = "none";
        };
        options.appendChild(div);
      });

      // Initial selection
      selectCase(cases[0].id);

      // Toggle dropdown
      display.onclick = () => {
        options.style.display = options.style.display === "block" ? "none" : "block";
      };

      // Close dropdown if clicked outside
      document.addEventListener("click", (e) => {
        if (!display.contains(e.target) && !options.contains(e.target)) {
          options.style.display = "none";
        }
      });
    });
}

function selectCase(id) {
  currentCase = cases.find(c => c.id === id);
  if (!currentCase) return;

  document.getElementById("case-image").src = currentCase.image;
  document.getElementById("case-name").textContent = currentCase.name;
  document.getElementById("open-btn").textContent = `${currentCase.price.toFixed(2)} Coins`;

  // Update dropdown display
  const display = document.getElementById("case-select-display");
  display.innerHTML = `<img src="${currentCase.image}"><span>${currentCase.name} (${currentCase.price.toFixed(2)} coins)</span>`;
}

function openCase() {
  if (!currentCase) return;
  if (coins < currentCase.price) return alert("Not enough coins.");

  coins -= currentCase.price;
  updateCoins();

  const winningItem = getRandomItem(currentCase.items);
  spinToItem(winningItem);
}

function getRandomItem(items) {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  let roll = Math.random() * total;
  for (let item of items) {
    if (roll < item.weight) return item;
    roll -= item.weight;
  }
  return items[0];
}

// ===================== SPINNER =====================
function spinToItem(winningItem) {
  const strip = document.getElementById("spinner-strip");
  strip.innerHTML = "";

  const slots = 50;
  const winnerIndex = 38;

  for (let i = 0; i < slots; i++) {
    let item = currentCase.items[Math.floor(Math.random() * currentCase.items.length)];
    if (i === winnerIndex) item = winningItem;

    const div = document.createElement("div");
    div.className = `spinner-item ${item.rarity.toLowerCase()}`;
    div.innerHTML = `<img src="${item.image}">`;
    strip.appendChild(div);
  }

  const itemWidth = strip.children[0].offsetWidth + 30;
  const containerWidth = document.getElementById("spinner-container").offsetWidth;
  const offset = -(winnerIndex * itemWidth - containerWidth / 2 + itemWidth / 2);

  strip.style.transition = "none";
  strip.style.transform = "translateX(0)";
  strip.offsetHeight;

  strip.style.transition = "transform 3.2s cubic-bezier(.25,.85,.35,1)";
  strip.style.transform = `translateX(${offset}px)`;

  setTimeout(() => {
    showWinner(winningItem);
  }, 3200);
}

function showWinner(item) {
  inventory.push(item);
  recentDrops.push(item);
  if (recentDrops.length > 20) recentDrops.shift();

  saveInventory();
  renderInventory();
  renderTopDrops();
  populateCoinflipDropdown();

  const winnerBox = document.getElementById("winner-name");
  if (winnerBox) {
    winnerBox.textContent = item.name;
    winnerBox.className = item.rarity.toLowerCase();
  }
}

// ===================== ADMIN GIVE =====================
function adminGiveItem() {
  const panel = document.getElementById("admin-give-panel");
  const itemsContainer = document.getElementById("admin-give-items");

  // Prompt for password if admin mode not active
  if (!adminMode) {
    const password = prompt("Enter Trading passkey:");
    if (password !== ADMIN_PASSWORD) {
      alert("Incorrect Trading Passkey.");
      return;
    }
    adminMode = true;
    alert("Trading Mode Enabled.");
  }

  // Show panel
  panel.style.display = "block";
  itemsContainer.innerHTML = "";

  // Populate items from all cases
  let allItems = [];
  cases.forEach(c => c.items.forEach(item => allItems.push(item)));

  allItems.forEach((item) => {
    const div = document.createElement("div");
    div.className = "admin-give-item";
    div.innerHTML = `
      <img src="${item.image}">
      <div class="admin-give-info">
        <span class="name">${item.name}</span>
        <span class="price">${item.price.toFixed(2)} coins</span>
      </div>
      <button>Give</button>
    `;
    div.querySelector("button").onclick = () => {
      if (coins < item.price) return alert("Not enough coins.");

      coins -= item.price;
      updateCoins();
      inventory.push({ ...item });
      saveInventory();
      renderInventory();
      populateCoinflipDropdown();
      alert(`Traded ${item.name} for ${item.price.toFixed(2)} coins`);
    };
    itemsContainer.appendChild(div);
  });

  // Close button
  document.getElementById("admin-give-close").onclick = () => {
    panel.style.display = "none";
    adminMode = false; // require password next time
  };
}
