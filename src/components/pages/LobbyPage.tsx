import React from 'react';
import { Book, Copy, User, CheckCircle, Clock } from 'lucide-react';

const LobbyPage = () => {
  // This is placeholder data. We will replace it with real data from Firebase later.
  const players = [
    { name: 'Player 1 (Host)', isReady: true },
    { name: 'Player 2', isReady: true },
    { name: 'Player 3', isReady: false },
  ];
  const gameCode = 'K4F8T1';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 p-4 text-white">
      <div className="w-full max-w-md mx-auto bg-slate-700 bg-opacity-50 rounded-2xl shadow-2xl p-6 border border-slate-600">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-cyan-300">Game Lobby</h1>
          <button className="text-slate-400 hover:text-cyan-300 transition-colors">
            <Book size={24} />
          </button>
        </div>

        <div className="mb-6 p-4 bg-slate-800 rounded-lg text-center">
          <p className="text-sm text-slate-400 mb-1">Share this code to invite players:</p>
          <div className="flex items-center justify-center gap-4">
            <p className="text-2xl font-mono tracking-widest text-white">{gameCode}</p>
            <button className="p-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg transition-colors">
              <Copy size={20} />
            </button>
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="turn-timer" className="block text-sm font-medium text-slate-300 mb-2">
            Turn Timer (Host only)
          </label>
          <select
            id="turn-timer"
            className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-white focus:ring-cyan-500 focus:border-cyan-500"
          >
            <option>15 seconds</option>
            <option>30 seconds</option>
            <option>45 seconds</option>
            <option>No Timer</option>
          </select>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold mb-2 text-slate-300">Players ({players.length}/6)</h2>
          {players.map((player, index) => (
            <div key={index} className="flex items-center justify-between bg-slate-800 p-3 rounded-lg">
              <div className="flex items-center gap-3">
                <User className="text-slate-400" size={20} />
                <span className="font-medium">{player.name}</span>
              </div>
              {player.isReady ? (
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle size={20} />
                  <span>Ready</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-yellow-400">
                  <Clock size={20} />
                  <span>Waiting...</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8">
          <button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-200 ease-in-out disabled:bg-slate-600 disabled:cursor-not-allowed disabled:transform-none">
            Start Game
          </button>
          <p className="text-center text-xs text-slate-400 mt-2">Only the host can start the game when all players are ready.</p>
        </div>
      </div>
    </div>
  );
};

export default LobbyPage;
