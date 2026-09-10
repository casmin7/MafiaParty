const players = {};
let currentStage = "SETUP";
let currentRoleIndex = 0;
let nightRoles = ["mafia"];
let editing = false;
let rolesAssigned = false;
let loversPair = [];
let nightSummary = [];
const blockedRole = [];

// Phase & Day Tracking
let dayNumber = 1;
let isNight = false;

const MAX_HISTORY_DEPTH = 30;
const historyStack = [];

function saveHistoryState() {
  const snapshot = {
    players: JSON.parse(JSON.stringify(players)),
    currentStage,
    currentRoleIndex,
    editing,
    rolesAssigned,
    loversPair: [...loversPair],
    nightSummary: [...nightSummary],
    nightRoles: [...nightRoles],
    dayNumber,
    isNight
  };
  historyStack.push(snapshot);
  if (historyStack.length > MAX_HISTORY_DEPTH) {
    historyStack.shift();
  }
}

function updateHeaderUI() {
  const totalPlayers = Object.keys(players).length;
  const alivePlayers = Object.values(players).filter(
    (p) => p.role !== "eliminated"
  ).length;

  const aliveCountEl = document.getElementById("aliveCount");
  const totalCountEl = document.getElementById("totalCount");
  if (aliveCountEl && totalCountEl) {
    aliveCountEl.textContent = alivePlayers;
    totalCountEl.textContent = totalPlayers;
  }

  const phaseBadge = document.getElementById("phaseBadge");
  if (phaseBadge) {
    if (currentStage === "SETUP") {
      phaseBadge.textContent = "SETUP";
      phaseBadge.classList.remove("night-phase");
    } else {
      const phaseName = isNight ? "Night" : "Day";
      phaseBadge.textContent = `${phaseName} ${dayNumber}`;
      phaseBadge.classList.toggle("night-phase", isNight);
    }
  }
}

function editToggle() {
  saveHistoryState();
  editing = !editing;
  renderPlayers();
  saveData();
}

function addPlayer() {
  const playerName = prompt("Enter player name:")?.trim();
  if (!playerName) return;
  if (players.hasOwnProperty(playerName)) {
    alert("Player already exists!");
    return;
  }
  saveHistoryState();
  players[playerName] = {
    name: playerName,
    role: "none",
    affectedBy: [],
  };
  renderPlayers();
  saveData();
}

