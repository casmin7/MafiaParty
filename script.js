const players = {};
let currentStage = "SETUP";
let currentRoleIndex = 0;
const nightRoles = ["mafia"];
let editing = false;
let rolesAssigned = false;

function editToggle() {
  editing = !editing;
  renderPlayers();
}

// Initial game state, adding players
function addPlayer() {
  const playerName = prompt("Enter player name:");
  // Duplicate check
  if (players.hasOwnProperty(playerName)) {
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
  // Header
  const stageTitle = document.getElementById("stageTitle");
  const roleSubTitle = document.getElementById("roleSubTitle");

  if (stageTitle && roleSubTitle) {
    if (currentStage === "SETUP") {
      stageTitle.textContent = "SETUP PHASE";
      roleSubTitle.textContent = "Add players to get started";
    } else if (currentStage === "NIGHT") {
      const activeRole = nightRoles[currentRoleIndex] ? nightRoles[currentRoleIndex].toUpperCase() : "";
      stageTitle.textContent = `NIGHT PHASE — ${activeRole}`;
      roleSubTitle.textContent = editing
        ? `Tap player to assign ${activeRole} role`
        : `Tap player to select ${activeRole}'s target`;
    } else if (currentStage === "DAY") {
      stageTitle.textContent = "DAY PHASE";
      roleSubTitle.textContent = "Tap a player card to eliminate them";
    }
  }

  // Player List
  const playerList = document.getElementById("playerList");
  if (!playerList) return;

  // Clear list
  playerList.innerHTML = "";

  // Render players
  for (const name in players) {
    const li = document.createElement("li");
    li.className = "player-card";

    const nameSpan = document.createElement("h1");
    const roleSpan = document.createElement("span");

    nameSpan.textContent = name;

    roleSpan.className = "hiddenInfo";
    roleSpan.textContent = players[name].role;

    // Role normalization and attribution for use in CSS
    const normalizedRole = players[name].role.toLowerCase().trim();
    li.dataset.role = normalizedRole;

    const assignedRole = players[name].role;

    // Get the role active right now
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
    };

    const hideRole = () => {
      // Don't hide the text if the card is currently selected in NIGHT
      if (currentStage === "NIGHT" && players[name].role === activeRole) {
        return;
      }
      roleSpan.classList.remove("revealed");
    };

    // Clean single event assignment
    li.addEventListener("click", () => {
      handleCardClick(name);
    });

    li.addEventListener("mousedown", showRole);
    li.addEventListener("mouseup", hideRole);
    li.addEventListener("mouseleave", hideRole);

    li.addEventListener("touchstart", showRole, { passive: true });
    li.addEventListener("touchend", hideRole);
    li.addEventListener("touchcancel", hideRole);

    li.appendChild(nameSpan);
    li.appendChild(roleSpan);

    playerList.appendChild(li);
  }
}

// Stages
function nextStage() {
  switch (currentStage) {
    case "SETUP":
      document.getElementById("nextStageButton").innerHTML = "Next Stage";
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
      advanceNightRole();
      console.log("currentRoleIndex: " + currentRoleIndex);
      if (currentRoleIndex >= nightRoles.length) {
        resolveNightActions();
        currentStage = "DAY";
        currentRoleIndex = 0; // Reset for future nights
        console.log("Stage changed to DAY");
        editing = false;
        rolesAssigned = true;
      } else {
        const activeRole = nightRoles[currentRoleIndex];

        if (!rolesAssigned) {
          const roleExists = Object.values(players).some(p => p.role === activeRole);
          editing = !roleExists;
        } else {
          editing = false; // Night setup complete, stay in action/targeting mode
        }
      }
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

  if (detectiveCheckbox.checked && !nightRoles.includes("detective")) {
    nightRoles.push("detective");
  }
  if (doctorCheckbox.checked && !nightRoles.includes("doctor")) {
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
  }
  renderPlayers();
}

function resolveNightActions() {
  const nightSummary = [];
  for (const name in players) {
    const actions = players[name].affectedBy;

    if (actions.includes("detective")) {
      const isMafia = players[name].role === "mafia";
      nightSummary.push(`Detective found ${isMafia ? "mafia" : "a civilian"}!`);
    }
    // Mafia targets player, but Doctor didn't save them
    if (actions.includes("mafia") && !actions.includes("doctor")) {
      nightSummary.push(`Mafia killed ${name}!`);
      players[name].role = "eliminated";
    } else if (actions.includes("doctor")) {
      nightSummary.push(`Doctor saved ${name}!`);
    }

    // Reset night targets for the next round
    players[name].affectedBy = [];
  }
  if (nightSummary.length > 0) {
    alert("--- Summery ---\n\n" + nightSummary.join("\n\n"));
  } else {
    alert("--- Summery ---\n\nNothing happened tonight.");
  }
}

function advanceNightRole() {
  const activeRole = nightRoles[currentRoleIndex];

  // Check if an ALIVE player has this role
  const isRoleAlive = Object.values(players).some(
    (p) => p.role === activeRole
  );

  // If role is dead (and we already finished setup), skip to next role
  if (!isRoleAlive && rolesAssigned) {
    currentRoleIndex++;
    if (currentRoleIndex < nightRoles.length) {
      advanceNightRole(); // Recurse to check next role
    }
  }
}

function resetGame() {
  if (!confirm("Are you sure you want to reset the entire game?")) return;

  // Clear player data
  for (const name in players) {
    players[name].role = "none";
    players[name].affectedBy = [];
  }

  // Reset state variables
  currentStage = "SETUP";
  currentRoleIndex = 0;
  editing = false;
  nightRoles.length = 0;
  nightRoles.push("mafia"); // Keep base role
  rolesAssigned = false;

  // Toggle UI section visibility back to setup
  document.getElementById("nextStageButton").textContent = "Start Game";
  document.getElementById("setup_div").hidden = false;
  document.getElementById("edit_div").style.visibility = "hidden";

  // Re-render empty player list
  renderPlayers();
}
