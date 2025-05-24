// ------------------------------
// Globale Variablen
// ------------------------------
let players = [];          // Array der Spieler {name, score}
let currentPlayerIndex = 0; // Index des aktuellen Spielers
let totalRounds = 0;       // Runden pro Spieler
let currentRound = 1;      // Aktuelle Durchgangs-Runde (1 bis totalRounds)
let timerInterval = null;  // Interval-ID für den Spiel-Timer
let countdownInterval = null; // Interval-ID für den 3s-Countdown

// DOM-Elemente abrufen
const setupDiv = document.getElementById('setup');
const gameDiv = document.getElementById('game');
const scoreboardDiv = document.getElementById('scoreboard');
const playerNamesInput = document.getElementById('playerNames');
const roundsCountInput = document.getElementById('roundsCount');
const startGameBtn = document.getElementById('startGameBtn');
const roundInfo = document.getElementById('roundInfo');
const timerDisplay = document.getElementById('timer');
const wordDisplay = document.getElementById('word');
const scoreDisplay = document.getElementById('score');
const nextBtn = document.getElementById('nextBtn');
const correctBtn = document.getElementById('correctBtn');
const controlsDiv = document.getElementById('controls');
const timeConfigDiv = document.getElementById('timeConfig');
const timeSelect = document.getElementById('timeSelect');
const startRoundBtn = document.getElementById('startRoundBtn');
const countdownDisplay = document.getElementById('countdown');
const resultTable = document.getElementById('resultTable');

// Beispiel-Wortliste (beliebig erweiterbar)
const words = [
  "Apfel", "Banane", "Computer", "Haus", "Katze",
  "Hund", "Auto", "Baum", "Stuhl", "Tisch",
  "Blume", "Straße", "Kuh", "Sonne", "Mond",
  "Buch", "Vogel", "Tür", "Fenster", "Schule"
];

// ------------------------------
// Initialisierung nach DOM-Loaded
// ------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // Zeit-Dropdown mit Werten füllen (30s bis 300s in 15s-Schritten)
  for (let t = 30; t <= 300; t += 15) {
    const option = document.createElement('option');
    option.value = t;
    // Anzeigeformat mm:ss oder ss
    const min = Math.floor(t / 60);
    const sec = t % 60;
    option.text = min > 0 
      ? `${min}:${sec.toString().padStart(2, '0')}` 
      : `${sec}s`;
    timeSelect.add(option);
  }

  // Event-Listener für Buttons registrieren
  startGameBtn.addEventListener('click', startGame);
  startRoundBtn.addEventListener('click', startRound);
  nextBtn.addEventListener('click', nextWord);
  correctBtn.addEventListener('click', markCorrect);
});

// ------------------------------
// Spiel starten (Setup)
// ------------------------------
function startGame() {
  // Spielernamen einlesen (Komma-getrennt) und trimmen
  const names = playerNamesInput.value.split(',')
    .map(name => name.trim())
    .filter(name => name !== "");
  // Wenn keine Namen eingegeben wurden, Standardnamen vergeben
  if (names.length === 0) {
    names.push("Spieler 1");
  }
  // Anzahl Runden pro Spieler einlesen (mindestens 1)
  const rounds = parseInt(roundsCountInput.value);
  totalRounds = isNaN(rounds) || rounds < 1 ? 1 : rounds;

  // Spieler-Array initialisieren (mit 0 Punkten)
  players = names.map(name => ({ name: name, score: 0 }));

  // Setup-UI verstecken, Spiel-UI anzeigen
  setupDiv.classList.add('hidden');
  gameDiv.classList.remove('hidden');

  // Erste Runde vorbereiten
  currentPlayerIndex = 0;
  currentRound = 1;
  nextTurn();
}

// ------------------------------
// Vorbereiten der nächsten Runde
// ------------------------------
function nextTurn() {
  // Prüfen, ob weitere Runden ausstehen
  if (currentRound <= totalRounds) {
    // Aktueller Spieler ermitteln
    const player = players[currentPlayerIndex];
    // Info anzeigen: Runde X/Y und Spielername
    roundInfo.textContent = `Runde ${currentRound}/${totalRounds} – ${player.name} ist dran`;
    // Score-Anzeige für aktuellen Spieler aktualisieren
    scoreDisplay.textContent = `Punkte: ${player.score}`;
    // Wort und Buttons ausblenden bis Start der Runde
    wordDisplay.textContent = "";
    wordDisplay.classList.add('hidden');
    controlsDiv.classList.add('hidden');
    // Zeit-Konfigurationsbereich einblenden
    timeConfigDiv.classList.remove('hidden');
    countdownDisplay.classList.add('hidden');
  } else {
    // Alle Runden gespielt – Spiel beenden
    endGame();
  }
}

