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

// Drag and Drop Tracking
let draggedItemKey = null;

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

function attachSwipeToReveal(card, name, badge) {
  let startX = 0;
  let currentX = 0;
  let isDragging = false;
  let hasMoved = false;

  const onStart = (clientX) => {
    startX = clientX;
    currentX = clientX;
    isDragging = true;
    hasMoved = false;
    card.dataset.swiping = "false";
    card.style.transition = "none";
  };

  const onMove = (clientX) => {
    if (!isDragging) return;
    currentX = clientX;
    const diffX = currentX - startX;

    if (Math.abs(diffX) > 5) {
      hasMoved = true;
      card.dataset.swiping = "true";
      badge.style.opacity = "1";
      if (card.parentElement) {
        card.parentElement.style.backgroundColor = "var(--card-active)";
      }
    }

    // Limit drag movement to the right
    if (diffX > 0 && diffX < 120) {
      card.style.transform = `translateX(${diffX}px)`;
    }
  };

  const onEnd = () => {
    if (!isDragging) return;
    isDragging = false;
    card.style.transition = "transform 0.2s ease-out";

    // ALWAYS reset back to closed state upon thumb/mouse release
    card.style.transform = `translateX(0px)`;
    card.classList.remove("revealed");
    badge.style.opacity = "0";
    if (card.parentElement) {
      card.parentElement.style.backgroundColor = "transparent";
    }

    if (hasMoved) {
      setTimeout(() => {
        card.dataset.swiping = "false";
      }, 100);
    } else {
      card.dataset.swiping = "false";
    }
  };

  // Touch events
  card.addEventListener("touchstart", (e) => onStart(e.touches[0].clientX), { passive: true });
  card.addEventListener("touchmove", (e) => onMove(e.touches[0].clientX), { passive: true });
  card.addEventListener("touchend", onEnd);

  // Mouse events
  const onMouseDown = (e) => {
    onStart(e.clientX);
    const onMouseMove = (e) => onMove(e.clientX);
    const onMouseUp = () => {
      onEnd();
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  card.addEventListener("mousedown", onMouseDown);
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
        ? `Tap player to assign ${activeRole} role (Swipe right to check role)`
        : `Tap player to select ${activeRole}'s target (Swipe right to check role)`;
    } else if (currentStage === "DAY") {
      stageTitle.textContent = "DAY PHASE";
      roleSubTitle.textContent = "Tap to eliminate | Swipe right to check role";
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

    const pencilIcon = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;
    const checkIcon = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

    if (editStatusText) {
      editStatusText.innerHTML = editing
        ? `${checkIcon} Done Editing`
        : `${pencilIcon} Edit Roles`;
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
    li.className = "player-card-container";
    li.style.backgroundColor = "transparent"; // Hide the shadow card by default
        li.style.transition = "background-color 0.15s ease"; // Smooth fade-in

    // Underlying role reveal badge
    const roleBadge = document.createElement("div");
        roleBadge.className = "role-reveal-badge";
        roleBadge.textContent = players[name].role;
        roleBadge.style.opacity = "0"; // Hidden by default
        roleBadge.style.transition = "opacity 0.15s ease"; // Smooth fade-in

        // Interactive card surface
        const card = document.createElement("div");
        card.className = "player-card";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Player ${name}, Role: ${players[name].role}`);

    const normalizedRole = players[name].role.toLowerCase().trim();
    card.dataset.role = normalizedRole;

    const assignedRole = players[name].role;
    const activeRole = nightRoles[currentRoleIndex];

    if (currentStage === "NIGHT" && assignedRole === activeRole) {
      card.classList.add("selected");
    } else {
      card.classList.remove("selected");
    }

    if (!editing && currentStage === "NIGHT" && players[name].affectedBy.includes(activeRole)) {
      card.classList.add("targeted");
    } else {
      card.classList.remove("targeted");
    }

    if (currentStage === "SETUP") {
      card.setAttribute("draggable", "true");

      card.addEventListener("dragstart", (e) => {
        draggedItemKey = name;
        e.dataTransfer.effectAllowed = "move";
        card.classList.add("dragging");
      });

      card.addEventListener("dragend", () => {
        draggedItemKey = null;
        card.classList.remove("dragging");
      });

      card.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      });

      card.addEventListener("drop", (e) => {
        e.preventDefault();
        if (!draggedItemKey || draggedItemKey === name) return;
        reorderPlayers(draggedItemKey, name);
      });
    } else {
      card.setAttribute("draggable", "false");
    }

    const nameSpan = document.createElement("h1");
    nameSpan.textContent = name;
    card.appendChild(nameSpan);

    // Phase-specific elements & attachments
    if (currentStage === "SETUP") {
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "✕";
      deleteBtn.className = "delete-btn";
      deleteBtn.setAttribute("aria-label", `Delete ${name}`);
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        deletePlayer(name);
      };
      card.appendChild(deleteBtn);
    } else {
      // Attach swipe gesture during gameplay phases
      attachSwipeToReveal(card, name, roleBadge);
    }

    // ALWAYS append elements to the DOM regardless of stage
    li.appendChild(roleBadge);
    li.appendChild(card);

    // Click & Keyboard interactions
    card.addEventListener("click", () => {
      if (card.dataset.swiping === "true") return;
      handleCardClick(name);
    });

    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleCardClick(name);
      }
    });

    playerList.appendChild(li);
  }
}

function reorderPlayers(draggedKey, targetKey) {
  saveHistoryState();

  const entries = Object.entries(players);
  const draggedIndex = entries.findIndex(([key]) => key === draggedKey);
  const targetIndex = entries.findIndex(([key]) => key === targetKey);

  const [removed] = entries.splice(draggedIndex, 1);
  entries.splice(targetIndex, 0, removed);

  for (const key in players) {
    delete players[key];
  }

  entries.forEach(([key, val]) => {
    players[key] = val;
  });

  renderPlayers();
  saveData();
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
        if(document.getElementById("resetWinCheckbox")?.checked)resetGame();
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
    const isRoleAlive = Object.values(players).some(
      (p) => p.role === activeRole
    );

    if (!isRoleAlive) {
      alert(`There is no living ${activeRole.toUpperCase()} to select a target!`);
      return;
    }

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
      const targetRole = players[name].role;
      nightSummary.push(`${targetRole} spent a night with the escort`);
      blockedRole.push(players[name].role);

      const escortDiesSetting = document.getElementById("escortDiesCheckbox")?.checked ?? true;

      if (targetRole === "mafia" && escortDiesSetting) {
        const escortPlayerName = Object.keys(players).find(p => players[p].role === "escort");

        if (escortPlayerName) {
          players[escortPlayerName].role = "eliminated";
          nightSummary.push(`The escort (${escortPlayerName}) died after visiting the killer!`);
        }
      }
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

  const autoSkip = document.getElementById("autoAdvanceCheckbox")?.checked ?? true;

  if (autoSkip) {
    const activeRole = nightRoles[currentRoleIndex];
    const isRoleAlive = Object.values(players).some(p => p.role === activeRole);

    if (!isRoleAlive && rolesAssigned) {
      currentRoleIndex++;
      advanceNightRole();
    }
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
  const checkboxIds = [
    "detectiveCheckbox",
    "doctorCheckbox",
    "escortCheckbox",
    "cupidCheckbox",
    "mutilatorCheckbox",
    "escortDiesCheckbox",
    "autoAdvanceCheckbox",
    "resetWinCheckbox"
  ];
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
