// == SETTINGS & COLOR OPTIONS ==
const PLAYER_COLORS = [
  "#36b8ef", "#fdc221", "#ee3c56", "#60cc4e", "#fd8be1", "#9e7bfd", "#fff", "#222"
];
const BG_GRADIENTS = [
  { name: "Tag (Blau)", colors: ["#aee9f5","#e7f8fc"], sun:"#ffe278" },
  { name: "Abend (Orange)", colors: ["#fbc986","#fed7b0"], sun:"#fd8047" },
  { name: "Dämmerung (Lila)", colors: ["#cab4f7","#edb6e9"], sun:"#ffda9c" }
];

// == SETUP SCREENS ==
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
      {x:0,y:360,w:700,h:40,type:"ground"},
      {x:100,y:300,w:120,h:22,type:"stone"},
      {x:260,y:230,w:100,h:20,type:"stone"},
      {x:420,y:180,w:130,h:22,type:"stone"},
      {x:570,y:260,w:80,h:20,type:"stone"}
    ],
    items: [
      {x:120,y:270,type:"coin"}, {x:285,y:200,type:"jump"}, {x:500,y:150,type:"coin"}
    ],
    enemies: [
      {x:165,y:270,dir:1}, {x:590,y:230,dir:-1}
    ]
  },
  {
    platforms: [
      {x:0,y:360,w:700,h:40,type:"ground"},
      {x:60,y:320,w:90,h:20,type:"stone"},
      {x:220,y:250,w:80,h:18,type:"stone"},
      {x:330,y:200,w:120,h:22,type:"stone"},
      {x:490,y:150,w:140,h:18,type:"stone"}
    ],
    items: [
      {x:85,y:290,type:"jump"}, {x:250,y:220,type:"coin"}, {x:360,y:170,type:"speed"}
    ],
    enemies: [
      {x:120,y:290,dir:1}, {x:350,y:170,dir:-1}, {x:550,y:120,dir:1}
    ]
  },
  {
    platforms: [
      {x:0,y:360,w:700,h:40,type:"ground"},
      {x:70,y:300,w:90,h:20,type:"stone"},
      {x:230,y:230,w:80,h:18,type:"stone"},
      {x:340,y:180,w:120,h:22,type:"stone"},
      {x:520,y:110,w:90,h:16,type:"stone"}
    ],
    items: [
      {x:95,y:270,type:"coin"}, {x:250,y:200,type:"jump"}, {x:410,y:150,type:"coin"}, {x:550,y:80,type:"speed"}
    ],
    enemies: [
      {x:130,y:270,dir:1}, {x:380,y:170,dir:-1}, {x:570,y:80,dir:1}
    ]
  }
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
const playerSize = { w: 32, h: 38 };
const enemySize = { w: 30, h: 32 };
const itemSize = { w: 20, h: 20 };
let keys = {};

