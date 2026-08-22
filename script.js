const players = {};

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
