// script.js - CELÝ SOUBOR (s rychlým ukončením, odebráním hráče a statistikami)

// Globální stav hry
let players = [];
let gameStarted = false;
let gameValue = 0; 
let currentPlayerIndex = 0; 
let currentThrowIndex = 0; 
let currentMultiplier = 1;
let lastMultiplierUsed = 1; // Sleduje poslední použitý násobitel pro statistiky

let history = []; 
const PLAYERS_STORAGE_KEY = 'darts_scorer_players';
const HISTORY_STORAGE_KEY = 'darts_scorer_history';
const SAVED_GAME_KEY = 'darts_scorer_saved_game'; // Nový klíč pro rozehranou hru


// --- INICIALIZACE ---

document.addEventListener('DOMContentLoaded', () => {
    loadPlayers();
    
    const setupSection = document.getElementById('setup-section');
    
    // Přidáno tlačítko pro rychlé ukončení/uložení
    const saveAndEndBtn = document.createElement('button');
    saveAndEndBtn.innerText = 'Ukončit a Uložit hru';
    saveAndEndBtn.id = 'save-and-end-btn';
    saveAndEndBtn.onclick = endGameManual;
    saveAndEndBtn.style.backgroundColor = '#9b59b6'; // Fialová
    setupSection.appendChild(saveAndEndBtn);
    
    // Původní tlačítko Export
    const exportBtn = document.createElement('button');
    exportBtn.innerText = 'Exportovat JSON Historii';
    exportBtn.onclick = exportHistoryToJSON;
    setupSection.appendChild(exportBtn);

    renderScoreButtons();
    renderPlayers(); 
    updateInputDisplay(); 
    checkSavedGame(); // Zkontroluje, zda existuje rozehraná hra
});


// --- TRVALÉ UKLÁDÁNÍ A NAČÍTÁNÍ ---

function savePlayers() {
    // Uloží do localStorage jména hráčů
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
            stats: { doubles: 0, triples: 0 } // Inicializace statistik
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
    const saveAndEndBtn = document.getElementById('save-and-end-btn');
    const loadBtn = document.getElementById('load-game-btn'); // Bude přidán v renderPlayers

    if (savedGame) {
        if (loadBtn) loadBtn.style.display = 'inline-block';
        if (saveAndEndBtn) saveAndEndBtn.style.display = 'inline-block';
        console.log("Nalezena rozehraná hra.");
    } else {
        if (loadBtn) loadBtn.style.display = 'none';
        if (saveAndEndBtn) saveAndEndBtn.style.display = 'none';
    }
}

