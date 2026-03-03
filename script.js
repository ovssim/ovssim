// ================= GLOBAL STATE =================
let coins = 10.00;
let inventory = [];
let cases = [];
let currentCase = null;

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

// ================= COINS =================
function updateCoins() {
  coinsDisplay.textContent = `Coins: ${coins.toFixed(2)}`;
}

// ================= LOAD CASES =================
fetch("cases.json")
  .then(res => res.json())
  .then(data => {
    cases = data.cases;
    cases.forEach(c => {
      const option = document.createElement("option");
      option.value = c.id;
      option.textContent = c.name;
      caseSelect.appendChild(option);
    });
    loadCase(cases[0].id);
  });

function loadCase(id) {
  currentCase = cases.find(c => c.id === id);
  caseImage.src = currentCase.image;
  caseName.textContent = currentCase.name;
  openBtn.textContent = `Open Case (${currentCase.price} coins)`;
}

caseSelect.addEventListener("change", e => {
  loadCase(e.target.value);
});

// ================= WEIGHTED RANDOM =================
function getRandomItem(caseData) {
  const totalWeight = caseData.items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;

  for (let item of caseData.items) {
    if (random < item.weight) return item;
    random -= item.weight;
  }
}

// ================= SPINNER =================
function spinToItem(winningItem) {
  spinnerStrip.innerHTML = "";

  const itemWidth = 140; // MUST match CSS (110 width + 30 margin)

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
    (spinnerStrip.parentElement.offsetWidth / 2 - itemWidth / 2);

  spinnerStrip.style.transition = "none";
  spinnerStrip.style.transform = "translateX(0px)";

  setTimeout(() => {
    spinnerStrip.style.transition =
      "transform 3.2s cubic-bezier(.25,.85,.35,1)";
    spinnerStrip.style.transform = `translateX(-${offset}px)`;
  }, 50);

  setTimeout(() => {
    winnerName.textContent = `You won: ${winningItem.name}`;
    addToInventory(winningItem);
  }, 3300);
}

// ================= OPEN CASE =================
openBtn.addEventListener("click", () => {
  if (!currentCase) return;
  if (coins < currentCase.price) return alert("Not enough coins!");

  coins -= currentCase.price;
  updateCoins();

  const winningItem = getRandomItem(currentCase);
  spinToItem(winningItem);
});

// ================= INVENTORY =================
function addToInventory(item) {
  inventory.push(item);
  renderInventory();
  updateCoinflipDropdown();
}

function renderInventory() {
  inventoryDiv.innerHTML = "";

  inventory.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = `inv-item ${item.rarity}`;
    div.innerHTML = `
      <img src="${item.image}">
      <div>${item.name}</div>
      <div>💰 ${item.price.toFixed(2)}</div>
      <button class="sell-btn">Sell</button>
    `;

    div.querySelector(".sell-btn").addEventListener("click", () => {
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
sellAllBtn.addEventListener("click", () => {
  inventory.forEach(item => (coins += item.price));
  inventory = [];
  renderInventory();
  updateCoins();
  updateCoinflipDropdown();
});

// ================= SHOW POTENTIAL ITEMS + ODDS =================
showCaseItemsBtn.addEventListener("click", () => {
  if (!currentCase) return;

  caseItemsList.innerHTML = "";

  const totalWeight = currentCase.items.reduce(
    (sum, item) => sum + item.weight,
    0
  );

  const sortedItems = [...currentCase.items].sort(
    (a, b) => b.price - a.price
  );

  sortedItems.forEach(item => {
    const dropRate = ((item.weight / totalWeight) * 100).toFixed(2);

    const div = document.createElement("div");
    div.className = `inv-item ${item.rarity}`;
    div.innerHTML = `
      <img src="${item.image}">
      <div>${item.name}</div>
      <div>💰 ${item.price.toFixed(2)} coins</div>
      <div style="font-size:14px; margin-top:5px;">
        🎯 ${dropRate}% chance
      </div>
    `;

    caseItemsList.appendChild(div);
  });

  caseItemsList.style.display =
    caseItemsList.style.display === "none" ? "block" : "none";
});

// ================= COINFLIP =================
function updateCoinflipDropdown() {
  coinflipSelect.innerHTML = "";

  inventory.forEach((item, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = `${item.name} (${item.price})`;
    coinflipSelect.appendChild(option);
  });
}

coinflipBtn.addEventListener("click", () => {
  const index = coinflipSelect.value;
  if (index === "" || inventory.length === 0) return;

  const selectedItem = inventory[index];

  const win = Math.random() < 0.5; // TRUE 50/50

  coin.classList.remove("head", "tail");

  setTimeout(() => {
    coin.classList.add(win ? "head" : "tail");
  }, 100);

  setTimeout(() => {
    if (win) {
      inventory.push(selectedItem);
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
updateCoins();
