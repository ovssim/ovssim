// ==================== COINS ====================
let coins = parseInt(localStorage.getItem("coins"));
if (isNaN(coins)) coins = 1000;

function saveCoins() {
  localStorage.setItem("coins", coins);
}

function updateCoins() {
  document.getElementById("coins").textContent = `Coins: ${coins}`;
}

saveCoins();
updateCoins();

// ==================== INVENTORY ====================
let inventory = JSON.parse(localStorage.getItem("inventory")) || [];

function saveInventory() {
  localStorage.setItem("inventory", JSON.stringify(inventory));
}

function addToInventory(item) {
  inventory.push(item);
  saveInventory();
  renderInventory();
}

function sellItem(index) {
  const item = inventory[index];
  coins = Math.floor(coins + item.price);

  inventory.splice(index, 1);
  saveInventory();
  saveCoins();

  updateCoins();
  renderInventory();
}

function renderInventory() {
  const inv = document.getElementById("inventory");
  inv.innerHTML = "";

  inventory.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = `inv-item ${item.rarity}`;

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

renderInventory();

// ==================== CASE DATA ====================
let caseData = null;

fetch("data/cases.json")
  .then(res => res.json())
  .then(data => {
    caseData = data.cases[0];

    document.getElementById("case-container").innerHTML = `
      <img src="${caseData.image}">
      <p>Price: ${caseData.price} coins</p>
    `;

    populateSpinner(caseData.items);
  })
  .catch(err => {
    console.error("Failed to load case data:", err);
  });

// ==================== RNG ====================
function openCase(items) {
  const totalWeight = items.reduce((sum, i) => sum + i.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const item of items) {
    if (roll < item.weight) return item;
    roll -= item.weight;
  }
}

// ==================== SPINNER ====================
function populateSpinner(items) {
  const strip = document.getElementById("spinner-strip");
  strip.innerHTML = "";

  const repeated = [...items, ...items, ...items];

  repeated.forEach(item => {
    const img = document.createElement("img");
    img.src = item.image;
    img.className = item.rarity;
    strip.appendChild(img);
  });
}

function spinToItem(item) {
  const strip = document.getElementById("spinner-strip");
  const imgs = strip.querySelectorAll("img");
  if (!imgs.length) return;

  const matches = [];
  imgs.forEach((img, i) => {
    if (img.src.includes(item.image)) matches.push(i);
  });

  const targetIndex =
    matches[Math.floor(Math.random() * matches.length)];

  const imgWidth = imgs[0].offsetWidth + 10;
  const containerWidth =
    document.getElementById("spinner-container").offsetWidth;

  const left =
    -(targetIndex * imgWidth - containerWidth / 2 + imgWidth / 2);

  strip.style.transition = "none";
  strip.style.left = "0px";
  strip.offsetHeight; // force reflow

  strip.style.transition = "left 4s cubic-bezier(.1,.6,0,1)";
  strip.style.left = `${left}px`;
}

// ==================== OPEN BUTTON ====================
const openBtn = document.getElementById("open-btn");

openBtn.addEventListener("click", () => {
  if (!caseData) {
    alert("Case not loaded yet!");
    return;
  }

  if (coins < caseData.price) {
    alert("Not enough coins!");
    return;
  }

  openBtn.disabled = true;

  coins -= caseData.price;
  saveCoins();
  updateCoins();

  const item = openCase(caseData.items);
  addToInventory(item);
  spinToItem(item);

  setTimeout(() => {
    showResult(item);
    openBtn.disabled = false;
  }, 4000);
});

// ==================== RESULT ====================
function showResult(item) {
  document.getElementById("result").innerHTML = `
    <h2 class="${item.rarity}">${item.name}</h2>
    <img src="${item.image}">
    <p>Value: ${item.price} coins</p>
  `;
}

