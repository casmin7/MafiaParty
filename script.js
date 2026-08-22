const players = {};
let currentStage = "SETUP"
let currentRoleIndex = 0;
const nightRoles = [];

// Initial game state, adding players
function addPlayer() {
  const playerName = prompt("Enter player name:");
  //Duplicate check
  if(players.hasOwnProperty(playerName)) {
    alert("Player already exists!");
    return;
  }
  // Player add
  if (playerName) {
    players[playerName] = { name: playerName, role: "none" };
  }
  // Render
  renderPlayers();
  // --- Logging ---
  for (const name in players) {
    console.log(name, players[name].role);
  }
}

// DOM rendering of player list
function renderPlayers() {
  const playerList = document.getElementById("playerList");
  // Clear list
  playerList.innerHTML = "";
  // Render players
  for (const name in players) {
    const li = document.createElement("li");
    li.className = "player-card";

    const nameSpan = document.createElement("h1")
    const roleSpan = document.createElement("span");

    nameSpan.textContent = name;

    roleSpan.className = "hiddenInfo";
    roleSpan.textContent = players[name].role;

    // Role normalization and attribution for use in CSS
    const normalizedRole = players[name].role.toLowerCase().trim();
    roleSpan.dataset.role = normalizedRole;

    const showRole = () => roleSpan.classList.add("revealed");
    const hideRole = () => roleSpan.classList.remove("revealed");

      li.addEventListener("mousedown", showRole);
      li.addEventListener("mouseup", hideRole);
      li.addEventListener("mouseleave", hideRole); // Hide if mouse drags off button

      // Mobile support
      li.addEventListener("touchstart", (e) => { e.preventDefault(); showRole(); });
      li.addEventListener("touchend", hideRole);

    li.appendChild(nameSpan);
    li.appendChild(roleSpan);

    playerList.appendChild(li);
  }
}

// Stages
function nextStage() {
  switch (currentStage) {
    case "SETUP":
      document.getElementById("setup_div").hidden = true;
      parseInput();
      currentStage = "FIRST_NIGHT";
      console.log("Stage changed to FIRST_NIGHT");
      break;
    case "FIRST_NIGHT":
      console.log("currentRoleIndex: " + currentRoleIndex);
      currentRoleIndex++;
      if (currentRoleIndex >= nightRoles.length) {
        currentStage = "DAY";
        currentRoleIndex = 0; // Reset for future nights
        console.log("Stage changed to DAY");
      }
      break;
    case "DAY":
      currentStage = "NIGHT";
      console.log("Stage changed to NIGHT");
      break;
    case "NIGHT":
      currentStage = "DAY";
      console.log("Stage changed to DAY");
      break;
    default:
      currentStage = "SETUP";
      console.log("Stage changed to SETUP");
      break;
  }
}

function parseInput() {
  function addRoles(role, count) {
    for (let i = 0; i < count; i++) {
      nightRoles.push(role);
    }
  }

  const mafiaCount = parseInt(document.getElementById("mafiaCount").value) || 0;
  const detectiveCount = parseInt(document.getElementById("detectiveCount").value) || 0;
  const doctorCount = parseInt(document.getElementById("doctorCount").value) || 0;

  addRoles("mafia", mafiaCount);
  addRoles("detective", detectiveCount);
  addRoles("doctor", doctorCount);

  console.log("nightRoles: " + nightRoles);
}
