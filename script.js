// -------------------- Coins --------------------
let coins = parseInt(localStorage.getItem("coins")) || 1000; // starting coins
localStorage.setItem("coins", coins);

function updateCoins() {
  document.getElementById("coins").textContent = `Coins: ${coins}`;
}

updateCoins();

// -------------------- Inventory --------------------
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

// -------------------- Case Data --------------------
let caseData;

fetch("data/cases.json")
  .then(res => res.json())
  .then(data => {
    caseData = data.cases[0];
    document.getElementById("case-container").innerHTML =
      `<img src="${caseData.image}"><p>Price: ${caseData.price} coins</p>`;
  });

// -------------------- Case Opening --------------------
function openCase(items) {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let roll = Math.random() * total;

  for (let item of items) {
    if (roll < item.weight) return item;
    roll -= item.weight;
  }
}

// Show the opening result
function showResult(item) {
  document.getElementById("result").innerHTML = `
    <h2 class="${item.rarity}">${item.name}</h2>
    <img src="${item.image}">
    <p>Value: ${item.price} coins</p>
  `;
}

// -------------------- Open Button --------------------
document.getElementById("open-btn").addEventListener("click", () => {
  if (!caseData) return alert("Case not loaded yet!");
  
  if (coins < caseData.price) {
    return alert("Not enough coins!");
  }

  coins -= caseData.price;
  localStorage.setItem("coins", coins);
  updateCoins();

  const item = openCase(caseData.items);
  addToInventory(item);
  showResult(item);
});

#spinner-container {
  width: 600px; /* visible area */
  height: 150px;
  margin: 20px auto;
  overflow: hidden;
  border: 2px solid #555;
  border-radius: 10px;
  background: #111;
  position: relative;
}

#spinner-strip {
  display: flex;
  flex-direction: row;
  position: relative;
  left: 0;
  transition: left 4s cubic-bezier(.1,.6,0,1);
}

#spinner-strip img {
  width: 150px;
  height: 150px;
  margin-right: 10px;
  border-radius: 8px;
}

function populateSpinner(items) {
  const strip = document.getElementById("spinner-strip");
  strip.innerHTML = "";

  // Repeat items to make it look continuous
  const repeatedItems = [...items, ...items, ...items];

  repeatedItems.forEach(item => {
    const img = document.createElement("img");
    img.src = item.image;
    strip.appendChild(img);
  });
}

function spinToItem(item) {
  const strip = document.getElementById("spinner-strip");
  const imgs = strip.querySelectorAll("img");
  
  // Find all indices of the winning item
  const itemIndices = [];
  imgs.forEach((img, i) => {
    if (img.src.includes(item.image)) itemIndices.push(i);
  });

  // Pick a random occurrence
  const targetIndex = itemIndices[Math.floor(Math.random() * itemIndices.length)];

  // Calculate new left position
  const imgWidth = 160; // 150px + 10px margin
  const containerWidth = document.getElementById("spinner-container").offsetWidth;
  const left = -(targetIndex * imgWidth - containerWidth / 2 + imgWidth / 2);

  // Animate
  strip.style.transition = "left 4s cubic-bezier(.1,.6,0,1)";
  strip.style.left = `${left}px`;
}
