// script.js

// Globální stav hry
let players = [];
let gameStarted = false;
let gameValue = 0; // 101, 301, 501, atd.
let currentPlayerIndex = 0;
let currentThrowIndex = 0; // 0, 1 nebo 2
let currentMultiplier = 1;

// Ukládání stavů pro funkci Undo
// Uchovává hluboké kopie stavu hry před každým zaznamenaným hodem
let history = []; 

// --- INICIALIZACE ---

document.addEventListener('DOMContentLoaded', () => {
    // Přidáme tlačítko pro export JSON (jak bylo navrženo v první odpovědi)
    const setupSection = document.getElementById('setup-section');
    const exportBtn = document.createElement('button');
    exportBtn.innerText = 'Exportovat JSON Historii';
    exportBtn.onclick = exportHistoryToJSON;
    setupSection.appendChild(exportBtn);

    // Vykreslíme tlačítka pro skóre, i když hra ještě nezačala
    renderScoreButtons();
    updateInputDisplay(); // Nastaví výchozí text "Není vybrán"
});


// --- FUNKCE PRO NASTAVENÍ HRY ---

function addPlayer() {
    if (gameStarted) return;
    const name = prompt("Zadejte jméno hráče:");
    if (name && players.length < 8) { // Omezení počtu hráčů
        players.push({
            name: name,
            score: 0,
            throws: [], // Historie všech trojitých hodů (kol)
            currentRoundThrows: [0, 0, 0] // Hody v aktuálním kole
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
        p.throws = []; // Reset historie při nové hře
    }); 
    currentPlayerIndex = 0;
    currentThrowIndex = 0;
    currentMultiplier = 1;
    history = []; // Vyčistíme historii pro novou hru
    
    saveState(); // Uloží výchozí stav
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
        // Kontrola, zda hráč vyhrál, aby se mu nesvítil active stav
        const isWinner = player.score === 0;
        const isCurrent = index === currentPlayerIndex && gameStarted && !isWinner;
        
        const playerDiv = document.createElement('div');
        playerDiv.className = isCurrent ? 'player-card active' : (isWinner ? 'player-card winner' : 'player-card');
        
        // Zobrazení skóre
        const scoreDisplay = isWinner ? "VYHRÁL!" : player.score;
        
        // Zobrazení aktuálních hodů, vynásobené násobitelem POUZE pokud je hod 0
        const throw1 = (currentThrowIndex === 0 && isCurrent) ? player.currentRoundThrows[0] * currentMultiplier : player.currentRoundThrows[0];
        const throw2 = (currentThrowIndex === 1 && isCurrent) ? player.currentRoundThrows[1] * currentMultiplier : player.currentRoundThrows[1];
        const throw3 = (currentThrowIndex === 2 && isCurrent) ? player.currentRoundThrows[2] * currentMultiplier : player.currentRoundThrows[2];

        playerDiv.innerHTML = `
            <h3>${player.name}</h3>
            <p>Zbývá: <strong>${scoreDisplay}</strong></p>
            <p>Hody v kole: 
                <span class="${currentThrowIndex === 0 && isCurrent ? 'current-throw' : ''}">${throw1}</span> | 
                <span class="${currentThrowIndex === 1 && isCurrent ? 'current-throw' : ''}">${throw2}</span> | 
                <span class="${currentThrowIndex === 2 && isCurrent ? 'current-throw' : ''}">${throw3}</span>
            </p>
        `;
        list.appendChild(playerDiv);
    });
}

function renderScoreButtons() {
    const container = document.getElementById('score-buttons');
    container.innerHTML = '';
    
    // Pole čísel [0, 1, 2, ..., 20] a pak 25
    const scoresToDisplay = [0];
    for (let i = 1; i <= 20; i++) {
        scoresToDisplay.push(i);
    }
    scoresToDisplay.push(25); 

    scoresToDisplay.forEach(score => {
        const btn = document.createElement('button');
        btn.innerText = score;
        
        // Přidání třídy pro styling nuly
        if (score === 0) {
            btn.classList.add('zero-button');
        }
        
        btn.onclick = () => recordThrow(score);
        container.appendChild(btn);
    });
}

function updateInputDisplay() {
    document.getElementById('current-multiplier').innerText = currentMultiplier;
    
    // Zobrazení jména aktivního hráče
    document.getElementById('current-player-name').innerText = players[currentPlayerIndex] ? players[currentPlayerIndex].name : 'Není vybrán';
    
    // Zvýraznění aktivního násobitele
    document.querySelectorAll('.multiplier').forEach(btn => btn.style.backgroundColor = '#f39c12'); // Oranžová z CSS
    if (currentMultiplier === 2) {
         document.querySelector('[onclick="setMultiplier(2)"]').style.backgroundColor = '#e67e22';
    } else if (currentMultiplier === 3) {
         document.querySelector('[onclick="setMultiplier(3)"]').style.backgroundColor = '#e67e22';
    }
}


// --- FUNKCE PRO SKÓROVÁNÍ ---

function setMultiplier(multiplier) {
    if (!gameStarted) return;
    
    // Zajištění, že se násobitel aplikuje pouze na aktuální hod
    if (currentThrowIndex < 3) {
        currentMultiplier = multiplier;
    }
    updateInputDisplay();
    // Aktualizujeme zobrazení v kartě hráče, aby viděl hodnotu hodu
    renderPlayers();
}

function recordThrow(score) {
    if (!gameStarted) {
        alert("Nejprve spusťte hru a vyberte hráče!");
        return;
    }

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

    // --- PRAVIDLO BUST & VÍTĚZSTVÍ ---

    if (newScore === 0) {
        // Vítězství! Hráč hodil přesně na nulu.
        alert(`${player.name} VYHRÁVÁ hru!`);
        player.score = 0;
        gameStarted = false; // Konec hry
    } else if (newScore < 0 || newScore === 1) { 
        // Bust - přestřelení nuly (< 0) nebo zbytek 1
        alert(`${player.name} přestřelil! (Bust). Skóre se neaktualizuje.`);
        // Skóre hráče zůstane beze změny (jako před začátkem kola)
    } else {
        // Standardní odečet
        player.score = newScore;
    }
    
    // Uložení hodu do celkové historie (pro JSON export)
    player.throws.push({ 
        startScore: player.score + (newScore < 0 || newScore === 1 ? 0 : totalScore), // Před odečtem (bere v úvahu Bust)
        endScore: player.score,
        round: [...player.currentRoundThrows]
    });
    
    // Reset pro další kolo
    player.currentRoundThrows = [0, 0, 0];
    currentThrowIndex = 0;
    
    // Přepnutí na dalšího hráče, pouze pokud hra neskončila
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
        gameStarted: gameStarted // Uložíme i stav hry
    };
    history.push(state);
    
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
    gameStarted = prevState.gameStarted;

    // Překreslení
    renderPlayers();
    updateInputDisplay();
    
    // Zajištění, že se setup tlačítka resetují podle stavu hry
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
    a.download = `sipky_historie_${new Date().toISOString().slice(0, 10)}.json`; // Název souboru
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
