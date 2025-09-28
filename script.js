// script.js - CELÝ SOUBOR

// Globální stav hry
let players = [];
let gameStarted = false;
let gameValue = 0; // 101, 301, 501, atd.
let currentPlayerIndex = 0;
let currentThrowIndex = 0; // 0, 1 nebo 2
let currentMultiplier = 1;

// Ukládání stavů pro funkci Undo
let history = []; 

// --- INICIALIZACE ---

document.addEventListener('DOMContentLoaded', () => {
    // Přidáme tlačítko pro export JSON
    const setupSection = document.getElementById('setup-section');
    const exportBtn = document.createElement('button');
    exportBtn.innerText = 'Exportovat JSON Historii';
    exportBtn.onclick = exportHistoryToJSON;
    setupSection.appendChild(exportBtn);

    renderScoreButtons();
    updateInputDisplay(); 
});


// --- FUNKCE PRO NASTAVENÍ HRY ---

function addPlayer() {
    if (gameStarted) return;
    const name = prompt("Zadejte jméno hráče:");
    if (name && players.length < 8) { 
        players.push({
            name: name,
            score: 0,
            throws: [], 
            currentRoundThrows: [0, 0, 0] 
        });
        renderPlayers();
    } else if (name) {
        alert("Maximální počet hráčů (8) byl dosažen.");
    }
}

function startGame(value) {
    if (players.length === 0) {
        alert("Nejprve přidejte alespoň jednoho hráče!");
        return;
    }
    gameValue = value;
    gameStarted = true;
    players.forEach(p => {
        p.score = gameValue;
        p.currentRoundThrows = [0, 0, 0];
        p.throws = []; 
    }); 
    currentPlayerIndex = 0;
    currentThrowIndex = 0;
    currentMultiplier = 1;
    history = []; 
    
    saveState(); 
    renderPlayers();
    updateInputDisplay();
    
    // Deaktivace tlačítek pro nastavení hry po startu
    document.querySelectorAll('#setup-section button:not([onclick="exportHistoryToJSON()"])').forEach(btn => btn.disabled = true);
}


// --- FUNKCE PRO ZOBRAZENÍ (RENDER) ---

