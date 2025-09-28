// script.js - CELÝ SOUBOR (Finalizováno: Opravená vazba ID tlačítka přes delegování)

// Globální stav hry
let players = [];
let gameStarted = false;
let gameValue = 0; 
let currentPlayerIndex = 0; 
let currentThrowIndex = 0; 
let currentMultiplier = 1;

let history = []; 
const PLAYERS_STORAGE_KEY = 'darts_scorer_players';
const HISTORY_STORAGE_KEY = 'darts_scorer_history';
const SAVED_GAME_KEY = 'darts_scorer_saved_game'; 


// --- INICIALIZACE A VAZBA UDÁLOSTÍ ---

document.addEventListener('DOMContentLoaded', () => {
    loadPlayers();
    
    const setupSection = document.getElementById('setup-section');
    
    // Tlačítko pro Ukončení Hry
    const endGameBtn = document.createElement('button');
    endGameBtn.innerText = 'Ukončit hru';
    endGameBtn.id = 'end-game-btn'; 
    endGameBtn.style.backgroundColor = '#9b59b6';
    endGameBtn.style.display = 'none'; // Skryté na začátku
    setupSection.appendChild(endGameBtn);
    
    // Původní tlačítko Export
    const exportBtn = document.createElement('button');
    exportBtn.innerText = 'Exportovat JSON Historii';
    exportBtn.onclick = exportHistoryToJSON;
    setupSection.appendChild(exportBtn);

    renderScoreButtons();
    renderPlayers(); 
    updateInputDisplay(); 
    checkSavedGame(); 
});


// --- DELEGOVÁNÍ UDÁLOSTI KLIKNUTÍ NA TĚLO STRÁNKY ---
// Toto zajistí, že kliknutí je vždy správně navázáno, i když se DOM mění.
document.body.addEventListener('click', (event) => {
    // Kontrola, zda kliknutý prvek má ID 'end-game-btn'
    if (event.target.id === 'end-game-btn') {
        promptEndGame();
    }
});


// --- TRVALÉ UKLÁDÁNÍ A NAČÍTÁNÍ (Beze změny) ---

function savePlayers() {
    const playerNames = players.map(p => ({ name: p.name }));
    localStorage.setItem(PLAYERS_STORAGE_KEY, JSON.stringify(playerNames));
}

function loadPlayers() {
    const storedPlayers = localStorage.getItem(PLAYERS_STORAGE_KEY);
    if (storedPlayers) {
        players = JSON.parse(storedPlayers).map(p => ({
            name: p.name,
            score: 0,
            throws: [], 
            currentRoundThrows: [0, 0, 0],
            stats: { doubles: 0, triples: 0 } 
        }));
    }
}

function saveGameHistory(newEntry) {
    const allHistory = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || '[]');
    allHistory.push(newEntry);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(allHistory));
    console.log("Hra úspěšně uložena do localStorage."); 
}

function saveCurrentGame() {
    const gameState = {
        players: players,
        gameValue: gameValue,
        currentPlayerIndex: currentPlayerIndex,
        currentThrowIndex: currentThrowIndex,
        currentMultiplier: currentMultiplier,
        gameStarted: gameStarted,
        date: new Date().toISOString()
    };
    localStorage.setItem(SAVED_GAME_KEY, JSON.stringify(gameState));
}

function checkSavedGame() {
    const savedGame = localStorage.getItem(SAVED_GAME_KEY);
    const loadBtn = document.getElementById('load-game-btn'); 

    if (loadBtn) {
        loadBtn.style.display = (savedGame && !gameStarted) ? 'inline-block' : 'none';
    }
}

function loadSavedGame(gameState) {
    players = gameState.players;
    gameValue = gameState.gameValue;
    currentPlayerIndex = gameState.currentPlayerIndex;
    currentThrowIndex = gameState.currentThrowIndex;
    currentMultiplier = gameState.currentMultiplier;
    gameStarted = true; 
    
    renderPlayers();
    updateInputDisplay();
    
    const endGameBtn = document.getElementById('end-game-btn');
    if (endGameBtn) endGameBtn.style.display = 'inline-block';

    document.querySelectorAll('#setup-section button:not([onclick="exportHistoryToJSON()"])').forEach(btn => btn.disabled = true);
    const historyButton = document.querySelector('a[href="history.html"] button');
    if (historyButton) historyButton.disabled = true;

    alert(`Rozehraná hra (${gameValue}x01) byla úspěšně načtena!`);
    localStorage.removeItem(SAVED_GAME_KEY); 
    checkSavedGame();
}


// --- FUNKCE PRO ZAMÍCHÁNÍ POŘADÍ HRÁČŮ ---

