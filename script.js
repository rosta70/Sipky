// script.js - CELÝ SOUBOR (FINÁLNÍ STABILNÍ VERZE S OPRAVENOU VAZBOU 'UKONČIT HRU')

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

// Mapy pro TTS (Zkráceno pro prostor)
const BASE_NUMBER_TEXT_MAP = { 0: "nula", 1: "jedna", 2: "dvě", 3: "tři", 4: "čtyři", 5: "pět", 6: "šest", 7: "sedm", 8: "osm", 9: "devět", 10: "deset", 11: "jedenáct", 12: "dvanáct", 13: "třináct", 14: "čtrnáct", 15: "patnáct", 16: "šestnáct", 17: "sedmnáct", 18: "osmnáct", 19: "devatenáct", 20: "dvacet", 25: "dvacet pět", 30: "třicet", 40: "čtyřicet", 50: "padesát", 60: "šedesát", 101: "sto jedna", 301: "tři sta jedna", 501: "pět set jedna" };
const DIGIT_MAP = { '0': 'nula', '1': 'jedna', '2': 'dvě', '3': 'tři', '4': 'čtyři', '5': 'pět', '6': 'šest', '7': 'sedm', '8': 'osm', '9': 'devět', };

// Definice kritických funkcí, které musí být globální (volané z HTML/onclick)
window.startGame = startGame;
window.addPlayer = addPlayer;
window.removePlayer = removePlayer;
window.setMultiplier = setMultiplier;
window.recordThrow = recordThrow;
window.undoLastThrow = undoLastThrow;
window.exportHistoryToJSON = exportHistoryToJSON;
window.promptEndGame = promptEndGame;
window.clearAllData = clearAllData; // Globální

function getCzechNumber(number) { return BASE_NUMBER_TEXT_MAP[number] || number.toString(); }
function getCzechNumberByDigits(number) { 
    const numStr = number.toString();
    if (number <= 20) { return BASE_NUMBER_TEXT_MAP[number] || number.toString(); }
    return numStr.split('').map(digit => DIGIT_MAP[digit] || digit).join(' ');
}
function speakText(text) { 
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'cs-CZ'; utterance.rate = 1.2;
        if (window.speechSynthesis.speaking) { window.speechSynthesis.cancel(); }
        window.speechSynthesis.speak(utterance);
        return utterance;
    } 
    return { onend: () => {} };
}


// --- INICIALIZACE A VAZBA UDÁLOSTÍ ---

document.addEventListener('DOMContentLoaded', () => {
    loadPlayers();
    
    const setupSection = document.getElementById('setup-section');
    const endGameContainer = document.getElementById('end-game-button-container'); 
    const historyControls = document.getElementById('history-controls');
    
    // Tlačítka
    const endGameBtn = document.createElement('button');
    endGameBtn.innerText = 'Ukončit hru'; endGameBtn.id = 'end-game-btn'; 
    endGameBtn.style.backgroundColor = '#9b59b6'; endGameBtn.style.display = 'none'; 
    endGameContainer.appendChild(endGameBtn); 
    
    // KLÍČOVÁ OPRAVA: PŘÍMÁ VAZBA NA TLAČÍTKO POMOCÍ setTimeout (pro maximalni robustnost)
    setTimeout(() => {
        const finalEndGameBtn = document.getElementById('end-game-btn');
        if (finalEndGameBtn) {
            finalEndGameBtn.addEventListener('click', promptEndGame);
        }
    }, 0);


    // Mini-tabulka pro ostatní hráče
    const setupParent = setupSection.parentNode;
    const summaryDiv = document.createElement('div');
    summaryDiv.id = 'score-summary-mobile';
    setupParent.insertBefore(summaryDiv, setupSection.nextSibling);

    // Tlačítko pro history.html (Vymazat Vše)
    if (historyControls) {
        const clearBtn = document.createElement('button');
        clearBtn.innerText = 'VYMAZAT VŠECHNA DATA (localStorage)';
        clearBtn.onclick = clearAllData;
        clearBtn.style.backgroundColor = '#c0392b';
        clearBtn.style.fontWeight = 'bold';
        clearBtn.style.marginTop = '20px';
        historyControls.appendChild(clearBtn);
    }
    
    renderScoreButtons();
    renderPlayers(); 
    updateInputDisplay(); 
    checkSavedGame(); 
});


