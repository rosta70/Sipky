// script.js - CELÝ SOUBOR (s opravenou funkcí endRound pro spolehlivé ukládání)

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


// --- INICIALIZACE ---

document.addEventListener('DOMContentLoaded', () => {
    // Načtení uložených hráčů
    loadPlayers();
    
    // Přidáme tlačítko pro export JSON
    const setupSection = document.getElementById('setup-section');
    const exportBtn = document.createElement('button');
    exportBtn.innerText = 'Exportovat JSON Historii';
    exportBtn.onclick = exportHistoryToJSON;
    setupSection.appendChild(exportBtn);

    renderScoreButtons();
    renderPlayers(); // Vykreslí uložené hráče
    updateInputDisplay(); 
});


// --- TRVALÉ UKLÁDÁNÍ A NAČÍTÁNÍ ---

function savePlayers() {
    // Uloží do localStorage pouze jména hráčů pro rychlé nastavení hry
    const playerNames = players.map(p => ({
        name: p.name
    }));
    localStorage.setItem(PLAYERS_STORAGE_KEY, JSON.stringify(playerNames));
}

function loadPlayers() {
    const storedPlayers = localStorage.getItem(PLAYERS_STORAGE_KEY);
    if (storedPlayers) {
        // Obnoví pole 'players' s uloženými jmény, ale ostatní pole resetuje na výchozí hodnoty
        players = JSON.parse(storedPlayers).map(p => ({
            name: p.name,
            score: 0,
            throws: [], 
            currentRoundThrows: [0, 0, 0] 
        }));
    }
}

function saveGameHistory(newEntry) {
    const allHistory = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || '[]');
    allHistory.push(newEntry);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(allHistory));
    console.log("Hra úspěšně uložena do localStorage."); // Kontrolní zpráva
}


// --- FUNKCE PRO NASTAVENÍ HRY ---

function addPlayer() {
    if (gameStarted) return;
    const name = prompt("Zadejte jméno hráče:");
    
    if (name && players.length < 8 && !players.some(p => p.name.toLowerCase() === name.toLowerCase())) { 
        players.push({
            name: name,
            score: 0,
            throws: [], 
            currentRoundThrows: [0, 0, 0] 
        });
        savePlayers(); // Uloží nového hráče
        renderPlayers();
    } else if (name) {
        alert("Hráč se stejným jménem už existuje nebo byl dosažen limit (8 hráčů).");
    }
}

function startGame(value) {
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
        currentRoundThrows: [0, 0, 0] 
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


// --- FUNKCE PRO ZOBRAZENÍ (RENDER) ---

function renderPlayers() {
    const list = document.getElementById('players-list');
    list.innerHTML = '';
    
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

        playerDiv.innerHTML = `
            <h3>${player.name}</h3>
            <p>Zbývá: <strong>${scoreDisplay}</strong></p>
            <p>${infoText}</p>
        `;
        list.appendChild(playerDiv);
    });
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
    const newScore = scoreBeforeRound - totalScore; // Správný výpočet
    let winner = false;
    let gameJustEnded = false; 

    if (newScore === 0) {
        // Vítězství!
        alert(`${player.name} VYHRÁVÁ hru!`);
        player.score = 0;
        gameStarted = false; 
        winner = true;
        gameJustEnded = true;
    } else if (newScore < 0 || newScore === 1) { 
        // Bust
        alert(`${player.name} přestřelil! (Bust). Skóre ${player.score} se nemění.`);
        // player.score zůstává scoreBeforeRound
    } else {
        // Standardní odečet
        player.score = newScore;
    }
    
    // Uložení hodu do celkové historie hráče pro export JSON (historie hodu)
    player.throws.push({ 
        startScore: scoreBeforeRound,
        endScore: player.score,
        round: [...player.currentRoundThrows],
        totalRoundScore: totalScore,
        bust: (newScore < 0 || newScore === 1)
    });
    
    // Uložení výsledku celé hry do trvalé historie, POUZE pokud hra právě skončila
    if (gameJustEnded) {
        const gameResult = {
            gameType: gameValue,
            date: new Date().toISOString().slice(0, 10),
            winner: winner ? player.name : 'N/A',
            players: players.map(p => ({
                name: p.name,
                finalScore: p.score,
                allThrows: p.throws
            }))
        };
        saveGameHistory(gameResult); // Zde se volá trvalé uložení
    }
    
    // Reset pro další kolo
    player.currentRoundThrows = [0, 0, 0];
    currentThrowIndex = 0;
    
    // Přepnutí na dalšího hráče
    if (gameStarted) {
        currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    }
    
    saveState(); 
    renderPlayers();
    updateInputDisplay();

    // Reaktivace tlačítek a odkazu na historii
    if (!gameStarted) {
         document.querySelectorAll('#setup-section button').forEach(btn => btn.disabled = false);
         const historyButton = document.querySelector('a[href="history.html"] button');
         if (historyButton) historyButton.disabled = false;
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
}

function undoLastThrow() {
    if (history.length <= 1) {
        alert("Nelze vrátit zpět, toto je první stav hry!");
        return;
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
