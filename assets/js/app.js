let rosters = {};
let userTeam = null;
let cpuTeam = null;
let ballPosition = 20; // yard line (0–100 scale)

const offenseSlots = ["QB", "RB", "WR1", "WR2", "WR3", "TE"];
const defenseSlots = ["DT1", "DT2", "DE1", "DE2", "LB1", "LB2", "LB3", "CB1", "CB2", "FS", "SS"];

document.addEventListener("DOMContentLoaded", () => {
  fetch("data/rosters-2008.json")
    .then(res => res.json())
    .then(data => { rosters = data; });

  const startBtn = document.getElementById("startGame");
  startBtn.addEventListener("click", () => {
    userTeam = document.getElementById("userTeam").value;
    cpuTeam = document.getElementById("cpuTeam").value;
    if (!userTeam || !cpuTeam) {
      alert("Please select both teams.");
      return;
    }
    document.getElementById("teamSelect").style.display = "none";
    document.getElementById("gameBoard").style.display = "flex";
    renderTeams();
    renderBall();
  });

  document.querySelectorAll(".play-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      runPlay(btn.dataset.play);
    });
  });
});

function renderTeams() {
  const offCol = document.getElementById("offenseCol");
  const defCol = document.getElementById("defenseCol");
  offCol.innerHTML = "";
  defCol.innerHTML = "";

  const offense = rosters[userTeam]?.offense || {};
  const defense = rosters[cpuTeam]?.defense || {};

  offenseSlots.forEach(slot => {
    if (offense[slot]) {
      const div = document.createElement("div");
      div.className = "player-card offense";
      div.textContent = `${slot}: ${offense[slot].name}`;
      div.onmouseover = () => showPopup(offense[slot]);
      div.onmouseout = hidePopup;
      offCol.appendChild(div);
    }
  });

  defenseSlots.forEach(slot => {
    if (defense[slot]) {
      const div = document.createElement("div");
      div.className = "player-card defense";
      div.textContent = `${slot}: ${defense[slot].name}`;
      div.onmouseover = () => showPopup(defense[slot]);
      div.onmouseout = hidePopup;
      defCol.appendChild(div);
    }
  });
}

function showPopup(player) {
  const popup = document.getElementById("playerPopup");
  popup.innerHTML = `<b>${player.name}</b><br>
                     Pos: ${player.pos}<br>
                     Rating: ${player.rating || "?"}`;
  popup.style.display = "block";
}
function hidePopup() {
  document.getElementById("playerPopup").style.display = "none";
}

function runPlay(play) {
  let yards = Math.floor(Math.random() * 10) - 2; // -2 to +7
  if (play === "Deep Pass") yards += Math.floor(Math.random() * 15);
  if (play === "Run RB") yards += 3;

  ballPosition += yards;
  if (ballPosition < 0) ballPosition = 0;
  if (ballPosition > 100) ballPosition = 100;

  document.getElementById("resultBox").textContent =
    `${play} gained ${yards} yards. Ball at ${ballPosition} yard line.`;

  renderBall();
}

function renderBall() {
  let marker = document.getElementById("ballMarker");
  if (!marker) {
    marker = document.createElement("div");
    marker.id = "ballMarker";
    marker.style.position = "absolute";
    marker.style.fontSize = "20px";
    marker.textContent = "🏈";
    document.getElementById("field").appendChild(marker);
  }
  const field = document.getElementById("field");
  const fieldHeight = field.offsetHeight;
  const y = fieldHeight - (ballPosition / 100) * fieldHeight;
  marker.style.left = "50%";
  marker.style.marginLeft = "-10px";
  marker.style.top = `${y - 10}px`;
}