// --- NOVÁ FUNKCE: VYMAZÁNÍ VŠECH DAT ---
function clearAllData() {
    const confirmation = confirm(
        "VAROVÁNÍ: Opravdu chcete VYMAZAT VŠECHNA ULOŽENÁ DATA (historiu, hráče, rozehranou hru) z prohlížeče?\n\n" +
        "Tato akce je nevratná a vynuluje celou aplikaci."
    );

    if (confirmation) {
        localStorage.clear();
        alert("Všechna data byla vymazána. Aplikace bude nyní znovu načtena.");
        window.location.reload();
    }
}


// --- UKLÁDÁNÍ A NAČÍTÁNÍ ---
function savePlayers() { const playerNames = players.map(p => ({ name: p.name })); localStorage.setItem(PLAYERS_STORAGE_KEY, JSON.stringify(playerNames)); }
function loadPlayers() { const storedPlayers = localStorage.getItem(PLAYERS_STORAGE_KEY); if (storedPlayers) { players = JSON.parse(storedPlayers).map(p => ({ name: p.name, score: 0, throws: [], currentRoundThrows: [0, 0, 0], stats: { doubles: 0, triples: 0 } })); } }
function saveGameHistory(newEntry) { const allHistory = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || '[]'); allHistory.push(newEntry); localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(allHistory)); }
function saveCurrentGame() { const gameState = { players: players, gameValue: gameValue, currentPlayerIndex: currentPlayerIndex, currentThrowIndex: currentThrowIndex, currentMultiplier: currentMultiplier, gameStarted: gameStarted, date: new Date().toISOString() }; localStorage.setItem(SAVED_GAME_KEY, JSON.stringify(gameState)); }
function checkSavedGame() { const savedGame = localStorage.getItem(SAVED_GAME_KEY); const loadBtn = document.getElementById('load-game-btn'); if (loadBtn) { loadBtn.style.display = (savedGame && !gameStarted) ? 'inline-block' : 'none'; } }
function loadSavedGame(gameState) {
    if (!gameState || !Array.isArray(gameState.players) || gameState.players.length === 0) { return; }
    players = gameState.players; gameValue = gameState.gameValue;
    currentPlayerIndex = gameState.currentPlayerIndex; currentThrowIndex = gameState.currentThrowIndex;
    currentMultiplier = gameState.currentMultiplier; gameStarted = true; 
    renderPlayers(); updateInputDisplay(); 
    const endGameBtn = document.getElementById('end-game-btn'); if (endGameBtn) endGameBtn.style.display = 'inline-block';
    document.querySelectorAll('#setup-section button:not([onclick="exportHistoryToJSON()"])').forEach(btn => btn.disabled = true);
    const historyButton = document.querySelector('a[href="history.html"] button'); if (historyButton) historyButton.disabled = true;
    document.getElementById('players-list').classList.add('game-active');
    localStorage.removeItem(SAVED_GAME_KEY);  checkSavedGame();
}


// --- NASTAVENÍ HRY A HRÁČE ---
function shufflePlayers() { 
    let currentIndex = players.length; let randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex); currentIndex--;
        [players[currentIndex], players[randomIndex]] = [players[randomIndex], players[currentIndex]];
    }
}
function addPlayer() { 
    if (gameStarted) return;
    const name = prompt("Zadejte jméno hráče:");
    if (name && players.length < 8 && !players.some(p => p.name.toLowerCase() === name.toLowerCase())) { 
        players.push({ name: name, score: 0, throws: [], currentRoundThrows: [0, 0, 0], stats: { doubles: 0, triples: 0 } });
        savePlayers();  renderPlayers();
    } else if (name) { alert("Hráč se stejným jménem už existuje nebo byl dosažen limit (8 hráčů)."); }
}
function removePlayer(name) { 
    if (gameStarted) return;
    if (confirm(`Opravdu chcete odebrat hráče ${name}?`)) {
        players = players.filter(p => p.name !== name);
        savePlayers(); renderPlayers();
    }
}

