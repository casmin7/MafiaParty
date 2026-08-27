const players = {};
let currentStage = "SETUP";
let currentRoleIndex = 0;
let  nightRoles = ["mafia"];
let editing = false;
let rolesAssigned = false;
let loversPair = [];
const nightSummary = [];
const blockedRole = [];

function editToggle() {
  editing = !editing;
  renderPlayers();
}

// Initial game state, adding players
function addPlayer() {
  const playerName = prompt("Enter player name:").trim();
  if (players.hasOwnProperty(playerName)) {
    alert("Player already exists!");
    return;
  }
  if (playerName) {
    players[playerName] = {
      name: playerName,
      role: "none",
      affectedBy: [],
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

    // delete button
    if (currentStage === "SETUP") {
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "✕";
      deleteBtn.className = "delete-btn";
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        deletePlayer(name);
      };
      li.appendChild(deleteBtn);
    }

    playerList.appendChild(li);
  }
}

function deletePlayer(playerName) {
  if (confirm(`Remove ${playerName} from setup?`)) {
    delete players[playerName];
    renderPlayers();
  }
}

function deleteAllPlayer() {
  if (confirm(`Remove all players from setup?`)) {
    for (const name in players) {
      delete players[name];
    }
    renderPlayers();
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
  // Clear resolution tracking state at the start
  nightSummary.length = 0;
  blockedRole.length = 0;

  // 1. Escort / Roleblock resolution (Must run first)
  for (const name in players) {
    const affected = players[name].affectedBy;
    if (affected && affected.includes("escort") && players[name].role !== "none") {
      nightSummary.push(`${players[name].role} spent a night with the escort`);
      blockedRole.push(players[name].role);
    }
  }

  // 2. Cupid resolution (Ran once outside of player loops)
  if (!blockedRole.includes("cupid")) {
    const cupidTargets = Object.keys(players).filter(p =>
      players[p].affectedBy && players[p].affectedBy.includes("cupid")
    );

    if (cupidTargets.length === 2) {
      loversPair = cupidTargets;
      nightSummary.push(`💘 Cupid linked ${loversPair[0]} and ${loversPair[1]} as Lovers for this round!`);
    }
  }

  // 4. Detective
  for (const name in players) {
    if (players[name].affectedBy.includes("detective") && !blockedRole.includes("detective")) {
      nightSummary.push(`Detective found ${players[name].role === "mafia" ? "the mafia" : "no mafia"}`);
    }
  }

  for (const name in players) {
    if (players[name].affectedBy.includes("mutilator") && !blockedRole.includes("mutilator")) {
      if (loversPair && loversPair.includes(name)) {
        nightSummary.push(`${name} and ${loversPair[loversPair.indexOf(name) === 0 ? 1 : 0]} were silenced`);
      } else {
        nightSummary.push(`Mutilator silenced ${name}`);
      }
    }
  }

  // 3. Killer / Mafia resolution
  for (const name in players) {
    const isTargetedByMafia = players[name].affectedBy && players[name].affectedBy.includes("mafia");
    const isMafiaBlocked = blockedRole.includes("mafia");

    if (isTargetedByMafia && !isMafiaBlocked) {
      // Check if current target is in a lovers pair
      const isLover = loversPair && loversPair.includes(name);
      const loverPartner = isLover
        ? loversPair[loversPair.indexOf(name) === 0 ? 1 : 0]
        : null;

      // Check if either the target OR their lover was saved by an unblocked doctor
      const targetSaved = players[name].affectedBy.includes("doctor");
      const partnerSaved = loverPartner && players[loverPartner].affectedBy && players[loverPartner].affectedBy.includes("doctor");
      const isDoctorActive = !blockedRole.includes("doctor");

      const isProtectedByDoctor = isDoctorActive && (targetSaved || partnerSaved);

      if (isProtectedByDoctor) {
        if (partnerSaved) { nightSummary.push(`The Doctor saved ${loverPartner} & ${name}!`); } else
        nightSummary.push(`The Doctor saved ${name}!`);
      } else if (isLover) {
        nightSummary.push(`${name} and ${loverPartner} were both killed!`);
        players[name].role = "eliminated";
        players[loverPartner].role = "eliminated";
      } else {
        nightSummary.push(`${name} was killed`);
        players[name].role = "eliminated";
      }
    }
  }

  // Display summary
  alert(nightSummary.length > 0 ? nightSummary.join("\n\n") : "Quiet night... nothing happened.");
  for (const name in players) {
    players[name].affectedBy = [];
    loversPair = [];
  }
}

function advanceNightRole() {
  const activeRole = nightRoles[currentRoleIndex];
  if (!activeRole) return;

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
    loversPair: loversPair
  };
  localStorage.setItem("mafiaGameData", JSON.stringify(data));
}

function loadData() {
  const savedString = localStorage.getItem("mafiaGameData");
  if (!savedString) {
    renderPlayers();
    return;
  }

  try {
    const data = JSON.parse(savedString);

    // 1. Clear current players object completely before restoring
    for (const key in players) {
      delete players[key];
    }

    // 2. Restore players object
    if (data.players) {
      Object.assign(players, data.players);
    }

    // 3. Restore primitive states
    currentStage = data.currentStage || "SETUP";
    currentRoleIndex = data.currentRoleIndex || 0;
    editing = data.editing || false;
    rolesAssigned = data.rolesAssigned || false;
    loversPair = data.loversPair || [];

    // 4. Restore nightRoles array safely
    nightRoles.length = 0;
    if (Array.isArray(data.nightRoles)) {
      nightRoles.push(...data.nightRoles);
    } else {
      nightRoles.push("mafia");
    }

    // 5. Sync UI elements (Buttons/Divs) based on loaded stage
    const nextBtn = document.getElementById("nextStageButton");
    const setupDiv = document.getElementById("setup_div");
    const editDiv = document.getElementById("edit_div");

    if (currentStage !== "SETUP") {
      if (nextBtn) nextBtn.textContent = "Next Stage";
      if (setupDiv) setupDiv.style.display = "none";
      if (editDiv) editDiv.style.visibility = "visible";
    }

  } catch (error) {
    console.error("Failed to parse saved game data:", error);
  }

  // Render after all data and UI states are restored
  renderPlayers();
}

// Load data automatically when the page finishes loading
window.addEventListener("DOMContentLoaded", loadData);