// ------------------------------
// Runde starten (nach Klick auf "Runde starten")
// ------------------------------
function startRound() {
  // Ausgewählte Zeit aus dem Dropdown (Sekunden)
  const duration = parseInt(timeSelect.value);
  // Countdown vorbereiten
  let count = 3;
  countdownDisplay.textContent = count;
  countdownDisplay.classList.remove('hidden');
  timeConfigDiv.classList.add('hidden'); // Auswahl ausblenden während Countdown

  // 3-Sekunden-Countdown
  countdownInterval = setInterval(() => {
    count--;
    if (count > 0) {
      countdownDisplay.textContent = count;
    } else {
      clearInterval(countdownInterval);
      countdownDisplay.classList.add('hidden');
      // Runde beginnt: Wort und Buttons einblenden
      wordDisplay.classList.remove('hidden');
      controlsDiv.classList.remove('hidden');
      // Ersten Timer-Wert anzeigen
      updateTimerDisplay(duration);
      // Zufälliges erstes Wort anzeigen
      nextWord();
      // Timer starten
      startTimer(duration);
    }
  }, 1000);
}

// ------------------------------
// Timer starten für die Runde
// ------------------------------
function startTimer(seconds) {
  let timeLeft = seconds;
  // Jede Sekunde den Timer aktualisieren
  timerInterval = setInterval(() => {
    timeLeft--;
    if (timeLeft >= 0) {
      updateTimerDisplay(timeLeft);
    }
    // Zeit abgelaufen
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      // Wechsel zum nächsten Spieler
      switchPlayer();
    }
  }, 1000);
}

// Timer-Anzeige (Format m:ss)
function updateTimerDisplay(time) {
  const min = Math.floor(time / 60);
  const sec = time % 60;
  timerDisplay.textContent = `Zeit: ${min}:${sec.toString().padStart(2, '0')}`;
}

// ------------------------------
// Wörter verwalten
// ------------------------------
// Zeigt das nächste Wort an (zufällig aus dem Array)
function nextWord() {
  const index = Math.floor(Math.random() * words.length);
  wordDisplay.textContent = words[index];
}

// ------------------------------
// Button-Handler
// ------------------------------
function markCorrect() {
  // Punkt für aktuellen Spieler
  players[currentPlayerIndex].score++;
  scoreDisplay.textContent = `Punkte: ${players[currentPlayerIndex].score}`;
  // Nächstes Wort zeigen
  nextWord();
}

// "Weiter": Nächste Wort ohne Punkt
// (Macht dasselbe wie nextWord())
nextBtn.addEventListener('click', nextWord);

// ------------------------------
// Spielerwechsel nach Ablauf der Zeit
// ------------------------------
function switchPlayer() {
  // Aktuelle Runde und Spieler erhöhen
  currentPlayerIndex++;
  // Wenn alle Spieler einmal dran waren, zur nächsten Rundendurchgang wechseln
  if (currentPlayerIndex >= players.length) {
    currentPlayerIndex = 0;
    currentRound++;
  }
  // Nächste Runde oder Spielende
  nextTurn();
}

// ------------------------------
// Spiel beenden und Scoreboard anzeigen
// ------------------------------
function endGame() {
  // Spiel-UI verstecken
  gameDiv.classList.add('hidden');
  // Scoreboard berechnen
  // Sortiere Spieler nach absteigender Punktzahl
  const ranking = [...players].sort((a, b) => b.score - a.score);
  // Tabelle leeren und neue Kopfzeile anlegen
  resultTable.innerHTML = `
    <tr><th>Platz</th><th>Spieler</th><th>Punkte</th></tr>
  `;
  // Zeilen für Rangliste hinzufügen
  ranking.forEach((player, index) => {
    const row = resultTable.insertRow();
    row.insertCell().textContent = (index + 1) + ".";
    row.insertCell().textContent = player.name;
    row.insertCell().textContent = player.score;
  });
  // Scoreboard anzeigen
  scoreboardDiv.classList.remove('hidden');
}

