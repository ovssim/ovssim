// ==================== COINS ====================
let coins = localStorage.getItem("coins");

if (coins === null) {
  coins = 1000;
  localStorage.setItem("coins", coins);
} else {
  coins = parseInt(coins);
}

function updateCoins() {
  document.getElementById("coins").textContent = `Coins: ${coins}`;
}

updateCoins();

// ==================== INVENTORY ====================
let inventory = JSON.parse(localStorage.getItem("inventory")) || [];

function addToInventory(item) {
  inventory.push(item);
  localStorage.setItem("inventory", JSON.stringify(inventory));
  renderInventory();
}

function renderInventory() {
  const inv = document.getElementById("inventory");
  inv.innerHTML = "";

  inventory.forEach(item => {
    const div = document.createElement("div");
    div.className = `inv-item ${item.rarity}`;
    div.innerHTML = `
      <img src="${item.image}">
      <p>${item.name}</p>
    `;
    inv.appendChild(div);
  });
}

renderInventory();

// ==================== CASE DATA ====================
let caseData;

fetch("data/cases.json")
  .then(res => res.json())
  .then(data => {
    caseData = data.cases[0];

    document.getElementById("case-container").innerHTML = `
      <img src="${caseData.image}">
      <p>Price: ${caseData.price} coins</p>
    `;

    // Populate spinner ONCE
    populateSpinner(caseData.items);
  });

// ==================== RNG ====================
function openCase(items) {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  let roll = Math.random() * total;

  for (let item of items) {
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

  const matches = [];
  imgs.forEach((img, i) => {
    if (img.src.includes(item.image)) matches.push(i);
  });

  const targetIndex = matches[Math.floor(Math.random() * matches.length)];
  const imgWidth = imgs[0].offsetWidth + 10;
  const containerWidth =
    document.getElementById("spinner-container").offsetWidth;

  const left =
    -(targetIndex * imgWidth - containerWidth / 2 + imgWidth / 2);

  // reset before spin
  strip.style.transition = "none";
  strip.style.left = "0px";
  strip.offsetHeight;

  strip.style.transition = "left 4s cubic-bezier(.1,.6,0,1)";
  strip.style.left = `${left}px`;
}

// ==================== OPEN BUTTON ====================
const openBtn = document.getElementById("open-btn");

openBtn.addEventListener("click", () => {
  if (!caseData) return alert("Case not loaded yet!");
  if (coins < caseData.price) return alert("Not enough coins!");

  openBtn.disabled = true;

  coins -= caseData.price;
  localStorage.setItem("coins", coins);
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