function startGame(value) {
    if (players.length === 0) { alert("Nejprve přidejte alespoň jednoho hráče!"); return; }
    if (players.length > 1) { 
        const confirmShuffle = confirm("Chcete náhodně zamíchat pořadí hráčů?");
        if (confirmShuffle) { shufflePlayers(); }
    }

    gameValue = value; gameStarted = true;
    players = players.map(p => ({
        name: p.name, score: gameValue, throws: [], currentRoundThrows: [0, 0, 0],
        stats: p.stats || { doubles: 0, triples: 0 }
    }));
    
    currentPlayerIndex = 0; currentThrowIndex = 0; currentMultiplier = 1; history = []; 
    speakText(`Začíná hru ${getCzechNumber(value)} na nulu. Hází ${players[currentPlayerIndex].name}`);

    // Aplikace stavové třídy
    document.getElementById('players-list').classList.add('game-active');

    saveState();  renderPlayers(); updateInputDisplay();
    
    document.querySelectorAll('#setup-section button:not([onclick="exportHistoryToJSON()"])').forEach(btn => btn.disabled = true);
    const historyButton = document.querySelector('a[href="history.html"] button'); if (historyButton) historyButton.disabled = true;
    
    const endGameBtn = document.getElementById('end-game-btn'); if (endGameBtn) endGameBtn.style.display = 'inline-block';
    checkSavedGame(); 
}

function promptEndGame() {
    if (!gameStarted) return;
    const action = confirm("Chcete hru uložit a ukončit, nebo ukončit bez uložení rozehraného stavu?\n\nStiskněte OK pro ULOŽIT A UKONČIT.\nStiskněte Storno pro UKONČIT BEZ ULOŽENÍ.");
    if (action) { saveCurrentGame(); alert("Hra byla uložena! Můžete ji načíst při příštím spuštění."); }
    else { localStorage.removeItem(SAVED_GAME_KEY); }
    
    gameStarted = false; gameValue = 0; currentThrowIndex = 0; currentMultiplier = 1;

    // Odebrání stavové třídy
    document.getElementById('players-list').classList.remove('game-active');

    document.querySelectorAll('#setup-section button').forEach(btn => btn.disabled = false);
    const historyButton = document.querySelector('a[href="history.html"] button'); if (historyButton) historyButton.disabled = false;
    
    const endGameBtn = document.getElementById('end-game-btn'); if (endGameBtn) endGameBtn.style.display = 'none';
    
    renderPlayers(); updateInputDisplay(); checkSavedGame(); 
}


// --- FUNKCE PRO ZOBRAZENÍ (RENDER) ---

