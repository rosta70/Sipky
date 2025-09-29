// script.js - Úpravy funkcí setMultiplier a updateInputDisplay

// ... (zbytek kódu) ...

function updateInputDisplay() {
    // Zde se nacházela redundantní informace o násobiteli.
    // Odstraníme její zobrazení na obrazovce (i v CSS ji skryjeme).
    const multiplierTextContainer = document.querySelector('#dart-input p');
    // const multiplierText = document.getElementById('current-multiplier'); // Tento prvek nebudeme používat
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

    // Resetování stavu tlačítek
    doubleBtn.classList.remove('active-multiplier');
    tripleBtn.classList.remove('active-multiplier');

    // NOVÁ LOGIKA: Skryjeme celý kontejner s textem násobitele
    if (multiplierTextContainer) {
        multiplierTextContainer.style.display = 'none';
    }

    // Nastavení aktivní třídy
    if (currentMultiplier === 2) {
        doubleBtn.classList.add('active-multiplier');
    } else if (currentMultiplier === 3) {
        tripleBtn.classList.add('active-multiplier');
    }
}


function setMultiplier(multiplier) {
    if (!gameStarted) return;
    
    if (currentThrowIndex < 3) {
        // KLÍČOVÁ ZMĚNA LOGIKY: Pokud je aktuální násobitel stejný, přepneme zpět na 1.
        if (currentMultiplier === multiplier) {
            currentMultiplier = 1; // Vypnuto
        } else {
            currentMultiplier = multiplier; // Zapnuto
        }
    }
    updateInputDisplay();
    renderPlayers(); 
}

// ... (zbytek kódu) ...
