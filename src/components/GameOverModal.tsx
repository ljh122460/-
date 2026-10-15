import React from 'react';
import { RotateCcw, Wrench, Trophy, Skull } from 'lucide-react';

interface GameOverModalProps {
  score: number;
  highScore: number;
  knockouts: number;
  onRestart: () => void;
  onOpenGarage: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  highScore,
  knockouts,
  onRestart,
  onOpenGarage,
}) => {
  const isNewRecord = score > highScore;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm select-none">
      <div className="w-full max-w-md bg-slate-900 border-2 border-red-600/80 rounded-3xl p-6 md:p-8 shadow-2xl text-center flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
        {/* Skull icon */}
        <div className="w-16 h-16 rounded-2xl bg-red-950/80 border border-red-500/60 flex items-center justify-center text-red-500 mb-3 shadow-lg shadow-red-950/50">
          <Skull className="w-9 h-9" />
        </div>

        <h2 className="text-3xl font-black italic tracking-wide text-red-500 mb-1 font-mono">
          GAME OVER
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          3 条生命已全数损耗！重机车损毁，被送往救护站...
        </p>

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-2 gap-3 mb-6">
          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl">
            <div className="text-[10px] text-slate-400 font-bold uppercase">最终得分 FINAL SCORE</div>
            <div className="text-2xl font-black text-amber-400 font-mono mt-0.5">
              {score.toLocaleString()}
            </div>
            {isNewRecord && (
              <span className="text-[10px] text-emerald-400 font-bold flex items-center justify-center gap-1 mt-0.5">
                <Trophy className="w-3 h-3" /> 新纪录！
              </span>
            )}
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl">
            <div className="text-[10px] text-slate-400 font-bold uppercase">击倒对手 KNOCKOUTS</div>
            <div className="text-2xl font-black text-rose-400 font-mono mt-0.5">
              {knockouts} <span className="text-xs text-slate-400 font-normal">人</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            onClick={onRestart}
            data-start="true"
            className="w-full py-3.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-slate-950 font-black text-base tracking-wider uppercase rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5 text-slate-950" />
            <span>重新挑战 (3条生命)</span>
          </button>

          <button
            onClick={onOpenGarage}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition flex items-center justify-center gap-2"
          >
            <Wrench className="w-4 h-4 text-amber-400" />
            <span>前往车库改装重机车与武器</span>
          </button>
        </div>
      </div>
    </div>
  );
};
