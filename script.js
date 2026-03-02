// ================= GLOBAL =================
let coins = 0;
let inventory = [];
let topDrops = [];
let currentCase = null;

// Load cases.json
let casesData = [];
fetch('cases.json')
  .then(r => r.json())
  .then(d => casesData = d.cases)
  .then(() => initCases());

function initCases() {
  const caseSelect = document.getElementById('case-select');
  const coinflipSelect = document.getElementById('coinflip-item-select');

  casesData.forEach(c => {
    const option = document.createElement('option');
    option.value = c.id;
    option.textContent = c.name;
    caseSelect.appendChild(option);

    c.items.forEach(item => {
      const cfOption = document.createElement('option');
      cfOption.value = `${c.id}|${item.name}`;
      cfOption.textContent = item.name;
      coinflipSelect.appendChild(cfOption);
    });
  });

  caseSelect.addEventListener('change', () => loadCase(caseSelect.value));
  loadCase(caseSelect.value);
}

function loadCase(caseId) {
  currentCase = casesData.find(c => c.id === caseId);
  document.getElementById('case-name').textContent = currentCase.name;
  document.getElementById('case-image').src = currentCase.image;

  const itemsList = document.getElementById('case-items-list');
  itemsList.innerHTML = '';
  currentCase.items.forEach(item => {
    const div = document.createElement('div');
    div.textContent = `${item.name} - ${item.rarity} - $${item.price}`;
    itemsList.appendChild(div);
  });
}

// ================= COINS =================
const coinsDiv = document.getElementById('coins');
function updateCoins() { coinsDiv.textContent = `Coins: ${coins.toFixed(2)}`; }
document.getElementById('add-coins-btn').addEventListener('click', () => { coins+=0.1; updateCoins(); });
document.getElementById('remove-coins-btn').addEventListener('click', () => { coins=Math.max(0,coins-0.1); updateCoins(); });

// ================= CASE OPENING =================
document.getElementById('open-btn').addEventListener('click', openCase);
function openCase() {
  if(!currentCase) return;
  const totalWeight = currentCase.items.reduce((a,i)=>a+i.weight,0);
  let rnd = Math.floor(Math.random()*totalWeight);
  let winnerItem = currentCase.items.find(item => (rnd-=item.weight)<0);
  inventory.push(winnerItem);
  topDrops.push(winnerItem);
  if(topDrops.length>5) topDrops.shift();
  displayInventory();
  displayTopDrops();
  displayWinner(winnerItem);
  animateSpinner(currentCase.items, winnerItem);
}

function displayWinner(item) {
  const winnerDiv = document.getElementById('winner-name');
  winnerDiv.textContent = `You won: ${item.name}`;
}

// ================= SPINNER =================
function animateSpinner(items, winner) {
  const strip = document.getElementById('spinner-strip');
  strip.innerHTML = '';
  for(let i=0;i<20;i++){
    items.forEach(it=>{
      const div = document.createElement('div');
      div.classList.add('spinner-item');
      const img = document.createElement('img');
      img.src = it.image;
      div.appendChild(img);
      strip.appendChild(div);
    });
  }
  const winnerIndex = 20*items.length/2 + items.findIndex(it=>it.name===winner.name);
  const distance = -winnerIndex*140 + 500;
  strip.style.transition='transform 6s cubic-bezier(.08,.6,0,1)';
  strip.style.transform=`translateX(${distance}px)`;
}

// ================= INVENTORY =================
function displayInventory() {
  const invDiv = document.getElementById('inventory');
  invDiv.innerHTML = '';
  inventory.forEach((item,i)=>{
    const div = document.createElement('div');
    div.classList.add('inv-item', item.rarity);
    const img = document.createElement('img');
    img.src = item.image;
    div.appendChild(img);
    const sellBtn = document.createElement('button');
    sellBtn.classList.add('sell-btn');
    sellBtn.textContent='Sell';
    sellBtn.addEventListener('click',()=>{
      coins+=item.price;
      inventory.splice(i,1);
      displayInventory();
      updateCoins();
    });
    div.appendChild(sellBtn);
    invDiv.appendChild(div);
  });
}

// Toggle inventory
document.getElementById('toggle-inv-btn').addEventListener('click',()=>{
  document.getElementById('inventory').classList.toggle('hidden');
});

// Sell All
document.getElementById('sell-all-btn').addEventListener('click',()=>{
  inventory.forEach(item=>coins+=item.price);
  inventory=[];
  displayInventory();
  updateCoins();
});

// ================= TOP DROPS =================
function displayTopDrops() {
  const div = document.getElementById('top-drops');
  div.innerHTML='';
  topDrops.forEach(item=>{
    const d = document.createElement('div');
    d.classList.add('top-drop',item.rarity);
    const img = document.createElement('img');
    img.src=item.image;
    d.appendChild(img);
    div.appendChild(d);
  });
}

// ================= ITEM COINFLIP =================
document.getElementById('start-coinflip-btn').addEventListener('click',()=>{
  const val = document.getElementById('coinflip-item-select').value;
  if(!val) return alert('Select an item');
  const [caseId, itemName] = val.split('|');
  const item = casesData.find(c=>c.id===caseId).items.find(i=>i.name===itemName);
  if(!item) return;
  const win = Math.random()<0.5;
  const resultDiv = document.getElementById('coinflip-result');
  if(win){
    inventory.push(item); // Duplicate if won
    resultDiv.textContent=`You won the coinflip! You got another ${item.name}!`;
  } else {
    resultDiv.textContent=`You lost the coinflip!`;
  }
  displayInventory();
});