function renderPlayers() {
  updateHeaderUI();

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

  const btnDeleteAll = document.getElementById("btn_delete_all");
  const btnAddPlayer = document.getElementById("btn_add_player");
  const btnPrevStage = document.getElementById("btn_prev_stage");
  const btnEditToggle = document.getElementById("btn_edit_toggle");
  const btnResetGame = document.getElementById("btn_reset_game");
  const editStatusText = document.getElementById("edit_status_text");
  const btnShowLog = document.getElementById("btn_show_log");

  if (currentStage === "SETUP") {
    if (btnDeleteAll) btnDeleteAll.style.display = "inline-flex";
    if (btnAddPlayer) btnAddPlayer.style.display = "inline-flex";
    if (btnPrevStage) btnPrevStage.style.display = "none";
    if (btnEditToggle) btnEditToggle.style.display = "none";
    if (btnResetGame) btnResetGame.style.display = "none";
    if (btnShowLog) btnShowLog.style.display = "none";
  } else if (currentStage === "NIGHT") {
    if (btnDeleteAll) btnDeleteAll.style.display = "none";
    if (btnAddPlayer) btnAddPlayer.style.display = "none";
    if (btnPrevStage) btnPrevStage.style.display = "inline-flex";
    if (btnEditToggle) btnEditToggle.style.display = "inline-flex";
    if (btnResetGame) btnResetGame.style.display = "inline-flex";
    if (btnShowLog) btnShowLog.style.display = "none";

    if (editStatusText) {
      editStatusText.textContent = editing ? "Done Editing" : "Edit Roles";
    }
  } else if (currentStage === "DAY") {
    if (btnDeleteAll) btnDeleteAll.style.display = "none";
    if (btnAddPlayer) btnAddPlayer.style.display = "none";
    if (btnPrevStage) btnPrevStage.style.display = "inline-flex";
    if (btnEditToggle) btnEditToggle.style.display = "none";
    if (btnResetGame) btnResetGame.style.display = "inline-flex";
    if (btnShowLog) btnShowLog.style.display = "inline-flex";
  }

  const playerList = document.getElementById("playerList");
  if (!playerList) return;

  playerList.innerHTML = "";

  for (const name in players) {
    const li = document.createElement("li");
    li.className = "player-card";

    li.tabIndex = 0;
    li.setAttribute("role", "button");
    li.setAttribute("aria-label", `Player ${name}, Role: ${players[name].role}`);

    const nameSpan = document.createElement("h1");
    const roleSpan = document.createElement("span");

    nameSpan.textContent = name;
    roleSpan.className = "hiddenInfo";
    roleSpan.textContent = players[name].role;

    const normalizedRole = players[name].role.toLowerCase().trim();
    li.dataset.role = normalizedRole;

    const assignedRole = players[name].role;
    const activeRole = nightRoles[currentRoleIndex];

    if (currentStage === "NIGHT" && assignedRole === activeRole) {
      li.classList.add("selected");
      roleSpan.classList.add("revealed");
    } else {
      li.classList.remove("selected");
      roleSpan.classList.remove("revealed");
    }

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
      if (currentStage === "NIGHT" && players[name].role === activeRole) {
        return;
      }
      roleSpan.classList.remove("revealed");
    };

    li.addEventListener("click", () => handleCardClick(name));
    li.addEventListener("pointerdown", showRole);
    li.addEventListener("pointerup", hideRole);
    li.addEventListener("pointerleave", hideRole);
    li.addEventListener("pointercancel", hideRole);

    li.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleCardClick(name);
      }
    });

    li.addEventListener("focus", showRole);
    li.addEventListener("blur", hideRole);

    li.appendChild(nameSpan);
    li.appendChild(roleSpan);

    if (currentStage === "SETUP") {
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "✕";
      deleteBtn.className = "delete-btn";
      deleteBtn.setAttribute("aria-label", `Delete ${name}`);
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
  if (confirm(`Remove ${playerName} from game?`)) {
    saveHistoryState();
    delete players[playerName];
    renderPlayers();
    saveData();
  }
}

function deleteAllPlayer() {
  if (confirm(`Remove all players from game?`)) {
    saveHistoryState();
    for (const name in players) {
      delete players[name];
    }
    renderPlayers();
    saveData();
  }
}

function nextStage() {
  saveHistoryState();

  switch (currentStage) {
    case "SETUP":
      document.getElementById("setup_div").style.display = "none";
      parseInput();
      currentStage = "NIGHT";
      isNight = true;
      dayNumber = 1;
      editing = true;
      break;

    case "NIGHT":
      currentRoleIndex++;
      advanceNightRole();

      if (currentRoleIndex >= nightRoles.length) {
        resolveNightActions();
        currentStage = "DAY";
        isNight = false;
        currentRoleIndex = 0;
        editing = false;
        rolesAssigned = true;
        checkWinCondition();
      } else {
        const activeRole = nightRoles[currentRoleIndex];
        if (!rolesAssigned) {
          const roleExists = Object.values(players).some(p => p.role === activeRole);
          editing = !roleExists;
        } else {
          editing = false;
        }
      }
      break;

    case "DAY":
      clearAllTargets();
      nightSummary.length = 0;
      currentStage = "NIGHT";
      isNight = true;
      dayNumber++;
      advanceNightRole();
      break;

    default:
      currentStage = "SETUP";
      isNight = false;
      dayNumber = 1;
      break;
  }
  renderPlayers();
  saveData();
}

