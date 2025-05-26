// === SETTINGS & COLOR OPTIONS ===
const PLAYER_COLORS = [
  "#36b8ef", "#fdc221", "#ee3c56", "#60cc4e", "#fd8be1", "#9e7bfd", "#fff", "#222"
];
const BG_GRADIENTS = [
  { name: "Tag (Blau)", colors: ["#aee9f5","#e7f8fc"], sun:"#ffe278" },
  { name: "Abend (Orange)", colors: ["#fbc986","#fed7b0"], sun:"#fd8047" },
  { name: "Dämmerung (Lila)", colors: ["#cab4f7","#edb6e9"], sun:"#ffda9c" }
];

// === SETUP SCREENS ===
let playerColor = PLAYER_COLORS[0];
let bgGradient = BG_GRADIENTS[0];
let levelNum = 0;

// -- Farbwahl (Spieler) --
const playerColorsDiv = document.getElementById('playerColors');
PLAYER_COLORS.forEach((col, idx) => {
  let btn = document.createElement('button');
  btn.className = "color-btn" + (idx===0 ? " selected":"");
  btn.style.background = col;
  btn.onclick = ()=> {
    document.querySelectorAll('.color-btn').forEach(b=>b.classList.remove('selected'));
    btn.classList.add('selected');
    playerColor = col;
  };
  playerColorsDiv.appendChild(btn);
});

// -- Farbwahl (Himmel) --
const bgColorsDiv = document.getElementById('bgColors');
BG_GRADIENTS.forEach((bg, idx) => {
  let btn = document.createElement('button');
  btn.className = "bg-btn" + (idx===0 ? " selected":"");
  btn.style.background = `linear-gradient(120deg, ${bg.colors[0]} 50%, ${bg.colors[1]} 100%)`;
  btn.onclick = ()=> {
    document.querySelectorAll('.bg-btn').forEach(b=>b.classList.remove('selected'));
    btn.classList.add('selected');
    bgGradient = bg;
  };
  bgColorsDiv.appendChild(btn);
});

// -- Start zu Levelauswahl --
document.getElementById('startBtn').onclick = () => {
  document.getElementById('setupScreen').style.display = 'none';
  document.getElementById('levelScreen').style.display = '';
  showLevelSelect();
};

// == LEVELAUSWAHL ==
const LEVELS = [
  {
    platforms: [
      {x:0,y:600,w:1200,h:100,type:"ground"},
      {x:150,y:480,w:180,h:40,type:"stone"},
      {x:360,y:380,w:160,h:34,type:"stone"},
      {x:650,y:260,w:200,h:40,type:"stone"},
      {x:950,y:380,w:160,h:34,type:"stone"}
    ],
    items: [
      {x:180,y:450,type:"coin"}, {x:410,y:350,type:"jump"}, {x:680,y:230,type:"coin"}
    ],
    enemies: [
      {x:210,y:450,dir:1}, {x:970,y:350,dir:-1}
    ]
  },
  // weitere Level kannst du analog anlegen
];

function showLevelSelect() {
  const levelSel = document.getElementById('levelSelect');
  levelSel.innerHTML = '';
  LEVELS.forEach((_, idx) => {
    let btn = document.createElement('button');
    btn.className = "level-btn" + (idx === 0 ? " selected" : "");
    btn.textContent = "Level " + (idx + 1);
    btn.onclick = () => {
      document.querySelectorAll('.level-btn').forEach(b=>b.classList.remove('selected'));
      btn.classList.add('selected');
      levelNum = idx;
      setTimeout(startGame, 350);
    };
    levelSel.appendChild(btn);
  });
}

// == GAME CODE ==
let player, items, enemies, score, isGameOver, jumpBoost, speedBoost, jumpBoostTimer, speedBoostTimer, bgScroll;
let highscore = Number(localStorage.getItem('asli_highscore') || 0);

// Sprite-Sizes
let playerSize = { w: 45, h: 55 };
let enemySize = { w: 40, h: 44 };
let itemSize = { w: 28, h: 28 };
let keys = {};
let platforms;
let canvas, ctx;

function resizeCanvas() {
  canvas = document.getElementById('game');
  let ww = Math.min(window.innerWidth * 0.98, 1200);
  let wh = Math.min(window.innerHeight * 0.7, 700);
  canvas.width = ww;
  canvas.height = wh;
  // Passe Plattformen/Positionen nur an, wenn du magst
}
window.addEventListener('resize', resizeCanvas);

function startGame() {
  document.getElementById('levelScreen').style.display = 'none';
  document.getElementById('gameContainer').style.display = '';
  canvas = document.getElementById('game');
  ctx = canvas.getContext('2d');
  resizeCanvas();
  // == Level laden ==
  let level = LEVELS[levelNum];
  player = { x: 30, y: 400, vx: 0, vy: 0, onGround: false, alive: true };
  items = level.items.map(it => ({ ...it, collected: false }));
  enemies = level.enemies.map(en => ({ ...en, alive: true }));
  platforms = level.platforms.map(pf => ({ ...pf }));
  score = 0;
  isGameOver = false;
  jumpBoost = 0;
  speedBoost = 0;
  jumpBoostTimer = 0;
  speedBoostTimer = 0;
  updateScoreBox();
  requestAnimationFrame(gameLoop);
}

