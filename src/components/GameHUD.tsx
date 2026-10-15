import React from 'react';
import { Combatant, DifficultyLevel, DIFFICULTY_SETTINGS } from '../game/combat';
import { Volume2, VolumeX, Pause, Radio, Wrench, MessageSquare, Sparkles } from 'lucide-react';

interface GameHUDProps {
  speed: number;
  rpm: number;
  position: number;
  progress: number;
  lap: number;
  hp: number;
  nitro: number;
  lives: number;
  score: number;
  difficulty: DifficultyLevel;
  activeDuelRival: Combatant | null;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onOpenRadio: () => void;
  onOpenGarage: () => void;
  onOpenChat: () => void;
  onOpenAiStudio: () => void;
  onPerformAttack: (type: 'punch' | 'kick' | 'weapon') => void;
  onActivateNitro: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  speed,
  rpm,
  position,
  progress,
  lap,
  hp,
  nitro,
  lives,
  score,
  difficulty,
  activeDuelRival,
  isMuted,
  onToggleMute,
  onPause,
  onOpenRadio,
  onOpenGarage,
  onOpenChat,
  onOpenAiStudio,
  onPerformAttack,
  onActivateNitro,
}) => {
  const diffInfo = DIFFICULTY_SETTINGS[difficulty];

  // Helper for ordinal suffix
  const getOrdinal = (n: number) => {
    if (n === 1) return '1ST';
    if (n === 2) return '2ND';
    if (n === 3) return '3RD';
    return `${n}TH`;
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 md:p-6 z-10 select-none">
      {/* Top Header Bar: Lives, Difficulty, Score, Lap & Utilities */}
      <div className="flex justify-between items-start gap-4">
        {/* Left: 3 Lives & Score */}
        <div className="flex flex-col gap-1.5">
          {/* 3 Lives / Vitality Sockets */}
          <div className="flex items-center gap-2 bg-slate-950/85 border border-red-500/30 px-3 py-1.5 rounded-xl shadow-lg">
            <span className="text-xs uppercase tracking-wider font-bold text-slate-400">生命</span>
            <div className="flex items-center gap-1.5">
              {[0, 1, 2].map((idx) => {
                const isAlive = idx < lives;
                return (
                  <div
                    key={idx}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                      isAlive
                        ? 'bg-gradient-to-br from-red-500 to-amber-600 text-white shadow-md shadow-red-500/40 scale-100'
                        : 'bg-slate-900 border border-slate-700/60 text-slate-600 opacity-40 scale-90'
                    }`}
                    title={isAlive ? '生命槽可用' : '已损耗生命'}
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                      <path d="M12 2a9 9 0 0 0-9 9c0 4.1 2.8 7.6 6.7 8.7L10 22h4l.3-2.3C18.2 18.6 21 15.1 21 11a9 9 0 0 0-9-9zm-4 8h8v3H8v-3z" />
                    </svg>
                  </div>
                );
              })}
            </div>
            <span className="text-sm font-bold text-red-400 font-mono ml-1">{lives}/3</span>
          </div>

          {/* Score & Multiplier */}
          <div className="bg-slate-950/85 border border-amber-500/30 px-3 py-1.5 rounded-xl shadow-lg flex items-baseline gap-2">
            <span className="text-xs font-bold text-amber-400 tracking-wider">得分 SCORE</span>
            <span className="text-2xl font-black text-amber-300 font-mono tracking-tight tabular-nums">
              {score.toLocaleString()}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 font-bold rounded">
              {diffInfo.label}难度
            </span>
          </div>
        </div>

        {/* Center: Lap Progress Bar & Position */}
        <div className="flex flex-col items-center">
          <div className="bg-slate-950/90 border border-slate-700/60 px-5 py-2 rounded-2xl shadow-2xl flex items-center gap-5">
            <div className="text-center">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">排位 POS</div>
              <div
                className={`text-3xl font-black font-mono tracking-tight ${
                  position === 1 ? 'text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]' : 'text-slate-100'
                }`}
              >
                {getOrdinal(position)}
                <span className="text-xs text-slate-400 font-normal ml-0.5">/8</span>
              </div>
            </div>

            <div className="h-8 w-px bg-slate-800" />

            <div className="text-center">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">圈数 LAP</div>
              <div className="text-xl font-black text-cyan-400 font-mono">
                {lap}
                <span className="text-xs text-slate-400 font-normal">/3</span>
              </div>
            </div>
          </div>

          {/* Mini Track Progress Bar */}
          <div className="w-48 h-2 bg-slate-900 border border-slate-800 rounded-full mt-2 overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-amber-500 transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>

        {/* Right: Quick System & Utility Buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* TTS Radio button */}
          <button
            onClick={onOpenRadio}
            className="p-2.5 bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/40 text-cyan-400 hover:text-cyan-300 rounded-xl transition shadow-lg active:scale-95"
            title="打开战术对讲机与语音播报 (TTS)"
            aria-label="打开战术对讲机与语音播报"
          >
            <Radio className="w-5 h-5" />
          </button>

          {/* AI Bike Studio */}
          <button
            onClick={onOpenAiStudio}
            className="p-2.5 bg-slate-900/90 hover:bg-slate-800 border border-violet-500/40 text-violet-400 hover:text-violet-300 rounded-xl transition shadow-lg active:scale-95"
            title="AI 重机车工坊与概念海报"
            aria-label="AI 重机车工坊与概念海报"
          >
            <Sparkles className="w-5 h-5" />
          </button>

          {/* Syndicate Chat */}
          <button
            onClick={onOpenChat}
            className="p-2.5 bg-slate-900/90 hover:bg-slate-800 border border-emerald-500/40 text-emerald-400 hover:text-emerald-300 rounded-xl transition shadow-lg active:scale-95"
            title="地下车队通讯与机械师对话 (Gemini Chat)"
            aria-label="地下车队通讯与机械师对话"
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          {/* Garage */}
          <button
            onClick={onOpenGarage}
            className="p-2.5 bg-slate-900/90 hover:bg-slate-800 border border-amber-500/40 text-amber-400 hover:text-amber-300 rounded-xl transition shadow-lg active:scale-95"
            title="车库与黑市改装"
            aria-label="车库与黑市改装"
          >
            <Wrench className="w-5 h-5" />
          </button>

          {/* Mute */}
          <button
            onClick={onToggleMute}
            className="p-2.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl transition shadow-lg active:scale-95"
            title={isMuted ? '取消静音' : '静音'}
            aria-label={isMuted ? '取消静音' : '静音'}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
          </button>

          {/* Pause */}
          <button
            onClick={onPause}
            className="p-2.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl transition shadow-lg active:scale-95"
            title="暂停游戏 (Esc / P)"
            aria-label="暂停游戏"
          >
            <Pause className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Middle: Active Duel Encounter Target Card (if near an opponent) */}
      {activeDuelRival && (
        <div className="self-center bg-slate-950/90 border border-red-500/50 p-2.5 px-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-pulse">
          <div className="w-8 h-8 rounded-lg bg-red-950/80 border border-red-500/40 flex items-center justify-center text-red-400 font-bold">
            ⚔️
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-red-300 tracking-wide">{activeDuelRival.name}</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-red-500/20 text-red-400 font-bold rounded">
                {activeDuelRival.weapon === 'chain' ? '铁链' : activeDuelRival.weapon === 'club' ? '球棒' : '拳脚'}
              </span>
            </div>
            <div className="w-40 h-2 bg-slate-800 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-150"
                style={{ width: `${Math.max(0, (activeDuelRival.hp / activeDuelRival.maxHp) * 100)}%` }}
              />
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-slate-300">
            {Math.round(activeDuelRival.hp)}/{activeDuelRival.maxHp} HP
          </span>
        </div>
      )}

      {/* Bottom Cockpit & Controls HUD */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        {/* Left: Speedometer & Tachometer */}
        <div className="bg-slate-950/90 border border-slate-800/90 p-3.5 px-5 rounded-2xl shadow-2xl flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">车速 SPEED</span>
            <div className="text-4xl font-black font-mono tracking-tighter text-cyan-400 drop-shadow-[0_0_14px_rgba(34,211,238,0.4)]">
              {Math.round(speed)}
              <span className="text-sm font-bold text-slate-400 ml-1">KM/H</span>
            </div>
            <span className="text-xs text-slate-500 font-mono mt-0.5">{rpm} RPM</span>
          </div>

          <div className="h-12 w-px bg-slate-800" />

          {/* Player HP & Nitro meters */}
          <div className="flex flex-col gap-2 min-w-[130px]">
            {/* HP */}
            <div>
              <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-0.5">
                <span>机车耐久</span>
                <span className="text-emerald-400">{Math.round(hp)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-150 ${
                    hp > 50 ? 'bg-emerald-500' : hp > 25 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.max(0, Math.min(100, hp))}%` }}
                />
              </div>
            </div>

            {/* Nitro */}
            <div>
              <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-0.5">
                <span>氮气增压 (N)</span>
                <span className="text-cyan-400">{Math.round(nitro)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-100"
                  style={{ width: `${Math.max(0, Math.min(100, nitro))}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: On-screen Action Keys & Touch Affordances */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          <button
            onClick={() => onPerformAttack('punch')}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-600/90 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg active:scale-95 transition"
            title="拳击 (J)"
          >
            <span>👊 拳击</span>
            <kbd className="px-1.5 py-0.5 bg-amber-900/40 text-slate-900 rounded text-[10px]">J</kbd>
          </button>

          <button
            onClick={() => onPerformAttack('kick')}
            className="flex items-center gap-1.5 px-3 py-2 bg-orange-600/90 hover:bg-orange-500 text-white font-black text-xs rounded-xl shadow-lg active:scale-95 transition"
            title="飞踢击退 (K)"
          >
            <span>🦵 飞踢</span>
            <kbd className="px-1.5 py-0.5 bg-orange-900/50 text-white rounded text-[10px]">K</kbd>
          </button>

          <button
            onClick={() => onPerformAttack('weapon')}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-600/90 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-lg active:scale-95 transition"
            title="铁链/球棒攻击 (L)"
          >
            <span>⚔️ 武器</span>
            <kbd className="px-1.5 py-0.5 bg-rose-900/50 text-white rounded text-[10px]">L</kbd>
          </button>

          <button
            onClick={onActivateNitro}
            className="flex items-center gap-1.5 px-3 py-2 bg-cyan-600/90 hover:bg-cyan-500 text-white font-black text-xs rounded-xl shadow-lg active:scale-95 transition"
            title="氮气加速 (N / Shift)"
          >
            <span>⚡ 氮气</span>
            <kbd className="px-1.5 py-0.5 bg-cyan-900/50 text-white rounded text-[10px]">N</kbd>
          </button>
        </div>
      </div>
    </div>
  );
};