function shufflePlayers() {
    let currentIndex = players.length;
    let randomIndex;

    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        [players[currentIndex], players[randomIndex]] = [
            players[randomIndex], players[currentIndex]
        ];
    }
}


// --- FUNKCE PRO NASTAVENÍ HRY A HRÁČE ---

function addPlayer() {
    if (gameStarted) return;
    const name = prompt("Zadejte jméno hráče:");
    
    if (name && players.length < 8 && !players.some(p => p.name.toLowerCase() === name.toLowerCase())) { 
        players.push({
            name: name,
            score: 0,
            throws: [], 
            currentRoundThrows: [0, 0, 0],
            stats: { doubles: 0, triples: 0 } 
        });
        savePlayers(); 
        renderPlayers();
    } else if (name) {
        alert("Hráč se stejným jménem už existuje nebo byl dosažen limit (8 hráčů).");
    }
}

function removePlayer(name) {
    if (gameStarted) return;
    if (confirm(`Opravdu chcete odebrat hráče ${name}?`)) {
        players = players.filter(p => p.name !== name);
        savePlayers();
        renderPlayers();
    }
}

function startGame(value) {
    if (players.length === 0) {
        alert("Nejprve přidejte alespoň jednoho hráče!");
        return;
    }
    
    if (players.length > 1) {
        const confirmShuffle = confirm("Chcete náhodně zamíchat pořadí hráčů?");
        if (confirmShuffle) {
            shufflePlayers();
        }
    }

    gameValue = value;
    gameStarted = true;
    
    players = players.map(p => ({
        name: p.name,
        score: gameValue,
        throws: [], 
        currentRoundThrows: [0, 0, 0],
        stats: p.stats || { doubles: 0, triples: 0 }
    }));
    
    currentPlayerIndex = 0;
    currentThrowIndex = 0;
    currentMultiplier = 1;
    history = []; 
    
    saveState(); 
    renderPlayers();
    updateInputDisplay();
    
    document.querySelectorAll('#setup-section button:not([onclick="exportHistoryToJSON()"])').forEach(btn => btn.disabled = true);
    const historyButton = document.querySelector('a[href="history.html"] button');
    if (historyButton) historyButton.disabled = true;
    
    const endGameBtn = document.getElementById('end-game-btn');
    if (endGameBtn) endGameBtn.style.display = 'inline-block'; // Zobrazení tlačítka
    checkSavedGame(); 
}

function promptEndGame() {
    if (!gameStarted) return;

    const action = confirm(
        "Chcete hru uložit a ukončit, nebo ukončit bez uložení rozehraného stavu?\n\n" +
        "Stiskněte OK pro ULOŽIT A UKONČIT.\n" +
        "Stiskněte Storno pro UKONČIT BEZ ULOŽENÍ."
    );

    if (action) {
        // ULOŽIT A UKONČIT
        saveCurrentGame();
        alert("Hra byla uložena! Můžete ji načíst při příštím spuštění.");
    } else {
        // POUZE UKONČIT (Bez uložení rozehraného stavu do SAVED_GAME_KEY)
        localStorage.removeItem(SAVED_GAME_KEY);
    }
    
    // Reset stavu
    gameStarted = false;
    gameValue = 0;
    currentThrowIndex = 0;
    currentMultiplier = 1;

    // Zobrazení setup tlačítek a skrytí Ukončit hru
    document.querySelectorAll('#setup-section button').forEach(btn => btn.disabled = false);
    const historyButton = document.querySelector('a[href="history.html"] button');
    if (historyButton) historyButton.disabled = false;
    
    const endGameBtn = document.getElementById('end-game-btn');
    if (endGameBtn) endGameBtn.style.display = 'none';
    
    renderPlayers();
    updateInputDisplay();
    checkSavedGame(); 
}


// --- FUNKCE PRO ZOBRAZENÍ (RENDER) ---

