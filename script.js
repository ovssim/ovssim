// ===================== GLOBAL STATE =====================
let coins = parseFloat(localStorage.getItem("coins")) || 100;
let inventory = JSON.parse(localStorage.getItem("inventory")) || [];
let cases = [];
let currentCase = null;

// ===================== INIT =====================
document.addEventListener("DOMContentLoaded", () => {
  updateCoins();
  renderInventory();
  loadCases();
});

// ===================== COINS =====================
function updateCoins() {
  document.getElementById("coins").textContent = `Coins: ${coins.toFixed(2)}`;
  localStorage.setItem("coins", coins);
}

// ===================== INVENTORY =====================
function saveInventory() {
  localStorage.setItem("inventory", JSON.stringify(inventory));
}

function addToInventory(item) {
  inventory.push(item);
  saveInventory();
  renderInventory();
}

function sellItem(index) {
  coins += inventory[index].price;
  inventory.splice(index, 1);
  saveInventory();
  updateCoins();
  renderInventory();
}

function renderInventory() {
  const inv = document.getElementById("inventory");
  inv.innerHTML = "";

  inventory.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = `inv-item ${item.rarity.toLowerCase()}`;

    div.innerHTML = `
      <img src="${item.image}">
      <p>${item.name}</p>
      <small>${item.price} coins</small>
      <button class="sell-btn">Sell</button>
    `;

    div.querySelector(".sell-btn").onclick = () => sellItem(index);
    inv.appendChild(div);
  });
}

// ===================== LOAD CASES =====================
function loadCases() {
  fetch("data/cases.json")
    .then(res => res.json())
    .then(data => {
      cases = data.cases;
      populateCaseSelect();
      selectCase(cases[0].id);
    });
}

function populateCaseSelect() {
  const select = document.getElementById("case-select");
  if (!select) return;

  select.innerHTML = "";
  cases.forEach(c => {
    const option = document.createElement("option");
    option.value = c.id;
    option.textContent = `${c.name} (${c.price} coins)`;
    select.appendChild(option);
  });

  select.onchange = () => selectCase(select.value);
}

function selectCase(id) {
  currentCase = cases.find(c => c.id === id);

  document.getElementById("case-container").innerHTML = `
    <img src="${currentCase.image}">
    <h2>${currentCase.name}</h2>
  `;

  document.getElementById("open-btn").textContent =
    `Open for ${currentCase.price} Coins`;
}

// ===================== WEIGHTED RNG =====================
function getRandomItem(items) {
  const totalWeight = items.reduce((sum, i) => sum + i.weight, 0);
  let roll = Math.random() * totalWeight;

  for (let item of items) {
    if (roll < item.weight) return item;
    roll -= item.weight;
  }
  return items[0];
}

// ===================== CSGO STYLE SPIN =====================
function spinToItem(winningItem) {
  const strip = document.getElementById("spinner-strip");
  strip.innerHTML = "";

  const totalSlots = 50;
  const winnerIndex = 38; // stops near end
  const items = currentCase.items;

  for (let i = 0; i < totalSlots; i++) {
    let item = items[Math.floor(Math.random() * items.length)];

    if (i === winnerIndex) {
      item = winningItem; // FORCE winner in wheel
    }

    const div = document.createElement("div");
    div.className = `spinner-item ${item.rarity.toLowerCase()}`;
    div.innerHTML = `<img src="${item.image}">`;
    strip.appendChild(div);
  }

  const spinnerItems = strip.querySelectorAll(".spinner-item");
  const itemWidth = spinnerItems[0].offsetWidth + 20;
  const containerWidth =
    document.getElementById("spinner-container").offsetWidth;

  const offset =
    -(winnerIndex * itemWidth - containerWidth / 2 + itemWidth / 2);

  strip.style.transition = "none";
  strip.style.transform = "translateX(0px)";
  strip.offsetHeight;

  strip.style.transition =
    "transform 3.2s cubic-bezier(.25,.85,.35,1)";
  strip.style.transform = `translateX(${offset}px)`;

  setTimeout(() => {
    spinnerItems[winnerIndex].classList.add("highlight-won");
    showWinner(winningItem);
  }, 3200);
}

// ===================== SHOW WINNER =====================
function showWinner(item) {
  const nameBox = document.getElementById("winner-name");
  if (nameBox) {
    nameBox.textContent = item.name;
    nameBox.className = item.rarity.toLowerCase();
  }

  addToInventory(item);
}

// ===================== OPEN BUTTON =====================
document.getElementById("open-btn").addEventListener("click", () => {
  if (!currentCase) return;

  if (coins < currentCase.price) {
    alert("Not enough coins!");
    return;
  }

  coins -= currentCase.price;
  updateCoins();

  const winningItem = getRandomItem(currentCase.items);
  spinToItem(winningItem);
});
