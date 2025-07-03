import React from 'react';
import { Crown, Home, RotateCw } from 'lucide-react';

const GameEndScreen = () => {
  // Placeholder data
  const players = ['Player 1', 'Player 2', 'Player 3'];
  const scoreHistory = [
    { round: 1, scores: [15, 0, 25] },
    { round: 2, scores: [28, 12, 50] },
    { round: 3, scores: [45, 20, 35] },
  ];
  const totals = [88, 32, 110];
  
  // New placeholder for podium data
  const podium = [
    { rank: 1, name: 'Player 2', score: 32 },
    { rank: 2, name: 'Player 1', score: 88 },
    { rank: 3, name: 'Player 3', score: 110 },
  ];
  const winner = podium[0].name;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 p-4 text-white">
      <div className="w-full max-w-lg mx-auto bg-slate-700 bg-opacity-50 rounded-2xl shadow-2xl p-6 md:p-8 border border-slate-600 text-center">
        
        <h1 className="text-4xl font-bold text-slate-300 mb-2">GAME OVER</h1>
        
        <div className="flex items-center justify-center gap-3 my-4">
          <Crown className="text-yellow-400" size={32} />
          <p className="text-2xl font-bold text-yellow-300">{winner} Wins!</p>
          <Crown className="text-yellow-400" size={32} />
        </div>

        {/* Podium Section */}
        <div className="my-6 space-y-2">
          <div className="flex items-center justify-center gap-3 text-xl">
            <span className="text-2xl">🥈</span>
            <span className="font-semibold text-slate-200">2nd: {podium[1].name}</span>
            <span className="text-slate-400">({podium[1].score} pts)</span>
          </div>
          <div className="flex items-center justify-center gap-3 text-lg">
            <span className="text-xl">🥉</span>
            <span className="font-semibold text-slate-300">3rd: {podium[2].name}</span>
            <span className="text-slate-400">({podium[2].score} pts)</span>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-600">
          <table className="min-w-full divide-y divide-slate-600">
            <thead className="bg-slate-800 bg-opacity-70">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Round
                </th>
                {players.map(name => (
                  <th key={name} scope="col" className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-slate-700 bg-opacity-50 divide-y divide-slate-600">
              {scoreHistory.map((roundData) => (
                <tr key={roundData.round}>
                  <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-300">
                    {roundData.round}
                  </td>
                  {roundData.scores.map((score, index) => (
                    <td key={index} className="px-4 py-3 whitespace-nowrap text-center text-slate-200">
                      {score}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-800 bg-opacity-70">
              <tr>
                <th scope="row" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Total
                </th>
                {totals.map((total, index) => (
                  <td key={index} className="px-4 py-3 text-center font-bold text-white">
                    {total}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="mt-8 space-y-4">
          <button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg flex items-center justify-center gap-2 transform hover:scale-105 transition-transform duration-200 ease-in-out disabled:bg-slate-600 disabled:cursor-not-allowed disabled:transform-none">
            <RotateCw size={20} />
            <span>Restart Game (Host only)</span>
          </button>
          <button className="w-full border-2 border-cyan-200 text-cyan-100 font-bold py-3 px-4 rounded-lg shadow-lg flex items-center justify-center gap-2 transform hover:scale-105 transition-transform duration-200 ease-in-out">
            <Home size={20} />
            <span>Leave to Lobby</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default GameEndScreen;
