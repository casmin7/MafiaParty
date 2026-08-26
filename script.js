const players = {};
let currentStage = "SETUP";
let currentRoleIndex = 0;
const nightRoles = ["mafia"];
let editing = false;
let rolesAssigned = false;
let loversPair = [];

function editToggle() {
  editing = !editing;
  renderPlayers();
}

// Initial game state, adding players
function addPlayer() {
  const playerName = prompt("Enter player name:");
  if (players.hasOwnProperty(playerName)) {
    alert("Player already exists!");
    return;
  }
  if (playerName) {
    players[playerName] = {
      name: playerName,
      role: "none",
      affectedBy: [],
      isMuted: false
    };
  }
  renderPlayers();
  for (const name in players) {
    console.log(name, players[name].role);
  }
}

// DOM rendering of player list
function renderPlayers() {
  // Header
  const stageTitle = document.getElementById("stageTitle");
  const roleSubTitle = document.getElementById("roleSubTitle");
  saveData();
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
      document.getElementById("setup_div").style.display = "none";
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
  // Reset array to ensure a clean sequence on every run
  nightRoles.length = 0;

  // Roles in exact desired turn sequence
  const roleSequence = [
    { id: "escortCheckbox", role: "escort" },       // 1st: Roleblocker
    { id: "cupidCheckbox", role: "cupid" },         // 2nd: Matchmaker
    { id: "mutilatorCheckbox", role: "mutilator" }, // 3rd: Silencer
    { id: null, role: "mafia" },                    // 4th: Mafia (Always included)
    { id: "detectiveCheckbox", role: "detective" }, // 5th: Investigator
    { id: "doctorCheckbox", role: "doctor" }        // 6th: Saver
  ];

  roleSequence.forEach(item => {
    // If it's Mafia (no element required) OR the checkbox is checked in DOM
    if (item.role === "mafia") {
      nightRoles.push("mafia");
    } else {
      const el = document.getElementById(item.id);
      if (el && el.checked) {
        nightRoles.push(item.role);
      }
    }
  });
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

  // 1. Identify who was roleblocked by the Escort
  const blockedPlayers = Object.keys(players).filter(p =>
    players[p].affectedBy.includes("escort")
  );

  for (const name in players) {
    if (blockedPlayers.includes(name)) {
      nightSummary.push(`🔞 ${name} was visited by the Escort and couldn't act!`);
    }
  }

  // Helper to check if a specific role's player is currently blocked
  const isRoleBlocked = (roleName) => {
    const performer = Object.keys(players).find(p => players[p].role === roleName);
    return performer && blockedPlayers.includes(performer);
  };

  // 2. Process Cupid (Only links lovers if Cupid isn't blocked)
  if (!isRoleBlocked("cupid")) {
    const cupidTargets = Object.keys(players).filter(p =>
      players[p].affectedBy.includes("cupid")
    );
    if (cupidTargets.length === 2 && loversPair.length === 0) {
      loversPair = cupidTargets;
      nightSummary.push(`💘 Cupid linked ${loversPair[0]} and ${loversPair[1]} as Lovers!`);
    }
  }

  // 3. Process Mutilator (Silences player for Day phase)
  if (!isRoleBlocked("mutilator")) {
    for (const name in players) {
      if (players[name].affectedBy.includes("mutilator")) {
        players[name].isMuted = true; // Read this during Day phase UI
        nightSummary.push(`🤐 ${name} was silenced and cannot speak today!`);
      }
    }
  }

  // 4. Process Detective
  if (!isRoleBlocked("detective")) {
    for (const name in players) {
      if (players[name].affectedBy.includes("detective")) {
        const isMafia = players[name].role === "mafia";
        nightSummary.push(`🔍 Detective found ${name} is ${isMafia ? "MAFIA" : "CIVILIAN"}.`);
      }
    }
  }

  // 5. Process Mafia Attack vs. Doctor Save
  const mafiaBlocked = isRoleBlocked("mafia");
  const doctorBlocked = isRoleBlocked("doctor");

  for (const name in players) {
    const actions = players[name].affectedBy;

    if (actions.includes("mafia")) {
      if (mafiaBlocked) {
        nightSummary.push(`🛡️ Mafia was roleblocked; no attack occurred!`);
      } else if (actions.includes("doctor") && !doctorBlocked) {
        nightSummary.push(`💉 Doctor saved ${name}!`);
      } else {
        nightSummary.push(`💀 Mafia killed ${name}!`);
        eliminatePlayer(name, nightSummary);
      }
    }

    // Reset night action targets
    players[name].affectedBy = [];
  }

  // Alert summary
  alert(nightSummary.length > 0 ? nightSummary.join("\n\n") : "Quiet night... nothing happened.");
}

function eliminatePlayer(playerName, summaryArray = []) {
  if (players[playerName].role === "eliminated") return;

  players[playerName].role = "eliminated";

  // Check if this player was a Lover
  if (loversPair.includes(playerName)) {
    const partnerName = loversPair.find(p => p !== playerName);
    if (partnerName && players[partnerName].role !== "eliminated") {
      summaryArray.push(`💔 ${partnerName} died of heartbreak following ${playerName}'s death!`);
      players[partnerName].role = "eliminated";
    }
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

  // Remove storage
  localStorage.removeItem("mafiaGameData");

  // Toggle UI section visibility back to setup
  document.getElementById("nextStageButton").textContent = "Start Game";
  document.getElementById("setup_div").style.display = "flex";
  document.getElementById("edit_div").style.visibility = "hidden";

  // Re-render empty player list
  renderPlayers();
}


function saveData() {
  const data = {
    players: players,
    currentStage: currentStage,
    currentRoleIndex: currentRoleIndex,
    editing: editing,
    nightRoles: nightRoles,
    rolesAssigned: rolesAssigned,
    loversPair: loversPair,
  };
  localStorage.setItem("mafiaGameData", JSON.stringify(data));
  console.log(JSON.parse(localStorage.getItem("mafiaGameData")));
}
