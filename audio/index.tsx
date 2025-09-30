import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';

type Throw = {
  value: number; // The base value hit (1-20, 25 for bull)
  multiplier: number; // 1, 2, or 3
  score: number; // The resulting score (value * multiplier)
};

type Player = {
  name: string;
  score: number;
  lastTurnThrows: Throw[];
  wins: number;
};

type Turn = {
    player: string;
    throws: Throw[];
    startingScore: number;
    endingScore: number;
};

type Game = {
    id: string;
    startTime: string;
    endTime: string | null;
    mode: GameMode;
    finishMode: FinishMode;
    winner: string | null;
    players: string[];
    turns: Turn[];
};

type View = 'setup' | 'game' | 'stats' | 'winner';
type GameMode = 101 | 301 | 501;
type FinishMode = 'double' | 'straight';

const checkoutGuide: { [key: number]: string } = {
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

const App = () => {
  const [view, setView] = useState<View>('setup');
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameHistory, setGameHistory] = useState<Game[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [gameMode, setGameMode] = useState<GameMode>(501);
  const [finishMode, setFinishMode] = useState<FinishMode>('double');
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentThrows, setCurrentThrows] = useState<Throw[]>([]);
  const [multiplier, setMultiplier] = useState(1);
  const [winner, setWinner] = useState<Player | null>(null);
  const [turnStartingScore, setTurnStartingScore] = useState<number>(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState<'restart' | 'setup' | null>(null);
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

   useEffect(() => {
    try {
      const savedState = window.localStorage.getItem('darts-scorer-state');
      if (savedState) {
        const { players: savedPlayers, gameHistory: savedHistory } = JSON.parse(savedState);
        if (savedPlayers) setPlayers(savedPlayers.map((p: any) => ({...p, score: 0, lastTurnThrows: []})));
        if (savedHistory) setGameHistory(savedHistory);
      }
    } catch (error) {
      console.error("Failed to load state from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
       const stateToSave = { players: players.map(({ name, wins }) => ({ name, wins })), gameHistory };
       window.localStorage.setItem('darts-scorer-state', JSON.stringify(stateToSave));
    } catch (error) {
      console.error("Failed to save state to localStorage", error);
    }
  }, [players, gameHistory]);

  const speak = useCallback((text: string) => {
    try {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'cs-CZ';
        utterance.rate = 0.9;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      }
    } catch (error: any) {
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
      setPlayers([...players, { name: newPlayerName.trim(), score: gameMode, lastTurnThrows: [], wins: 0 }]);
      setNewPlayerName('');
    }
  }, [newPlayerName, players, gameMode]);

  const removePlayer = useCallback((name: string) => {
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
       const newGame: Game = {
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
    
  const recordAndNextPlayer = useCallback((lastThrows: Throw[]) => {
      const currentPlayer = players[currentPlayerIndex];
      const newTurn: Turn = {
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

 const handleScore = useCallback((score: number) => {
    const throwScore = score * multiplier;
    const newThrow: Throw = { value: score, multiplier, score: throwScore };
    const newThrows = [...currentThrows, newThrow];
    setCurrentThrows(newThrows);

    const updatedPlayers = [...players];
    const currentPlayer = updatedPlayers[currentPlayerIndex];
    const newScore = currentPlayer.score - throwScore;

    if (newScore < 0 || newScore === 1) { // Bust
      currentPlayer.score = turnStartingScore;
      setPlayers(updatedPlayers);
      speak(`Přešlap! ${currentPlayer.name} má zpět ${turnStartingScore}.`);
      recordAndNextPlayer(newThrows);
      return;
    }

    if (newScore === 0) { // Winner
      if (finishMode === 'double' && multiplier !== 2 && score !== 25) { // Bull (50) is D25
         currentPlayer.score = turnStartingScore;
         setPlayers(updatedPlayers);
         speak(`Přešlap! Hru je nutné ukončit doublem. ${currentPlayer.name} má zpět ${turnStartingScore}.`);
         recordAndNextPlayer(newThrows);
         return;
      }
        
      const winningTurn: Turn = {
        player: currentPlayer.name,
        throws: newThrows,
        startingScore: turnStartingScore,
        endingScore: 0,
      };

      if (currentGame) {
        const finishedGame: Game = {
            ...currentGame,
            endTime: new Date().toISOString(),
            winner: currentPlayer.name,
            turns: [...currentGame.turns, winningTurn],
        };
        setGameHistory(prevHistory => [...prevHistory, finishedGame]);
        setCurrentGame(null);
      }

      const newWinner = { ...currentPlayer, score: 0 };
      setWinner(newWinner);
      setPlayers(players.map(p => p.name === newWinner.name ? { ...p, score: 0, wins: p.wins + 1, lastTurnThrows: newThrows } : p));
      setView('winner');
      speak(`Konec hry! Vítězem je ${newWinner.name}! Gratuluji!`);
      return;
    }

    currentPlayer.score = newScore;
    setPlayers(updatedPlayers);
    speak(`${throwScore}`);
    setMultiplier(1);

    if (newThrows.length === 3) {
      recordAndNextPlayer(newThrows);
    }
  }, [currentThrows, multiplier, players, currentPlayerIndex, turnStartingScore, recordAndNextPlayer, speak, finishMode, currentGame]);
    
  const handleMultiplier = useCallback((m: number) => {
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
      players: players.map(({ name, wins }) => ({ name, wins })),
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

  const handleImportHistory = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target?.result;
            if (typeof text !== 'string') throw new Error("File is not readable");
            const importedState = JSON.parse(text);
            if (importedState.players && importedState.gameHistory) {
                setPlayers(importedState.players.map((p: any) => ({...p, score: 0, lastTurnThrows: []})));
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

  const formatThrow = (t: Throw): string => {
    if (t.value === 25) return t.multiplier === 2 ? 'D-BULL' : 'BULL';
    switch (t.multiplier) {
        case 3: return `T${t.value}`;
        case 2: return `D${t.value}`;
        default: return `${t.value}`;
    }
  };


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
      </div>
      <ul className="player-list-setup">
        {players.map(p => (
          <li key={p.name}>
            {p.name}
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
        <button onClick={() => fileInputRef.current?.click()} className="secondary-btn">Importovat historii</button>
        <input type="file" ref={fileInputRef} onChange={handleImportHistory} style={{display: 'none'}} accept=".json"/>
      </div>
    </div>
  );

  const renderGameScreen = () => {
      if (players.length === 0) return renderSetupScreen();
      const currentPlayer = players[currentPlayerIndex];

      return (
        <div className="game-container">
            <div className="scoreboard">
                <h2>Skóre</h2>
                {players.map((p, index) => (
                    <div key={p.name} className={`player-card ${index === currentPlayerIndex ? 'active' : ''}`}>
                        <div className="player-card-header">
                            <h3>{p.name}</h3>
                            <span className="player-wins">Výhry: {p.wins}</span>
                        </div>
                        <div className="score" key={`${p.name}-${p.score}`}>{p.score}</div>
                        {index === currentPlayerIndex && checkoutGuide[p.score] && (
                            <div className="checkout-suggestion">
                                <span role="img" aria-label="Target">🎯</span> Doporučení: <strong>{checkoutGuide[p.score]}</strong>
                            </div>
                        )}
                        <div className="turn-info">
                            {index === currentPlayerIndex ? (
                                <div className="current-throws-container">
                                    {currentThrows.map((t, i) => (
                                        <span key={i} className={`throw-pill multiplier-${t.multiplier}`}>
                                            {formatThrow(t)}
                                        </span>
                                    ))}
                                    {[...Array(3 - currentThrows.length)].map((_, i) => (
                                       <span key={`placeholder-${i}`} className="throw-pill placeholder"></span>
                                    ))}
                                </div>
                            ) : (
                                <span className="last-turn-throws">
                                  Poslední kolo: {p.lastTurnThrows.length > 0 ? p.lastTurnThrows.map(formatThrow).join(' | ') : 'N/A'}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <div className="controls">
                <h3>{`Na řadě: ${currentPlayer.name}`}</h3>
                 <div className="multiplier-controls">
                    <button onClick={() => handleMultiplier(2)} className={`multiplier-btn ${multiplier === 2 ? 'active' : ''}`}>Dvojnásobek (D)</button>
                    <button onClick={() => handleMultiplier(3)} className={`multiplier-btn ${multiplier === 3 ? 'active' : ''}`}>Trojnásobek (T)</button>
                </div>
                <div className="numpad">
                    {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
                        <button key={num} onClick={() => handleScore(num)} className="numpad-btn">{num}</button>
                    ))}
                    <button onClick={() => handleScore(25)} className="numpad-btn bull-btn">Bull (25/50)</button>
                    <button onClick={() => handleScore(0)} className="numpad-btn miss-btn">Chyba / 0</button>
                </div>
                <div className="action-controls">
                    <button onClick={handleUndo} className="action-btn" disabled={currentThrows.length === 0}>Vrátit hod</button>
                </div>
            </div>
        </div>
    );
  };
    
  const renderWinnerScreen = () => (
    <div className="winner-screen">
        <h2>Vítěz!</h2>
        <p>{winner?.name}</p>
        <button onClick={startGame}>Nová hra</button>
        <button onClick={() => setView('setup')}>Změnit nastavení</button>
    </div>
  );

  const calculatePlayerStats = (players: Player[], history: Game[]) => {
      const stats: { [key: string]: any } = {};

      players.forEach(p => {
          stats[p.name] = {
              totalThrows: 0,
              totalScore: 0,
              singles: {},
              doubles: {},
              triples: {},
          };
      });

      history.forEach(game => {
          game.turns.forEach(turn => {
              if (!stats[turn.player]) return;
              turn.throws.forEach(throwData => {
                  if (typeof throwData !== 'object' || throwData === null) return;

                  stats[turn.player].totalThrows++;
                  stats[turn.player].totalScore += throwData.score;

                  if (throwData.multiplier === 1) {
                      stats[turn.player].singles[throwData.value] = (stats[turn.player].singles[throwData.value] || 0) + 1;
                  } else if (throwData.multiplier === 2) {
                      stats[turn.player].doubles[throwData.value] = (stats[turn.player].doubles[throwData.value] || 0) + 1;
                  } else if (throwData.multiplier === 3) {
                      stats[turn.player].triples[throwData.value] = (stats[turn.player].triples[throwData.value] || 0) + 1;
                  }
              });
          });
      });

      const findMostFrequent = (freqMap: { [key: number]: number }) => {
          if (Object.keys(freqMap).length === 0) return null;
          const mostFrequent = Object.entries(freqMap).sort((a, b) => b[1] - a[1])[0];
          return { value: parseInt(mostFrequent[0]), count: mostFrequent[1] };
      };

      return players.map(p => {
          const pStats = stats[p.name];
          return {
              name: p.name,
              wins: p.wins,
              averagePerThrow: pStats.totalThrows > 0 ? (pStats.totalScore / pStats.totalThrows).toFixed(2) : '0.00',
              mostFrequentSingle: findMostFrequent(pStats.singles),
              mostFrequentDouble: findMostFrequent(pStats.doubles),
              mostFrequentTriple: findMostFrequent(pStats.triples),
          };
      });
  };


  const renderStatsScreen = () => {
    const detailedStats = calculatePlayerStats(players, gameHistory);

    return (
        <div className="stats-container">
            <div className="stats-header">
                <h2>Statistiky</h2>
                <button onClick={handleDownloadHistory} disabled={players.length === 0} className="secondary-btn">Stáhnout historii (JSON)</button>
            </div>
            <h3>Celkové pořadí</h3>
            <table>
                <thead>
                    <tr>
                        <th>Pořadí</th>
                        <th>Jméno</th>
                        <th>Výhry</th>
                    </tr>
                </thead>
                <tbody>
                    {[...players].sort((a, b) => b.wins - a.wins).map((p, index) => (
                        <tr key={p.name}>
                            <td>{index + 1}.</td>
                            <td>{p.name}</td>
                            <td>{p.wins}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <h3 className="history-title">Podrobné statistiky hráčů</h3>
            <div className="player-stats-grid">
                {detailedStats.map(stat => (
                    <div key={stat.name} className="player-stats-card">
                        <h4>{stat.name}</h4>
                        <div className="stat-item">
                            <span>Průměr na šipku:</span>
                            <strong>{stat.averagePerThrow !== '0.00' ? stat.averagePerThrow : 'N/A'}</strong>
                        </div>
                        <div className="stat-item">
                            <span>Nejčastější Single:</span>
                            <strong>{stat.mostFrequentSingle ? `${stat.mostFrequentSingle.value} (${stat.mostFrequentSingle.count}x)` : 'N/A'}</strong>
                        </div>
                        <div className="stat-item">
                            <span>Nejčastější Double:</span>
                            <strong>{stat.mostFrequentDouble ? `D${stat.mostFrequentDouble.value} (${stat.mostFrequentDouble.count}x)` : 'N/A'}</strong>
                        </div>
                        <div className="stat-item">
                            <span>Nejčastější Triple:</span>
                            <strong>{stat.mostFrequentTriple ? `T${stat.mostFrequentTriple.value} (${stat.mostFrequentTriple.count}x)` : 'N/A'}</strong>
                        </div>
                    </div>
                ))}
            </div>

            <h3 className="history-title">Historie Her</h3>
            <div className="game-history">
                {gameHistory.length > 0 ? [...gameHistory].reverse().map(game => (
                    <details key={game.id} className="history-entry">
                        <summary className="history-summary">
                            <span><strong>{new Date(game.startTime).toLocaleString('cs-CZ')}</strong></span>
                            <span>Mód: {game.mode}</span>
                            <span>Vítěz: <strong>{game.winner || 'N/A'}</strong></span>
                        </summary>
                        <div className="history-details">
                            <table className="turn-table">
                                <thead>
                                    <tr>
                                        <th>Hráč</th>
                                        <th>Start</th>
                                        <th>Hody</th>
                                        <th>Celkem</th>
                                        <th>Zůstatek</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {game.turns.map((turn, index) => {
                                        const turnThrows = Array.isArray(turn.throws) 
                                            ? (turn.throws as any[]).map(t => t?.score ?? t)
                                            : [];
                                        const totalTurnScore = turnThrows.reduce((a, b) => a + (b || 0), 0);
                                        return (
                                            <tr key={index}>
                                                <td>{turn.player}</td>
                                                <td>{turn.startingScore}</td>
                                                <td>{turnThrows.join(', ')}</td>
                                                <td>{totalTurnScore}</td>
                                                <td>{turn.endingScore}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </details>
                )) : <p>Zatím nebyly odehrány žádné hry.</p>}
            </div>
        </div>
    );
};

    const renderGameMenuModal = () => {
        if (!isMenuOpen) return null;

        const closeMenu = () => {
            setIsMenuOpen(false);
            setConfirmationAction(null);
        };

        const performRestart = () => {
            handleRestartGame();
            closeMenu();
        };

        const performBackToSetup = () => {
            handleBackToSetup();
            closeMenu();
        };
        
        const performShowStats = () => {
            setView('stats');
            closeMenu();
        };

        return (
            <div className="modal-overlay">
                <div className="modal-content">
                    {!confirmationAction && (
                        <>
                            <h2>Menu</h2>
                            <button onClick={() => setConfirmationAction('restart')}>Nová hra</button>
                            <button onClick={() => setConfirmationAction('setup')}>Zpět do nastavení</button>
                             <button onClick={performShowStats}>Statistiky</button>
                            <button onClick={closeMenu} className="secondary-btn">Pokračovat ve hře</button>
                        </>
                    )}
                    {confirmationAction === 'restart' && (
                        <>
                            <h2>Nová hra</h2>
                            <p className="confirmation-message">Opravdu chcete restartovat hru? Aktuální postup bude ztracen.</p>
                            <button onClick={performRestart}>Ano, restartovat</button>
                            <button onClick={() => setConfirmationAction(null)} className="secondary-btn">Zrušit</button>
                        </>
                    )}
                    {confirmationAction === 'setup' && (
                         <>
                            <h2>Zpět do nastavení</h2>
                            <p className="confirmation-message">Opravdu chcete opustit hru a vrátit se do nastavení?</p>
                            <button onClick={performBackToSetup}>Ano, vrátit se</button>
                            <button onClick={() => setConfirmationAction(null)} className="secondary-btn">Zrušit</button>
                        </>
                    )}
                </div>
            </div>
        );
    };

  return (
    <div className="app-container">
      {renderGameMenuModal()}
      <header>
        <h1>Počítadlo Šipek</h1>
        <div className="header-actions">
            {view === 'game' && (
              <div className="header-game-controls">
                  <button onClick={() => setIsMenuOpen(true)}>Menu</button>
              </div>
            )}
            <div className="view-switcher">
                <button
                    onClick={() => (view === 'game' || view === 'winner') ? setView('game') : setView('setup')}
                    className={view === 'setup' || view === 'game' || view === 'winner' ? 'active' : ''}>
                    {(view === 'game' || view === 'winner') ? 'Hra' : 'Nastavení'}
                </button>
                <button
                    onClick={() => setView('stats')}
                    className={view === 'stats' ? 'active' : ''}
                    disabled={players.length === 0}>
                    Statistiky
                </button>
            </div>
        </div>
      </header>
      <main>
        <div key={view}>
            {view === 'setup' && renderSetupScreen()}
            {view === 'game' && renderGameScreen()}
            {view === 'winner' && renderWinnerScreen()}
            {view === 'stats' && renderStatsScreen()}
        </div>
      </main>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
    console.error('Root element with id "root" not found in the document.');
}