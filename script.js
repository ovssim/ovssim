// ================= GLOBAL STATE =================
let coins = 10.0;
let inventory = [];
let cases = [];
let currentCase = null;

// ================= DOM ELEMENTS =================
const coinsDisplay = document.getElementById("coins");
const caseSelect = document.getElementById("case-select");
const caseImage = document.getElementById("case-image");
const caseName = document.getElementById("case-name");
const openBtn = document.getElementById("open-btn");
const spinnerStrip = document.getElementById("spinner-strip");
const winnerName = document.getElementById("winner-name");
const inventoryDiv = document.getElementById("inventory");
const sellAllBtn = document.getElementById("sell-all-btn");
const showCaseItemsBtn = document.getElementById("show-case-items-btn");
const caseItemsList = document.getElementById("case-items-list");

const coinflipSelect = document.getElementById("coinflip-select");
const coinflipBtn = document.getElementById("coinflip-btn");
const coin = document.getElementById("coin");

// ================= UTILITY FUNCTIONS =================
function safeSetText(el, text) {
  if (el) el.textContent = text;
}

function safeSetHTML(el, html) {
  if (el) el.innerHTML = html;
}

function safeAddEvent(el, event, fn) {
  if (el) el.addEventListener(event, fn);
}

// ================= COINS =================
function updateCoins() {
  safeSetText(coinsDisplay, `Coins: ${coins.toFixed(2)}`);
}

// ================= LOAD CASES =================
fetch("cases.json")
  .then(res => res.json())
  .then(data => {
    cases = data.cases || [];
    if (caseSelect) {
      cases.forEach(c => {
        const option = document.createElement("option");
        option.value = c.id;
        option.textContent = c.name;
        caseSelect.appendChild(option);
      });
    }
    if (cases.length) loadCase(cases[0].id);
  })
  .catch(err => console.error("Failed to load cases.json:", err));

function loadCase(id) {
  currentCase = cases.find(c => c.id === id);
  if (!currentCase) return;
  if (caseImage) caseImage.src = currentCase.image;
  safeSetText(caseName, currentCase.name);
  safeSetText(openBtn, `Open Case (${currentCase.price} coins)`);
}

safeAddEvent(caseSelect, "change", e => loadCase(e.target.value));

// ================= WEIGHTED RANDOM =================
function getRandomItem(caseData) {
  if (!caseData || !caseData.items) return null;
  const totalWeight = caseData.items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;

  for (let item of caseData.items) {
    if (random < item.weight) return item;
    random -= item.weight;
  }
  return null;
}

// ================= SPINNER =================
function spinToItem(winningItem) {
  if (!spinnerStrip || !winningItem) return;

  safeSetHTML(spinnerStrip, "");
  const itemWidth = 140; // match CSS
  const totalSpins = 60;
  const randomItems = [];

  for (let i = 0; i < totalSpins; i++) {
    const item = getRandomItem(currentCase);
    randomItems.push(item);
  }

  const winningIndex = totalSpins - 5;
  randomItems[winningIndex] = winningItem;

  randomItems.forEach(item => {
    const div = document.createElement("div");
    div.className = `spinner-item ${item.rarity}`;
    div.innerHTML = `<img src="${item.image}">`;
    spinnerStrip.appendChild(div);
  });

  const offset =
    winningIndex * itemWidth -
    (spinnerStrip.parentElement ? spinnerStrip.parentElement.offsetWidth / 2 - itemWidth / 2 : 0);

  spinnerStrip.style.transition = "none";
  spinnerStrip.style.transform = "translateX(0px)";

  setTimeout(() => {
    spinnerStrip.style.transition = "transform 3.2s cubic-bezier(.25,.85,.35,1)";
    spinnerStrip.style.transform = `translateX(-${offset}px)`;
  }, 50);

  setTimeout(() => {
    safeSetText(winnerName, `You won: ${winningItem.name}`);
    addToInventory(winningItem);
  }, 3300);
}

// ================= OPEN CASE =================
safeAddEvent(openBtn, "click", () => {
  if (!currentCase) return;
  if (coins < currentCase.price) return alert("Not enough coins!");

  coins -= currentCase.price;
  updateCoins();

  const winningItem = getRandomItem(currentCase);
  spinToItem(winningItem);
});

// ================= INVENTORY =================
function addToInventory(item) {
  if (!item) return;
  inventory.push(item);
  renderInventory();
  updateCoinflipDropdown();
}

function renderInventory() {
  if (!inventoryDiv) return;
  safeSetHTML(inventoryDiv, "");

  inventory.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = `inv-item ${item.rarity}`;
    div.innerHTML = `
      <img src="${item.image}">
      <div>${item.name}</div>
      <div>💰 ${item.price.toFixed(2)}</div>
      <button class="sell-btn">Sell</button>
    `;

    const sellBtn = div.querySelector(".sell-btn");
    safeAddEvent(sellBtn, "click", () => {
      coins += item.price;
      inventory.splice(index, 1);
      renderInventory();
      updateCoins();
      updateCoinflipDropdown();
    });

    inventoryDiv.appendChild(div);
  });
}

// ================= SELL ALL =================
safeAddEvent(sellAllBtn, "click", () => {
  inventory.forEach(item => (coins += item.price));
  inventory = [];
  renderInventory();
  updateCoins();
  updateCoinflipDropdown();
});

// ================= SHOW POTENTIAL ITEMS + ODDS =================
safeAddEvent(showCaseItemsBtn, "click", () => {
  if (!currentCase || !caseItemsList) return;

  const totalWeight = currentCase.items.reduce((sum, item) => sum + item.weight, 0);
  const sortedItems = [...currentCase.items].sort((a, b) => b.price - a.price);

  safeSetHTML(caseItemsList, "");
  sortedItems.forEach(item => {
    const dropRate = ((item.weight / totalWeight) * 100).toFixed(2);
    const div = document.createElement("div");
    div.className = `inv-item ${item.rarity}`;
    div.innerHTML = `
      <img src="${item.image}">
      <div>${item.name}</div>
      <div>💰 ${item.price.toFixed(2)} coins</div>
      <div style="font-size:14px; margin-top:5px;">🎯 ${dropRate}% chance</div>
    `;
    caseItemsList.appendChild(div);
  });

  // Toggle display
  caseItemsList.style.display =
    getComputedStyle(caseItemsList).display === "none" ? "block" : "none";
});

// ================= COINFLIP =================
function updateCoinflipDropdown() {
  if (!coinflipSelect) return;
  safeSetHTML(coinflipSelect, "");

  inventory.forEach((item, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = `${item.name} (${item.price})`;
    coinflipSelect.appendChild(option);
  });
}

safeAddEvent(coinflipBtn, "click", () => {
  if (!coinflipSelect || !coin) return;
  const index = coinflipSelect.value;
  if (index === "" || inventory.length === 0) return;

  const selectedItem = inventory[index];
  if (!selectedItem) return;

  const win = Math.random() < 0.5;

  coin.classList.remove("head", "tail");
  setTimeout(() => {
    coin.classList.add(win ? "head" : "tail");
  }, 100);

  setTimeout(() => {
    if (win) {
      inventory.push({ ...selectedItem }); // duplicate safely
      alert("You won the flip! Item duplicated!");
    } else {
      inventory.splice(index, 1);
      alert("You lost the flip! Item removed!");
    }
    renderInventory();
    updateCoinflipDropdown();
  }, 700);
});

// ================= INIT =================
window.onload = () => {
  updateCoins();
  if (caseItemsList) caseItemsList.style.display = "none";
};