function parseInput() {
  nightRoles.length = 0;

  const roleSequence = [
    { id: "escortCheckbox", role: "escort" },
    { id: "cupidCheckbox", role: "cupid" },
    { id: "mutilatorCheckbox", role: "mutilator" },
    { id: null, role: "mafia" },
    { id: "detectiveCheckbox", role: "detective" },
    { id: "doctorCheckbox", role: "doctor" }
  ];

  roleSequence.forEach(item => {
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

  if (currentStage === "DAY") {
    if (confirm(`Eliminate ${playerName}?`)) {
      saveHistoryState();
      players[playerName].role = "eliminated";
      renderPlayers();
      saveData();
      checkWinCondition();
    }
    return;
  }

  if (currentStage === "NIGHT" && editing) {
    saveHistoryState();
    if (players[playerName].role === activeRole) {
      players[playerName].role = "none";
    } else if (players[playerName].role === "none") {
      players[playerName].role = activeRole;
    } else {
      alert(`${playerName} is already assigned as ${players[playerName].role}!`);
    }
  }

  if (currentStage === "NIGHT" && !editing) {
    const actionIndex = players[playerName].affectedBy.indexOf(activeRole);

    if (actionIndex > -1) {
      players[playerName].affectedBy.splice(actionIndex, 1);
    } else {
      players[playerName].affectedBy.push(activeRole);
    }
  }
  renderPlayers();
  saveData();
}

function resolveNightActions() {
  nightSummary.length = 0;
  blockedRole.length = 0;

  for (const name in players) {
    const affected = players[name].affectedBy;
    if (affected && affected.includes("escort") && players[name].role !== "none") {
      nightSummary.push(`${players[name].role} spent a night with the escort`);
      blockedRole.push(players[name].role);
    }
  }

  if (!blockedRole.includes("cupid")) {
    const cupidTargets = Object.keys(players).filter(p =>
      players[p].affectedBy && players[p].affectedBy.includes("cupid")
    );

    if (cupidTargets.length === 2) {
      loversPair = cupidTargets;
      nightSummary.push(`💘 Cupid linked ${loversPair[0]} and ${loversPair[1]} as Lovers for this round!`);
    }
  }

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

  for (const name in players) {
    const isTargetedByMafia = players[name].affectedBy && players[name].affectedBy.includes("mafia");
    const isMafiaBlocked = blockedRole.includes("mafia");

    if (isTargetedByMafia && !isMafiaBlocked) {
      const isLover = loversPair && loversPair.includes(name);
      const loverPartner = isLover
        ? loversPair[loversPair.indexOf(name) === 0 ? 1 : 0]
        : null;

      const targetSaved = players[name].affectedBy.includes("doctor");
      const partnerSaved = loverPartner && players[loverPartner].affectedBy && players[loverPartner].affectedBy.includes("doctor");
      const isDoctorActive = !blockedRole.includes("doctor");

      const isProtectedByDoctor = isDoctorActive && (targetSaved || partnerSaved);

      if (isProtectedByDoctor) {
        if (partnerSaved) {
          nightSummary.push(`The Doctor saved ${loverPartner} & ${name}!`);
        } else {
          nightSummary.push(`The Doctor saved ${name}!`);
        }
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

  alert(nightSummary.length > 0 ? nightSummary.join("\n\n") : "Quiet night... nothing happened.");

  clearAllTargets();
  loversPair = [];
}

function clearAllTargets() {
  for (const name in players) {
    players[name].affectedBy = [];
  }
}

function advanceNightRole() {
  if (currentRoleIndex >= nightRoles.length) return;

  const activeRole = nightRoles[currentRoleIndex];
  const isRoleAlive = Object.values(players).some(p => p.role === activeRole);

  if (!isRoleAlive && rolesAssigned) {
    currentRoleIndex++;
    advanceNightRole();
  }
}

function previousStage() {
  if (historyStack.length === 0) return;

  const previousState = historyStack.pop();

  currentStage = previousState.currentStage;
  currentRoleIndex = previousState.currentRoleIndex;
  editing = previousState.editing;
  rolesAssigned = previousState.rolesAssigned;
  loversPair = previousState.loversPair;
  nightSummary = previousState.nightSummary;
  dayNumber = previousState.dayNumber || 1;
  isNight = previousState.isNight || false;

  nightRoles.length = 0;
  nightRoles.push(...previousState.nightRoles);

  for (const key in players) {
    delete players[key];
  }
  Object.assign(players, previousState.players);

  const setupDiv = document.getElementById("setup_div");
  if (setupDiv) {
    setupDiv.style.display = currentStage === "SETUP" ? "flex" : "none";
  }

  renderPlayers();
  saveData();
}

function checkWinCondition() {
  if (currentStage === "SETUP") return;

  const livingPlayers = Object.values(players).filter(p => p.role !== "eliminated");
  if (livingPlayers.length === 0) return;

  const livingMafia = livingPlayers.filter(p => p.role === "mafia").length;
  const livingTown = livingPlayers.length - livingMafia;

  if (livingMafia === 0) {
    alert("🎉 TOWN WINS! All Mafia members have been eliminated.");
  } else if (livingMafia >= livingTown) {
    alert("🔪 MAFIA WINS! Mafia members equal or outnumber the Town.");
  }
}

function resetGame() {
  if (!confirm("Are you sure you want to reset the entire game?")) return;

  for (const name in players) {
    players[name].role = "none";
    players[name].affectedBy = [];
  }

  currentStage = "SETUP";
  currentRoleIndex = 0;
  dayNumber = 1;
  isNight = false;
  editing = false;
  nightRoles.length = 0;
  nightRoles.push("mafia");
  rolesAssigned = false;
  nightSummary.length = 0;
  historyStack.length = 0;

  localStorage.removeItem("mafiaGameData");
  document.getElementById("setup_div").style.display = "flex";
  renderPlayers();
}

function showLog() {
  alert(nightSummary.length > 0 ? nightSummary.join("\n\n") : "Quiet night... nothing happened.");
}

function saveCheckboxState() {
  const checkboxIds = ["detectiveCheckbox", "doctorCheckbox", "escortCheckbox", "cupidCheckbox", "mutilatorCheckbox"];
  const checkboxState = {};
  checkboxIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) checkboxState[id] = el.checked;
  });
  localStorage.setItem("mafiaCheckboxState", JSON.stringify(checkboxState));
}

function loadCheckboxState() {
  const savedState = localStorage.getItem("mafiaCheckboxState");
  if (!savedState) return;

  try {
    const checkboxState = JSON.parse(savedState);
    for (const id in checkboxState) {
      const el = document.getElementById(id);
      if (el) el.checked = checkboxState[id];
    }
  } catch (err) {
    console.error("Failed to parse checkbox state:", err);
  }
}

function saveData() {
  const data = {
    players,
    currentStage,
    currentRoleIndex,
    editing,
    nightRoles,
    rolesAssigned,
    loversPair,
    nightSummary,
    historyStack,
    dayNumber,
    isNight
  };
  localStorage.setItem("mafiaGameData", JSON.stringify(data));
}

function loadData() {
  loadCheckboxState();

  const savedString = localStorage.getItem("mafiaGameData");
  if (!savedString) {
    renderPlayers();
    return;
  }

  try {
    const data = JSON.parse(savedString);

    for (const key in players) {
      delete players[key];
    }

    if (data.players) {
      Object.assign(players, data.players);
    }

    currentStage = data.currentStage || "SETUP";
    currentRoleIndex = data.currentRoleIndex || 0;
    editing = data.editing || false;
    rolesAssigned = data.rolesAssigned || false;
    loversPair = data.loversPair || [];
    dayNumber = data.dayNumber || 1;
    isNight = data.isNight || false;

    if (Array.isArray(data.historyStack)) {
      historyStack.length = 0;
      historyStack.push(...data.historyStack);
    }

    if (Array.isArray(data.nightSummary)) {
      nightSummary.length = 0;
      nightSummary.push(...data.nightSummary);
    }

    nightRoles.length = 0;
    if (Array.isArray(data.nightRoles)) {
      nightRoles.push(...data.nightRoles);
    } else {
      nightRoles.push("mafia");
    }

    const setupDiv = document.getElementById("setup_div");
    if (currentStage !== "SETUP" && setupDiv) {
      setupDiv.style.display = "none";
    }

  } catch (error) {
    console.error("Failed to parse saved game data:", error);
  }

  renderPlayers();
}

window.addEventListener("DOMContentLoaded", loadData);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => console.error(err));
  });
}
