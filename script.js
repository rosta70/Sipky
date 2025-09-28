// Globální stav hry
let players = [];
let gameStarted = false;
let gameValue = 0; // 301, 501, atd.
let currentPlayerIndex = 0;
let currentThrowIndex = 0; // 0, 1 nebo 2
let currentMultiplier = 1;

// Ukládání stavů pro funkci Undo
let history = []; 

// --- FUNKCE PRO NASTAVENÍ HRY ---

function addPlayer() {
    if (gameStarted) return;
    const name = prompt("Zadejte jméno hráče:");
    if (name) {
        players.push({
            name: name,
            score: 0,
            throws: [], // Historie všech trojitých hodů (kol)
            currentRoundThrows: [0, 0, 0] // Hody v aktuálním kole
        });
        renderPlayers();
    }
}

function startGame(value) {
    if (players.length === 0) {
        alert("Nejprve přidejte alespoň jednoho hráče!");
        return;
    }
    gameValue = value;
    gameStarted = true;
    players.forEach(p => p.score = gameValue); // Nastaví startovní skóre
    currentPlayerIndex = 0;
    currentThrowIndex = 0;
    currentMultiplier = 1;
    saveState(); // Uloží výchozí stav
    renderPlayers();
    renderScoreButtons();
    updateInputDisplay();
}

// --- FUNKCE PRO ZOBRAZENÍ (RENDER) ---

function renderPlayers() {
    const list = document.getElementById('players-list');
    list.innerHTML = '';
    
    players.forEach((player, index) => {
        const isCurrent = index === currentPlayerIndex && gameStarted;
        const playerDiv = document.createElement('div');
        playerDiv.className = isCurrent ? 'player-card active' : 'player-card';
        playerDiv.innerHTML = `
            <h3>${player.name}</h3>
            <p>Zbývá: <strong>${player.score}</strong></p>
            <p>Hody v kole: 
                <span class="${currentThrowIndex === 0 && isCurrent ? 'current-throw' : ''}">${player.currentRoundThrows[0] * currentMultiplier}</span> | 
                <span class="${currentThrowIndex === 1 && isCurrent ? 'current-throw' : ''}">${player.currentRoundThrows[1] * currentMultiplier}</span> | 
                <span class="${currentThrowIndex === 2 && isCurrent ? 'current-throw' : ''}">${player.currentRoundThrows[2] * currentMultiplier}</span>
            </p>
        `;
        list.appendChild(playerDiv);
    });
}

function renderScoreButtons() {
    const container = document.getElementById('score-buttons');
    container.innerHTML = '';
    const scores = [...Array(20).keys()].map(i => i + 1); // 1 až 20
    scores.push(25); // Přidáme 25 (Bull)

    scores.forEach(score => {
        const btn = document.createElement('button');
        btn.innerText = score;
        btn.onclick = () => recordThrow(score);
        container.appendChild(btn);
    });
}

function updateInputDisplay() {
    document.getElementById('current-multiplier').innerText = currentMultiplier;
    document.getElementById('current-player-name').innerText = players[currentPlayerIndex] ? players[currentPlayerIndex].name : 'Není vybrán';
    // Můžeme zvýraznit tlačítka Double/Triple
    document.querySelectorAll('.multiplier').forEach(btn => btn.style.backgroundColor = 'lightgray');
    if (currentMultiplier === 2) {
         document.querySelector('[onclick="setMultiplier(2)"]').style.backgroundColor = 'yellow';
    } else if (currentMultiplier === 3) {
         document.querySelector('[onclick="setMultiplier(3)"]').style.backgroundColor = 'orange';
    }
}


// --- FUNKCE PRO SKÓROVÁNÍ ---

function setMultiplier(multiplier) {
    if (!gameStarted) return;
    currentMultiplier = multiplier;
    updateInputDisplay();
    // Aktualizujeme zobrazení hodnot hodu v kole s novým násobitelem
    renderPlayers();
}

function recordThrow(score) {
    if (!gameStarted) return;

    const value = score * currentMultiplier;
    const player = players[currentPlayerIndex];
    
    // Zaznamenáme hod do aktuálního kola
    player.currentRoundThrows[currentThrowIndex] = value;
    
    currentThrowIndex++;
    currentMultiplier = 1; // Násobitel se po hodu vždy resetuje

    if (currentThrowIndex === 3) {
        // Konec tří hodů v kole
        endRound();
    } else {
        // Pokračujeme v hodu
        updateInputDisplay();
        renderPlayers();
        saveState();
    }
}


function endRound() {
    const player = players[currentPlayerIndex];
    const totalScore = player.currentRoundThrows.reduce((a, b) => a + b, 0);
    const newScore = player.score - totalScore;

    // --- PRAVIDLO BUST ---
    if (newScore < 0 || newScore === 1) { // Bust - přestřelení nuly nebo zbytek 1
        alert(`${player.name} přestřelil! (Bust). Skóre se nemění.`);
    } else if (newScore === 0) {
        // Vítězství!
        alert(`${player.name} VYHRÁVÁ hru!`);
        player.score = 0;
        gameStarted = false; // Konec hry
    } else {
        // Standardní odečet
        player.score = newScore;
    }
    
    // Uložení hodu do celkové historie (pro JSON export)
    player.throws.push({ 
        startScore: player.score + totalScore, // Před odečtem
        endScore: player.score,
        round: [...player.currentRoundThrows]
    });
    
    // Reset pro další kolo
    player.currentRoundThrows = [0, 0, 0];
    currentThrowIndex = 0;
    
    // Přepnutí na dalšího hráče
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    
    saveState(); // Uloží nový stav hry
    renderPlayers();
    updateInputDisplay();
}

// --- UNDO A HISTORY ---

function saveState() {
    // Uloží hlubokou kopii aktuálního stavu hry
    history.push({
        players: JSON.parse(JSON.stringify(players)),
        currentPlayerIndex: currentPlayerIndex,
        currentThrowIndex: currentThrowIndex,
        currentMultiplier: currentMultiplier
    });
    // Omezit historii, aby nezabírala příliš místa
    if (history.length > 50) { 
        history.shift();
    }
}

function undoLastThrow() {
    if (history.length <= 1) {
        alert("Nelze vrátit zpět, toto je první stav hry!");
        return;
    }
    
    history.pop(); // Odstraníme aktuální/poslední stav
    const prevState = history[history.length - 1]; // Načteme předchozí stav

    // Obnovení stavu
    players = JSON.parse(JSON.stringify(prevState.players));
    currentPlayerIndex = prevState.currentPlayerIndex;
    currentThrowIndex = prevState.currentThrowIndex;
    currentMultiplier = prevState.currentMultiplier;

    // Překreslení
    renderPlayers();
    updateInputDisplay();
    gameStarted = true; // Zajištění, že se hra znovu zapne, pokud se vrátíme ze stavu "Vítězství"
}

// --- VOLITELNÉ: EXPORT JSON ---

function exportHistoryToJSON() {
    const data = JSON.stringify(players.map(p => ({
        name: p.name,
        gameValue: gameValue,
        history: p.throws
    })), null, 2);

    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sipky_historie_${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ZAVOLAT PŘI NAČTENÍ STRÁNKY
document.addEventListener('DOMContentLoaded', () => {
    // Přidáme tlačítko pro export JSON do HTML
    const setupSection = document.getElementById('setup-section');
    const exportBtn = document.createElement('button');
    exportBtn.innerText = 'Exportovat JSON Historii';
    exportBtn.onclick = exportHistoryToJSON;
    setupSection.appendChild(exportBtn);
});
