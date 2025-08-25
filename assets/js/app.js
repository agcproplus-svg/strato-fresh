


// --- DOM references ---
const startBtn = document.getElementById("startGame");
const userSelect = document.getElementById("userTeam");
const cpuSelect = document.getElementById("cpuTeam");
const selectScreen = document.getElementById("teamSelect");
const gameScreen = document.getElementById("gameBoard");

const offenseCol = document.getElementById("offenseCol");
const defenseCol = document.getElementById("defenseCol");
const resultBox = document.getElementById("resultBox");

let userTeam = null;
let cpuTeam = null;
let userRoster = null;
let cpuRoster = null;
let possession = "user"; // user starts with the ball

// --- Load rosters ---
async function loadRosters() {
  try {
    const res = await fetch("data/rosters-2008.json");
    return await res.json();
  } catch (e) {
    console.error("Error loading rosters:", e);
  }
}

// --- Render roster players to the field ---
function renderField(offense, defense) {
  offenseCol.innerHTML = "";
  defenseCol.innerHTML = "";

  offense.forEach(player => {
    const card = document.createElement("div");
    card.className = "player-card offense";
    card.innerText = player.name + " (" + player.pos + ")";
    card.addEventListener("mouseenter", () => showPlayerCard(player));
    card.addEventListener("mouseleave", hidePlayerCard);
    offenseCol.appendChild(card);
  });

  defense.forEach(player => {
    const card = document.createElement("div");
    card.className = "player-card defense";
    card.innerText = player.name + " (" + player.pos + ")";
    card.addEventListener("mouseenter", () => showPlayerCard(player));
    card.addEventListener("mouseleave", hidePlayerCard);
    defenseCol.appendChild(card);
  });
}

// --- Show player card popup ---
function showPlayerCard(player) {
  const popup = document.getElementById("playerPopup");
  popup.style.display = "block";
  popup.innerHTML = `
    <h3>${player.name}</h3>
    <p><b>POS:</b> ${player.pos}</p>
    <p>${player.stats || "No stats available"}</p>
  `;
}
function hidePlayerCard() {
  const popup = document.getElementById("playerPopup");
  popup.style.display = "none";
}

// --- Resolve play selection ---
function handlePlay(playType) {
  const offense = possession === "user" ? userRoster.offense : cpuRoster.offense;
  const defense = possession === "user" ? cpuRoster.defense : userRoster.defense;

  const result = resolvePlay(playType, offense, defense);
  resultBox.innerText = result;
}

// --- Dummy play resolver (replace with Strat-O-Matic style later) ---
function resolvePlay(playType, offense, defense) {
  const dice = Math.floor(Math.random() * 20) + 1;
  if (dice <= 5) return `${playType}: Loss of yards`;
  if (dice <= 10) return `${playType}: Short gain`;
  if (dice <= 15) return `${playType}: Medium gain`;
  if (dice <= 19) return `${playType}: Long gain!`;
  return `${playType}: Touchdown!`;
}

// --- Attach handlers to play buttons ---
document.querySelectorAll(".play-btn").forEach(btn => {
  btn.addEventListener("click", () => handlePlay(btn.dataset.play));
});

// --- Start Game handler ---
startBtn.addEventListener("click", async () => {
  const uTeam = userSelect.value;
  const cTeam = cpuSelect.value;
  if (!uTeam || !cTeam || uTeam === cTeam) {
    alert("Pick two different teams!");
    return;
  }

  const allRosters = await loadRosters();
  userRoster = allRosters[uTeam];
  cpuRoster = allRosters[cTeam];
  userTeam = uTeam;
  cpuTeam = cTeam;

  // hide select, show board
  selectScreen.style.display = "none";
  gameScreen.style.display = "block";

  // first drive: user offense vs cpu defense
  renderField(userRoster.offense, cpuRoster.defense);
});
