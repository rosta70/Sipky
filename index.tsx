// FIX: Add React and ReactDOM imports to resolve UMD global errors and use the modern createRoot API.
import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';

const checkoutGuide = {
  170: 'T20, T20, D-BULL', 167: 'T20, T19, D-BULL', 164: 'T20, T18, D-BULL', 161: 'T20, T17, D-BULL',
  160: 'T20, T20, D20', 158: 'T20, T20, D19', 157: 'T20, T19, D20', 156: 'T20, T20, D18',
  155: 'T20, T19, D19', 154: 'T20, T18, D20', 153: 'T20, T19, D18', 152: 'T20, T20, D16',
  151: 'T20, T17, D20', 150: 'T20, T18, D18', 149: 'T20, T19, D16', 148: 'T20, T16, D20',
  147: 'T20, T17, D18', 146: 'T20, T18, D16', 145: 'T20, T15, D20', 144: 'T20, T20, D12',
  143: 'T20, T17, D16', 142: 'T20, T14, D20', 141: 'T20, T19, D12', 140: 'T20, T20, D10',
  139: 'T19, T14, D20', 138: 'T20, T18, D12', 137: 'T19, T16, D16', 136: 'T20, T20, D8',
  135: 'BULL, T15, D20', 134: 'T20, T14, D16', 133: 'T20, T19, D8', 132: 'T20, T20, D6',
  131: 'T20, T13, D16', 130: 'T20, 20, D-BULL', 129: 'T19, T16, D12', 128: 'T18, T14, D16',
  127: 'T20, T17, D8', 126: 'T19, 19, D-BULL', 125: 'BULL, T15, D10', 124: 'T20, 18, D-BULL',
  123: 'T19, T16, D9', 122: 'T18, T20, D4', 121: 'T20, 11, D-BULL', 120: 'T20, 20, D20',
  119: 'T19, 12, D-BULL', 118: 'T20, 18, D20', 117: 'T20, 17, D20', 116: 'T20, 16, D20',
  115: 'T20, 15, D20', 114: 'T20, 14, D20', 113: 'T20, 13, D20', 112: 'T20, 12, D20',
  111: 'T20, 11, D20', 110: 'T20, 10, D20', 109: 'T19, 12, D20', 108: 'T20, 8, D20',
  107: 'T19, 10, D20', 106: 'T20, 6, D20', 105: 'T20, 5, D20', 104: 'T18, 10, D20',
  103: 'T19, 6, D20', 102: 'T20, 2, D20', 101: 'T17, 10, D20', 100: 'T20, D20',
  99: 'T19, 10, D16', 98: 'T20, D19', 97: 'T19, D20', 96: 'T20, D18', 95: 'T19, D19',
  94: 'T18, D20', 93: 'T19, D18', 92: 'T20, D16', 91: 'T17, D20', 90: 'T20, D15',
  89: 'T19, D16', 88: 'T20, D14', 87: 'T17, D18', 86: 'T18, D16', 85: 'T15, D20',
  84: 'T20, D12', 83: 'T17, D16', 82: 'T14, D20', 81: 'T19, D12', 80: 'T20, D10',
  79: 'T13, D20', 78: 'T18, D12', 77: 'T19, D10', 76: 'T20, D8', 75: 'T17, D12',
  74: 'T14, D16', 73: 'T19, D8', 72: 'T16, D12', 71: 'T13, D16', 70: 'T10, D20',
  69: 'T19, D6', 68: 'T20, D4', 67: 'T17, D8', 66: 'T10, D18', 65: 'T19, D4',
  64: 'T16, D8', 63: 'T13, D12', 62: 'T10, D16', 61: 'T15, D8', 60: '20, D20',
  59: '19, D20', 58: '18, D20', 57: '17, D20', 56: '16, D20', 55: '15, D20',
  54: '14, D20', 53: '13, D20', 52: '12, D20', 51: '19, D16', 50: '10, D20',
  49: '9, D20', 48: '16, D16', 47: '15, D16', 46: '6, D20', 45: '13, D16',
  44: '12, D16', 43: '3, D20', 42: '10, D16', 41: '9, D16', 40: 'D20',
  39: '7, D16', 38: 'D19', 37: '5, D16', 36: 'D18', 35: '3, D16', 34: 'D17',
  33: '1, D16', 32: 'D16', 31: '15, D8', 30: 'D15', 29: '13, D8', 28: 'D14',
  27: '19, D4', 26: 'D13', 25: '17, D4', 24: 'D12', 23: '7, D8', 22: 'D11',
  21: '13, D4', 20: 'D10', 19: '11, D4', 18: 'D9', 17: '9, D4', 16: 'D8',
  15: '7, D4', 14: 'D7', 13: '5, D4', 12: 'D6', 11: '3, D4', 10: 'D5',
  9: '1, D4', 8: 'D4', 7: '3, D2', 6: 'D3', 5: '1, D2', 4: 'D2', 3: '1, D1', 2: 'D1',
};