function renderPlayers() {
    const list = document.getElementById('players-list');
    list.innerHTML = '';

    // Vykreslení mobilního shrnutí skóre (Mini-tabulka)
    const summaryDiv = document.getElementById('score-summary-mobile');
    let summaryContent = '';

    if (gameStarted && players.length > 1) {
        summaryDiv.style.display = 'block';
        const nonCurrentPlayers = players.filter((p, index) => index !== currentPlayerIndex);
        summaryContent += '<div class="score-summary-grid">';
        nonCurrentPlayers.forEach(player => {
            const score = player.score === 0 ? 'WIN' : player.score;
            summaryContent += `<span class="player-name">${player.name}:</span><span class="player-score">${score}</span>`;
        });
        summaryContent += '</div>';
        summaryDiv.innerHTML = '<h3>Ostatní hráči</h3>' + summaryContent;
    } else {
        summaryDiv.style.display = 'none';
    }


    // Fix: ZAJIŠTĚNÍ ZOBRAZENÍ KLÁVESNICE PO STARTU
    const dartInput = document.getElementById('dart-input');
    if (dartInput) {
        if (gameStarted) {
            dartInput.classList.remove('dart-input-hidden');
            dartInput.style.maxHeight = '500px'; 
            dartInput.style.opacity = '1';
        } else {
            dartInput.classList.add('dart-input-hidden');
            dartInput.style.maxHeight = '0';
            dartInput.style.opacity = '0';
        }
    }


    const savedGame = localStorage.getItem(SAVED_GAME_KEY);
    if (!gameStarted && savedGame) {
        const loadBtn = document.createElement('button');
        loadBtn.innerText = 'Načíst uloženou hru'; loadBtn.id = 'load-game-btn';
        loadBtn.style.backgroundColor = '#9b59b6'; loadBtn.style.marginRight = '10px';
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
            let throwVal = val;
            let className = '';

            if (isCurrent) {
                if (i === currentThrowIndex) {
                    throwVal = val * currentMultiplier; 
                    className = 'throw-current-input';
                } else if (i < currentThrowIndex) {
                    className = 'throw-recorded';
                } else {
                    className = 'throw-pending';
                }
            } else { throwVal = player.currentRoundThrows[i]; className = 'throw-recorded'; }
            return `<span class="${className}">${throwVal}</span>`;
        }).join(' | ');

        let infoText = '';
        
        if (isCurrent) {
            const required = player.score - currentRoundSum;
            infoText += `<p class="round-throws">Hody v kole: ${throws}</p>`;
            infoText += `<p>Potřeba: <strong class="round-needed">${required}</strong> (Součet: ${currentRoundSum})</p>`;
        } else if (gameStarted && !isCurrent) {
            const lastRoundScore = player.throws.length > 0 ? player.throws[player.throws.length - 1].totalRoundScore : '-';
            infoText = `<p class="last-round-score">Poslední kolo: ${lastRoundScore}</p>`;
        } else if (!gameStarted) { infoText = ''; }
        
        const removeBtn = gameStarted ? '' : 
            `<button onclick="removePlayer('${player.name}')" style="background-color: #c0392b; padding: 3px 8px; font-size: 0.8em; margin-top: 5px;">Odebrat</button>`;


        playerDiv.innerHTML = `
            <h3>${player.name} ${removeBtn}</h3>
            <p class="score-remaining">Zbývá: <strong>${scoreDisplay}</strong></p>
            ${infoText}
        `;
        list.appendChild(playerDiv);
    });
    checkSavedGame();
}

function renderScoreButtons() {
    const container = document.getElementById('score-buttons');
    container.innerHTML = '';
    const scoresToDisplay = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25];
    scoresToDisplay.forEach(score => {
        const btn = document.createElement('button');
        btn.innerText = score;
        if (score === 0) { btn.classList.add('zero-button'); }
        btn.onclick = () => recordThrow(score); 
        container.appendChild(btn);
    });
}

function updateInputDisplay() {
    const multiplierTextContainer = document.querySelector('#dart-input p');
    const doubleBtn = document.querySelector('[onclick="setMultiplier(2)"]');
    const tripleBtn = document.querySelector('[onclick="setMultiplier(3)"]');
    
    document.getElementById('current-player-name').innerText = players[currentPlayerIndex] ? players[currentPlayerIndex].name : 'Není vybrán';
    
    // Zajištění, že indikátor existuje
    let throwIndicator = document.getElementById('throw-indicator');
    if (!throwIndicator) {
        throwIndicator = document.createElement('span');
        throwIndicator.id = 'throw-indicator';
        const dartInput = document.getElementById('dart-input');
        if (dartInput) {
            dartInput.insertBefore(throwIndicator, dartInput.querySelector('h2'));
        }
    }
    throwIndicator.innerText = gameStarted ? `Šipka: ${currentThrowIndex + 1} / 3` : '';

    doubleBtn.classList.remove('active-multiplier');
    tripleBtn.classList.remove('active-multiplier');

    if (currentMultiplier === 2) {
        doubleBtn.classList.add('active-multiplier');
    } else if (currentMultiplier === 3) {
        tripleBtn.classList.add('active-multiplier');
    }
    
    // Skrytí redundantního textu (zajištěno v CSS)
    if (multiplierTextContainer) {
        multiplierTextContainer.style.display = 'none';
    }
}


