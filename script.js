// ===================== GLOBAL STATE =====================
let coins = parseFloat(localStorage.getItem("coins")) || 100;
let inventory = JSON.parse(localStorage.getItem("inventory")) || [];
let cases = [];
let currentCase = null;
let recentDrops = JSON.parse(localStorage.getItem("recentDrops")) || [];

// ===================== INIT =====================
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("sell-all-btn").onclick = sellAllItems;
  document.getElementById("toggle-inv-btn").onclick = () =>
    document.getElementById("inventory").classList.toggle("hidden");

  updateCoins();
  renderInventory();
  renderTopDrops();
  loadCases();
  updateItemWagerDropdown();
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

function addToInventory(item) {
  inventory.push(item);
  recentDrops.push(item);
  if (recentDrops.length > 20) recentDrops.shift();
  saveInventory();
  renderInventory();
  renderTopDrops();
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
      <button class="sell-btn theme-btn">Sell</button>
    `;
    div.querySelector(".sell-btn").onclick = () => {
      coins += item.price;
      inventory.splice(index, 1);
      saveInventory();
      updateCoins();
      renderInventory();
      updateItemWagerDropdown();
    };
    inv.appendChild(div);
  });
}

function sellAllItems() {
  if (inventory.length === 0) { alert("Inventory is empty!"); return; }
  const totalValue = inventory.reduce((sum, i) => sum + i.price, 0);
  coins += totalValue;
  inventory = [];
  saveInventory();
  updateCoins();
  renderInventory();
  updateItemWagerDropdown();
  alert(`Sold all items for ${totalValue.toFixed(2)} coins!`);
}

function renderTopDrops() {
  const c = document.getElementById("top-drops");
  c.innerHTML = "";

  [...recentDrops].sort((a,b)=>b.price-a.price).slice(0,8)
    .forEach(i => {
      const d = document.createElement("div");
      d.className = `top-drop ${i.rarity.toLowerCase()}`;
      d.innerHTML = `<img src="${i.image}"><p>${i.name}</p><strong>${i.price} coins</strong>`;
      c.appendChild(d);
    });
}

// ===================== LOAD CASES =====================
function loadCases() {
  fetch("data/cases.json")
    .then(r => r.json())
    .then(data => {
      cases = data.cases;
      const select = document.getElementById("case-select");
      select.innerHTML = "";
      cases.forEach(c => {
        const option = document.createElement("option");
        option.value = c.id;
        option.textContent = `${c.name} (${c.price} coins)`;
        select.appendChild(option);
      });
      select.onchange = () => selectCase(select.value);
      selectCase(cases[0].id);
    });
}

function selectCase(id) {
  currentCase = cases.find(c=>c.id===id);
  if(!currentCase) return;
  document.getElementById("case-image").src = currentCase.image;
  document.getElementById("case-name").textContent = currentCase.name;
  document.getElementById("open-btn").textContent = `Open for ${currentCase.price} Coins`;
}

// ===================== CASE OPENING =====================
document.getElementById("open-btn").addEventListener("click", () => {
  if (!currentCase) return;
  if (coins < currentCase.price) { alert("Not enough coins!"); return; }
  coins -= currentCase.price;
  updateCoins();

  const totalWeight = currentCase.items.reduce((sum, i) => sum + i.weight, 0);
  let rand = Math.random() * totalWeight;
  let wonItem = null;
  for (let i of currentCase.items) {
    if (rand < i.weight) { wonItem = i; break; }
    rand -= i.weight;
  }
  if (!wonItem) wonItem = currentCase.items[currentCase.items.length-1];

  addToInventory({...wonItem});
  document.getElementById("winner-name").textContent = `You won: ${wonItem.name} 🎉`;
  updateItemWagerDropdown();
});

// ===================== ITEM COINFLIP =====================
function updateItemWagerDropdown() {
  const select = document.getElementById("item-wager");
  select.innerHTML = "";
  if(inventory.length===0){
    const option = document.createElement("option");
    option.textContent = "No items available"; option.disabled=true;
    select.appendChild(option);
    document.getElementById("flip-btn").disabled = true;
    return;
  }
  inventory.forEach((item,index)=>{
    const option=document.createElement("option");
    option.value=index;
    option.textContent=`${item.name} (${item.rarity})`;
    select.appendChild(option);
  });
  document.getElementById("flip-btn").disabled=false;
}

document.getElementById("flip-btn").addEventListener("click",()=>{
  const select = document.getElementById("item-wager");
  const index = parseInt(select.value);
  if(isNaN(index) || !inventory[index]) return alert("Select an item!");
  const item = inventory[index];
  const resultEl = document.getElementById("coinflip-result");
  const win = Math.random()<0.5;
  if(win){
    inventory.push({...item});
    resultEl.textContent = `You won! You got another ${item.name} 🎉`;
  } else {
    inventory.splice(index,1);
    resultEl.textContent = `You lost your ${item.name} 😢`;
  }
  saveInventory();
  renderInventory();
  updateItemWagerDropdown();
});
