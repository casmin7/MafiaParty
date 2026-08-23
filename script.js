const players = {};
let currentStage = "SETUP"
let currentRoleIndex = 0;
const nightRoles = ["mafia"];
let editing = false;

function editToggle() {
  editing = !editing;
  renderPlayers();
}
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
    players[playerName] = { name: playerName, role: "none", affectedBy: [] };
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
    li.dataset.role = normalizedRole;

    const assignedRole = players[name].role;

    // Get the role you are currently assigning right now in Night 1
    const activeRole = nightRoles[currentRoleIndex];

    // If this player has been given the active role, mark their card!
    if (currentStage === "NIGHT" && assignedRole === activeRole) {
      li.classList.add("selected");
      roleSpan.classList.add("revealed");
    } else {
      li.classList.remove("selected");
      roleSpan.classList.remove("revealed");
    }

    // --- Targeted player ---
    if (!editing && currentStage === "NIGHT" && players[name].affectedBy.includes(activeRole)) {
      li.classList.add("targeted");
    } else {
      li.classList.remove("targeted");
    }

    const showRole = () => {
      if (currentStage === "DAY") {
        roleSpan.classList.add("revealed");
      }
    }
    const hideRole = () => {
      // Don't hide the text if the card is currently selected in NIGHT
      if (currentStage === "NIGHT" && players[name].role === activeRole) {
        return;
      }
      roleSpan.classList.remove("revealed");
    };

    li.addEventListener("click", () => {
        handleCardClick(name);
      });

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
      document.getElementById("edit_div").style.visibility = "visible";
      parseInput();
      currentStage = "NIGHT";
      console.log("Stage changed to NIGHT");
      editing = true;
      console.log("currentRoleIndex: " + currentRoleIndex);
      break;
    case "NIGHT":
      currentRoleIndex++;
      console.log("currentRoleIndex: " + currentRoleIndex);
      if (currentRoleIndex >= nightRoles.length) {
        resolveNightActions();
        currentStage = "DAY";
        currentRoleIndex = 0; // Reset for future nights
        console.log("Stage changed to DAY");
      }
      editing = false;
      break;
    case "DAY":
      currentStage = "NIGHT";
      console.log("Stage changed to NIGHT");
      break;
    default:
      currentStage = "SETUP";
      console.log("Stage changed to SETUP");
      break;
  }
  renderPlayers();

}

function parseInput() {
  const detectiveCheckbox = document.getElementById("detectiveCheckbox");
  const doctorCheckbox = document.getElementById("doctorCheckbox");

  if (detectiveCheckbox.checked) {
    nightRoles.push("detective");
  }
  if (doctorCheckbox.checked) {
    nightRoles.push("doctor");
  }
}


function handleCardClick(playerName) {
  if (players[playerName].role === "eliminated") return;
  const activeRole = nightRoles[currentRoleIndex];

  // DAY PHASE: Click to eliminate
  if (currentStage === "DAY") {
    if (confirm(`Eliminate ${playerName}?`)) {
      players[playerName].role = "eliminated";
      renderPlayers();
    }
    return;
  }

  if (currentStage === "NIGHT" && editing) {

    if (players[playerName].role === activeRole) {
      players[playerName].role = "none";
    }
    // 2. If they are currently unassigned, give them the active role
    else if (players[playerName].role === "none") {
      players[playerName].role = activeRole;
    }
    // 3. If they already have a DIFFERENT role, alert or block reassignment
    else {
      alert(`${playerName} is already assigned as ${players[playerName].role}!`);
    }
  }
  if (currentStage === "NIGHT" && !editing) {
    const actionIndex = players[playerName].affectedBy.indexOf(activeRole);

    if (actionIndex > -1) {
      // Already affected by this role -> unselect (remove from array)
      players[playerName].affectedBy.splice(actionIndex, 1);
    } else {
      // Not affected yet -> add active role to array
      players[playerName].affectedBy.push(activeRole);
    }

  renderPlayers();
}

function resolveNightActions() {
  for (const name in players) {
    const actions = players[name].affectedBy;

    // Mafia targets player, but Doctor didn't save them
    if (actions.includes("mafia") && !actions.includes("doctor")) {
      players[name].role = "eliminated";
    }

    // Reset night targets for the next round
    players[name].affectedBy = [];
  }
}
