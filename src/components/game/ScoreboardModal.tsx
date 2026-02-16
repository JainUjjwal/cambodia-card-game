import React from 'react';
import { X } from 'lucide-react';

interface ScoreboardModalProps {
  players: any[];
  roundHistory: any[];
  onClose: () => void;
}

const ScoreboardModal = ({ players, roundHistory, onClose }: ScoreboardModalProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="relative bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl p-6 max-w-2xl w-full text-white">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold mb-6 text-cyan-300 text-center">Scoreboard</h2>

        <div className="overflow-x-auto rounded-lg border border-slate-700">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Round</th>
                {players.map(p => (
                  <th key={p.id} className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase">{p.name}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {roundHistory.map((round, idx) => (
                <tr key={idx} className="bg-slate-800">
                  <td className="px-4 py-3 text-sm text-slate-300">{idx + 1}</td>
                  {players.map(p => {
                    const isCaller = round.callerId === p.id;
                    const score = round.scores[p.id];
                    const isSuccess = isCaller && score === 0;
                    return (
                      <td key={p.id} className="px-4 py-3 text-center text-sm">
                        <span className={`${isCaller ? (isSuccess ? 'text-green-400 font-bold' : 'text-red-400') : 'text-slate-200'}`}>
                          {score}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-900 font-bold">
              <tr>
                <td className="px-4 py-3 text-sm text-cyan-300 uppercase">Total</td>
                {players.map(p => (
                  <td key={p.id} className="px-4 py-3 text-center text-sm text-white">{p.score}</td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
        
        {roundHistory.length === 0 && (
          <p className="text-center text-slate-500 my-8 italic">No rounds completed yet.</p>
        )}
      </div>
    </div>
  );
};

export default ScoreboardModal;