function startGame() {
  document.getElementById('levelScreen').style.display = 'none';
  document.getElementById('gameContainer').style.display = '';
  bgScroll = 0;
  // == Level laden ==
  let level = LEVELS[levelNum];
  player = { x: 30, y: 290, vx: 0, vy: 0, onGround: false, alive: true };
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
  let moveSpeed = 5 + speedBoost;
  if (keys['ArrowLeft']) player.vx = -moveSpeed;
  else if (keys['ArrowRight']) player.vx = moveSpeed;
  else player.vx = 0;

  if ((keys['Space'] || keys['ArrowUp']) && player.onGround) {
    player.vy = -13 - jumpBoost;
    player.onGround = false;
  }
  player.x += player.vx;
  player.y += player.vy;
  player.vy += 0.7; // Gravity

  // Begrenzungen
  if (player.x < 0) player.x = 0;
  if (player.x + playerSize.w > 700) player.x = 700 - playerSize.w;
  // Plattformen prüfen
  player.onGround = false;
  for (let pf of platforms) {
    if (
      player.x + playerSize.w > pf.x && player.x < pf.x + pf.w &&
      player.y + playerSize.h > pf.y && player.y + playerSize.h < pf.y + pf.h + 13 &&
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
        jumpBoost = 8; jumpBoostTimer = 170;
      } else if (it.type === 'speed') {
        speedBoost = 3; speedBoostTimer = 170;
      }
    }
  }
  if (jumpBoostTimer > 0) { jumpBoostTimer--; if (jumpBoostTimer === 0) jumpBoost = 0; }
  if (speedBoostTimer > 0) { speedBoostTimer--; if (speedBoostTimer === 0) speedBoost = 0; }
  // Gegner
  for (let en of enemies) {
    if (!en.alive) continue;
    en.x += en.dir * 1.1;
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
      if (player.vy > 0 && player.y + playerSize.h - en.y < 18) {
        en.alive = false;
        player.vy = -8;
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
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 700, 400);

  // --- Hintergrund ---
  // Himmel
  let grad = ctx.createLinearGradient(0, 0, 0, 400);
  grad.addColorStop(0, bgGradient.colors[0]);
  grad.addColorStop(1, bgGradient.colors[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 700, 400);
  // Sonne
  ctx.beginPath();
  ctx.arc(570, 60, 40, 0, Math.PI * 2);
  ctx.fillStyle = bgGradient.sun;
  ctx.globalAlpha = 0.8;
  ctx.fill();
  ctx.globalAlpha = 1.0;
  // Wolken
  drawCloud(ctx, 110, 65, 45, 15);
  drawCloud(ctx, 260, 40, 35, 12);
  drawCloud(ctx, 360, 100, 28, 11);
  drawCloud(ctx, 600, 80, 36, 12);
  // Bäume/Büsche
  drawTree(ctx, 70, 320, 28, 60, "#84c649");
  drawTree(ctx, 620, 290, 32, 74, "#60b96b");
  drawBush(ctx, 200, 355, 55, "#60b96b");
  drawBush(ctx, 500, 365, 40, "#84c649");

  // --- Plattformen ---
  platforms.forEach(pf => {
    if (pf.type === "ground") {
      // Erdboden
      ctx.fillStyle = "#8c6d47";
      ctx.fillRect(pf.x, pf.y, pf.w, pf.h);
      // Pixel-Gras obendrauf
      ctx.fillStyle = "#68c038";
      for(let i=0; i<pf.w; i+=8) {
        ctx.fillRect(pf.x+i, pf.y-7+Math.random()*4, 7, 8);
      }
    } else {
      // Felsen
      ctx.fillStyle = "#b6b6b6";
      ctx.fillRect(pf.x, pf.y, pf.w, pf.h);
      ctx.strokeStyle = "#666";
      ctx.strokeRect(pf.x, pf.y, pf.w, pf.h);
      // Moos drauf
      ctx.fillStyle = "#68c038";
      for(let i=0; i<pf.w-6; i+=16) {
        ctx.fillRect(pf.x+i, pf.y-7+Math.random()*2, 12, 6);
      }
    }
  });

  // --- Items ---
  for (let it of items) {
    if (it.collected) continue;
    if (it.type === 'coin') {
      // Münze
      ctx.fillStyle = "#ffe065";
      ctx.beginPath();
      ctx.arc(it.x + 10, it.y + 10, 10, 0, Math.PI * 2); // Coin
      ctx.fill();
      ctx.strokeStyle = "#e6b900";
      ctx.stroke();
    } else if (it.type === 'jump') {
      // Feder (blau)
      ctx.save();
      ctx.translate(it.x+10,it.y+12);
      ctx.rotate(-0.6);
      ctx.fillStyle="#82e3ed";
      ctx.beginPath();
      ctx.ellipse(0,0,4,14,0,0,Math.PI*2);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle="#1a6d7d";
      ctx.fillRect(it.x+7, it.y+17,6,6);
    } else if (it.type === 'speed') {
      // Blitz (pink)
      ctx.fillStyle = "#ea68b1";
      ctx.beginPath();
      ctx.moveTo(it.x+10,it.y+3);
      ctx.lineTo(it.x+13,it.y+12);
      ctx.lineTo(it.x+9,it.y+12);
      ctx.lineTo(it.x+14,it.y+19);
      ctx.lineTo(it.x+8,it.y+14);
      ctx.lineTo(it.x+11,it.y+8);
      ctx.closePath();
      ctx.fill();
    }
  }

  // --- Gegner ---
  for (let en of enemies) {
    if (!en.alive) continue;
    // Käfer (Bodentier)
    ctx.fillStyle = "#884434";
    ctx.beginPath();
    ctx.ellipse(en.x+15, en.y+16, 14, 12, 0, 0, Math.PI*2);
    ctx.fill();
    // Beine
    ctx.strokeStyle="#332222";
    for(let b=0;b<3;b++){
      ctx.beginPath();
      ctx.moveTo(en.x+5+b*10, en.y+28);
      ctx.lineTo(en.x+2+b*12, en.y+32);
      ctx.stroke();
    }
    // Kopf
    ctx.beginPath();
    ctx.arc(en.x+15, en.y+7, 7, 0, Math.PI*2);
    ctx.fillStyle="#a86959";
    ctx.fill();
    // Augen
    ctx.fillStyle="#fff";
    ctx.beginPath();
    ctx.arc(en.x+12, en.y+7, 2, 0, Math.PI*2);
    ctx.arc(en.x+18, en.y+7, 2, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle="#111";
    ctx.beginPath();
    ctx.arc(en.x+13, en.y+8, 1, 0, Math.PI*2);
    ctx.arc(en.x+17, en.y+8, 1, 0, Math.PI*2);
    ctx.fill();
  }

  // --- Spieler: ASLI ---
  // Körper
  ctx.fillStyle = playerColor;
  ctx.fillRect(player.x, player.y, playerSize.w, playerSize.h);
  // Kopf
  ctx.beginPath();
  ctx.arc(player.x+16, player.y+10, 13, Math.PI, 2*Math.PI, false);
  ctx.fillStyle = playerColor;
  ctx.fill();
  ctx.strokeStyle = "#444";
  ctx.stroke();
  // Gesicht
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(player.x+10, player.y+9, 2, 0, Math.PI*2);
  ctx.arc(player.x+22, player.y+9, 2, 0, Math.PI*2);
  ctx.fill();
  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.arc(player.x+10, player.y+9, 1, 0, Math.PI*2);
  ctx.arc(player.x+22, player.y+9, 1, 0, Math.PI*2);
  ctx.fill();
  // Smile
  ctx.strokeStyle = "#fff";
 