function renderPlayers() {
    const list = document.getElementById('players-list');
    list.innerHTML = '';
    
    const savedGame = localStorage.getItem(SAVED_GAME_KEY);
    if (!gameStarted) {
        const loadBtn = document.createElement('button');
        loadBtn.innerText = 'Načíst uloženou hru';
        loadBtn.id = 'load-game-btn';
        loadBtn.style.backgroundColor = '#9b59b6';
        loadBtn.style.marginRight = '10px';
        loadBtn.onclick = () => loadSavedGame(JSON.parse(savedGame));
        list.appendChild(loadBtn);
    }
    
    players.forEach((player, index) => {
        const isWinner = player.score === 0;
        const isCurrent = index === currentPlayerIndex && gameStarted && !isWinner;
        
        const currentRoundSum = player.currentRoundThrows.reduce((a, b) => a + b, 0); 
        
        const playerDiv = document.createElement('div');
        playerDiv.className = isCurrent ? 'player-card active' : (isWinner ? 'player-card winner' : 'player-card');
        
        const scoreDisplay = isWinner ? "VYHRÁL!" : player.score;
        
        const throws = player.currentRoundThrows.map((val, i) => {
            return (i === currentThrowIndex && isCurrent) && currentThrowIndex < 3 ? val * currentMultiplier : val;
        });

        const throwsDisplay = throws.join(' | ');

        let infoText = `Hody v kole: ${throwsDisplay}`;
        
        if (isCurrent) {
            const required = player.score - currentRoundSum;
            infoText += `<br>Potřeba: <strong class="round-needed">${required}</strong> (Součet: ${currentRoundSum})`;
        }
        
        const removeBtn = gameStarted ? '' : 
            `<button onclick="removePlayer('${player.name}')" style="background-color: #c0392b; padding: 3px 8px; font-size: 0.8em; margin-top: 5px;">Odebrat</button>`;


        playerDiv.innerHTML = `
            <h3>${player.name} ${removeBtn}</h3>
            <p>Zbývá: <strong>${scoreDisplay}</strong></p>
            <p>${infoText}</p>
        `;
        list.appendChild(playerDiv);
    });
    checkSavedGame();
}

function renderScoreButtons() {
    const container = document.getElementById('score-buttons');
    container.innerHTML = '';
    
    const scoresToDisplay = [0];
    for (let i = 1; i <= 20; i++) {
        scoresToDisplay.push(i);
    }
    scoresToDisplay.push(25); 

    scoresToDisplay.forEach(score => {
        const btn = document.createElement('button');
        btn.innerText = score;
        
        if (score === 0) {
            btn.classList.add('zero-button');
        }
        
        btn.onclick = () => recordThrow(score);
        container.appendChild(btn);
    });
}

function updateInputDisplay() {
    const multiplierTextContainer = document.querySelector('#dart-input p');
    const multiplierText = document.getElementById('current-multiplier');
    const doubleBtn = document.querySelector('[onclick="setMultiplier(2)"]');
    const tripleBtn = document.querySelector('[onclick="setMultiplier(3)"]');
    
    document.getElementById('current-player-name').innerText = players[currentPlayerIndex] ? players[currentPlayerIndex].name : 'Není vybrán';
    
    doubleBtn.classList.remove('active-multiplier');
    tripleBtn.classList.remove('active-multiplier');

    if (currentMultiplier === 2) {
         doubleBtn.classList.add('active-multiplier');
         multiplierTextContainer.style.display = 'block';
         multiplierText.innerText = '2x';
    } else if (currentMultiplier === 3) {
         tripleBtn.classList.add('active-multiplier');
         multiplierTextContainer.style.display = 'block';
         multiplierText.innerText = '3x';
    } else {
        multiplierTextContainer.style.display = 'none';
        multiplierText.innerText = '1x'; 
    }
}


// --- FUNKCE PRO SKÓROVÁNÍ ---

function setMultiplier(multiplier) {
    if (!gameStarted) return;
    
    if (currentThrowIndex < 3) {
        currentMultiplier = multiplier;
    }
    updateInputDisplay();
    renderPlayers(); 
}

function recordThrow(score) {
    if (!gameStarted || currentThrowIndex >= 3) {
        alert("Nejprve spusťte hru!");
        return;
    }
    
    const value = score * currentMultiplier; 
    const player = players[currentPlayerIndex];
    
    player.currentRoundThrows[currentThrowIndex] = value; 
    
    if (currentMultiplier === 2) {
        player.stats.doubles++;
    } else if (currentMultiplier === 3) {
        player.stats.triples++;
    }
    
    currentMultiplier = 1; 
    saveState();
    
    currentThrowIndex++; 

    if (currentThrowIndex === 3) {
        endRound();
    } else {
        updateInputDisplay();
        renderPlayers(); 
    }
}


