import React, { useState, useEffect } from 'react';
import './TicTacToe.css';

type Player = 'X' | 'O';
type Cell = Player | null;
type Opponent = 'human' | 'computer';
type Difficulty = 'easy' | 'medium' | 'hard';
type Phase = 'setup' | 'coinflip' | 'playing' | 'gameover';

interface ScoreState {
  player1: number;
  player2: number;
  draws: number;
}

const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function checkWinner(board: Cell[]): { winner: Player; line: number[] } | null {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a] as Player, line };
    }
  }
  return null;
}

function isBoardFull(board: Cell[]): boolean {
  return board.every(cell => cell !== null);
}

function minimax(
  board: Cell[],
  isMaximizing: boolean,
  aiMark: Player,
  humanMark: Player
): number {
  const result = checkWinner(board);
  if (result) return result.winner === aiMark ? 10 : -10;
  if (isBoardFull(board)) return 0;

  const moves = board.reduce<number[]>((acc, cell, i) => (!cell ? [...acc, i] : acc), []);

  if (isMaximizing) {
    let best = -Infinity;
    for (const i of moves) {
      board[i] = aiMark;
      best = Math.max(best, minimax(board, false, aiMark, humanMark));
      board[i] = null;
    }
    return best;
  } else {
    let best = Infinity;
    for (const i of moves) {
      board[i] = humanMark;
      best = Math.min(best, minimax(board, true, aiMark, humanMark));
      board[i] = null;
    }
    return best;
  }
}

function getBestMove(board: Cell[], aiMark: Player): number {
  const humanMark: Player = aiMark === 'X' ? 'O' : 'X';
  let bestVal = -Infinity;
  let bestMove = -1;
  const workingBoard = [...board];
  for (let i = 0; i < 9; i++) {
    if (!workingBoard[i]) {
      workingBoard[i] = aiMark;
      const val = minimax(workingBoard, false, aiMark, humanMark);
      workingBoard[i] = null;
      if (val > bestVal) {
        bestVal = val;
        bestMove = i;
      }
    }
  }
  return bestMove;
}

function getComputerMove(board: Cell[], aiMark: Player, difficulty: Difficulty): number {
  const empty = board.reduce<number[]>((acc, cell, i) => (!cell ? [...acc, i] : acc), []);
  if (difficulty === 'easy') {
    return empty[Math.floor(Math.random() * empty.length)];
  }
  if (difficulty === 'medium' && Math.random() < 0.5) {
    return empty[Math.floor(Math.random() * empty.length)];
  }
  return getBestMove([...board], aiMark);
}

const DIFFICULTY_HINTS: Record<Difficulty, string> = {
  easy: 'Computer plays randomly',
  medium: 'Computer makes occasional mistakes',
  hard: 'Computer plays perfectly — unbeatable',
};

