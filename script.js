const mainMenu = document.getElementById("mainMenu");
const gameArea = document.getElementById("gameArea");
const startBtn = document.getElementById("startBtn");
const playerNameInput = document.getElementById("playerName");
const themeSelect = document.getElementById("themeSelect");
const playerColorInput = document.getElementById("playerColor");
const storyBox = document.getElementById("storyBox");
const levelHeader = document.getElementById("levelHeader");
const menuBtn = document.getElementById("menuBtn");

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const undoBtn = document.getElementById("undoBtn");
const restartLevelBtn = document.getElementById("restartLevelBtn");
const levelSelectBtn = document.getElementById("levelSelectBtn");
const levelSelect = document.getElementById("levelSelect");

// Tiles: 0=leer, 1=Wand, 2=Spieler, 3=Ziel, 4=Kiste, 5=Kiste+Ziel
const levels = [
  [
    [1,1,1,1,1,1,1],
    [1,0,0,0,0,3,1],
    [1,0,4,1,0,0,1],
    [1,0,1,0,0,0,1],
    [1,0,0,0,4,0,1],
    [1,2,0,0,0,0,1],
    [1,1,1,1,1,1,1],
  ],
  [
    [1,1,1,1,1,1,1],
    [1,3,0,0,0,0,1],
    [1,0,4,1,0,0,1],
    [1,0,1,0,4,0,1],
    [1,0,0,0,1,0,1],
    [1,2,0,0,0,3,1],
    [1,1,1,1,1,1,1],
  ],
  // Weitere Level kannst du nach Belieben einbauen!
];

let gameState = {
  player: { name: "Held*in", theme: "classic", color: "#68d9ee" },
  level: 1,
  px: 1, py: 5,
  history: [],
  solved: []
};

function loadProgress() {
  try {
    let data = localStorage.getItem("pixelSokobanSave");
    if (data) {
      let obj = JSON.parse(data);
      if (obj && Array.isArray(obj.solved)) gameState.solved = obj.solved;
    }
  } catch(e){}
}
function saveProgress() {
  localStorage.setItem("pixelSokobanSave", JSON.stringify({solved: gameState.solved}));
}

function showStory(text, timeout = 0) {
  if (!storyBox) return;
  storyBox.textContent = text;
  if (timeout > 0) setTimeout(() => storyBox.textContent = "", timeout);
}

// Fortschritts-Kommentar
function showProgressStory() {
  let total = levels.length;
  let solved = (gameState.solved||[]).length;
  if (solved === 0) return;
  if (solved < total/3) showStory(`Gut gemacht! Du hast schon ${solved} von ${total} Rätseln gelöst.`);
  else if (solved < total-1) showStory(`Beeindruckend, ${gameState.player.name}! Noch ${total-solved} Level bis zum Ziel.`);
  else if (solved === total-1) showStory("Vor dir liegt das finale Abenteuer – das letzte Rätsel wartet!");
  else showStory("Du hast alle Rätsel dieser Welt gemeistert. Stolz? Das solltest du sein!");
}

// Joystick
const joystickOuter = document.getElementById("joystickOuter");
const joystickThumb = document.getElementById("joystickThumb");
let joystickActive = false;
let lastMove = 0;

function joystickStart(e) {
  joystickActive = true;
  updateJoystick(e);
  document.addEventListener("mousemove", updateJoystick);
  document.addEventListener("touchmove", updateJoystick);
  document.addEventListener("mouseup", joystickEnd);
  document.addEventListener("touchend", joystickEnd);
}
function joystickEnd() {
  joystickActive = false;
  joystickThumb.style.transform = "";
  document.removeEventListener("mousemove", updateJoystick);
  document.removeEventListener("touchmove", updateJoystick);
  document.removeEventListener("mouseup", joystickEnd);
  document.removeEventListener("touchend", joystickEnd);
}
function updateJoystick(e) {
  if (!joystickActive) return;
  let rect = joystickOuter.getBoundingClientRect();
  let cx = rect.left+rect.width/2, cy = rect.top+rect.height/2;
  let x, y;
  if (e.touches && e.touches.length) {
    x = e.touches[0].clientX; y = e.touches[0].clientY;
  } else {
    x = e.clientX; y = e.clientY;
  }
  let dx = x-cx, dy = y-cy;
  let dist = Math.sqrt(dx*dx+dy*dy);
  let max = rect.width/2-18;
  if (dist > max) { dx = dx*max/dist; dy = dy*max/dist; }
  joystickThumb.style.transform = `translate(${dx}px,${dy}px)`;
  if (dist>18) {
    let now = Date.now();
    if (now-lastMove < 140) return;
    lastMove = now;
    let angle = Math.atan2(dy, dx);
    if (angle>=-Math.PI/4 && angle<Math.PI/4) movePlayer("right");
    else if (angle>=Math.PI/4 && angle<3*Math.PI/4) movePlayer("down");
    else if (angle<=-Math.PI/4 && angle>-3*Math.PI/4) movePlayer("up");
    else movePlayer("left");
  }
}
joystickOuter.addEventListener('touchstart', joystickStart);
joystickOuter.addEventListener('mousedown', joystickStart);