// --- FUNKCE END ROUND ---
function endRound() {
    const player = players[currentPlayerIndex];
    const totalScore = player.currentRoundThrows.reduce((a, b) => a + b, 0);
    const scoreBeforeRound = player.score;
    const newScore = scoreBeforeRound - totalScore; 
    let winner = false;
    let gameJustEnded = false; 
    const currentThrows = [...player.currentRoundThrows]; 

    if (newScore === 0) {
        alert(`${player.name} VYHRÁVÁ hru!`);
        player.score = 0;
        gameStarted = false; 
        winner = true;
        gameJustEnded = true;
    } else if (newScore < 0 || newScore === 1) { 
        // BUST
        alert(`${player.name} hodil ${newScore === 1 ? '1 (nelze zavřít)' : 'pod nulu'}! Kolo se nepočítá (Bust).`);
        
        // KOREKCE STATISTIK
        for (let i = 0; i < currentThrows.length; i++) {
            const throwValue = currentThrows[i];
            if (throwValue) {
                if (throwValue % 3 === 0 && throwValue / 3 <= 20 && player.stats.triples > 0) {
                    player.stats.triples--;
                } else if (throwValue % 2 === 0 && throwValue / 2 <= 20 && player.stats.doubles > 0) {
                    player.stats.doubles--;
                }
            }
        }
    } else {
        player.score = newScore;
    }
    
    // Uložení hodu do celkové historie hráče
    player.throws.push({ 
        startScore: scoreBeforeRound,
        endScore: player.score,
        round: currentThrows, 
        totalRoundScore: totalScore,
        bust: (newScore < 0 || newScore === 1)
    });
    
    if (gameJustEnded) {
        const gameResult = {
            gameType: gameValue,
            date: new Date().toISOString().slice(0, 10),
            winner: winner ? player.name : 'N/A',
            players: players.map(p => ({
                name: p.name,
                finalScore: p.score,
                allThrows: p.throws,
                stats: p.stats
            }))
        };
        saveGameHistory(gameResult); 
        localStorage.removeItem(SAVED_GAME_KEY); 
    }
    
    // Reset pro další kolo
    player.currentRoundThrows = [0, 0, 0];
    currentThrowIndex = 0;
    
    // Přepínáme hráče VŽDY, pokud hra pokračuje
    if (gameStarted) {
        currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    }
    
    saveState(); 
    renderPlayers();
    updateInputDisplay();

    if (!gameStarted) {
         document.querySelectorAll('#setup-section button').forEach(btn => btn.disabled = false);
         const historyButton = document.querySelector('a[href="history.html"] button');
         if (historyButton) historyButton.disabled = false;
         
         const endGameBtn = document.getElementById('end-game-btn');
         if (endGameBtn) endGameBtn.style.display = 'none'; 
         
         checkSavedGame();
    }
}

// --- UNDO A HISTORY ---

function saveState() {
    const state = {
        players: JSON.parse(JSON.stringify(players)),
        currentPlayerIndex: currentPlayerIndex,
        currentThrowIndex: currentThrowIndex,
        currentMultiplier: currentMultiplier,
        gameStarted: gameStarted 
    };
    history.push(state);
    
    if (history.length > 50) { 
        history.shift();
    }
    if (gameStarted) saveCurrentGame();
}

function undoLastThrow() {
    if (history.length <= 1) {
        alert("Nelze vrátit zpět, toto je první stav hry!");
        return;
    }
    
    const lastState = history[history.length - 1]; 
    const previousPlayer = players[lastState.currentPlayerIndex];
    
    const lastThrowValue = lastState.players[lastState.currentPlayerIndex].currentRoundThrows[lastState.currentThrowIndex - 1];
    if (lastThrowValue) {
        if (lastThrowValue % 3 === 0 && lastThrowValue / 3 <= 20 && previousPlayer.stats.triples > 0) {
            previousPlayer.stats.triples--;
        } else if (lastThrowValue % 2 === 0 && lastThrowValue / 2 <= 20 && previousPlayer.stats.doubles > 0) {
            previousPlayer.stats.doubles--;
        }
    }
    
    history.pop(); 
    const prevState = history[history.length - 1]; 

    players = JSON.parse(JSON.stringify(prevState.players));
    currentPlayerIndex = prevState.currentPlayerIndex;
    currentThrowIndex = prevState.currentThrowIndex;
    currentMultiplier = prevState.currentMultiplier;
    gameStarted = prevState.gameStarted;

    renderPlayers();
    updateInputDisplay();
    
    const endGameBtn = document.getElementById('end-game-btn');
    const setupButtons = document.querySelectorAll('#setup-section button:not([onclick="exportHistoryToJSON()"])');
    const historyButton = document.querySelector('a[href="history.html"] button');

    if (gameStarted) {
        setupButtons.forEach(btn => btn.disabled = true);
        if (historyButton) historyButton.disabled = true;
        if (endGameBtn) endGameBtn.style.display = 'inline-block';
    } else {
        setupButtons.forEach(btn => btn.disabled = false);
        if (historyButton) historyButton.disabled = false;
        if (endGameBtn) endGameBtn.style.display = 'none';
    }
    
    checkSavedGame();
}

// --- EXPORT JSON ---

function exportHistoryToJSON() {
    if (players.every(p => p.throws.length === 0)) {
        alert("Žádné hody k exportování. Zahrajte alespoň jedno kolo.");
        return;
    }
    
    const data = JSON.stringify(players.map(p => ({
        name: p.name,
        gameType: gameValue,
        finalScore: p.score,
        history: p.throws
    })), null, 2);

    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sipky_historie_aktualni_hry_${new Date().toISOString().slice(0, 10)}.json`; 
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