const formatThrow = (t) => {
    if (!t || typeof t.value === 'undefined') return '?';
    if (t.value === 25) return t.multiplier === 2 ? 'D-BULL' : 'BULL';
    switch (t.multiplier) {
        case 3: return `T${t.value}`;
        case 2: return `D${t.value}`;
        default: return `${t.value}`;
    }
};

const HistoryEntry = ({ game }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    return(
      <div className="history-entry">
        <div className="history-summary" onClick={() => setIsExpanded(!isExpanded)}>
            <span><strong>Vítěz: {game.winner}</strong> ({game.mode}, {new Date(game.startTime).toLocaleString('cs-CZ')})</span>
            <span>{isExpanded ? '⌃' : '⌄'}</span>
        </div>
        {isExpanded && (
          <div className="history-details">
            <table className="turn-table">
              <thead>
                <tr>
                  <th>Hráč</th>
                  <th>Hody</th>
                  <th>Skóre kola</th>
                  <th>Zbývalo</th>
                </tr>
              </thead>
              <tbody>
                {game.turns.map((turn, i) => (
                  <tr key={i}>
                    <td>{turn.player}</td>
                    <td>{turn.throws.map(formatThrow).join(', ')}</td>
                    <td>{turn.throws.reduce((acc, t) => acc + t.score, 0)}</td>
                    <td>{turn.startingScore} → {turn.endingScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
};

const App = () => {
  const [view, setView] = useState('setup');
  const [players, setPlayers] = useState([]);
  const [gameHistory, setGameHistory] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [gameMode, setGameMode] = useState(501);
  const [finishMode, setFinishMode] = useState('double');
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentThrows, setCurrentThrows] = useState([]);
  const [multiplier, setMultiplier] = useState(1);
  const [winner, setWinner] = useState(null);
  const [turnStartingScore, setTurnStartingScore] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState(null);
  const [currentGame, setCurrentGame] = useState(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const fileInputRef = useRef(null);

   useEffect(() => {
    try {
      const savedState = window.localStorage.getItem('darts-scorer-state');
      if (savedState) {
        const { players: savedPlayers, gameHistory: savedHistory } = JSON.parse(savedState);
        if (savedPlayers) setPlayers(savedPlayers.map((p) => ({...p, score: 0, lastTurnThrows: [], isAI: p.isAI || false })));
        if (savedHistory) setGameHistory(savedHistory);
      }
    } catch (error) {
      console.error("Failed to load state from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
       const stateToSave = { players: players.map(({ name, wins, isAI }) => ({ name, wins, isAI })), gameHistory };
       window.localStorage.setItem('darts-scorer-state', JSON.stringify(stateToSave));
    } catch (error) {
      console.error("Failed to save state to localStorage", error);
    }
  }, [players, gameHistory]);


  const speak = useCallback((text) => {
    try {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'cs-CZ';
        utterance.rate = 0.9;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error("Chyba při syntéze řeči:", error);
    }
  }, []);

  useEffect(() => {
      if(view === 'game' && players.length > 0) {
          setTurnStartingScore(players[currentPlayerIndex].score);
      }
  }, [currentPlayerIndex, players, view]);


  const addPlayer = useCallback(() => {
    if (newPlayerName.trim() && !players.find(p => p.name === newPlayerName.trim())) {
      setPlayers([...players, { name: newPlayerName.trim(), score: gameMode, lastTurnThrows: [], wins: 0, isAI: false }]);
      setNewPlayerName('');
    }
  }, [newPlayerName, players, gameMode]);
    
  // AI hráč je v online verzi nedostupný
  const addAiPlayer = useCallback(() => {
    alert('Funkce AI soupeře není v této online verzi dostupná z bezpečnostních důvodů (vyžaduje API klíč). Aplikace je plně funkční pro hru více hráčů.');
  }, []);

  const removePlayer = useCallback((name) => {
    setPlayers(players.filter(p => p.name !== name));
  }, [players]);

  const startGame = useCallback(() => {
    if (players.length > 0) {
      const initialPlayers = players.map(p => ({...p, score: gameMode, lastTurnThrows: [] }));
      setPlayers(initialPlayers);
      setCurrentPlayerIndex(0);
      setCurrentThrows([]);
      setWinner(null);
      setView('game');
      setTurnStartingScore(gameMode);
       const newGame = {
        id: `game-${Date.now()}`,
        startTime: new Date().toISOString(),
        endTime: null,
        mode: gameMode,
        finishMode,
        winner: null,
        players: initialPlayers.map(p => p.name),
        turns: [],
      };
      setCurrentGame(newGame);
      speak(`Nová hra ${gameMode} byla zahájena. Začíná ${initialPlayers[0].name}.`);
    }
  }, [players, gameMode, finishMode, speak]);
    
  const recordAndNextPlayer = useCallback((lastThrows) => {
      const currentPlayer = players[currentPlayerIndex];
      const newTurn = {
          player: currentPlayer.name,
          throws: lastThrows,
          startingScore: turnStartingScore,
          endingScore: currentPlayer.score,
      };
      
      setCurrentGame(prevGame => {
          if (!prevGame) return null;
          return {...prevGame, turns: [...prevGame.turns, newTurn]};
      });

      setPlayers(prevPlayers => {
          const updatedPlayers = [...prevPlayers];
          updatedPlayers[currentPlayerIndex] = {
              ...updatedPlayers[currentPlayerIndex],
              lastTurnThrows: lastThrows,
          };
          return updatedPlayers;
      });

      const nextIndex = (currentPlayerIndex + 1) % players.length;
      setCurrentPlayerIndex(nextIndex);
      setCurrentThrows([]);
      setMultiplier(1);
      speak(`${players[nextIndex].name}, jsi na řadě. Zbývá ti ${players[nextIndex].score}.`);
  }, [currentPlayerIndex, players, turnStartingScore, speak]);

 const handleScore = useCallback((score) => {
    const throwScore = score * multiplier;
    const newThrow = { value: score, multiplier, score: throwScore };
    const newThrows = [...currentThrows, newThrow];
    setCurrentThrows(newThrows);

    setPlayers(currentPlayers => {
        const updatedPlayers = [...currentPlayers];
        const currentPlayer = updatedPlayers[currentPlayerIndex];
        const newScore = currentPlayer.score - throwScore;

        if (newScore < 0 || newScore === 1) { // Bust
          currentPlayer.score = turnStartingScore;
          speak(`Přešlap! ${currentPlayer.name} má zpět ${turnStartingScore}.`);
          recordAndNextPlayer(newThrows);
          return updatedPlayers;
        }

        if (newScore === 0) { // Winner
          if (finishMode === 'double' && multiplier !== 2 && score !== 25) { // Bull (50) is D25
             currentPlayer.score = turnStartingScore;
             speak(`Přešlap! Hru je nutné ukončit doublem. ${currentPlayer.name} má zpět ${turnStartingScore}.`);
             recordAndNextPlayer(newThrows);
             return updatedPlayers;
          }
            
          const winningTurn = { player: currentPlayer.name, throws: newThrows, startingScore: turnStartingScore, endingScore: 0};
          if (currentGame) {
            const finishedGame = { ...currentGame, endTime: new Date().toISOString(), winner: currentPlayer.name, turns: [...currentGame.turns, winningTurn] };
            setGameHistory(prevHistory => [...prevHistory, finishedGame]);
            setCurrentGame(null);
          }

          const newWinner = { ...currentPlayer, score: 0 };
          setWinner(newWinner);
          setView('winner');
          speak(`Konec hry! Vítězem je ${newWinner.name}! Gratuluji!`);
          // Update wins count in the final player list
          return updatedPlayers.map(p => p.name === newWinner.name ? { ...p, score: 0, wins: p.wins + 1, lastTurnThrows: newThrows } : p);
        }

        currentPlayer.score = newScore;
        speak(`${throwScore}`);
        setMultiplier(1);

        if (newThrows.length === 3) {
          recordAndNextPlayer(newThrows);
        }
        return updatedPlayers;
    });
  }, [currentThrows, multiplier, players, currentPlayerIndex, turnStartingScore, recordAndNextPlayer, speak, finishMode, currentGame]);

  // Tato funkce se nyní nikdy nezavolá, protože nelze přidat AI hráče.
  // Je zde ponechána pro případné budoucí použití v jiném prostředí.
  const handleAITurn = useCallback(async () => {
    setIsAiThinking(true);
    speak("Simulace AI není dostupná, přeskakuji kolo.");
    await new Promise(resolve => setTimeout(resolve, 1500));
    recordAndNextPlayer([]);
    setIsAiThinking(false);
  }, [speak, recordAndNextPlayer]);


  useEffect(() => {
    if (view === 'game' && players.length > 0 && players[currentPlayerIndex]?.isAI && !winner && !isAiThinking) {
        const timer = setTimeout(() => { handleAITurn(); }, 1500);
        return () => clearTimeout(timer);
    }
  }, [view, currentPlayerIndex, players, winner, isAiThinking, handleAITurn]);
    
  const handleMultiplier = useCallback((m) => {
    setMultiplier(current => (current === m ? 1 : m));
  }, []);

  const handleUndo = useCallback(() => {
    if (currentThrows.length > 0) {
      const lastThrow = currentThrows[currentThrows.length - 1];
      const newThrows = currentThrows.slice(0, -1);
      
      setPlayers(prevPlayers => {
          const updatedPlayers = [...prevPlayers];
          const currentPlayer = updatedPlayers[currentPlayerIndex];
          currentPlayer.score += lastThrow.score;
          return updatedPlayers;
      });

      setCurrentThrows(newThrows);
      setMultiplier(1);
    }
  }, [currentThrows, currentPlayerIndex]);

  const handleRestartGame = useCallback(() => {
    setCurrentGame(null);
    startGame();
  }, [startGame]);

  const handleBackToSetup = useCallback(() => {
      setView('setup');
      setCurrentThrows([]);
      setMultiplier(1);
      setCurrentPlayerIndex(0);
      setWinner(null);
      setCurrentGame(null);
  }, []);

  const handleDownloadHistory = useCallback(() => {
    const stateToSave = {
      players: players.map(({ name, wins, isAI }) => ({ name, wins, isAI })),
      gameHistory
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(stateToSave, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "darts_history.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }, [players, gameHistory]);

  const handleImportHistory = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target?.result;
            if (typeof text !== 'string') throw new Error("File is not readable");
            const importedState = JSON.parse(text);
            if (importedState.players && importedState.gameHistory) {
                setPlayers(importedState.players.map((p) => ({...p, score: 0, lastTurnThrows: [], isAI: p.isAI || false })));
                setGameHistory(importedState.gameHistory);
                alert("Historie byla úspěšně importována!");
            } else {
                throw new Error("Invalid file structure");
            }
        } catch (error) {
            console.error("Failed to import history:", error);
            alert("Chyba při importu historie. Soubor je poškozený nebo má nesprávný formát.");
        }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  }, []);

  const renderSetupScreen = () => (
    <div className="setup-container">
      <h2>Nastavení hry</h2>
      <div className="player-input">
        <input
          type="text"
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value)}
          placeholder="Jméno hráče"
          onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
        />
        <button onClick={addPlayer} disabled={!newPlayerName.trim()}>Přidat</button>
        <button onClick={addAiPlayer} className="ai-btn">Přidat AI</button>
      </div>
      <ul className="player-list-setup">
        {players.map(p => (
          <li key={p.name}>
            <span>{p.name} {p.isAI && <span className="bot-tag">BOT</span>}</span>
            <button onClick={() => removePlayer(p.name)}>X</button>
          </li>
        ))}
      </ul>
      <div className="mode-selector">
        <label>Mód hry:</label>
        <button onClick={() => setGameMode(101)} className={gameMode === 101 ? 'active' : ''}>101</button>
        <button onClick={() => setGameMode(301)} className={gameMode === 301 ? 'active' : ''}>301</button>
        <button onClick={() => setGameMode(501)} className={gameMode === 501 ? 'active' : ''}>501</button>
      </div>
       <div className="mode-selector">
        <label>Způsob ukončení:</label>
        <button onClick={() => setFinishMode('double')} className={finishMode === 'double' ? 'active' : ''}>Double Out</button>
        <button onClick={() => setFinishMode('straight')} className={finishMode === 'straight' ? 'active' : ''}>Standardní nula</button>
      </div>
      <div className="setup-actions">
        <button onClick={startGame} disabled={players.length < 1} className="start-game-btn">
          Zahájit hru
        </button>
        <button onClick={() => fileInputRef.current?.click()} className="secondary-btn">Importovat data</button>
        <input type="file" ref={fileInputRef} onChange={handleImportHistory} style={{ display: 'none' }} accept=".json" />
      </div>
    </div>
  );
  
   const renderPlayerCard = (player, index) => {
    const isActive = index === currentPlayerIndex;
    const turnThrows = currentThrows.length > 0 && isActive ? currentThrows : player.lastTurnThrows;
    const totalTurnScore = turnThrows.reduce((sum, t) => sum + (t?.score || 0), 0);
    const checkout = player.score <= 170 && player.score > 1 && checkoutGuide[player.score];

    return (
        <div key={player.name} className={`player-card ${isActive ? 'active' : ''}`}>
            <div className="player-card-header">
                <h3>{player.name} {player.isAI && <span className="bot-tag">BOT</span>}</h3>
                <span className="player-wins">Výhry: {player.wins}</span>
            </div>
            <div className="score">{player.score}</div>
             {isActive && isAiThinking && <div className="turn-info">Gemini přemýšlí...</div>}
             {!isAiThinking && checkout && (
                <div className="checkout-suggestion">
                    <span>Doporučené zavření:</span> <strong>{checkout}</strong>
                </div>
             )}
            <div className="turn-info">
              {turnThrows.length > 0 && (
                <>
                  <span className="last-turn-throws">
                    {turnThrows.map(formatThrow).join(' | ')}
                  </span>
                  &nbsp;({totalTurnScore})
                </>
              )}
            </div>
        </div>
    );
  };
    
  const renderGameScreen = () => {
    const currentPlayer = players[currentPlayerIndex];
    if (!currentPlayer) return <div>Načítání...</div>;

    const isPlayerTurn = !currentPlayer.isAI && !isAiThinking;

    return (
      <div className="game-container">
        <header>
          <div className="view-switcher">
            <button onClick={() => setView('game')} className="active">Hra</button>
            <button onClick={() => setView('stats')}>Statistiky</button>
          </div>
          <div className="header-game-controls">
            <button onClick={() => setConfirmationAction({ title: 'Restartovat hru?', message: 'Opravdu chcete restartovat aktuální hru?', onConfirm: handleRestartGame })}>Restart</button>
            <button onClick={() => setConfirmationAction({ title: 'Ukončit hru?', message: 'Opravdu chcete ukončit hru a vrátit se do nastavení?', onConfirm: handleBackToSetup })}>Nová hra</button>
          </div>
        </header>
        <main>
          <div className="scoreboard">
            {players.map(renderPlayerCard)}
          </div>
          <div className="controls">
            <div className="current-throws-container">
              {[...currentThrows, ...Array(3 - currentThrows.length)].map((t, i) => (
                <div key={i} className={`throw-pill ${t ? 'multiplier-' + t.multiplier : 'placeholder'}`}>
                  {t ? formatThrow(t) : '–'}
                </div>
              ))}
            </div>
            <div className="multiplier-controls">
              <button onClick={() => handleMultiplier(2)} className={`multiplier-btn ${multiplier === 2 ? 'active' : ''}`} disabled={!isPlayerTurn}>Double (x2)</button>
              <button onClick={() => handleMultiplier(3)} className={`multiplier-btn ${multiplier === 3 ? 'active' : ''}`} disabled={!isPlayerTurn}>Triple (x3)</button>
            </div>
            <div className="numpad">
              {[...Array(20).keys()].map(i => (
                <button key={i + 1} onClick={() => handleScore(i + 1)} className="numpad-btn" disabled={!isPlayerTurn}>{i + 1}</button>
              ))}
              <button onClick={() => handleScore(25)} className="numpad-btn bull-btn" disabled={!isPlayerTurn}>BULL</button>
              <button onClick={() => handleScore(0)} className="numpad-btn miss-btn" disabled={!isPlayerTurn}>MISS</button>
            </div>
            <div className="action-controls">
                <button onClick={handleUndo} className="action-btn" disabled={currentThrows.length === 0 || !isPlayerTurn}>Vrátit hod</button>
                <button onClick={() => recordAndNextPlayer(currentThrows)} className="action-btn" disabled={!isPlayerTurn}>Další hráč</button>
            </div>
          </div>
        </main>
      </div>
    );
  };
    
  const renderWinnerScreen = () => (
    <div className="winner-screen">
      <h2>Konec Hry!</h2>
      <p>Vítězem je {winner?.name || 'nikdo'}!</p>
      <button onClick={handleRestartGame}>Hrát znovu</button>
      <button onClick={handleBackToSetup} className="secondary-btn">Zpět do nastavení</button>
    </div>
  );

  const renderStatsScreen = () => {
    const allTurns = gameHistory.flatMap(g => g.turns);
    const playerStats = players.map(player => {
        const playerTurns = allTurns.filter(t => t.player === player.name);
        const totalThrowsCount = playerTurns.reduce((sum, turn) => sum + turn.throws.length, 0);
        const totalScore = playerTurns.reduce((sum, turn) => sum + turn.throws.reduce((ts, t) => ts + t.score, 0), 0);
        
        let bestTurnScore = 0;
        playerTurns.forEach(turn => {
            const turnScore = turn.throws.reduce((acc, t) => acc + t.score, 0);
            if (turnScore > bestTurnScore) {
                bestTurnScore = turnScore;
            }
        });

        const averageTurnScore = playerTurns.length > 0 ? (totalScore / playerTurns.length).toFixed(1) : 0;
        const averageDartScore = totalThrowsCount > 0 ? (totalScore / totalThrowsCount).toFixed(1) : 0;

        return {
            name: player.name,
            wins: player.wins,
            gamesPlayed: gameHistory.filter(g => g.players.includes(player.name)).length,
            averageTurnScore,
            averageDartScore,
            bestTurnScore,
        };
    });

    return (
        <>
        <header>
            <div className="view-switcher">
                <button onClick={() => setView('game')}>Hra</button>
                <button onClick={() => setView('stats')} className="active">Statistiky</button>
            </div>
            <div className="header-game-controls">
                <button onClick={() => setConfirmationAction({ title: 'Vymazat historii?', message: 'Opravdu chcete smazat všechny hráče a kompletní herní historii?', onConfirm: () => { setPlayers([]); setGameHistory([]); } })}>Vymazat vše</button>
                <button onClick={handleDownloadHistory}>Exportovat data</button>
            </div>
        </header>
        <main>
            <div className="stats-container">
              <h2>Celkové statistiky</h2>
               <div className="player-stats-grid">
                  {playerStats.map(stats => (
                      <div key={stats.name} className="player-stats-card">
                          <h4>{stats.name}</h4>
                          <div className="stat-item"><span>Výhry</span> <strong>{stats.wins}</strong></div>
                          <div className="stat-item"><span>Odehrané hry</span> <strong>{stats.gamesPlayed}</strong></div>
                          <div className="stat-item"><span>Průměr na 3 šipky</span> <strong>{stats.averageTurnScore}</strong></div>
                          <div className="stat-item"><span>Průměr na 1 šipku</span> <strong>{stats.averageDartScore}</strong></div>
                          <div className="stat-item"><span>Nejlepší kolo</span> <strong>{stats.bestTurnScore}</strong></div>
                      </div>
                  ))}
               </div>
                
                <h3 className="history-title">Historie her</h3>
                <div className="game-history">
                    {gameHistory.length > 0 ? (
                      [...gameHistory].reverse().map(game => <HistoryEntry key={game.id} game={game} />)
                    ) : (
                      <p>Zatím nebyly odehrány žádné hry.</p>
                    )}
                </div>
            </div>
        </main>
       </>
    );
  };
    
  const renderConfirmationModal = () => {
    if (!confirmationAction) return null;
    const { title, message, onConfirm } = confirmationAction;

    return (
        <div className="modal-overlay" onClick={() => setConfirmationAction(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>{title}</h2>
                <p className="confirmation-message">{message}</p>
                <button onClick={() => { onConfirm(); setConfirmationAction(null); }}>Potvrdit</button>
                <button className="secondary-btn" onClick={() => setConfirmationAction(null)}>Zrušit</button>
            </div>
        </div>
    );
  };

  const renderContent = () => {
    switch (view) {
      case 'game':
        return renderGameScreen();
      case 'winner':
        return renderWinnerScreen();
      case 'stats':
          return renderStatsScreen();
      case 'setup':
      default:
        return (
            <>
                <header>
                    <h1>Počítadlo Šipek</h1>
                </header>
                <main>{renderSetupScreen()}</main>
            </>
        )
    }
  };

  return (
    <div className="app-container">
        {renderContent()}
        {renderConfirmationModal()}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
