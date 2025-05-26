// ========== SPIELVARIABLEN ==========
let canvas, ctx, animationId;
let bird = {}, pipes = [];
let gameActive = false, gameOverState = false, gameStarted = false;
let gravity = 0.23, jump = -4.6;
let score = 0, speed = 1.85, birdColor = "#FFD700";
let pipeGap = 205, pipeWidth = 52, pipeMin = 32, pipeMax = 410;
let speedIncrease = 0.019, minGap = 115, maxSpeed = 3.4;
let lastPipeTime = 0, pipeInterval = 1540, frameTime = 0;
let flapAnimation = 0;
let lives = 3;
let invulnerable = false;
let selectedLives = 3;
let highscore = 0;
let bgMode = 'fruehling';

const bgColors = {
    herbst: "#ffb86c",
    nacht: "#112233",
    fruehling: "#cae6fb"
};

let stars = [];
const STAR_COUNT = 38;

const livesRange = document.getElementById('livesRange');
const livesValue = document.getElementById('livesValue');
selectedLives = parseInt(livesRange.value, 10);

livesRange.addEventListener('input', function() {
    livesValue.textContent = livesRange.value;
    selectedLives = parseInt(livesRange.value, 10);
});

document.getElementById('startBtn').onclick = function() {
    birdColor = document.getElementById('birdColor').value;
    bgMode = document.getElementById('bgSelect').value;
    lives = selectedLives;
    document.getElementById('setup').style.display = 'none';
    document.getElementById('game').style.display = 'block';
    document.getElementById('restartBtn').style.display = 'none';
    startGame();
};

document.getElementById('restartBtn').onclick = function() {
    score = 0;
    lives = selectedLives;
    document.getElementById('score').textContent = score;
    startGame();
};

function firstJumpStart() {
    if (!gameStarted && !gameOverState) {
        gameStarted = true;
        frameTime = performance.now();
        requestAnimationFrame(loop);
    }
    jumpBird();
}

function jumpBird() {
    if (!gameStarted || !gameActive) return;
    bird.vy = jump;
    flapAnimation = 7;
}

const jumpBtn = document.getElementById('jumpBtn');
jumpBtn.addEventListener('touchstart', function(e) {
    e.preventDefault();
    firstJumpStart();
}, {passive: false});
jumpBtn.addEventListener('mousedown', firstJumpStart);

document.getElementById('gameCanvas').addEventListener('touchstart', function(e){
    e.preventDefault();
    firstJumpStart();
}, {passive: false});
document.getElementById('gameCanvas').addEventListener('mousedown', firstJumpStart);

document.addEventListener('keydown', e => {
    if ((e.code === "Space" || e.key === " ")) firstJumpStart();
});

function startGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    pipes = [];
    bird = { x: 70, y: canvas.height / 2 - 18, w: 34, h: 34, vy: 0 };
    gameActive = true;
    gameOverState = false;
    gameStarted = false;
    score = 0;
    speed = 1.85;
    pipeGap = 205;
    lastPipeTime = 0;
    pipeInterval = 1540;
    invulnerable = false;
    document.getElementById('score').textContent = score;
    updateLivesDisplay();
    highscore = Number(localStorage.getItem('aslis_flappy_highscore') || 0);
    updateHighscoreDisplay();

    if (bgMode === "nacht") {
        stars = [];
        const w = canvas.width;
        const h = canvas.height;
        for (let i = 0; i < STAR_COUNT; i++) {
            stars.push({
                x: Math.random() * w,
                y: Math.random() * h,
                r: Math.random() < 0.14 ? 1.7 : 1.1,
                color: Math.random() < 0.20 ? "#ffe98f" : "#fff"
            });
        }
    }
    drawIdleScreen();
}

function createPipe() {
    let minH = 28;
    let maxH = canvas.height - pipeGap - minH;
    let gapY = Math.floor(Math.random() * (maxH - minH + 1)) + minH;
    return { x: canvas.width, gapY: gapY, scored: false };
}

function update(dt) {
    if (!gameActive || !gameStarted) return;

    bird.vy += gravity;
    bird.y += bird.vy;
    if (flapAnimation > 0) flapAnimation--;

    if (performance.now() - lastPipeTime > pipeInterval) {
        pipes.push(createPipe());
        lastPipeTime = performance.now();
    }

    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= speed;
        if (!pipes[i].scored && pipes[i].x + pipeWidth < bird.x) {
            pipes[i].scored = true;
            score++;
            document.getElementById('score').textContent = score;
            if (score % 6 === 0 && speed < maxSpeed) {
                speed += speedIncrease;
                pipeGap = Math.max(pipeGap - 7, minGap);
                pipeInterval = Math.max(pipeInterval - 35, 870);
            }
        }
        if (pipes[i].x + pipeWidth < 0) {
            pipes.splice(i, 1);
        }
    }

    if (!invulnerable) {
        let hit = false;
        for (let pipe of pipes) {
            if (collides(bird, pipe.x, 0, pipeWidth, pipe.gapY)) hit = true;
            if (collides(bird, pipe.x, pipe.gapY + pipeGap, pipeWidth, canvas.height - pipe.gapY - pipeGap)) hit = true;
        }
        if (bird.y < 0 || bird.y + bird.h > canvas.height) hit = true;
        if (hit) handleHit();
    }
}