const TicTacToe: React.FC = () => {
  const [phase, setPhase] = useState<Phase>('setup');
  const [opponent, setOpponent] = useState<Opponent>('human');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [player1Name, setPlayer1Name] = useState('Player 1');
  const [player2Name, setPlayer2Name] = useState('Player 2');

  // xIsPlayer1: true = player1 is X (goes first), false = player2 is X
  const [xIsPlayer1, setXIsPlayer1] = useState(true);
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [currentTurn, setCurrentTurn] = useState<Player>('X');
  const [winResult, setWinResult] = useState<{ winner: Player; line: number[] } | null>(null);
  const [isDraw, setIsDraw] = useState(false);
  const [scores, setScores] = useState<ScoreState>({ player1: 0, player2: 0, draws: 0 });
  const [computerThinking, setComputerThinking] = useState(false);
  const [coinFlipMessage, setCoinFlipMessage] = useState('');

  // Derived values
  const xName = xIsPlayer1 ? player1Name : player2Name;
  const oName = xIsPlayer1 ? player2Name : player1Name;
  // In computer mode: computer is always player2
  const computerMark: Player | null = opponent === 'computer'
    ? (xIsPlayer1 ? 'O' : 'X')
    : null;
  const isComputerTurn =
    opponent === 'computer' &&
    computerMark === currentTurn &&
    phase === 'playing';

  const startRound = (keepScores: boolean, p1Name = player1Name, p2Name = player2Name) => {
    const player1GoesFirst = Math.random() < 0.5;
    const firstPlayerName = player1GoesFirst ? p1Name : p2Name;
    setXIsPlayer1(player1GoesFirst);
    setCoinFlipMessage(`${firstPlayerName} goes first!`);
    setBoard(Array(9).fill(null));
    setCurrentTurn('X');
    setWinResult(null);
    setIsDraw(false);
    setComputerThinking(false);
    if (!keepScores) setScores({ player1: 0, player2: 0, draws: 0 });
    setPhase('coinflip');
    setTimeout(() => setPhase('playing'), 1800);
  };

  // Computer move effect
  useEffect(() => {
    if (!isComputerTurn || !computerMark || winResult || isDraw) return;

    setComputerThinking(true);
    const timer = setTimeout(() => {
      const move = getComputerMove([...board], computerMark, difficulty);
      const newBoard = [...board];
      newBoard[move] = computerMark;
      const result = checkWinner(newBoard);
      setBoard(newBoard);
      setComputerThinking(false);

      if (result) {
        setWinResult(result);
        setScores(prev => ({ ...prev, player2: prev.player2 + 1 }));
        setPhase('gameover');
      } else if (isBoardFull(newBoard)) {
        setIsDraw(true);
        setScores(prev => ({ ...prev, draws: prev.draws + 1 }));
        setPhase('gameover');
      } else {
        setCurrentTurn(prev => (prev === 'X' ? 'O' : 'X'));
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [isComputerTurn, board, computerMark, difficulty, winResult, isDraw]);

  const handleCellClick = (index: number) => {
    if (
      phase !== 'playing' ||
      board[index] ||
      winResult ||
      isDraw ||
      isComputerTurn ||
      computerThinking
    ) return;

    const newBoard = [...board];
    newBoard[index] = currentTurn;
    const result = checkWinner(newBoard);
    setBoard(newBoard);

    if (result) {
      setWinResult(result);
      // winnerIsPlayer1: X wins & player1 is X, OR O wins & player1 is O
      const winnerIsPlayer1 = (result.winner === 'X') === xIsPlayer1;
      setScores(prev => ({
        ...prev,
        player1: winnerIsPlayer1 ? prev.player1 + 1 : prev.player1,
        player2: !winnerIsPlayer1 ? prev.player2 + 1 : prev.player2,
      }));
      setPhase('gameover');
    } else if (isBoardFull(newBoard)) {
      setIsDraw(true);
      setScores(prev => ({ ...prev, draws: prev.draws + 1 }));
      setPhase('gameover');
    } else {
      setCurrentTurn(prev => (prev === 'X' ? 'O' : 'X'));
    }
  };

  const getStatusMessage = (): string => {
    if (phase === 'coinflip') return coinFlipMessage;
    if (phase === 'gameover') {
      if (isDraw) return "It's a draw!";
      const winnerName = winResult?.winner === 'X' ? xName : oName;
      return `${winnerName} wins!`;
    }
    if (computerThinking) return 'Computer is thinking...';
    const turnName = currentTurn === 'X' ? xName : oName;
    return `${turnName}'s turn (${currentTurn})`;
  };

  const resetToSetup = () => {
    setPhase('setup');
    setBoard(Array(9).fill(null));
    setWinResult(null);
    setIsDraw(false);
    setComputerThinking(false);
    setScores({ player1: 0, player2: 0, draws: 0 });
  };

  // ── Setup Screen ──────────────────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div className="ttt-container">
        <div className="ttt-setup-card">
          <h1 className="ttt-title">Tic Tac Toe</h1>

          <div className="ttt-setup-section">
            <span className="ttt-label">Opponent</span>
            <div className="ttt-toggle-group">
              <button
                className={`ttt-toggle-btn ${opponent === 'human' ? 'active' : ''}`}
                onClick={() => { setOpponent('human'); setPlayer2Name('Player 2'); }}
              >
                vs Human
              </button>
              <button
                className={`ttt-toggle-btn ${opponent === 'computer' ? 'active' : ''}`}
                onClick={() => { setOpponent('computer'); setPlayer2Name('Computer'); }}
              >
                vs Computer
              </button>
            </div>
          </div>

          {opponent === 'computer' && (
            <div className="ttt-setup-section">
              <span className="ttt-label">Difficulty</span>
              <div className="ttt-toggle-group">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                  <button
                    key={d}
                    className={`ttt-toggle-btn ${difficulty === d ? 'active' : ''}`}
                    onClick={() => setDifficulty(d)}
                  >
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>
              <p className="ttt-hint">{DIFFICULTY_HINTS[difficulty]}</p>
            </div>
          )}

          <div className="ttt-setup-section">
            <label className="ttt-label" htmlFor="p1name">
              {opponent === 'computer' ? 'Your Name' : 'Player 1 Name'}
            </label>
            <input
              id="p1name"
              className="ttt-name-input"
              value={player1Name}
              onChange={e => setPlayer1Name(e.target.value || 'Player 1')}
              maxLength={20}
            />
          </div>

          {opponent === 'human' && (
            <div className="ttt-setup-section">
              <label className="ttt-label" htmlFor="p2name">Player 2 Name</label>
              <input
                id="p2name"
                className="ttt-name-input"
                value={player2Name}
                onChange={e => setPlayer2Name(e.target.value || 'Player 2')}
                maxLength={20}
              />
            </div>
          )}

          <button className="ttt-start-btn" onClick={() => startRound(false)}>
            Start Game
          </button>
        </div>
      </div>
    );
  }

  // ── Coin Flip Screen ──────────────────────────────────────────────────────
  if (phase === 'coinflip') {
    return (
      <div className="ttt-container">
        <div className="ttt-game-card ttt-coinflip-card">
          <div className="ttt-coinflip-dice">&#9856;</div>
          <h2 className="ttt-coinflip-heading">{coinFlipMessage}</h2>
          <div className="ttt-coinflip-marks">
            <div className="ttt-coinflip-mark-row">
              <span className="ttt-mark ttt-x ttt-coinflip-symbol">X</span>
              <span className="ttt-coinflip-mark-name">{xName}</span>
            </div>
            <div className="ttt-coinflip-divider">·</div>
            <div className="ttt-coinflip-mark-row">
              <span className="ttt-mark ttt-o ttt-coinflip-symbol">O</span>
              <span className="ttt-coinflip-mark-name">{oName}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Game Screen ───────────────────────────────────────────────────────────
  const statusClass = [
    'ttt-status',
    phase === 'gameover' && isDraw ? 'ttt-status-draw' : '',
    phase === 'gameover' && !isDraw ? 'ttt-status-win' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className="ttt-container">
      <div className="ttt-game-card">
        <h1 className="ttt-title">Tic Tac Toe</h1>

        {/* Scoreboard */}
        <div className="ttt-scores">
          <div className="ttt-score-item">
            <span className="ttt-score-name">{player1Name}</span>
            <span className="ttt-score-value">{scores.player1}</span>
          </div>
          <div className="ttt-score-item ttt-score-draws">
            <span className="ttt-score-name">Draws</span>
            <span className="ttt-score-value">{scores.draws}</span>
          </div>
          <div className="ttt-score-item">
            <span className="ttt-score-name">{player2Name}</span>
            <span className="ttt-score-value">{scores.player2}</span>
          </div>
        </div>

        {/* X / O assignment */}
        <div className="ttt-legend">
          <span className="ttt-mark ttt-x">X</span> {xName}
          &nbsp;·&nbsp;
          <span className="ttt-mark ttt-o">O</span> {oName}
        </div>

        {/* Status message */}
        <div className={statusClass}>{getStatusMessage()}</div>

        {/* Board */}
        <div className={`ttt-board ${phase === 'playing' ? (currentTurn === 'X' ? 'ttt-board--x-turn' : 'ttt-board--o-turn') : ''}`}>
          {board.map((cell, i) => {
            const isWinCell = winResult?.line.includes(i);
            return (
              <button
                key={i}
                className={[
                  'ttt-cell',
                  cell === 'X' ? 'ttt-cell-x' : '',
                  cell === 'O' ? 'ttt-cell-o' : '',
                  isWinCell ? (winResult?.winner === 'X' ? 'ttt-cell-win-x' : 'ttt-cell-win-o') : '',
                ].filter(Boolean).join(' ')}
                onClick={() => handleCellClick(i)}
                disabled={
                  !!cell ||
                  phase !== 'playing' ||
                  isComputerTurn ||
                  computerThinking
                }
              >
                {cell}
              </button>
            );
          })}
        </div>

        {/* Game-over actions */}
        {phase === 'gameover' && (
          <div className="ttt-actions">
            <button
              className="ttt-btn ttt-btn-primary"
              onClick={() => startRound(true)}
            >
              Play Again
            </button>
            <button
              className="ttt-btn ttt-btn-secondary"
              onClick={resetToSetup}
            >
              New Game
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicTacToe;
