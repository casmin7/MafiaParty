const players = {};


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
  // Logging
  for (const name in players) {
    console.log(name, players[name].role);
  }
}
