// ===================== GLOBAL STATE =====================
let coins = parseFloat(localStorage.getItem("coins"));
if (isNaN(coins) || coins < 0) coins = 10;

let inventory = JSON.parse(localStorage.getItem("inventory")) || [];
let recentDrops = JSON.parse(localStorage.getItem("recentDrops")) || [];
let cases = [];
let currentCase = null;

// cooldown lock
let isSpinning = false;

// ===================== INIT =====================
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("admin-give-btn").onclick = adminGiveItem;

  updateCoins();
  renderInventory();
  renderTopDrops();
  loadCases();
  populateCoinflipDropdown();

  document.getElementById("sell-all-btn").onclick = sellAllItems;
  document.getElementById("add-coins-btn").onclick = () => {
    coins += 50;
    updateCoins();
  };
  document.getElementById("remove-coins-btn").onclick = () => {
    coins = Math.max(0, coins - 50);
    updateCoins();
  };

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
      <button class="sell-btn theme-btn">Scrap</button>
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
  alert(`Scrapped Backpack for ${total.toFixed(2)} coins.`);
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

// ===================== INVENTORY DROPDOWN =====================
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

// ===================== COINFLIP =====================
function coinflipItem(index) {
  const item = inventory[index];
  const coin = document.getElementById("coin");
  const btn = document.getElementById("coinflip-btn");

  btn.disabled = true;

  const win = Math.random() < 0.5;
  let flips = 0;

  const interval = setInterval(() => {
    coin.classList.toggle("head");
    coin.classList.toggle("tail");

    flips++;
    if (flips > 10) {
      clearInterval(interval);

      if (win) {
        inventory.push({ ...item });
        alert("You won " + item.name);
      } else {
        inventory.splice(index, 1);
        alert("You lost " + item.name);
      }

      saveInventory();
      renderInventory();
      populateCoinflipDropdown();
      btn.disabled = false;
    }
  }, 150);
}

// ===================== CASE LOADING + SELECTOR (FIXED) =====================
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
        div.className = "case-option";

        div.innerHTML = `
          <img src="${c.image}">
          <div>
            <div>${c.name}</div>
            <small>${c.price.toFixed(2)} coins</small>
          </div>
        `;

        div.onclick = (e) => {
          e.stopPropagation();
          selectCase(c.id);
          options.style.display = "none";
        };

        options.appendChild(div);
      });

      // IMPORTANT FIX: ensure case exists
      if (cases.length > 0) {
        selectCase(cases[0].id);
      }

      display.onclick = (e) => {
        e.stopPropagation();
        options.style.display =
          options.style.display === "block" ? "none" : "block";
      };

      document.addEventListener("click", () => {
        options.style.display = "none";
      });
    });
}

// ===================== SELECT CASE (FIXED UI) =====================
function selectCase(id) {
  currentCase = cases.find(c => c.id === id);
  if (!currentCase) return;

  document.getElementById("case-image").src = currentCase.image;
  document.getElementById("case-name").textContent = currentCase.name;
  document.getElementById("open-btn").textContent =
    `⛃ ${currentCase.price.toFixed(2)} ⛃`;

  const display = document.getElementById("case-select-display");

  display.innerHTML = `
    <img src="${currentCase.image}">
    <span>${currentCase.name} (${currentCase.price.toFixed(2)} coins)</span>
  `;
}

// ===================== OPEN CASE (COOLDOWN FIX) =====================
function openCase() {
  if (isSpinning) return;
  if (!currentCase) return;

  if (coins < currentCase.price) {
    alert("Not enough coins");
    return;
  }

  isSpinning = true;

  coins -= currentCase.price;
  updateCoins();

  const winningItem = getRandomItem(currentCase.items);
  spinToItem(winningItem);
}

// ===================== RANDOM ITEM =====================
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
  const winIndex = 38;

  for (let i = 0; i < slots; i++) {
    let item = currentCase.items[Math.floor(Math.random() * currentCase.items.length)];
    if (i === winIndex) item = winningItem;

    const div = document.createElement("div");
    div.className = `spinner-item ${item.rarity.toLowerCase()}`;
    div.innerHTML = `<img src="${item.image}">`;
    strip.appendChild(div);
  }

  strip.offsetHeight;

  const width = strip.children[0].offsetWidth + 30;
  const container = document.getElementById("spinner-container").offsetWidth;

  const offset = -(winIndex * width - container / 2 + width / 2);

  strip.style.transition = "transform 3.2s cubic-bezier(.25,.85,.35,1)";
  strip.style.transform = `translateX(${offset}px)`;

  setTimeout(() => {
    showWinner(winningItem);
    isSpinning = false; // cooldown unlock
  }, 3200);
}

// ===================== WINNER =====================
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
