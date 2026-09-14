# Mafia Party: A helping hand for mafia games

![badge](https://hackatime.hackclub.com/api/v1/badge/U0ADP8GUBGR/casmin7/MafiaParty)
![Website](https://img.shields.io/website?url=https%3A%2F%2Fmafia.casmin.eu)



## What it is:
A small site/app (PWA) that facilitates when playing big games of the party game Mafia (Werewolf). 

Say you have 8 players, 2 killers, 1 medic, 1 detective, remembering what each did at night is quite easy for a storyteller who is experienced. But say that others join too since it seems fun. Great! Now you have 16 players... what now? 


That's why I made this! It has been battled tested up to 28 players and the way it was coded theoretically allows for any combo of players and roles. 

Do you want 30 players, 10 doctors and one killer? Sure

Do you want 120 players, 15 of each role, 10 kills per round and multiple eliminations at day? Sure 

Do whatever you want, _do whatever your players need!_

## What it isn’t:
It isn't a full game. It's merely a tool to be used by a moderator instead of a piece of paper or remembering each action at night.
You still need people to play with, a space to play and a deck of cards to give out roles

---

### Gameplay Management

- Dynamic Role Support: Works with any player count or role combo without pre-configuration.

- Built-in Role Library: Out-of-the-box support for Detective, Doctor/Medic, Cupid, Escort, Mutilator, and traditional Mafia/Villagers.

- State Tracking: Tracks live player counts, day/night cycles, contextual actions, and win conditions automatically.

### User Experience & Privacy

- Peeking Prevention: Draggable role cards reveal secret info only while active, preventing nearby players from seeing the moderator's screen.

- Dynamic Players: Cards can be reordered when in the setup phase to prepare for a new game if players move around the room

- Adaptive Navigation: Contextual nav bar updates available actions based on the current phase of the game.

### Technical Performance

- Offline PWA Support: Service worker caching allows full offline usability in low-reception game areas.

- Persistent Game State: Automatically saves all game data locally so no progress is lost on page refreshes.

# Try it now at: [mafia.casmin.eu](mafia.casmin.eu)
