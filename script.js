// ===================== GLOBAL STATE =====================
let coins = parseFloat(localStorage.getItem("coins")) || 100;
let inventory = JSON.parse(localStorage.getItem("inventory")) || [];
let cases = [];
let currentCase = null;

// ===================== INIT =====================
document.addEventListener("DOMContentLoaded", () => {

  document.getElementById("sell-all-btn").onclick = sellAllItems;

  document.getElementById("toggle-inv-btn").onclick = () =>
    document.getElementById("inventory").classList.toggle("hidden");

  document.getElementById("toggle-coinflip-btn").onclick = () =>
    document.getElementById("coinflip-section").classList.toggle("hidden");

  updateCoins();
  renderInventory();
  loadCases();
  renderBetOptions();
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
  let existing = inventory.find(i => i.name === item.name);
  if (existing) {
    existing.amount = (existing.amount || 1) + 1;
  } else {
    item.amount = 1;
    inventory.push(item);
  }
  saveInventory();
  renderInventory();
  renderBetOptions();
}

function sellItem(index) {
  let item = inventory[index];
  coins += item.price;
  if (item.amount > 1) {
    item.amount--;
  } else {
    inventory.splice(index, 1);
  }
  saveInventory();
  updateCoins();
  renderInventory();
  renderBetOptions();
}

function sellAllItems() {
  let total = inventory.reduce((sum,i)=> sum + (i.price*(i.amount||1)),0);
  coins += total;
  inventory = [];
  saveInventory();
  updateCoins();
  renderInventory();
  renderBetOptions();
}

function renderInventory() {
  const inv = document.getElementById("inventory");
  inv.innerHTML = "";

  inventory.forEach((item,index)=>{
    const div = document.createElement("div");
    div.className = "inv-item";
    div.innerHTML = `
      <img src="${item.image}">
      <p>${item.name}</p>
      <small>${item.price} coins</small>
      <p>x${item.amount||1}</p>
      <button class="sell-btn">Sell</button>
    `;
    div.querySelector("button").onclick=()=>sellItem(index);
    inv.appendChild(div);
  });
}

// ===================== LOAD CASES =====================
function loadCases() {
  fetch("data/cases.json")
  .then(r=>r.json())
  .then(data=>{
    cases = data.cases;
    const select = document.getElementById("case-select");
    select.innerHTML="";
    cases.forEach(c=>{
      const opt=document.createElement("option");
      opt.value=c.id;
      opt.textContent=`${c.name} (${c.price} coins)`;
      select.appendChild(opt);
    });
    select.onchange=()=>selectCase(select.value);
    selectCase(cases[0].id);
  });
}

function selectCase(id){
  currentCase=cases.find(c=>c.id===id);
  if(!currentCase)return;

  document.getElementById("case-image").src=currentCase.image;
  document.getElementById("case-name").textContent=currentCase.name;
  document.getElementById("open-btn").textContent=
  `Open for ${currentCase.price} Coins`;
}

// ===================== OPEN CASE =====================
document.getElementById("open-btn").onclick=()=>{
  if(coins<currentCase.price){alert("Not enough coins");return;}
  coins-=currentCase.price;
  updateCoins();
  const item=currentCase.items[Math.floor(Math.random()*currentCase.items.length)];
  addToInventory({...item});
};

// ===================== COINFLIP =====================
let selectedBet = null;
let betType = null;
let selectedElement = null;

const coin = document.getElementById("coin");
const wagerDisplay = document.getElementById("wager-display");
const winDisplay = document.getElementById("win-display");

function renderBetOptions() {
  const betSelection = document.getElementById("bet-selection");
  betSelection.innerHTML = "";

  // COIN OPTIONS
  [10, 50].forEach(amount => {
    const div = document.createElement("div");
    div.className = "bet-item";
    div.textContent = `${amount} Coins`;

    div.onclick = () => handleSelection(div, amount, "coins");

    betSelection.appendChild(div);
  });

  // ITEM OPTIONS
  inventory.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "bet-item";
    div.innerHTML = `<img src="${item.image}">${item.name} x${item.amount || 1}`;

    div.onclick = () => handleSelection(div, index, "item");

    betSelection.appendChild(div);
  });
}

function handleSelection(element, value, type) {
  // deselect if clicking same
  if (selectedElement === element) {
    clearSelection();
    return;
  }

  clearSelection();

  selectedBet = value;
  betType = type;
  selectedElement = element;
  element.classList.add("selected");

  updatePoolDisplay();
}

function clearSelection() {
  document.querySelectorAll(".bet-item").forEach(el =>
    el.classList.remove("selected")
  );

  selectedBet = null;
  betType = null;
  selectedElement = null;

  wagerDisplay.innerHTML = "";
  winDisplay.innerHTML = "";
}

function updatePoolDisplay() {
  wagerDisplay.innerHTML = "";
  winDisplay.innerHTML = "";

  if (!betType) return;

  if (betType === "coins") {
    wagerDisplay.innerHTML = `<p>${selectedBet} Coins</p>`;
    winDisplay.innerHTML = `<p>${selectedBet * 2} Coins</p>`;
  }

  if (betType === "item") {
    const item = inventory[selectedBet];
    if (!item) return;

    wagerDisplay.innerHTML = `<img src="${item.image}"><p>${item.name}</p>`;
    winDisplay.innerHTML = `<img src="${item.image}"><p>${item.name} x2</p>`;
  }
}

document.getElementById("flip-btn").onclick = () => {
  if (!betType) {
    alert("Select a bet first");
    return;
  }

  coin.classList.remove("coin-flip");
  void coin.offsetWidth; // restart animation
  coin.classList.add("coin-flip");

  const resultText = document.getElementById("flip-result");
  resultText.textContent = "Flipping...";
  resultText.style.color = "white";

  setTimeout(() => {
    const win = Math.random() < 0.5;

    if (betType === "coins") {
      if (coins < selectedBet) {
        alert("Not enough coins");
        return;
      }

      coins -= selectedBet;

      if (win) {
        coins += selectedBet * 2;
        resultText.textContent = "YOU WIN!";
        resultText.style.color = "gold";
      } else {
        resultText.textContent = "YOU LOSE!";
        resultText.style.color = "red";
      }

      updateCoins();
    }

    if (betType === "item") {
      const item = inventory[selectedBet];
      if (!item) return;

      if (win) {
        item.amount++;
        resultText.textContent = "YOU WIN!";
        resultText.style.color = "gold";
      } else {
        if (item.amount > 1) item.amount--;
        else inventory.splice(selectedBet, 1);

        resultText.textContent = "YOU LOSE!";
        resultText.style.color = "red";
      }

      saveInventory();
      renderInventory();
    }

    clearSelection();
    renderBetOptions();

  }, 1500);
};