function renderPlayers() {
    const list = document.getElementById('players-list');
    list.innerHTML = '';
    
    players.forEach((player, index) => {
        const isWinner = player.score === 0;
        const isCurrent = index === currentPlayerIndex && gameStarted && !isWinner;
        
        // Vypočet součtu aktuálních hodů
        const currentRoundSum = player.currentRoundThrows.reduce((a, b) => a + b, 0); 
        
        const playerDiv = document.createElement('div');
        playerDiv.className = isCurrent ? 'player-card active' : (isWinner ? 'player-card winner' : 'player-card');
        
        // Zobrazení skóre
        const scoreDisplay = isWinner ? "VYHRÁL!" : player.score;
        
        // Zobrazení aktuálních hodů s aplikovaným násobitelem POUZE na právě zadávaný hod
        const throws = player.currentRoundThrows.map((val, i) => {
            // Pokud je to aktivní hráč a aktivní hod, aplikujeme násobitel na vizuální zobrazení
            return (i === currentThrowIndex && isCurrent) && currentThrowIndex < 3 ? val * currentMultiplier : val;
        });

        // Vytvoření zobrazení Hody v kole a Zkratky
        const throwsDisplay = throws.join(' | ');

        let infoText = `Hody v kole: ${throwsDisplay}`;
        
        // Zobrazení součtu a zbývajícího skóre v kole
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
    
    // Zobrazení jména aktivního hráče
    document.getElementById('current-player-name').innerText = players[currentPlayerIndex] ? players[currentPlayerIndex].name : 'Není vybrán';
    
    // Resetování tříd pro zvýraznění
    doubleBtn.classList.remove('active-multiplier');
    tripleBtn.classList.remove('active-multiplier');

    // Nastavení červeného zvýraznění a skrytí/zobrazení 1x textu
    if (currentMultiplier === 2) {
         doubleBtn.classList.add('active-multiplier');
         multiplierTextContainer.style.display = 'block';
         multiplierText.innerText = '2x';
    } else if (currentMultiplier === 3) {
         tripleBtn.classList.add('active-multiplier');
         multiplierTextContainer.style.display = 'block';
         multiplierText.innerText = '3x';
    } else {
        // Skrytí informace o násobiteli, pokud je 1
        multiplierTextContainer.style.display = 'none';
        multiplierText.innerText = '1x'; // Udržíme hodnotu, ale skryjeme kontejner
    }
}


// --- FUNKCE PRO SKÓROVÁNÍ ---

function setMultiplier(multiplier) {
    if (!gameStarted) return;
    
    if (currentThrowIndex < 3) {
        currentMultiplier = multiplier;
    }
    updateInputDisplay();
    renderPlayers(); // Aktualizuje vizuál se správným násobitelem
}

function recordThrow(score) {
    if (!gameStarted || currentThrowIndex >= 3) {
        alert("Nejprve spusťte hru!");
        return;
    }
    
    // Uložíme hodnotu násobenou (hodnota je uložena v kole, ne násobená vizuální hodnota)
    const value = score * currentMultiplier; 
    const player = players[currentPlayerIndex];
    
    // Zapamatujeme si skutečnou hodnotu hodu, ne hodnotu s násobitelem
    player.currentRoundThrows[currentThrowIndex] = value; 
    
    // Resetujeme násobitel, ale ponecháme currentThrowIndex pro dynamické zobrazení součtu
    currentMultiplier = 1; 

    // Teprve teď uložíme stav. V tomto stavu je v kole uložený 1. hod a čekáme na další.
    saveState();
    
    currentThrowIndex++; // Přepneme na další hod

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
    const newScore = player.score - totalScore;

    // --- PRAVIDLO BUST & VÍTĚZSTVÍ ---
    const scoreBeforeRound = player.score;

    if (newScore === 0) {
        // Vítězství!
        alert(`${player.name} VYHRÁVÁ hru!`);
        player.score = 0;
        gameStarted = false; 
    } else if (newScore < 0 || newScore === 1) { 
        // Bust
        alert(`${player.name} přestřelil! (Bust). Skóre ${player.score} se nemění.`);
        // Skóre hráče zůstane stejné.
    } else {
        // Standardní odečet
        player.score = newScore;
    }
    
    // Uložení hodu do celkové historie
    player.throws.push({ 
        startScore: scoreBeforeRound,
        endScore: player.score,
        round: [...player.currentRoundThrows],
        totalRoundScore: totalScore,
        bust: (newScore < 0 || newScore === 1) // Zaznamená, zda došlo k Bustu
    });
    
    // Reset pro další kolo
    player.currentRoundThrows = [0, 0, 0];
    currentThrowIndex = 0;
    
    // Přepnutí na dalšího hráče, pokud hra neskončila
    if (gameStarted) {
        currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    }
    
    saveState(); // Uloží nový stav hry
    renderPlayers();
    updateInputDisplay();

    // Reaktivace setup tlačítek na konci hry
    if (!gameStarted) {
         document.querySelectorAll('#setup-section button').forEach(btn => btn.disabled = false);
    }
}

// --- UNDO A HISTORY ---

function saveState() {
    // Uloží hlubokou kopii aktuálního stavu hry
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

    // Obnovení stavu
    players = JSON.parse(JSON.stringify(prevState.players));
    currentPlayerIndex = prevState.currentPlayerIndex;
    currentThrowIndex = prevState.currentThrowIndex;
    currentMultiplier = prevState.currentMultiplier;
    gameStarted = prevState.gameStarted;

    // Překreslení
    renderPlayers();
    updateInputDisplay();
    
    const setupButtons = document.querySelectorAll('#setup-section button:not([onclick="exportHistoryToJSON()"])');
    setupButtons.forEach(btn => btn.disabled = gameStarted);
}

// --- EXPORT JSON ---

function exportHistoryToJSON() {
    if (players.every(p => p.throws.length === 0)) {
        alert("Žádné hody k exportování. Zahrajte alespoň jedno kolo.");
        return;
    }
    
    const data = JSON.stringify(players.map(p => ({
        name: p.name,
        gameValue: gameValue,
        finalScore: p.score,
        history: p.throws
    })), null, 2);

    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sipky_historie_${new Date().toISOString().slice(0, 10)}.json`; 
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