startBtn.onclick = () => {
  gameState.player.name = playerNameInput.value.trim() || "Held*in";
  gameState.player.theme = themeSelect.value;
  gameState.player.color = playerColorInput.value;
  mainMenu.style.display = "none";
  gameArea.style.display = "flex";
  gameState.level = parseInt(levelSelect.value) || 1;
  loadLevel(gameState.level);
  levelHeader.textContent = `Level ${gameState.level} – ${gameState.player.name}`;
  showStory("Schiebe alle Kisten auf die Ziele. Viel Erfolg, Abenteurer!");
};

menuBtn.onclick = () => {
  gameArea.style.display = "none";
  mainMenu.style.display = "flex";
  showStory("Trage deinen Namen ein, wähle Farbe und Stil und starte das Abenteuer!");
  levelHeader.textContent = "";
  playerNameInput.value = "";
};

undoBtn.onclick = () => {
  undo();
};
restartLevelBtn.onclick = () => {
  loadLevel(gameState.level);
  showStory("Level zurückgesetzt.");
};
levelSelectBtn.onclick = () => {
  gameArea.style.display = "none";
  mainMenu.style.display = "flex";
};

let currentLevel = null;

function loadLevel(n) {
  if (!levels[n-1]) return;
  currentLevel = JSON.parse(JSON.stringify(levels[n-1]));
  gameState.history = [];
  for (let y=0; y<currentLevel.length; y++)
    for (let x=0; x<currentLevel[0].length; x++)
      if (currentLevel[y][x] === 2) { gameState.px = x; gameState.py = y; }
  drawLevel();
  // Level-Story-Text
  if (gameState.solved && gameState.solved.includes(n)) {
    showStory("Du hast dieses Level bereits geschafft!");
    setTimeout(showProgressStory, 1600);
  } else if (n === 1) {
    showStory("Dein Abenteuer beginnt! Schiebe alle Kisten auf die Ziele.");
  } else if (n === 2) {
    showStory("Du merkst, die Rätsel werden anspruchsvoller...");
  } else if (n === levels.length) {
    showStory("Vor dir liegt das letzte Rätsel. Zeig, was du kannst!");
  } else {
    showStory("Kannst du dieses Rätsel auch meistern?");
  }
}

function drawLevel() {
  const level = currentLevel;
  const tileSize = Math.floor(canvas.width / level[0].length);

  // Theme-Farben
  let wallCol = "#333", bgCol = "#23242a", goalCol = "#ffd500", boxCol = "#bc8b2c";
  if (gameState.player.theme === "forest") {
    wallCol = "#294b29"; bgCol = "#1a2e19"; goalCol = "#a1ff55"; boxCol = "#916c31";
  } else if (gameState.player.theme === "night") {
    wallCol = "#23233a"; bgCol = "#19192a"; goalCol = "#fff"; boxCol = "#e8be6c";
  }
  ctx.clearRect(0,0,canvas.width,canvas.height);
  for (let y=0; y<level.length; y++) {
    for (let x=0; x<level[0].length; x++) {
      let v = level[y][x];
      // Wand
      if (v === 1) {
        ctx.fillStyle = wallCol;
        ctx.fillRect(x*tileSize, y*tileSize, tileSize, tileSize);
      } else {
        ctx.fillStyle = bgCol;
        ctx.fillRect(x*tileSize, y*tileSize, tileSize, tileSize);
      }
      // Ziel
      if (v === 3 || v === 5) {
        ctx.beginPath();
        ctx.arc(x*tileSize+tileSize/2, y*tileSize+tileSize/2, tileSize/4, 0, 2*Math.PI);
        ctx.fillStyle = goalCol;
        ctx.fill();
      }
      // Kiste
      if (v === 4 || v === 5) {
        ctx.fillStyle = boxCol;
        ctx.fillRect(x*tileSize+tileSize*0.17, y*tileSize+tileSize*0.17, tileSize*0.66, tileSize*0.66);
        ctx.strokeStyle = "#55320b";
        ctx.lineWidth = 3;
        ctx.strokeRect(x*tileSize+tileSize*0.17, y*tileSize+tileSize*0.17, tileSize*0.66, tileSize*0.66);
      }
      // Spieler
      if (gameState.px === x && gameState.py === y) {
        ctx.beginPath();
        ctx.arc(x*tileSize+tileSize/2, y*tileSize+tileSize/2, tileSize/2.7, 0, 2*Math.PI);
        ctx.fillStyle = gameState.player.color;
        ctx.fill();
        ctx.strokeStyle = "#222";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x*tileSize+tileSize/2, y*tileSize+tileSize/2+tileSize/5, tileSize/9, 0, 2*Math.PI);
        ctx.fillStyle = "#fff";
        ctx.fill();
      }
    }
  }
}

