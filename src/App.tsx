import { useState, useEffect, useCallback } from 'react';
import { RoadRashCanvas } from './components/RoadRashCanvas';
import { GameHUD } from './components/GameHUD';
import { TitleScreen } from './components/TitleScreen';
import { GameOverModal } from './components/GameOverModal';
import { VictoryModal } from './components/VictoryModal';
import { GarageModal } from './components/GarageModal';
import { RadioTTSModal } from './components/RadioTTSModal';
import { AiStudioModal } from './components/AiStudioModal';
import { ChatModal } from './components/ChatModal';
import { DifficultyLevel, WeaponType, Combatant } from './game/combat';
import { sounds } from './game/sound';
import { Play, RotateCcw, Home } from 'lucide-react';

type GameState = 'title' | 'playing' | 'paused' | 'gameover' | 'victory';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('title');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('normal');
  const [trackIndex, setTrackIndex] = useState(0);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem('roadrash_high_score') || '0', 10);
    } catch {
      return 0;
    }
  });

  const [money, setMoney] = useState(500);
  const [playerWeapon, setPlayerWeapon] = useState<WeaponType>('fists');
  const [upgrades, setUpgrades] = useState({
    engine: 0,
    accel: 0,
    tires: 0,
    armor: 0,
  });

  // Telemetry for HUD
  const [telemetry, setTelemetry] = useState({
    speed: 0,
    rpm: 0,
    position: 1,
    progress: 0,
    lap: 1,
    hp: 100,
    nitro: 100,
    activeDuelRival: null as Combatant | null,
  });

  // Modal open states
  const [activeModal, setActiveModal] = useState<'garage' | 'radio' | 'aiStudio' | 'chat' | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [knockoutsCount, setKnockoutsCount] = useState(0);

  // Sync state to body dataset
  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  // Support ?autostart=1 query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      startGame();
    }
  }, []);

  const startGame = useCallback(() => {
    setLives(3);
    setScore(0);
    setKnockoutsCount(0);
    setGameState('playing');
    sounds.startEngine();
  }, []);

  const handlePause = useCallback(() => {
    if (gameState === 'playing') {
      setGameState('paused');
    } else if (gameState === 'paused') {
      setGameState('playing');
    }
  }, [gameState]);

  // Keyboard shortcut for Pause (P or Esc) and Enter/Space for start
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (gameState === 'title' && (e.code === 'Enter' || e.code === 'Space')) {
        e.preventDefault();
        startGame();
      } else if (e.code === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (gameState === 'playing' || gameState === 'paused') {
          handlePause();
        }
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameState, startGame, handlePause]);

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    sounds.setMuted(nextMuted);
  };

  const handleLifeLost = (remainingLives: number) => {
    setLives(remainingLives);
  };

  const handleScoreAdd = (points: number) => {
    setScore((prev) => {
      const next = prev + points;
      if (next > highScore) {
        setHighScore(next);
        try {
          localStorage.setItem('roadrash_high_score', next.toString());
        } catch {}
      }
      return next;
    });
  };

  const handleKnockoutRival = () => {
    setKnockoutsCount((prev) => prev + 1);
  };

  const handleLapComplete = () => {
    // Check lap
  };

  const handleGameOver = (finalScore: number, finalKnockouts: number) => {
    setKnockoutsCount(finalKnockouts);
    setGameState('gameover');
    sounds.stopAll();
  };

  const handleVictory = (finalScore: number, finalKnockouts: number) => {
    setKnockoutsCount(finalKnockouts);
    setGameState('victory');
    sounds.stopAll();
    sounds.playScoreJingle();
  };

  const handleBuyUpgrade = (type: 'engine' | 'accel' | 'tires' | 'armor', cost: number) => {
    if (money >= cost) {
      setMoney((m) => m - cost);
      setUpgrades((prev) => ({ ...prev, [type]: prev[type] + 1 }));
      sounds.playScoreJingle();
    }
  };

  const handleEquipWeapon = (weapon: WeaponType, cost: number) => {
    if (weapon === playerWeapon) return;
    if (cost > 0 && money >= cost) {
      setMoney((m) => m - cost);
    }
    setPlayerWeapon(weapon);
    sounds.playWeaponClang();
  };

  return (
    <div className="relative w-screen h-screen bg-slate-950 overflow-hidden font-sans select-none">
      {/* 1. Pseudo-3D Highway Combat Canvas Engine */}
      <RoadRashCanvas
        difficulty={difficulty}
        lives={lives}
        score={score}
        playerWeapon={playerWeapon}
        trackIndex={trackIndex}
        isPaused={gameState !== 'playing'}
        onUpdateTelemetry={setTelemetry}
        onLifeLost={handleLifeLost}
        onScoreAdd={handleScoreAdd}
        onKnockoutRival={handleKnockoutRival}
        onLapComplete={handleLapComplete}
        onGameOver={handleGameOver}
        onVictory={handleVictory}
      />

      {/* 2. In-Game Head-Up Display (Visible during Playing and Paused) */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <GameHUD
          speed={telemetry.speed}
          rpm={telemetry.rpm}
          position={telemetry.position}
          progress={telemetry.progress}
          lap={telemetry.lap}
          hp={telemetry.hp}
          nitro={telemetry.nitro}
          lives={lives}
          score={score}
          difficulty={difficulty}
          activeDuelRival={telemetry.activeDuelRival}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onPause={handlePause}
          onOpenRadio={() => setActiveModal('radio')}
          onOpenGarage={() => setActiveModal('garage')}
          onOpenChat={() => setActiveModal('chat')}
          onOpenAiStudio={() => setActiveModal('aiStudio')}
          onPerformAttack={(type) => {
            const event = new KeyboardEvent('keydown', {
              key: type === 'punch' ? 'j' : type === 'kick' ? 'k' : 'l',
            });
            window.dispatchEvent(event);
          }}
          onActivateNitro={() => {
            const down = new KeyboardEvent('keydown', { key: 'n' });
            window.dispatchEvent(down);
            setTimeout(() => {
              const up = new KeyboardEvent('keyup', { key: 'n' });
              window.dispatchEvent(up);
            }, 600);
          }}
        />
      )}

      {/* 3. Title Landing Screen */}
      {gameState === 'title' && (
        <TitleScreen
          difficulty={difficulty}
          trackIndex={trackIndex}
          onSelectDifficulty={setDifficulty}
          onSelectTrack={setTrackIndex}
          onStartGame={startGame}
          onOpenGarage={() => setActiveModal('garage')}
          onOpenAiStudio={() => setActiveModal('aiStudio')}
          highScore={highScore}
        />
      )}

      {/* 4. Pause Modal */}
      {gameState === 'paused' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-6 text-center shadow-2xl flex flex-col items-center">
            <h2 className="text-2xl font-black italic tracking-wider text-slate-100 font-mono mb-1">
              PAUSED 暂停中
            </h2>
            <p className="text-xs text-slate-400 mb-6">按 P 或 Esc 随时继续极速狂飙</p>

            <div className="w-full flex flex-col gap-2.5">
              <button
                onClick={() => setGameState('playing')}
                className="w-full py-3 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-slate-950 font-black text-sm uppercase rounded-xl shadow-lg transition flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 text-slate-950 fill-current" />
                <span>继续比赛 (RESUME)</span>
              </button>

              <button
                onClick={startGame}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4 text-slate-400" />
                <span>重新开始本局 (RESTART)</span>
              </button>

              <button
                onClick={() => {
                  setGameState('title');
                  sounds.stopAll();
                }}
                className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-bold text-xs rounded-xl border border-slate-800 transition flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                <span>返回主菜单 (TITLE)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Game Over Modal (3 Lives Depleted) */}
      {gameState === 'gameover' && (
        <GameOverModal
          score={score}
          highScore={highScore}
          knockouts={knockoutsCount}
          onRestart={startGame}
          onOpenGarage={() => setActiveModal('garage')}
        />
      )}

      {/* 6. Victory Modal (3 Laps Completed) */}
      {gameState === 'victory' && (
        <VictoryModal
          score={score}
          knockouts={knockoutsCount}
          difficulty={difficulty}
          onNextRace={() => {
            setTrackIndex((prev) => (prev + 1) % 3);
            startGame();
          }}
          onOpenGarage={() => setActiveModal('garage')}
        />
      )}

      {/* 7. Feature Modals */}
      {/* Feature 1: TTS Radio Announcer (gemini-3.8-flash-tts) */}
      {activeModal === 'radio' && <RadioTTSModal onClose={() => setActiveModal(null)} />}

      {/* Feature 2: High-Quality Image Customizer with 1K, 2K, 4K (gemini-3-pro-image-preview) */}
      {activeModal === 'aiStudio' && <AiStudioModal onClose={() => setActiveModal(null)} />}

      {/* Feature 3: Multi-turn Chatbot with Roles (gemini-3.8-flash / gemini-3.1-flash-lite / gemini-4-argon) */}
      {activeModal === 'chat' && <ChatModal onClose={() => setActiveModal(null)} />}

      {/* Garage Upgrades & Weapons */}
      {activeModal === 'garage' && (
        <GarageModal
          money={money}
          playerWeapon={playerWeapon}
          upgrades={upgrades}
          onBuyUpgrade={handleBuyUpgrade}
          onEquipWeapon={handleEquipWeapon}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
}
