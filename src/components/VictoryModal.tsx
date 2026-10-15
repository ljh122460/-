import React from 'react';
import { Trophy, RotateCcw, ArrowRight, DollarSign } from 'lucide-react';
import { calculateRaceReward, DifficultyLevel } from '../game/combat';

interface VictoryModalProps {
  score: number;
  knockouts: number;
  difficulty: DifficultyLevel;
  onNextRace: () => void;
  onOpenGarage: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  score,
  knockouts,
  difficulty,
  onNextRace,
  onOpenGarage,
}) => {
  const rewards = calculateRaceReward(1, knockouts, 8, difficulty);

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm select-none">
      <div className="w-full max-w-md bg-slate-900 border-2 border-amber-500/80 rounded-3xl p-6 md:p-8 shadow-2xl text-center flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
        {/* Trophy icon */}
        <div className="w-16 h-16 rounded-2xl bg-amber-950/80 border border-amber-500/60 flex items-center justify-center text-amber-400 mb-3 shadow-lg shadow-amber-950/50">
          <Trophy className="w-9 h-9" />
        </div>

        <h2 className="text-3xl font-black italic tracking-wide text-amber-400 mb-1 font-mono">
          VICTORY! 冲线夺冠
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          成功以第 1 名冲过终点线！全场暴走族向你致敬！
        </p>

        {/* Reward & Stats */}
        <div className="w-full grid grid-cols-3 gap-2.5 mb-6">
          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl">
            <div className="text-[10px] text-slate-400 font-bold uppercase">比赛奖金</div>
            <div className="text-xl font-black text-emerald-400 font-mono mt-0.5 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
              {rewards.prizeMoney}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl">
            <div className="text-[10px] text-slate-400 font-bold uppercase">本局总分</div>
            <div className="text-xl font-black text-amber-400 font-mono mt-0.5">
              {score.toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl">
            <div className="text-[10px] text-slate-400 font-bold uppercase">击飞对手</div>
            <div className="text-xl font-black text-rose-400 font-mono mt-0.5">
              {knockouts} <span className="text-xs text-slate-400 font-normal">人</span>
            </div>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            onClick={onNextRace}
            data-start="true"
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-base tracking-wider uppercase rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2"
          >
            <span>下一赛道 / 继续飙车</span>
            <ArrowRight className="w-5 h-5 text-slate-950" />
          </button>

          <button
            onClick={onOpenGarage}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition flex items-center justify-center gap-2"
          >
            <span>前往车库用奖金升级机车</span>
          </button>
        </div>
      </div>
    </div>
  );
};
