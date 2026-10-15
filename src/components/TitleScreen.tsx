import React from 'react';
import { DifficultyLevel, DIFFICULTY_SETTINGS } from '../game/combat';
import { Sparkles, Trophy, ShieldAlert, Zap } from 'lucide-react';

interface TitleScreenProps {
  difficulty: DifficultyLevel;
  trackIndex: number;
  onSelectDifficulty: (diff: DifficultyLevel) => void;
  onSelectTrack: (trackIdx: number) => void;
  onStartGame: () => void;
  onOpenGarage: () => void;
  onOpenAiStudio: () => void;
  highScore: number;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  difficulty,
  trackIndex,
  onSelectDifficulty,
  onSelectTrack,
  onStartGame,
  onOpenGarage,
  onOpenAiStudio,
  highScore,
}) => {
  const tracks = [
    { id: 0, name: '加州沿海一号公路', desc: '落日海风与棕榈悬崖 · 经典畅快' },
    { id: 1, name: '内华达荒漠峡谷', desc: '红岩热浪与高速直道 · 极限时速' },
    { id: 2, name: '赛博霓虹午夜环线', desc: '雨夜都市高速与立交急弯 · 极高对抗' },
  ];

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-between items-center p-6 md:p-10 bg-gradient-to-b from-slate-950 via-slate-900 to-black text-slate-100 overflow-y-auto">
      {/* Top Banner / High Score & AI Quick Links */}
      <div className="w-full max-w-5xl flex justify-between items-center">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-amber-300">最高纪录 HIGH SCORE:</span>
          <span className="text-sm font-mono font-black text-amber-400">{highScore.toLocaleString()}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenGarage}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <span>🛠️ 机车改装</span>
          </button>
          <button
            onClick={onOpenAiStudio}
            className="px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI 概念车工坊 (1K/2K/4K)</span>
          </button>
        </div>
      </div>

      {/* Centerpiece: Arcade Emblem & Title */}
      <div className="flex flex-col items-center text-center my-auto max-w-2xl">
        {/* Custom Retro 90s Road Rash SVG Lockup */}
        <div className="relative mb-2">
          <svg viewBox="0 0 600 130" className="w-full max-w-lg filter drop-shadow-[0_10px_25px_rgba(239,68,68,0.5)]">
            <defs>
              <linearGradient id="titleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="40%" stopColor="#f59e0b" />
                <stop offset="70%" stopColor="#dc2626" />
                <stop offset="100%" stopColor="#7f1d1d" />
              </linearGradient>
              <linearGradient id="chromeTitle" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="50%" stopColor="#94a3b8" />
                <stop offset="100%" stopColor="#ffffff" />
              </linearGradient>
            </defs>

            {/* Background speed lines */}
            <path d="M 40,80 L 560,80" stroke="#f59e0b" strokeWidth="3" strokeDasharray="12 8" opacity="0.6" />
            <path d="M 80,95 L 520,95" stroke="#ef4444" strokeWidth="2" strokeDasharray="16 6" opacity="0.5" />

            {/* English Title Outline & Fill */}
            <text
              x="300"
              y="58"
              textAnchor="middle"
              fontFamily="'Chakra Petch', sans-serif"
              fontSize="48"
              fontWeight="900"
              fontStyle="italic"
              letterSpacing="6"
              fill="url(#titleGrad)"
              stroke="#0f172a"
              strokeWidth="5"
              paintOrder="stroke fill"
            >
              ROAD RASH
            </text>

            {/* Chinese Arcade Subtitle */}
            <text
              x="300"
              y="108"
              textAnchor="middle"
              fontFamily="'Chakra Petch', sans-serif"
              fontSize="34"
              fontWeight="900"
              fontStyle="italic"
              letterSpacing="10"
              fill="url(#chromeTitle)"
              stroke="#450a0a"
              strokeWidth="4"
              paintOrder="stroke fill"
            >
              狂 飙 暴 走 鹈 鹕
            </text>
          </svg>
        </div>

        <p className="text-slate-300 text-xs md:text-sm font-medium max-w-lg mb-6">
          操控暴走鹈鹕驾驶重型机车！喉囊存鱼挥翼疾驰，挥拳飞踢击飞暴走族对手与巡警，3 条生命极限挑战！
        </p>

        {/* Difficulty Selection Pills */}
        <div className="w-full bg-slate-900/90 border border-slate-800 p-3 sm:p-4 rounded-2xl mb-4 sm:mb-6 shadow-xl">
          <div className="flex items-center justify-center gap-2 mb-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span className="text-[11px] sm:text-xs uppercase font-extrabold tracking-wider text-slate-300">
              选择 AI 对手难度 (AI DIFFICULTY)
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
            {(['easy', 'normal', 'hard'] as DifficultyLevel[]).map((level) => {
              const active = difficulty === level;
              const info = DIFFICULTY_SETTINGS[level];
              return (
                <button
                  key={level}
                  onClick={() => onSelectDifficulty(level)}
                  className={`p-2 sm:p-3 rounded-xl border flex flex-col items-center transition-all ${
                    active
                      ? level === 'easy'
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-md scale-[1.02]'
                        : level === 'normal'
                        ? 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-md scale-[1.02]'
                        : 'bg-red-950/80 border-red-500 text-red-300 shadow-md scale-[1.02]'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="text-sm sm:text-base font-black tracking-wide">{info.label}</span>
                  <span className="text-[9px] sm:text-[11px] mt-0.5 text-slate-400 font-normal leading-tight text-center">
                    {level === 'easy' ? '慢速·弱攻' : level === 'normal' ? '标准·平衡' : '极速·狂暴'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Track Selection */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4 sm:mb-6">
          {tracks.map((tr) => (
            <button
              key={tr.id}
              onClick={() => onSelectTrack(tr.id)}
              className={`p-2 sm:p-2.5 rounded-xl border text-left transition ${
                trackIndex === tr.id
                  ? 'bg-cyan-950/70 border-cyan-500 text-cyan-200 shadow-md'
                  : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="text-xs font-bold truncate">{tr.name}</div>
              <div className="text-[9px] sm:text-[10px] text-slate-400 truncate">{tr.desc}</div>
            </button>
          ))}
        </div>

        {/* Primary Start Game CTA */}
        <button
          onClick={onStartGame}
          data-start="true"
          className="group relative px-12 py-4 bg-gradient-to-r from-red-600 via-amber-500 to-red-600 hover:from-red-500 hover:via-amber-400 hover:to-red-500 text-slate-950 font-black text-xl tracking-wider uppercase rounded-2xl shadow-2xl shadow-red-500/40 transform hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-3"
        >
          <Zap className="w-6 h-6 fill-current text-slate-950" />
          <span>开始飙车 START RACE</span>
        </button>
      </div>

      {/* Bottom Flat Control Hints */}
      <div className="w-full max-w-4xl text-center text-[11px] text-slate-400 font-mono tracking-wide pt-4 border-t border-slate-800/80 flex flex-wrap justify-center gap-x-6 gap-y-1">
        <span>🎮 W/S/A/D 或 方向键 驱动转向</span>
        <span>👊 J 拳击</span>
        <span>🦵 K 侧踹飞踢</span>
        <span>⚔️ L 铁链球棒</span>
        <span>⚡ N / Shift 氮气加速</span>
        <span>⌨️ Enter / Space 立即发车</span>
      </div>
    </div>
  );
};