function updateScoreBox() {
  document.getElementById('scoreBox').innerHTML =
    `<span style="color:#ee3c56;">ASLI</span> – Punkte: <b>${score}</b> &nbsp;&nbsp; Highscore: <b>${highscore}</b>`;
}

// == GAME LOOP ==
function gameLoop() {
  if (isGameOver) return;
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

function update() {
  // Bewegung
  let moveSpeed = 9 + speedBoost;
  if (keys['left']) player.vx = -moveSpeed;
  else if (keys['right']) player.vx = moveSpeed;
  else player.vx = 0;

  if (keys['up'] && player.onGround) {
    player.vy = -18 - jumpBoost;
    player.onGround = false;
  }
  player.x += player.vx;
  player.y += player.vy;
  player.vy += 0.9; // Gravity

  // Begrenzungen
  if (player.x < 0) player.x = 0;
  if (player.x + playerSize.w > canvas.width) player.x = canvas.width - playerSize.w;
  // Plattformen prüfen
  player.onGround = false;
  for (let pf of platforms) {
    if (
      player.x + playerSize.w > pf.x && player.x < pf.x + pf.w &&
      player.y + playerSize.h > pf.y && player.y + playerSize.h < pf.y + pf.h + 18 &&
      player.vy >= 0
    ) {
      player.y = pf.y - playerSize.h;
      player.vy = 0;
      player.onGround = true;
    }
  }
  // Items
  for (let it of items) {
    if (!it.collected && rectsCollide(player, playerSize, it, itemSize)) {
      it.collected = true;
      if (it.type === 'coin') {
        score += 10;
        if (score > highscore) {
          highscore = score;
          localStorage.setItem('asli_highscore', highscore);
        }
      } else if (it.type === 'jump') {
        jumpBoost = 9; jumpBoostTimer = 150;
      }
    }
  }
  if (jumpBoostTimer > 0) { jumpBoostTimer--; if (jumpBoostTimer === 0) jumpBoost = 0; }
  // Gegner
  for (let en of enemies) {
    if (!en.alive) continue;
    en.x += en.dir * 2;
    // Plattformkante: Richtung wechseln
    let plat = platforms.find(pf =>
      en.x + enemySize.w > pf.x && en.x < pf.x + pf.w &&
      en.y + enemySize.h === pf.y + pf.h
    );
    if (!plat || en.x < plat.x || en.x + enemySize.w > plat.x + plat.w) {
      en.dir *= -1;
    }
    // Kollision mit Spieler
    if (rectsCollide(player, playerSize, en, enemySize) && player.alive && en.alive) {
      // Von oben töten, sonst Game Over
      if (player.vy > 0 && player.y + playerSize.h - en.y < 22) {
        en.alive = false;
        player.vy = -13;
        score += 25;
        if (score > highscore) {
          highscore = score;
          localStorage.setItem('asli_highscore', highscore);
        }
      } else {
        player.alive = false;
        gameOver();
      }
    }
  }
  // Sieg?
  if (items.every(it => it.collected) && enemies.every(en => !en.alive)) {
    score += 50;
    if (score > highscore) {
      highscore = score;
      localStorage.setItem('asli_highscore', highscore);
    }
    setTimeout(() => {
      isGameOver = true;
      updateScoreBox();
      alert("Level geschafft! Endpunktzahl: " + score);
    }, 100);
  }
  updateScoreBox();
}

function gameOver() {
  isGameOver = true;
  updateScoreBox();
  setTimeout(() => alert("Game Over! Punktzahl: " + score), 120);
}

// == GRAFIK ==

function draw() {
  // ... wie bisher, nur benutze überall die neuen canvas.width/canvas.height
  // Kann auf Wunsch hier nochmal gepostet werden – ist fast identisch!
  // (Achte darauf, dass alle Positions-/Größenwerte zu deinem Canvas passen)
}

// Controller Touch-Events
function setControllerEvents() {
  const map = { 'btn-left': 'left', 'btn-right': 'right', 'btn-up': 'up', 'btn-down': 'down' };
  Object.entries(map).forEach(([id, key]) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('touchstart', e => { keys[key] = true; e.preventDefault(); });
    btn.addEventListener('mousedown', e => { keys[key] = true; });
    btn.addEventListener('touchend', e => { keys[key] = false; e.preventDefault(); });
    btn.addEventListener('mouseup', e => { keys[key] = false; });
    btn.addEventListener('mouseleave', e => { keys[key] = false; });
  });
}
// Keyboard für Desktop
window.addEventListener('keydown', (e) => {
  if (e.code === "ArrowLeft") keys['left'] = true;
  if (e.code === "ArrowRight") keys['right'] = true;
  if (e.code === "ArrowUp" || e.code === "Space") keys['up'] = true;
});
window.addEventListener('keyup', (e) => {
  if (e.code === "ArrowLeft") keys['left'] = false;
  if (e.code === "ArrowRight") keys['right'] = false;
  if (e.code === "ArrowUp" || e.code === "Space") keys['up'] = false;
});

// Nach dem Laden Touch-Controller aktivieren
window.addEventListener('load', setControllerEvents);

function rectsCollide(a, aSize, b, bSize) {
  return (
    a.x < b.x + bSize.w &&
    a.x + aSize.w > b.x &&
    a.y < b.y + bSize.h &&
    a.y + aSize.h > b.y
  );
}