function handleHit() {
    lives--;
    updateLivesDisplay();
    if (lives <= 0) {
        endGame();
        return;
    }
    invulnerable = true;
    bird.y = canvas.height / 2 - 18;
    bird.vy = 0;
    setTimeout(() => { invulnerable = false; }, 1200);
}

function updateLivesDisplay() {
    document.getElementById('livesBox').textContent = 'Leben: ' + lives;
}

function updateHighscoreDisplay() {
    document.getElementById('highscoreBox').textContent = 'Highscore: ' + highscore;
}

function draw() {
    ctx.fillStyle = bgColors[bgMode];
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (bgMode === "nacht") drawStars(ctx);
    else drawClouds(ctx);

    for (let pipe of pipes) {
        drawPipe(ctx, pipe.x, 0, pipeWidth, pipe.gapY, "#f44", true);
        drawPipe(ctx, pipe.x, pipe.gapY + pipeGap, pipeWidth, canvas.height - pipe.gapY - pipeGap, "#f44", false);
    }

    ctx.save();
    if (invulnerable) ctx.globalAlpha = 0.42 + 0.25 * Math.sin(performance.now()/90);
    drawBird(ctx, bird.x, bird.y);
    ctx.restore();

    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    if (gameOverState) {
        ctx.fillStyle = "rgba(0,0,0,0.73)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 32px monospace";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", canvas.width / 2, 240);
        ctx.font = "20px monospace";
        ctx.fillText("Score: " + score, canvas.width / 2, 282);
        ctx.font = "15px monospace";
        ctx.fillText("Tippe 'Nochmal spielen'", canvas.width / 2, 315);
    }
}

function drawIdleScreen() {
    ctx.fillStyle = bgColors[bgMode];
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (bgMode === "nacht") drawStars(ctx);
    else drawClouds(ctx);

    drawBird(ctx, bird.x, bird.y);

    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 22px monospace";
    ctx.textAlign = "center";
    ctx.fillText("Tippe auf den Knopf", canvas.width / 2, 230);
    ctx.font = "16px monospace";
    ctx.fillText("um zu starten!", canvas.width / 2, 260);
}

function loop(ts) {
    if (!gameActive && !gameOverState) return;
    let now = performance.now();
    let dt = now - frameTime;
    frameTime = now;
    update(dt);
    draw();
    if (gameActive && gameStarted) requestAnimationFrame(loop);
}

function collides(a, x, y, w, h) {
    return a.x < x + w && a.x + a.w > x && a.y < y + h && a.y + a.h > y;
}

function endGame() {
    gameActive = false;
    gameOverState = true;
    if (score > highscore) {
        highscore = score;
        localStorage.setItem('aslis_flappy_highscore', highscore);
    }
    updateHighscoreDisplay();
    document.getElementById('restartBtn').style.display = 'block';
}

function drawPipe(ctx, x, y, w, h, color, up) {
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.rect(x, y, w, h);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#fff2";
    if (up) ctx.fillRect(x + 6, y + h - 13, w - 12, 7);
    else ctx.fillRect(x + 6, y, w - 12, 7);
    ctx.restore();
}

// ==== NEUE drawBird-Funktion ====
function drawBird(ctx, x, y) {
    let img = document.getElementById("birdImage");
    ctx.drawImage(img, x, y, 34, 34);
}

function drawClouds(ctx) {
    ctx.save();
    ctx.globalAlpha = 1;
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        let cx = 75 + i * 88;
        let cy = 56 + Math.sin(performance.now() / 1500 + i) * 8;
        ctx.arc(cx, cy, 23, 0, 2 * Math.PI);
        ctx.arc(cx + 17, cy + 8, 12, 0, 2 * Math.PI);
        ctx.arc(cx - 15, cy + 7, 10, 0, 2 * Math.PI);
        ctx.fillStyle = "#fff";
        ctx.fill();
    }
    ctx.restore();
}

function drawStars(ctx) {
    if (bgMode !== "nacht") return;
    for (let star of stars) {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, 2 * Math.PI);
        ctx.fillStyle = star.color;
        ctx.globalAlpha = 0.93 + Math.sin(performance.now()/450 + star.x + star.y) * 0.16;
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}