function setMultiplier(multiplier) {
    if (!gameStarted) return;
    
    if (currentThrowIndex < 3) {
        // OPRAVENÁ LOGIKA: Přepínání/Zrušení násobitele
        if (currentMultiplier === multiplier) {
            currentMultiplier = 1; // Vypnuto
        } else {
            currentMultiplier = multiplier; // Zapnuto
        }
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
    
    // TTS: Hlasová odezva pro 1. a 2. hod
    if (currentThrowIndex < 2) {
        speakText(getCzechNumberByDigits(value)); 
    }
    
    if (currentMultiplier === 2) {
        player.stats.doubles++;
    } else if (currentMultiplier === 3) {
        player.stats.triples++;
    }
    
    currentMultiplier = 1; 
    currentThrowIndex++; 

    renderPlayers(); 
    updateInputDisplay(); 
    saveState();

    if (currentThrowIndex === 3) {
        endRound();
    }
}


function endRound() {
    const player = players[currentPlayerIndex];
    const totalScore = player.currentRoundThrows.reduce((a, b) => a + b, 0);
    const scoreBeforeRound = player.score;
    const newScore = scoreBeforeRound - totalScore; 
    let winner = false;
    let gameJustEnded = false; 
    const currentThrows = [...player.currentRoundThrows]; 

    // --- TTS SEKVENČNÍ LOGIKA ---
    
    const lastThrowText = getCzechNumberByDigits(currentThrows[2]);
    const lastThrowUtterance = speakText(lastThrowText);

    lastThrowUtterance.onend = function() {
        let announcementText = '';
        
        const totalScoreText = getCzechNumberByDigits(totalScore);
        const scoreBeforeRoundText = getCzechNumberByDigits(scoreBeforeRound);

        if (newScore === 0) {
            announcementText = `${player.name} vítězí! Celkem za kolo ${totalScoreText}.`; 
            winner = true;
            gameJustEnded = true;
            player.score = 0;
            gameStarted = false; 
            alert(`${player.name} VYHRÁVÁ hru!`);
        } else if (newScore < 0 || newScore === 1) { 
            announcementText = `Bust! Skóre ${scoreBeforeRoundText} zůstává. Celkem za kolo ${totalScoreText}.`;
            alert(`${player.name} hodil ${newScore === 1 ? 'jedna (nelze zavřít)' : 'pod nulu'}! Kolo se nepočítá (Bust).`);
            // Korekce statistik
            for (let i = 0; i < currentThrows.length; i++) {
                const throwValue = currentThrows[i];
                if (throwValue) {
                    if (throwValue % 3 === 0 && throwValue / 3 <= 20 && player.stats.triples > 0) { player.stats.triples--; } 
                    else if (throwValue % 2 === 0 && throwValue / 2 <= 20 && player.stats.doubles > 0) { player.stats.doubles--; }
                }
            }
        } else {
            player.score = newScore;
            announcementText = `Celkem za kolo ${totalScoreText}. Zbývá ${getCzechNumberByDigits(player.score)}`;
        }
        
        const nextAnnouncement = speakText(announcementText);
        
        nextAnnouncement.onend = function() {
            if (gameStarted) {
                currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
                speakText(`Na řadě je ${players[currentPlayerIndex].name}`);
            }
            finalizeRoundLogic(player, scoreBeforeRound, totalScore, currentThrows, newScore, gameJustEnded);
        };
    };
    
    function finalizeRoundLogic(player, scoreBeforeRound, totalScore, currentThrows, newScore, gameJustEnded) {
        player.throws.push({ 
            startScore: scoreBeforeRound, endScore: player.score, round: currentThrows, 
            totalRoundScore: totalScore, bust: (newScore < 0 || newScore === 1)
        });
        
        if (gameJustEnded) { 
            const gameResult = {
                gameType: gameValue, date: new Date().toISOString().slice(0, 10), winner: winner ? player.name : 'N/A',
                players: players.map(p => ({
                    name: p.name, finalScore: p.score, allThrows: p.throws, stats: p.stats
                }))
            };
            saveGameHistory(gameResult); localStorage.removeItem(SAVED_GAME_KEY);
        }
        player.currentRoundThrows = [0, 0, 0];
        currentThrowIndex = 0;
        
        saveState();  renderPlayers(); updateInputDisplay();

        if (!gameStarted) {
            document.querySelectorAll('#setup-section button').forEach(btn => btn.disabled = false);
            const historyButton = document.querySelector('a[href="history.html"] button'); if (historyButton) historyButton.disabled = false;
            const endGameBtn = document.getElementById('end-game-btn'); if (endGameBtn) endGameBtn.style.display = 'none'; 
            checkSavedGame();
        }
    }
}


function saveState() {
    const state = {
        players: JSON.parse(JSON.stringify(players)), currentPlayerIndex: currentPlayerIndex, currentThrowIndex: currentThrowIndex, currentMultiplier: currentMultiplier, gameStarted: gameStarted 
    };
    history.push(state);
    if (history.length > 50) {  history.shift(); }
    if (gameStarted) saveCurrentGame();
}

function undoLastThrow() {
    if (history.length <= 1) { alert("Nelze vrátit zpět, toto je první stav hry!"); return; }
    
    const lastState = history[history.length - 1]; 
    const previousPlayer = players[lastState.currentPlayerIndex];
    
    const lastThrowValue = lastState.players[lastState.currentPlayerIndex].currentRoundThrows[lastState.currentThrowIndex - 1];
    if (lastThrowValue) {
        if (lastThrowValue % 3 === 0 && lastThrowValue / 3 <= 20 && previousPlayer.stats.triples > 0) { previousPlayer.stats.triples--; } 
        else if (lastThrowValue % 2 === 0 && lastThrowValue / 2 <= 20 && previousPlayer.stats.doubles > 0) { previousPlayer.stats.doubles--; }
    }
    
    history.pop(); 
    const prevState = history[history.length - 1]; 

    players = JSON.parse(JSON.stringify(prevState.players));
    currentPlayerIndex = prevState.currentPlayerIndex;
    currentThrowIndex = prevState.currentThrowIndex;
    currentMultiplier = prevState.currentMultiplier;
    gameStarted = prevState.gameStarted;

    renderPlayers(); updateInputDisplay();
    
    const endGameBtn = document.getElementById('end-game-btn');
    const setupButtons = document.querySelectorAll('#setup-section button:not([onclick="exportHistoryToJSON()"])');
    const historyButton = document.querySelector('a[href="history.html"] button');

    if (gameStarted) {
        setupButtons.forEach(btn => btn.disabled = true);
        if (historyButton) historyButton.disabled = true;
        if (endGameBtn) endGameBtn.style.display = 'inline-block';
        speakText(`Vráceno. Na řadě je ${players[currentPlayerIndex].name}`);
        document.getElementById('players-list').classList.add('game-active');
    } else {
        setupButtons.forEach(btn => btn.disabled = false);
        if (historyButton) historyButton.disabled = false;
        if (endGameBtn) endGameBtn.style.display = 'none';
        document.getElementById('players-list').classList.remove('game-active');
    }
    
    checkSavedGame();
}

function exportHistoryToJSON() {
    if (players.every(p => p.throws.length === 0)) { alert("Žádné hody k exportování. Zahrajte alespoň jedno kolo."); return; }
    
    const data = JSON.stringify(players.map(p => ({
        name: p.name, gameType: gameValue, finalScore: p.score, history: p.throws
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

function clearAllData() {
    const confirmation = confirm(
        "VAROVÁNÍ: Opravdu chcete VYMAZAT VŠECHNA ULOŽENÁ DATA (historiu, hráče, rozehranou hru) z prohlížeče?\n\n" +
        "Tato akce je nevratná a vynuluje celou aplikaci."
    );

    if (confirmation) {
        localStorage.clear();
        alert("Všechna data byla vymazána. Aplikace bude nyní znovu načtena.");
        window.location.reload();
    }
}
