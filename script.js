// JavaScript für das Stirnraten-Spiel

// Kategorien und Beispiel-Wörter
const categories = {
  Natur: ["Baum", "Blume", "Wasser", "Sonne", "Berg", "Wald", "Regen", "Tiere", "Vogel", "See"],
  Gefühle: ["Freude", "Traurigkeit", "Angst", "Liebe", "Eifersucht", "Zorn", "Ehrfurcht", "Dankbarkeit", "Hoffnung", "Stolz"],
  Berufe: ["Arzt", "Lehrer", "Ingenieur", "Koch", "Pilot", "Mechaniker", "Künstler", "Bäcker", "Friseur", "Bauer"],
  Urlaub: ["Strand", "Zelt", "Reisen", "Urlaub", "Berge", "Meer", "Rucksack", "Hotel", "Camping", "Wald"],
  Farben: ["Rot", "Blau", "Gelb", "Grün", "Orange", "Lila", "Braun", "Schwarz", "Weiß", "Rosa"],
  Objekte: ["Stuhl", "Tisch", "Auto", "Zug", "Buch", "Fenster", "Computer", "Lampe", "Gabel", "Flasche"],
  Allgemein: ["Haus", "Baum", "Katze", "Hund", "Stuhl", "Tag", "Mond", "Auto", "Buch", "Kunst"]
};

// Spielzustand
let players = [];              // Array für Spieler-Objekte {name, score}
let playerCount = 0;
let totalRounds = 0;
let currentRound = 1;
let currentPlayerIndex = 0;
let words = [];                // Liste der Wörter für die aktuelle Runde
let timerInterval;
let timeLeft = 0;

// Hilfsfunktion: Shuffled Kopie eines Arrays
function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

// Initialisierung bei Seitenaufruf
window.addEventListener('load', () => {
  updatePlayerNameFields();  // Erstellt die Eingabefelder für Spielernamen
  // Event-Listener
  document.getElementById('playerCount').addEventListener('change', updatePlayerNameFields);
  document.getElementById('time').addEventListener('input', () => {
    document.getElementById('timeDisplay').textContent = document.getElementById('time').value + " Sek.";
  });
  document.getElementById('startBtn').addEventListener('click', startGame);
  document.getElementById('nextWord').addEventListener('click', showNextWord);
  document.getElementById('correct').addEventListener('click', markCorrect);
  document.getElementById('restartBtn').addEventListener('click', () => location.reload());
});

// Aktualisiert die Eingabefelder für Spielernamen basierend auf Spieleranzahl
function updatePlayerNameFields() {
  const count = parseInt(document.getElementById('playerCount').value);
  const container = document.getElementById('playerNames');
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const label = document.createElement('label');
    label.textContent = "Name Spieler " + (i + 1) + ": ";
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'playerName' + i;
    input.placeholder = 'Name';
    input.value = 'Spieler ' + (i + 1);
    label.appendChild(input);
    container.appendChild(label);
    container.appendChild(document.createElement('br'));
  }
}

// Startet das Spiel: liest Einstellungen, initialisiert Spieler und startet die erste Runde
function startGame() {
  // Einstellungen einlesen
  playerCount = parseInt(document.getElementById('playerCount').value);
  totalRounds = parseInt(document.getElementById('rounds').value) || 1;
  const roundTime = parseInt(document.getElementById('time').value);
  const category = document.getElementById('category').value;

  // Spieler-Objekte erstellen
  players = [];
  for (let i = 0; i < playerCount; i++) {
    const name = document.getElementById('playerName' + i).value.trim() 
                 || ("Spieler " + (i + 1));
    players.push({ name: name, score: 0 });
  }

  // Wortliste kopieren und mischen
  words = shuffle(Array.from(categories[category] || []));

  // UI wechseln: Setup ausblenden, Spielbildschirm einblenden
  document.getElementById('setup').classList.add('hidden');
  document.getElementById('game').classList.remove('hidden');

  currentPlayerIndex = 0;
  currentRound = 1;
  timeLeft = roundTime;

  // Punktestand und Timer initialisieren
  updateScoreBoard();
  updateTimerDisplay();
  startTimer(roundTime);
  showNextWord();
}

// Zeigt das nächste Wort an oder beendet die Runde, wenn keine Wörter mehr übrig sind
function showNextWord() {
  if (words.length === 0) {
    endRound();
    return;
  }
  const word = words.pop();  // letztes Wort holen und entfernen
  document.getElementById('word').textContent = word;
}

// Wird aufgerufen, wenn der Spieler korrekt geantwortet hat
function markCorrect() {
  players[currentPlayerIndex].score++;
  updateScoreBoard();
  showNextWord();
}

// Aktualisiert die Anzeige für den aktuellen Punktestand
function updateScoreBoard() {
  const sb = document.getElementById('scoreBoard');
  sb.textContent = players[currentPlayerIndex].name + ": " 
                   + players[currentPlayerIndex].score + " Punkte";
}

// Startet den Countdown-Timer
function startTimer(duration) {
  clearInterval(timerInterval);
  timeLeft = duration;
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    timeLeft--;
    if (timeLeft >= 0) {
      updateTimerDisplay();
    }
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      endRound();
    }
  }, 1000);
}

// Aktualisiert die Timer-Anzeige im Format MM:SS
function updateTimerDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const mm = minutes.toString().padStart(2, '0');
  const ss = seconds.toString().padStart(2, '0');
  document.getElementById('timeLeft').textContent = mm + ":" + ss;
}

// Beendet die aktuelle Runde und startet gegegebenenfalls die nächste Runde oder das Spielende
function endRound() {
  clearInterval(timerInterval);
  // Nächster Spieler bzw. nächste Runde
  if (currentPlayerIndex < playerCount - 1) {
    currentPlayerIndex++;
  } else {
    currentPlayerIndex = 0;
    currentRound++;
  }
  if (currentRound > totalRounds) {
    // Spiel beenden und Ergebnis anzeigen
    showResults();
  } else {
    // Neue Runde vorbereiten
    const category = document.getElementById('category').value;
    words = shuffle(Array.from(categories[category] || []));
    const roundTime = parseInt(document.getElementById('time').value);
    timeLeft = roundTime;
    updateTimerDisplay();
    updateScoreBoard();
    startTimer(roundTime);
    showNextWord();
  }
}

// Zeigt den Ergebnisbildschirm mit den Endständen
function showResults() {
  document.getElementById('game').classList.add('hidden');
  const resultsSection = document.getElementById('results');
  resultsSection.classList.remove('hidden');
  // Ergebnisse auflisten
  const resultList = document.getElementById('resultList');
  resultList.innerHTML = '';
  // Nach Punkten sortieren (absteigend)
  players.sort((a, b) => b.score - a.score);
  for (const player of players) {
    const li = document.createElement('li');
    li.textContent = player.name + ": " + player.score + " Punkte";
    resultList.appendChild(li);
  }
}
