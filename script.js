// ====== GLOBAL STATE ======
let coins = parseFloat(localStorage.getItem("coins"));
if (isNaN(coins) || coins < 0) coins = 100;

let inventory = JSON.parse(localStorage.getItem("inventory")) || [];
let recentDrops = JSON.parse(localStorage.getItem("recentDrops")) || [];
let cases = window.cases || [];
let currentCase = null;

// Rarity colors
const rarityClasses = {
  legendary: "hex-legendary",
  strange: "hex-strange",
  vintage: "hex-vintage",
  mythical: "hex-mythical",
  collector: "hex-collector",
  genuine: "hex-genuine",
  haunted: "hex-haunted",
  unusual: "hex-unusual",
  rare: "hex-rare"
};

// ====== DOM ELEMENTS ======
const coinsDisplay = document.getElementById("coins");
const inventoryDiv = document.getElementById("inventory");
const topDropsDiv = document.getElementById("top-drops");
const spinnerStrip = document.getElementById("spinner-strip");
const spinnerContainer = document.getElementById("spinner-container");
const caseSelectDisplay = document.getElementById("case-select-display");
const caseSelectOptions = document.getElementById("case-select-options");
const caseName = document.getElementById("case-name");
const caseImage = document.getElementById("case-image");
const caseItemsList = document.getElementById("case-items-list");
const openBtn = document.getElementById("open-btn");
const showItemsBtn = document.getElementById("show-case-items-btn");
const coinflipSelect = document.getElementById("coinflip-select");
const coinflipBtn = document.getElementById("coinflip-btn");
const coinElement = document.getElementById("coin");

// ====== INIT ======
updateCoinsDisplay();
populateCaseDropdown();
renderInventory();
renderTopDrops();

// ====== FUNCTIONS ======
function updateCoinsDisplay() {
  coinsDisplay.innerHTML = `Coins: ${coins.toFixed(2)}`;
  localStorage.setItem("coins", coins);
}

function saveInventory() {
  localStorage.setItem("inventory", JSON.stringify(inventory));
}

function saveTopDrops() {
  localStorage.setItem("recentDrops", JSON.stringify(recentDrops));
}

function createItemBox(item) {
  const box = document.createElement("div");
  box.classList.add("item-box", rarityClasses[item.rarity] || "");
  const img = document.createElement("img");
  img.src = item.image;
  box.appendChild(img);
  return box;
}

function renderInventory() {
  inventoryDiv.innerHTML = "";
  inventory.forEach(item => {
    const box = createItemBox(item);
    inventoryDiv.appendChild(box);
  });
}

function renderTopDrops() {
  topDropsDiv.innerHTML = "";
  recentDrops.slice(-10).reverse().forEach(item => {
    const box = createItemBox(item);
    topDropsDiv.appendChild(box);
  });
}

function populateCaseDropdown() {
  caseSelectDisplay.innerText = "Select Case ▼";
  cases.forEach(cs => {
    const option = document.createElement("div");
    option.innerText = cs.name;
    option.addEventListener("click", () => selectCase(cs.id));
    caseSelectOptions.appendChild(option);
  });

  caseSelectDisplay.addEventListener("click", () => {
    caseSelectOptions.style.display =
      caseSelectOptions.style.display === "block" ? "none" : "block";
  });
}

function selectCase(id) {
  currentCase = cases.find(c => c.id === id);
  caseSelectDisplay.innerText = currentCase.name;
  caseImage.src = currentCase.image;
  caseName.innerText = currentCase.name;
  displayCaseItems();
}

function displayCaseItems() {
  caseItemsList.innerHTML = "";
  currentCase.items.forEach(item => {
    const box = createItemBox(item);
    caseItemsList.appendChild(box);
  });
}

// ====== OPEN CASE ======
openBtn.addEventListener("click", () => {
  if (!currentCase) return;
  if (coins < currentCase.price) return alert("Not enough coins!");
  coins -= currentCase.price;
  updateCoinsDisplay();

  // Weighted random selection
  const totalWeight = currentCase.items.reduce((sum, i) => sum + i.weight, 0);
  let r = Math.random() * totalWeight;
  let selectedItem = null;
  for (let item of currentCase.items) {
    r -= item.weight;
    if (r <= 0) {
      selectedItem = item;
      break;
    }
  }

  if (!selectedItem) selectedItem = currentCase.items[0];

  // Add to inventory & recent drops
  inventory.push(selectedItem);
  recentDrops.push(selectedItem);
  saveInventory();
  saveTopDrops();
  renderInventory();
  renderTopDrops();

  winnerName(selectedItem.name);
  spinCase(selectedItem);
});

function winnerName(name) {
  const winnerDiv = document.getElementById("winner-name");
  winnerDiv.innerText = `You won: ${name}!`;
}

// ====== SPINNER ======
function spinCase(item) {
  spinnerStrip.innerHTML = "";
  // Duplicate items for spinning
  const spinItems = [...currentCase.items, ...currentCase.items, ...currentCase.items];
  spinItems.forEach(i => {
    const div = document.createElement("div");
    div.classList.add("spinner-item", rarityClasses[i.rarity] || "");
    const img = document.createElement("img");
    img.src = i.image;
    div.appendChild(img);
    spinnerStrip.appendChild(div);
  });

  // Animate spinner
  spinnerStrip.style.transition = "transform 5s cubic-bezier(0.25, 1, 0.5, 1)";
  const targetIndex = spinItems.indexOf(item) + spinItems.length / 3;
  const offset = targetIndex * 88; // width+margin approx
  spinnerStrip.style.transform = `translateX(-${offset}px)`;
}

// ====== SHOW POTENTIAL ITEMS ======
showItemsBtn.addEventListener("click", () => {
  caseItemsList.style.display =
    caseItemsList.style.display === "flex" ? "none" : "flex";
});

// ====== COINFLIP ======
coinflipBtn.addEventListener("click", () => {
  const choice = coinflipSelect.value;
  const outcome = Math.random() < 0.5 ? "head" : "tail";

  coinElement.classList.remove("flip");
  void coinElement.offsetWidth; // reset animation
  coinElement.classList.add("flip");

  setTimeout(() => {
    if (choice === outcome) {
      coins += 1;
      alert(`You won! Coin: ${outcome}`);
    } else {
      coins -= 1;
      alert(`You lost! Coin: ${outcome}`);
    }
    updateCoinsDisplay();
  }, 1000);
});

// ====== COINS BUTTONS ======
document.getElementById("add-coins-btn").addEventListener("click", () => {
  coins += 0.10;
  updateCoinsDisplay();
});

document.getElementById("remove-coins-btn").addEventListener("click", () => {
  coins -= 0.10;
  updateCoinsDisplay();
});

// ====== SELL ALL ======
document.getElementById("sell-all-btn").addEventListener("click", () => {
  coins += inventory.reduce((sum, i) => sum + i.price, 0);
  inventory = [];
  updateCoinsDisplay();
  renderInventory();
  saveInventory();
});
