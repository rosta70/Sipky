import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Type } from '@google/genai';

// API klíč je nutné nastavit v prostředí, kde je aplikace spuštěna.
// Např. pomocí Vite a .env souboru: VITE_API_KEY=váš_klíč
// V kódu se pak přistupuje přes import.meta.env.VITE_API_KEY
// Pro zjednodušení a dodržení pravidel zde předpokládáme, že process.env.API_KEY existuje.
let ai;
try {
  if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
} catch (e) {
  console.warn("API klíč pro Gemini není nastaven. Funkce AI hráče nebude dostupná.");
}


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
    
  const addAiPlayer = useCallback(() => {
    if (!ai) {
        alert("Funkce AI hráče je nedostupná. API klíč pro Gemini není nakonfigurován.");
        return;
    }
    const aiPlayerName = 'Gemini Bot';
    if (!players.find(p => p.name === aiPlayerName)) {
      setPlayers([...players, { name: aiPlayerName, score: gameMode, lastTurnThrows: [], wins: 0, isAI: true }]);
    }
  }, [players, gameMode]);

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

  const handleAITurn = useCallback(async () => {
    setIsAiThinking(true);
    const currentPlayer = players[currentPlayerIndex];
    speak(`${currentPlayer.name} přemýšlí.`);

    const throwSchema = {
      type: Type.OBJECT,
      properties: {
        value: { type: Type.NUMBER, description: "Číslo, které bylo trefeno (1-20, 25 pro bull)." },
        multiplier: { type: Type.NUMBER, description: "Násobič (1 pro single, 2 pro double, 3 pro triple)." },
        score: { type: Type.NUMBER, description: "Celkové skóre za hod (value * multiplier)." }
      },
      required: ["value", "multiplier", "score"]
    };
    const responseSchema = { type: Type.ARRAY, items: throwSchema, description: "Pole s maximálně třemi hody." };
    const prompt = `Jsi expert na šipky a hraješ hru ${gameMode} s ukončením na ${finishMode}. Tvůj aktuální stav je ${currentPlayer.score}. Cílem je vyhrát. Tvoje úroveň je středně pokročilá. Vrať mi tvé tři hody jako JSON pole objektů. Každý objekt reprezentuje jeden hod. Hraj realisticky, občas můžeš minout cíl a trefit sousední číslo. Pokud můžeš hru ukončit, pokus se o to. Pokud ne, připrav si co nejlepší pozici. Vždy vrať pole, i když je prázdné nebo má méně než 3 hody (např. při vítězství).`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash", contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: responseSchema },
        });

        const aiThrows = JSON.parse(response.text.trim());
        if (!Array.isArray(aiThrows)) throw new Error("AI response was not an array.");
        
        let turnThrowsForHistory = [];
        for (const aiThrow of aiThrows) {
            await new Promise(resolve => setTimeout(resolve, 1200));
            setCurrentThrows(prev => [...prev, aiThrow]);
            turnThrowsForHistory.push(aiThrow);
            
            let turnOutcome = 'continue';
            
            setPlayers(currentPlayers => {
                const updatedPlayers = JSON.parse(JSON.stringify(currentPlayers));
                const playerToUpdate = updatedPlayers[currentPlayerIndex];
                const newScore = playerToUpdate.score - aiThrow.score;

                if (newScore < 0 || newScore === 1) { // BUST
                    playerToUpdate.score = turnStartingScore;
                    speak(`Přešlap!`);
                    turnOutcome = 'bust';
                } else if (newScore === 0) { // WIN?
                    if (finishMode === 'double' && aiThrow.multiplier !== 2 && aiThrow.value !== 25) {
                        playerToUpdate.score = turnStartingScore;
                        speak(`Přešlap, špatný double!`);
                        turnOutcome = 'bust';
                    } else {
                        playerToUpdate.score = 0;
                        const winningTurn = { player: playerToUpdate.name, throws: turnThrowsForHistory, startingScore: turnStartingScore, endingScore: 0 };
                        if (currentGame) {
                            const finishedGame = { ...currentGame, endTime: new Date().toISOString(), winner: playerToUpdate.name, turns: [...currentGame.turns, winningTurn] };
                            setGameHistory(prev => [...prev, finishedGame]);
                            setCurrentGame(null);
                        }
                        const newWinner = { ...playerToUpdate, score: 0 };
                        setWinner(newWinner);
                        setView('winner');
                        speak(`Konec hry! Vítězem je ${newWinner.name}! Gratuluji!`);
                        turnOutcome = 'win';
                        return updatedPlayers.map(p => p.name === newWinner.name ? { ...p, score: 0, wins: p.wins + 1, lastTurnThrows: turnThrowsForHistory } : p);
                    }
                } else { // CONTINUE
                    playerToUpdate.score = newScore;
                    speak(`${aiThrow.score}`);
                }
                return updatedPlayers;
            });
            
            if (turnOutcome === 'bust' || turnOutcome === 'win') {
                if(turnOutcome === 'bust') recordAndNextPlayer(turnThrowsForHistory);
                setIsAiThinking(false);
                return;
            }
        }
        recordAndNextPlayer(turnThrowsForHistory);

    } catch (error) {
        console.error("Chyba při volání Gemini API:", error);
        speak("Omlouvám se, mám problém s myšlením. Přeskakuji kolo.");
        recordAndNextPlayer([]);
    } finally {
        setIsAiThinking(false);
    }
}, [players, currentPlayerIndex, gameMode, finishMode, speak, recordAndNextPlayer, turnStartingScore, currentGame]);

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

  const formatThrow = (t) => {
    if (!t || typeof t.value === 'undefined') return '?';
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
        <button onClick={() => fileInputRef.current?.click()} className="
