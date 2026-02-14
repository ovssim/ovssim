// ===================== GLOBAL STATE =====================
let coins = parseFloat(localStorage.getItem("coins")) || 100;
let inventory = JSON.parse(localStorage.getItem("inventory")) || [];
let cases = [];
let currentCase = null;
let recentDrops = JSON.parse(localStorage.getItem("recentDrops")) || [];

// ===================== INIT =====================
document.addEventListener("DOMContentLoaded", () => {
  updateCoins();
  renderInventory();
  renderTopDrops();
  loadCases();

  // Buttons
  document.getElementById("toggle-inv-btn").onclick = () =>
    document.getElementById("inventory").classList.toggle("hidden");
  document.getElementById("add-coins-btn").onclick = () => {
    coins += 1.00;
    updateCoins();
  };
  document.getElementById("remove-coins-btn").onclick = () => {
    coins = Math.max(0, coins - 5.00);
    updateCoins();
  };

  // Case Items Button
  const caseItemsBtn = document.getElementById("show-case-items-btn");
  const caseItemsList = document.getElementById("case-items-list");
  caseItemsBtn.addEventListener("click", () => {
    if (!currentCase) return;
    if (caseItemsList.style.display === "block") {
      caseItemsList.style.display = "none";
      caseItemsBtn.textContent = "Show Case Items";
    } else {
      renderCaseItems();
      caseItemsList.style.display = "block";
      caseItemsBtn.textContent = "Hide Case Items";
    }
  });
});

// ===================== COINS =====================
function updateCoins() {
  document.getElementById("coins").textContent = `Coins: ${coins.toFixed(2)}`;
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
      <button class="sell-btn theme-btn">Sell</button>
    `;
    div.querySelector(".sell-btn").onclick = () => sellItem(index);
    inv.appendChild(div);
  });
}

// ===================== TOP DROPS =====================
function renderTopDrops() {
  const c = document.getElementById("top-drops");
  c.innerHTML = "";
  [...recentDrops].sort((a,b)=>b.price-a.price).slice(0,8).forEach(i=>{
    const d = document.createElement("div");
    d.className = `top-drop ${i.rarity.toLowerCase()}`;
    d.innerHTML = `<img src="${i.image}"><p>${i.name}</p><strong>${i.price} coins</strong>`;
    c.appendChild(d);
  });
}

// ===================== LOAD CASES =====================
function loadCases() {
  fetch("data/cases.json").then(r=>r.json()).then(data=>{
    cases = data.cases;
    const select = document.getElementById("case-select");
    select.innerHTML = "";
    cases.forEach(c=>{
      const option = document.createElement("option");
      option.value = c.id;
      option.textContent = `${c.name} (${c.price} coins)`;
      select.appendChild(option);
    });
    select.onchange = ()=> selectCase(select.value);
    selectCase(cases[0].id);
  });
}

function selectCase(id){
  currentCase = cases.find(c=>c.id===id);
  if(!currentCase) return;
  document.getElementById("case-image").src=currentCase.image;
  document.getElementById("case-name").textContent=currentCase.name;
  document.getElementById("open-btn").textContent=`Open for ${currentCase.price} Coins`;
  currentCase.items.forEach(i=>new Image().src=i.image);
}

// ===================== CASE ITEMS =====================
function renderCaseItems(){
  if(!currentCase) return;
  const list = document.getElementById("case-items-list");
  list.innerHTML="";
  const totalWeight = currentCase.items.reduce((s,i)=>s+i.weight,0);
  currentCase.items.sort((a,b)=>b.price-a.price).forEach(item=>{
    const div=document.createElement("div");
    div.className=`inv-item ${item.rarity.toLowerCase()}`;
    const chance=((item.weight/totalWeight)*100).toFixed(2);
    div.innerHTML=`<img src="${item.image}" style="width:50px;height:50px;object-fit:contain;">
      <div style="text-align:left;">
      <strong>${item.name}</strong><br>
      ${item.price} coins<br>
      ${chance}%
      </div>`;
    list.appendChild(div);
  });
}

// ===================== RNG =====================
function getRandomItem(items){
  const totalWeight = items.reduce((sum,i)=>sum+i.weight,0);
  let roll=Math.random()*totalWeight;
  for(let item of items){if(roll<item.weight)return item;roll-=item.weight;}
  return items[0];
}

// ===================== SPINNER =====================
function spinToItem(winningItem){
  const strip=document.getElementById("spinner-strip");
  strip.innerHTML="";
  const totalSlots=50, winnerIndex=38, items=currentCase.items;
  for(let i=0;i<totalSlots;i++){
    let item=items[Math.floor(Math.random()*items.length)];
    if(i===winnerIndex)item=winningItem;
    const div=document.createElement("div");
    div.className=`spinner-item ${item.rarity.toLowerCase()}`;
    div.innerHTML=`<img src="${item.image}">`;
    strip.appendChild(div);
  }
  const spinnerItems=strip.querySelectorAll(".spinner-item");
  const itemWidth=spinnerItems[0].offsetWidth+30;
  const containerWidth=document.getElementById("spinner-container").offsetWidth;
  const offset=-(winnerIndex*itemWidth-containerWidth/2+itemWidth/2);
  strip.style.transition="none";
  strip.style.transform="translateX(0px)";
  strip.offsetHeight;
  strip.style.transition="transform 3.2s cubic-bezier(.25,.85,.35,1)";
  strip.style.transform=`translateX(${offset}px)`;
  setTimeout(()=>{
    spinnerItems[winnerIndex].classList.add("highlight-won");
    showWinner(winningItem);
  },3200);
}

// ===================== SHOW WINNER =====================
function showWinner(item){
  const nameBox=document.getElementById("winner-name");
  if(nameBox){nameBox.textContent=`You won: ${item.name}`;nameBox.className=item.rarity.toLowerCase();}
  addToInventory(item);
}

// ===================== OPEN BUTTON =====================
document.getElementById("open-btn").addEventListener("click",()=>{
  if(!currentCase) return;
  if(coins<currentCase.price){alert("Not enough coins!");return;}
  coins-=currentCase.price;
  updateCoins();
  const winningItem=getRandomItem(currentCase.items);
  spinToItem(winningItem);
});
