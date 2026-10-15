import React from 'react';
import { X, Wrench, Shield, Zap, Gauge, DollarSign, Check } from 'lucide-react';
import { WeaponType } from '../game/combat';

interface GarageModalProps {
  money: number;
  playerWeapon: WeaponType;
  upgrades: {
    engine: number; // max speed
    accel: number;  // acceleration
    tires: number;  // steering handling
    armor: number;  // defense
  };
  onBuyUpgrade: (type: 'engine' | 'accel' | 'tires' | 'armor', cost: number) => void;
  onEquipWeapon: (weapon: WeaponType, cost: number) => void;
  onClose: () => void;
}

export const GarageModal: React.FC<GarageModalProps> = ({
  money,
  playerWeapon,
  upgrades,
  onBuyUpgrade,
  onEquipWeapon,
  onClose,
}) => {
  const upgradeItems = [
    {
      id: 'engine',
      name: 'V4 涡轮增压发动机',
      desc: '大幅提升机车最高时速 (+15 KM/H)',
      icon: Gauge,
      level: upgrades.engine,
      cost: 450 * (upgrades.engine + 1),
    },
    {
      id: 'accel',
      name: '双进气化油器',
      desc: '极速起步与更强加速出弯性能',
      icon: Zap,
      level: upgrades.accel,
      cost: 400 * (upgrades.accel + 1),
    },
    {
      id: 'tires',
      name: '赛级热熔防滑轮胎',
      desc: '极大减小过弯离心力，贴地疾驰',
      icon: Wrench,
      level: upgrades.tires,
      cost: 350 * (upgrades.tires + 1),
    },
    {
      id: 'armor',
      name: '钛合金强化车架与护甲',
      desc: '增强机车碰撞抗性与击退减免',
      icon: Shield,
      level: upgrades.armor,
      cost: 500 * (upgrades.armor + 1),
    },
  ];

  const weapons: { id: WeaponType; name: string; desc: string; cost: number }[] = [
    { id: 'fists', name: '铁拳肉搏', desc: '灵活无冷却，基础攻击', cost: 0 },
    { id: 'club', name: '带刺实木球棒', desc: '强击退力与范围伤害，易造成击飞', cost: 600 },
    { id: 'chain', name: '重型加长铁链', desc: '超远攻击距离与巨额杀伤，暴走族神兵', cost: 1200 },
  ];

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm select-none">
      <div className="w-full max-w-xl bg-slate-900 border border-amber-500/50 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-950/80 border border-amber-500/40 rounded-xl text-amber-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-amber-300 tracking-wide font-mono">
                老扳手机车改装工坊 & 黑市武器库
              </h3>
              <p className="text-xs text-slate-400">用比赛奖金提升性能，装备冷兵器制霸公路</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 px-3 py-1 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-400 font-mono font-black text-sm">
              <DollarSign className="w-4 h-4" />
              <span>{money.toLocaleString()}</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Performance Upgrades */}
        <div className="my-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            机车机械性能升级 (PERFORMANCE UPGRADES)
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {upgradeItems.map((item) => {
              const Icon = item.icon;
              const canAfford = money >= item.cost;
              const isMax = item.level >= 5;

              return (
                <div
                  key={item.id}
                  className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between"
                >
                  <div className="flex items-start gap-2.5 mb-2">
                    <div className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-amber-400 mt-0.5">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-200">{item.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{item.desc}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-900">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <div
                          key={lvl}
                          className={`w-3.5 h-1.5 rounded-sm ${
                            lvl <= item.level ? 'bg-amber-400' : 'bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>

                    <button
                      disabled={!canAfford || isMax}
                      onClick={() => onBuyUpgrade(item.id as any, item.cost)}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-lg transition active:scale-95"
                    >
                      {isMax ? '已满级' : `$${item.cost} 升级`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weapons Arsenal */}
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            黑市打击武器 (WEAPONS ARSENAL)
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {weapons.map((w) => {
              const isEquipped = playerWeapon === w.id;
              const canAfford = money >= w.cost;

              return (
                <div
                  key={w.id}
                  className={`p-3 rounded-2xl border flex flex-col justify-between transition ${
                    isEquipped
                      ? 'bg-rose-950/40 border-rose-500 shadow-md'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div>
                    <div className="text-xs font-black text-slate-200 flex items-center justify-between">
                      <span>{w.name}</span>
                      {isEquipped && <Check className="w-4 h-4 text-rose-400" />}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 leading-tight">{w.desc}</div>
                  </div>

                  <button
                    disabled={isEquipped || (!isEquipped && w.cost > 0 && !canAfford)}
                    onClick={() => onEquipWeapon(w.id, w.cost)}
                    className={`w-full mt-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      isEquipped
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 cursor-default'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-100'
                    }`}
                  >
                    {isEquipped ? '当前装备中' : w.cost === 0 ? '装备' : `$${w.cost} 购买并装备`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
