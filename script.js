// ===== INVENTORY TOGGLE =====
const toggleInvBtn = document.getElementById("toggle-inv-btn");
toggleInvBtn.addEventListener("click", () => {
  const inv = document.getElementById("inventory");
  inv.classList.toggle("hidden");
});

// ===== COINS ADJUST =====
document.getElementById("add-coins-btn").addEventListener("click", () => {
  coins += 50;
  updateCoins();
  saveData();
});

document.getElementById("remove-coins-btn").addEventListener("click", () => {
  coins -= 50;
  if (coins < 0) coins = 0;
  updateCoins();
  saveData();
});