// Undo
function undo() {
  if (gameState.history.length > 0) {
    const {level, px, py, field} = gameState.history.pop();
    currentLevel = JSON.parse(JSON.stringify(field));
    gameState.px = px; gameState.py = py;
    drawLevel();
    showStory("Rückgängig gemacht!");
  } else {
    showStory("Du kannst keinen weiteren Zug rückgängig machen.");
  }
}

function movePlayer(dir) {
  const level = currentLevel;
  let px = gameState.px, py = gameState.py;
  let dx=0, dy=0;
  if(dir==="up") dy=-1;
  if(dir==="down") dy=1;
  if(dir==="left") dx=-1;
  if(dir==="right") dx=1;
  let nx=px+dx, ny=py+dy;
  if(level[ny][nx]===1) return;
  gameState.history.push({level: gameState.level, px, py, field: JSON.parse(JSON.stringify(level))});
  if(level[ny][nx]===4||level[ny][nx]===5) {
    let nnx=nx+dx, nny=ny+dy;
    if(level[nny][nnx]!==0 && level[nny][nnx]!==3) { gameState.history.pop(); return; }
    if(level[nny][nnx]===3) level[nny][nnx]=5;
    else level[nny][nnx]=4;
    level[ny][nx]= (level[ny][nx]===5) ? 3 : 0;
  }
  if(level[py][px]===2) level[py][px]=0;
  else if(level[py][px]===3) level[py][px]=3;
  gameState.px=nx; gameState.py=ny;
  if(level[ny][nx]===3) level[ny][nx]=2;
  else level[ny][nx]=2;
  drawLevel();
  if (isSolved()) {
    if (!gameState.solved.includes(gameState.level)) {
      gameState.solved.push(gameState.level);
      saveProgress();
    }
    showStory("Level geschafft! 🎉 Bald erfährst du mehr über dein Abenteuer...");
    setTimeout(()=>{
      if (gameState.solved.length === levels.length) {
        endGame();
      } else {
        nextLevel();
      }
    }, 1400);
  }
}

function isSolved() {
  for (let y=0; y<currentLevel.length; y++)
    for (let x=0; x<currentLevel[0].length; x++)
      if (currentLevel[y][x] === 3) return false;
  return true;
}

function nextLevel() {
  if (gameState.level < levels.length) {
    gameState.level++;
    levelHeader.textContent = `Level ${gameState.level} – ${gameState.player.name}`;
    loadLevel(gameState.level);
    levelSelect.value = gameState.level;
    showProgressStory();
  } else {
    endGame();
  }
}

// Finale "Danke"-Story
function endGame() {
  showStory(`Du hast jedes Rätsel gemeistert, ${gameState.player.name}! Danke fürs Spielen. Mehr Level folgen?`);
  setTimeout(()=>{
    gameArea.style.display = "none";
    mainMenu.style.display = "flex";
    showStory("Willkommen zurück im Menü! Starte ein neues Abenteuer oder probiere eine andere Farbe.");
  }, 5000);
}

// Level-Auswahl Dropdown füllen
function fillLevelSelect() {
  if (!levelSelect) return;
  levelSelect.innerHTML = "";
  for (let i=1; i<=levels.length; i++) {
    let opt = document.createElement("option");
    opt.value = i;
    opt.textContent = i + (gameState.solved && gameState.solved.includes(i) ? " ✓" : "");
    levelSelect.appendChild(opt);
  }
  levelSelect.value = gameState.level || 1;
}
levelSelect.onchange = function() {
  gameState.level = parseInt(levelSelect.value);
  loadLevel(gameState.level);
  levelHeader.textContent = `Level ${gameState.level} – ${gameState.player.name}`;
};

window.onload = function() {
  loadProgress();
  fillLevelSelect();
  showStory("Trage deinen Namen ein, wähle Farbe und Stil und starte das Abenteuer!");
};