function loadSavedGame(gameState) {
    // Používá buď uložený stav z localStorage nebo stav z JSON importu
    players = gameState.players;
    gameValue = gameState.gameValue;
    currentPlayerIndex = gameState.currentPlayerIndex;
    currentThrowIndex = gameState.currentThrowIndex;
    currentMultiplier = gameState.currentMultiplier;
    gameStarted = true; // Předpokládáme, že rozehraná hra je aktivní
    
    // Obnovení globálního stavu
    renderPlayers();
    updateInputDisplay();
    
    // Deaktivace tlačítek pro nastavení hry
    document.querySelectorAll('#setup-section button:not([onclick="exportHistoryToJSON()"])').forEach(btn => btn.disabled = true);
    const historyButton = document.querySelector('a[href="history.html"] button');
    if (historyButton) historyButton.disabled = true;

    alert(`Rozehraná hra (${gameValue}x01) byla úspěšně načtena!`);
    // Po načtení se rozehraná hra z localStorage smaže, aby se zabránilo zmatku
    localStorage.removeItem(SAVED_GAME_KEY); 
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
    // ... (Logika pro start zůstává stejná, jen se inicializují statistiky)
    if (players.length === 0) {
        alert("Nejprve přidejte alespoň jednoho hráče!");
        return;
    }
    gameValue = value;
    gameStarted = true;
    
    players = players.map(p => ({
        name: p.name,
        score: gameValue,
        throws: [], 
        currentRoundThrows: [0, 0, 0],
        stats: p.stats || { doubles: 0, triples: 0 } // Zachování nebo inicializace statistik
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
}

function endGameManual() {
    if (!gameStarted) {
        alert("Nejdříve musíte spustit hru.");
        return;
    }

    if (confirm("Opravdu chcete uložit rozehranou hru a ukončit počítání skóre?")) {
        saveCurrentGame(); // Uloží rozehraný stav do nového klíče
        alert("Hra byla uložena! Můžete ji načíst při příštím spuštění.");
        
        // Reset stavu
        gameStarted = false;
        gameValue = 0;
        currentThrowIndex = 0;
        currentMultiplier = 1;
        
        // Reaktivace tlačítek
        document.querySelectorAll('#setup-section button').forEach(btn => btn.disabled = false);
        const historyButton = document.querySelector('a[href="history.html"] button');
        if (historyButton) historyButton.disabled = false;
        
        renderPlayers();
        updateInputDisplay();
        checkSavedGame();
    }
}


// --- FUNKCE PRO ZOBRAZENÍ (RENDER) ---

function renderPlayers() {
    const list = document.getElementById('players-list');
    list.innerHTML = '';
    
    // Přidání tlačítka pro načtení rozehrané hry, pokud existuje
    const savedGame = localStorage.getItem(SAVED_GAME_KEY);
    if (savedGame && !gameStarted) {
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
        
        if (isCurrent && currentThrowIndex > 0) {
            infoText += `<br>Potřeba: <strong class="round-needed">${player.score - currentRoundSum}</strong> (Součet: ${currentRoundSum})`;
        }
        
        // Zobrazení tlačítka pro odebrání hráče POUZE před startem hry
        const removeBtn = gameStarted ? '' : 
            `<button onclick="removePlayer('${player.name}')" style="background-color: #c0392b; padding: 3px 8px; font-size: 0.8em; margin-top: 5px;">Odebrat</button>`;


        playerDiv.innerHTML = `
            <h3>${player.name} ${removeBtn}</h3>
            <p>Zbývá: <strong>${scoreDisplay}</strong></p>
            <p>${infoText}</p>
        `;
        list.appendChild(playerDiv);
    });
}

function renderScoreButtons() {
    // ... (Zůstává beze změny) ...
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
        lastMultiplierUsed = multiplier; // Sledování násobitele pro statistiky
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
    
    // Započítání statistik pro Double/Triple
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


function endRound() {
    const player = players[currentPlayerIndex];
    const totalScore = player.currentRoundThrows.reduce((a, b) => a + b, 0);
    const scoreBeforeRound = player.score;
    const newScore = scoreBeforeRound - totalScore; 
    let winner = false;
    let gameJustEnded = false; 

    if (newScore === 0) {
        alert(`${player.name} VYHRÁVÁ hru!`);
        player.score = 0;
        gameStarted = false; 
        winner = true;
        gameJustEnded = true;
    } else if (newScore < 0 || newScore === 1) { 
        alert(`${player.name} přestřelil! (Bust). Skóre ${player.score} se nemění.`);
    } else {
        player.score = newScore;
    }
    
    // Uložení hodu do celkové historie hráče
    player.throws.push({ 
        startScore: scoreBeforeRound,
        endScore: player.score,
        round: [...player.currentRoundThrows],
        totalRoundScore: totalScore,
        bust: (newScore < 0 || newScore === 1)
    });
    
    if (gameJustEnded) {
        const gameResult = {
            gameType: gameValue,
            date: new Date().toISOString().slice(0, 10),
            winner: winner ? player.name : 'N/A',
            // Uložíme statistiky pro hráče
            players: players.map(p => ({
                name: p.name,
                finalScore: p.score,
                allThrows: p.throws,
                stats: p.stats
            }))
        };
        saveGameHistory(gameResult); 
        localStorage.removeItem(SAVED_GAME_KEY); // Vyčistíme rozehranou hru po dokončení
    }
    
    player.currentRoundThrows = [0, 0, 0];
    currentThrowIndex = 0;
    
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
         checkSavedGame();
    }
}

// --- UNDO A HISTORY ---

function saveState() {
    // ... (Zůstává beze změny) ...
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
}

function undoLastThrow() {
    if (history.length <= 1) {
        alert("Nelze vrátit zpět, toto je první stav hry!");
        return;
    }
    
    // Zde je potřeba odečíst statistiku násobitele z předchozího hodu, pokud byla použita
    const lastState = history[history.length - 1]; 
    const previousState = history[history.length - 2]; 

    // Kontrola, zda došlo k odečtení skóre
    if (lastState.currentThrowIndex > 0 && lastState.currentMultiplier === 1) {
        const lastPlayer = lastState.players[lastState.currentPlayerIndex];
        const lastThrowValue = lastPlayer.currentRoundThrows[lastState.currentThrowIndex - 1];
        
        // Jednoduchá heuristika: Pokud se hod dělí 2 nebo 3, odečteme z počtu Double/Triple
        if (lastThrowValue > 0) {
            if (lastThrowValue % 3 === 0 && previousState.players[previousState.currentPlayerIndex].stats.triples > 0) {
                players[previousState.currentPlayerIndex].stats.triples--;
            } else if (lastThrowValue % 2 === 0 && previousState.players[previousState.currentPlayerIndex].stats.doubles > 0) {
                players[previousState.currentPlayerIndex].stats.doubles--;
            }
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
    
    const setupButtons = document.querySelectorAll('#setup-section button:not([onclick="exportHistoryToJSON()"])');
    setupButtons.forEach(btn => btn.disabled = gameStarted);
    const historyButton = document.querySelector('a[href="history.html"] button');
    if (historyButton) historyButton.disabled = gameStarted;
}


// --- EXPORT JSON (Zůstává stejné) ---

function exportHistoryToJSON() {
    if (players.every(p => p.throws.length === 0)) {
        alert("Žádné hody k exportování. Zahrajte alespoň jedno kolo.");
        return;
    }
    
    // ... (zbytek exportu zůstává stejný)
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
