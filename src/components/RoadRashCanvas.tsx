import React, { useEffect, useRef } from 'react';
import {
  RoadSegment,
  buildTrack,
  project3D,
  SEGMENT_LENGTH,
  ROAD_WIDTH,
  CAMERA_HEIGHT,
  DRAW_DISTANCE,
  updatePlayerSpeed,
  calculateCentrifugalForce,
} from '../game/physics';
import {
  Combatant,
  WeaponType,
  AttackType,
  resolveAttack,
  updateOpponentAI,
  processCrashLifeDeduction,
  calculateScoreAddition,
  DifficultyLevel,
  DIFFICULTY_SETTINGS,
} from '../game/combat';
import { sounds } from '../game/sound';

export interface TrafficCar {
  id: string;
  x: number;
  z: number;
  speed: number;
  color: string;
  type: 'sedan' | 'truck' | 'taxi';
}

export interface FloatingFx {
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  scale: number;
}

interface RoadRashCanvasProps {
  difficulty: DifficultyLevel;
  lives: number;
  score: number;
  playerWeapon: WeaponType;
  trackIndex: number;
  isPaused: boolean;
  onUpdateTelemetry: (stats: {
    speed: number;
    rpm: number;
    position: number;
    progress: number;
    lap: number;
    hp: number;
    nitro: number;
    activeDuelRival: Combatant | null;
  }) => void;
  onLifeLost: (remainingLives: number) => void;
  onScoreAdd: (points: number, reason: string) => void;
  onKnockoutRival: (rivalName: string) => void;
  onLapComplete: (lap: number) => void;
  onGameOver: (finalScore: number, knockouts: number) => void;
  onVictory: (finalScore: number, knockouts: number) => void;
}

export const RoadRashCanvas: React.FC<RoadRashCanvasProps> = ({
  difficulty,
  lives,
  score,
  playerWeapon,
  trackIndex,
  isPaused,
  onUpdateTelemetry,
  onLifeLost,
  onScoreAdd,
  onKnockoutRival,
  onLapComplete,
  onGameOver,
  onVictory,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Keep live references to prevent recreating loop
  const stateRef = useRef({
    lives,
    score,
    difficulty,
    playerWeapon,
    isPaused,
    track: [] as RoadSegment[],
    cameraZ: 0,
    playerX: 0,
    playerY: 0,
    playerSpeed: 0,
    maxSpeed: 215,
    accel: 110,
    braking: 160,
    playerHp: 100,
    playerNitro: 100,
    isNitroActive: false,
    playerAttack: null as { type: AttackType; timer: number; dir: number } | null,
    isPlayerCrashed: false,
    crashTimer: 0,
    ragdollX: 0,
    ragdollY: 0,
    lap: 1,
    maxLaps: 3,
    knockoutsCount: 0,
    trauma: 0, // screen shake
    opponents: [] as Combatant[],
    traffic: [] as TrafficCar[],
    floatingFx: [] as FloatingFx[],
    keys: {
      up: false,
      down: false,
      left: false,
      right: false,
      punch: false,
      kick: false,
      weapon: false,
      nitro: false,
    },
  });

  // Sync props to refs
  useEffect(() => {
    stateRef.current.lives = lives;
    stateRef.current.difficulty = difficulty;
    stateRef.current.playerWeapon = playerWeapon;
    stateRef.current.isPaused = isPaused;
  }, [lives, difficulty, playerWeapon, isPaused]);

  // Initialize track, opponents, traffic
  useEffect(() => {
    const s = stateRef.current;
    s.track = buildTrack(2800);

    // Initialize 6 distinctive rivals + 1 Police Officer
    const rivalsData: Omit<Combatant, 'speed' | 'isCrashed' | 'crashTimer'>[] = [
      { id: 'r1', name: 'Viper (毒蛇)', x: 0.28, z: 1200, baseMaxSpeed: 195, hp: 100, maxHp: 100, weapon: 'chain' },
      { id: 'r2', name: 'Biff (铁拳比夫)', x: -0.32, z: 2400, baseMaxSpeed: 185, hp: 120, maxHp: 120, weapon: 'club' },
      { id: 'r3', name: 'Natasha (黑寡妇)', x: 0.45, z: 3800, baseMaxSpeed: 205, hp: 90, maxHp: 90, weapon: 'fists' },
      { id: 'r4', name: 'Razor (剃刀雷泽)', x: -0.4, z: 5200, baseMaxSpeed: 190, hp: 110, maxHp: 110, weapon: 'club' },
      { id: 'r5', name: 'Ghost (极速幽灵)', x: 0.15, z: 6600, baseMaxSpeed: 212, hp: 95, maxHp: 95, weapon: 'fists' },
      { id: 'r6', name: 'Sarge (暴徒军士)', x: -0.22, z: 8200, baseMaxSpeed: 188, hp: 130, maxHp: 130, weapon: 'chain' },
      { id: 'cop1', name: "Officer O'Leary (铁面警长)", x: 0.5, z: 9800, baseMaxSpeed: 220, hp: 150, maxHp: 150, weapon: 'club', isPolice: true },
    ];

    s.opponents = rivalsData.map((r) => ({
      ...r,
      speed: r.baseMaxSpeed * 0.85,
      isCrashed: false,
      crashTimer: 0,
    }));

    // Generate civilian traffic cars
    s.traffic = [];
    for (let i = 0; i < 28; i++) {
      const types: ('sedan' | 'truck' | 'taxi')[] = ['sedan', 'truck', 'taxi'];
      const colors = ['#e63946', '#457b9d', '#f4a261', '#2a9d8f', '#e9c46a', '#ffffff', '#343a40'];
      s.traffic.push({
        id: `car_${i}`,
        x: (i % 2 === 0 ? 0.35 : -0.35) + (Math.sin(i * 3.4) * 0.2),
        z: 1600 + i * 850,
        speed: 75 + (i % 4) * 12,
        color: colors[i % colors.length],
        type: types[i % types.length],
      });
    }

    return () => {
      sounds.stopAll();
    };
  }, [trackIndex]);

  // Keyboard input listeners with edge triggers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (stateRef.current.isPaused) return;

      const k = stateRef.current.keys;
      const key = e.key.toLowerCase();

      if (key === 'w' || key === 'arrowup') k.up = true;
      if (key === 's' || key === 'arrowdown') k.down = true;
      if (key === 'a' || key === 'arrowleft') k.left = true;
      if (key === 'd' || key === 'arrowright') k.right = true;
      if (key === 'n' || e.shiftKey) k.nitro = true;

      // Attacks: J for Punch, K for Kick, L for Weapon
      if (key === 'j' && !stateRef.current.playerAttack && !stateRef.current.isPlayerCrashed) {
        stateRef.current.playerAttack = {
          type: 'punch',
          timer: 0.25,
          dir: k.left ? -1 : 1,
        };
        sounds.playPunch();
      } else if (key === 'k' && !stateRef.current.playerAttack && !stateRef.current.isPlayerCrashed) {
        stateRef.current.playerAttack = {
          type: 'kick',
          timer: 0.32,
          dir: k.left ? -1 : 1,
        };
        sounds.playKick();
      } else if (key === 'l' && !stateRef.current.playerAttack && !stateRef.current.isPlayerCrashed) {
        stateRef.current.playerAttack = {
          type: 'weapon',
          timer: 0.38,
          dir: k.left ? -1 : 1,
        };
        sounds.playWeaponClang();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = stateRef.current.keys;
      const key = e.key.toLowerCase();

      if (key === 'w' || key === 'arrowup') k.up = false;
      if (key === 's' || key === 'arrowdown') k.down = false;
      if (key === 'a' || key === 'arrowleft') k.left = false;
      if (key === 'd' || key === 'arrowright') k.right = false;
      if (key === 'n' || !e.shiftKey) k.nitro = false;
    };

    const handleBlur = () => {
      const k = stateRef.current.keys;
      k.up = false;
      k.down = false;
      k.left = false;
      k.right = false;
      k.nitro = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Main 60 FPS Render & Simulation Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05);

      const s = stateRef.current;
      const canvas = canvasRef.current;

      if (canvas && s.track.length > 0 && !s.isPaused) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Dynamic resizing
          const width = canvas.clientWidth;
          const height = canvas.clientHeight;
          if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
          }

          // ---------- 1. SIMULATION STEP ----------
          // Nitro depletion / regeneration
          if (s.keys.nitro && s.playerNitro > 5 && !s.isPlayerCrashed && s.keys.up) {
            s.isNitroActive = true;
            s.playerNitro = Math.max(0, s.playerNitro - 45 * dt);
            if (Math.random() < 0.3) sounds.playNitro();
          } else {
            s.isNitroActive = false;
            s.playerNitro = Math.min(100, s.playerNitro + 12 * dt);
          }

          // Player crash timer & ragdoll recovery
          if (s.isPlayerCrashed) {
            s.crashTimer -= dt;
            s.playerSpeed = Math.max(0, s.playerSpeed - 180 * dt);
            if (s.crashTimer <= 0) {
              s.isPlayerCrashed = false;
              s.playerHp = 100;
              s.playerX = Math.max(-0.6, Math.min(0.6, s.playerX));
            }
          }

          // Steer & Speed update
          const isOffroad = Math.abs(s.playerX) > 1.05;
          if (!s.isPlayerCrashed) {
            s.playerSpeed = updatePlayerSpeed(
              s.playerSpeed,
              s.maxSpeed,
              s.accel,
              s.braking,
              s.keys.up,
              s.keys.down,
              isOffroad,
              s.isNitroActive,
              dt
            );

          // Safe segment getter with positive modulo
          const getSeg = (idx: number): RoadSegment => {
            const len = s.track.length;
            if (len === 0) return { index: 0, worldY: 0, worldZ: 0, curve: 0, colorGrass: '#10381e', colorRumble: '#ffffff', colorRoad: '#2b2f3a', colorLane: '#f8fafc' };
            const mod = ((idx % len) + len) % len;
            return s.track[mod] || s.track[0];
          };

          // Steer handling
          const speedRatio = s.playerSpeed / s.maxSpeed;
          if (s.keys.left) s.playerX -= 1.65 * speedRatio * dt;
          if (s.keys.right) s.playerX += 1.65 * speedRatio * dt;

          // Centrifugal force from curves
          const currentSeg = getSeg(Math.floor(s.cameraZ / SEGMENT_LENGTH));
          const curveForce = calculateCentrifugalForce(speedRatio, currentSeg.curve, dt);
          s.playerX -= curveForce;
          }

          // Advance camera along road
          s.cameraZ += s.playerSpeed * 22 * dt;
          const totalTrackLen = s.track.length * SEGMENT_LENGTH;
          if (s.cameraZ >= totalTrackLen) {
            s.cameraZ -= totalTrackLen;
            s.lap++;
            onLapComplete(s.lap);
            sounds.playScoreJingle();
            const { points } = calculateScoreAddition('lap_completed', s.difficulty, s.score);
            s.score += points;
            onScoreAdd(points, `第 ${s.lap - 1} 圈完成！`);

            if (s.lap > s.maxLaps) {
              onVictory(s.score, s.knockoutsCount);
            }
          }

          // Update Audio engine
          sounds.updateEnginePitch(s.playerSpeed / s.maxSpeed, s.keys.up, s.isNitroActive);

          // Update attack animation timer
          if (s.playerAttack) {
            s.playerAttack.timer -= dt;
            if (s.playerAttack.timer <= 0) {
              s.playerAttack = null;
            }
          }

          // ---------- 2. TRAFFIC & OPPONENT RACERS UPDATE ----------
          let nearestRival: Combatant | null = null;
          let minRivalDist = Infinity;
          let policeNear = false;

          for (const opp of s.opponents) {
            if (opp.isCrashed) {
              opp.crashTimer -= dt;
              opp.speed = Math.max(0, opp.speed - 120 * dt);
              if (opp.crashTimer <= 0) {
                opp.isCrashed = false;
                opp.hp = opp.maxHp;
                opp.speed = opp.baseMaxSpeed * 0.7;
              }
            } else {
              // AI Decision
              const aiDecision = updateOpponentAI(
                opp,
                { x: s.playerX, z: s.cameraZ + 400, speed: s.playerSpeed },
                s.difficulty,
                dt
              );

              opp.x += aiDecision.steerX * dt;
              opp.speed += (aiDecision.targetSpeed - opp.speed) * 0.05;
              opp.z += opp.speed * 22 * dt;

              if (opp.z >= totalTrackLen) opp.z -= totalTrackLen;

              // AI attacking player
              if (aiDecision.attack && !s.isPlayerCrashed) {
                const attackRes = resolveAttack(
                  { x: opp.x, z: opp.z, weapon: opp.weapon, isPlayer: false },
                  {
                    id: 'player',
                    name: 'Player',
                    x: s.playerX,
                    z: s.cameraZ + 400,
                    speed: s.playerSpeed,
                    baseMaxSpeed: s.maxSpeed,
                    hp: s.playerHp,
                    maxHp: 100,
                    weapon: s.playerWeapon,
                    isCrashed: s.isPlayerCrashed,
                    crashTimer: 0,
                  },
                  aiDecision.attack,
                  s.difficulty
                );

                if (attackRes.hit) {
                  s.playerHp = Math.max(0, s.playerHp - attackRes.damage);
                  s.playerX += attackRes.knockbackX;
                  s.trauma = 0.55;
                  if (aiDecision.attack === 'kick') sounds.playKick();
                  else if (aiDecision.attack === 'weapon') sounds.playWeaponClang();
                  else sounds.playPunch();

                  s.floatingFx.push({
                    text: `-${attackRes.damage} HP!`,
                    x: width / 2 + (attackRes.knockbackX > 0 ? -60 : 60),
                    y: height * 0.65,
                    color: '#ef4444',
                    alpha: 1,
                    scale: 1.4,
                  });

                  // If player HP is depleted -> CRASH & LOSE 1 LIFE!
                  if (s.playerHp <= 0) {
                    s.isPlayerCrashed = true;
                    s.crashTimer = 3.2;
                    s.trauma = 1.0;
                    sounds.playCrash();
                    sounds.playLifeLost();

                    const lifeRes = processCrashLifeDeduction(s.lives, 'knockout');
                    s.lives = lifeRes.remainingLives;
                    onLifeLost(s.lives);

                    s.floatingFx.push({
                      text: '💥 击落倒地！生命 -1',
                      x: width / 2,
                      y: height * 0.45,
                      color: '#f43f5e',
                      alpha: 1,
                      scale: 2.2,
                    });

                    if (lifeRes.isGameOver) {
                      onGameOver(s.score, s.knockoutsCount);
                    }
                  }
                }
              }
            }

            // Proximity check for duel HUD
            const deltaZ = opp.z - (s.cameraZ + 400);
            if (Math.abs(deltaZ) < minRivalDist && Math.abs(deltaZ) < 800) {
              minRivalDist = Math.abs(deltaZ);
              nearestRival = opp;
            }

            if (opp.isPolice && Math.abs(deltaZ) < 1400) {
              policeNear = true;
            }
          }

          sounds.setPoliceSiren(policeNear);

          // Update Civilian Traffic
          for (const car of s.traffic) {
            car.z += car.speed * 22 * dt;
            if (car.z >= totalTrackLen) car.z -= totalTrackLen;

            // Check collision with player
            const deltaZ = car.z - (s.cameraZ + 400);
            const deltaX = Math.abs(s.playerX - car.x);

            if (Math.abs(deltaZ) < 90 && deltaX < 0.32 && !s.isPlayerCrashed) {
              // SEVERE COLLISION WITH CIVILIAN CAR -> LOSE 1 LIFE!
              s.isPlayerCrashed = true;
              s.crashTimer = 3.5;
              s.trauma = 1.0;
              s.playerSpeed = 0;
              sounds.playCrash();
              sounds.playLifeLost();

              const lifeRes = processCrashLifeDeduction(s.lives, 'heavy_crash');
              s.lives = lifeRes.remainingLives;
              onLifeLost(s.lives);

              s.floatingFx.push({
                text: '🚗 猛烈车祸！生命 -1',
                x: width / 2,
                y: height * 0.45,
                color: '#f43f5e',
                alpha: 1,
                scale: 2.2,
              });

              if (lifeRes.isGameOver) {
                onGameOver(s.score, s.knockoutsCount);
              }
            }
          }

          // Check Player attack hit on opponents
          if (s.playerAttack && !s.isPlayerCrashed) {
            for (const opp of s.opponents) {
              if (opp.isCrashed) continue;

              const res = resolveAttack(
                { x: s.playerX, z: s.cameraZ + 400, weapon: s.playerWeapon, isPlayer: true },
                opp,
                s.playerAttack.type,
                s.difficulty
              );

              if (res.hit) {
                opp.hp = Math.max(0, opp.hp - res.damage);
                opp.x += res.knockbackX;
                s.trauma = 0.35;

                const { points } = calculateScoreAddition('hit', s.difficulty, s.score);
                s.score += points;
                onScoreAdd(points, `命中 ${opp.name}`);

                s.floatingFx.push({
                  text: `+${points} HIT!`,
                  x: width / 2 + (res.knockbackX > 0 ? 80 : -80),
                  y: height * 0.55,
                  color: '#fbbf24',
                  alpha: 1,
                  scale: 1.5,
                });

                if (res.isKnockout) {
                  opp.isCrashed = true;
                  opp.crashTimer = 4.5;
                  s.knockoutsCount++;
                  sounds.playCrash();
                  onKnockoutRival(opp.name);

                  const koScore = calculateScoreAddition('knockout', s.difficulty, s.score);
                  s.score += koScore.points;
                  onScoreAdd(koScore.points, `击飞击倒 ${opp.name}!`);

                  s.floatingFx.push({
                    text: `💥 KNOCKOUT! +${koScore.points}`,
                    x: width / 2,
                    y: height * 0.48,
                    color: '#10b981',
                    alpha: 1,
                    scale: 2.0,
                  });
                }
                break; // One hit per swing
              }
            }
          }

          // Calculate race position (1st to 8th)
          let position = 1;
          for (const opp of s.opponents) {
            if (opp.z > s.cameraZ + 400) position++;
          }

          // Send telemetry to HUD
          onUpdateTelemetry({
            speed: s.playerSpeed,
            rpm: Math.round(s.playerSpeed * 42 + 1200),
            position,
            progress: (s.cameraZ / totalTrackLen) * 100,
            lap: s.lap,
            hp: s.playerHp,
            nitro: s.playerNitro,
            activeDuelRival: nearestRival,
          });

          // ---------- 3. GRAPHICS & CANVAS RASTER RENDERING ----------
          // Screen Shake translation
          ctx.save();
          if (s.trauma > 0) {
            const shakeX = (Math.random() - 0.5) * s.trauma * 24;
            const shakeY = (Math.random() - 0.5) * s.trauma * 24;
            ctx.translate(shakeX, shakeY);
            s.trauma = Math.max(0, s.trauma - dt * 2.2);
          }

          // Sky & Horizon Parallax
          const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.6);
          if (trackIndex === 0) {
            // Pacific Coast Highway: Sunset gold & ocean blue
            skyGrad.addColorStop(0, '#0f172a');
            skyGrad.addColorStop(0.4, '#c2410c');
            skyGrad.addColorStop(0.75, '#f59e0b');
            skyGrad.addColorStop(1, '#fde68a');
          } else if (trackIndex === 1) {
            // Nevada Badlands: Scorching desert haze
            skyGrad.addColorStop(0, '#451a03');
            skyGrad.addColorStop(0.5, '#b45309');
            skyGrad.addColorStop(1, '#fed7aa');
          } else {
            // Neon Tokyo Expressway: Cyberpunk midnight
            skyGrad.addColorStop(0, '#020617');
            skyGrad.addColorStop(0.6, '#1e1b4b');
            skyGrad.addColorStop(1, '#4c1d95');
          }
          ctx.fillStyle = skyGrad;
          ctx.fillRect(0, 0, width, height * 0.6);

          // Distant mountains / skyline parallax
          const baseSegIndex = Math.floor(s.cameraZ / SEGMENT_LENGTH);
          const horizonOffset = (s.playerX * 80) % width;

          ctx.fillStyle = trackIndex === 2 ? '#0f172a' : '#1e293b';
          ctx.beginPath();
          ctx.moveTo(0, height * 0.45);
          for (let mx = 0; mx <= width; mx += 100) {
            const my = height * 0.38 + Math.sin((mx + horizonOffset) * 0.008) * 35;
            ctx.lineTo(mx, my);
          }
          ctx.lineTo(width, height * 0.6);
          ctx.lineTo(0, height * 0.6);
          ctx.closePath();
          ctx.fill();

          // Fill ground horizon base
          const groundColor = trackIndex === 1 ? '#78350f' : trackIndex === 2 ? '#090d16' : '#0d2c18';
          ctx.fillStyle = groundColor;
          ctx.fillRect(0, height * 0.42, width, height * 0.58);

          // Safe segment getter with positive modulo
          const getSeg = (idx: number): RoadSegment => {
            const len = s.track.length;
            if (len === 0) return { index: 0, worldY: 0, worldZ: 0, curve: 0, colorGrass: '#10381e', colorRumble: '#ffffff', colorRoad: '#2b2f3a', colorLane: '#f8fafc' };
            const mod = ((idx % len) + len) % len;
            return s.track[mod] || s.track[0];
          };

          // Camera parameters
          const startSeg = Math.floor(s.cameraZ / SEGMENT_LENGTH);
          const cameraH = CAMERA_HEIGHT;
          const currentSegY = getSeg(startSeg).worldY;
          const cameraY = currentSegY + cameraH;
          const cameraX = s.playerX * ROAD_WIDTH;

          // Project & Render Road Segments back to front (Painter's algorithm)
          for (let n = DRAW_DISTANCE - 1; n >= 0; n--) {
            const seg = getSeg(startSeg + n);
            const nextSeg = getSeg(startSeg + n + 1);

            // Project current segment (nearer)
            const p1 = project3D(
              0,
              seg.worldY,
              seg.worldZ + (seg.worldZ < s.cameraZ ? totalTrackLen : 0),
              cameraX,
              cameraY,
              s.cameraZ,
              width,
              height
            );

            // Project next segment (farther)
            const p2 = project3D(
              0,
              nextSeg.worldY,
              nextSeg.worldZ + (nextSeg.worldZ < s.cameraZ ? totalTrackLen : 0),
              cameraX,
              cameraY,
              s.cameraZ,
              width,
              height
            );

            if (!p1 || !p2) continue;
            // Farther segment must be higher on screen than nearer segment
            if (p1.screenY <= p2.screenY || p2.screenY >= height || p1.screenY <= height * 0.4) continue;

            // Draw Rumble strips (curbs)
            const r1 = p1.screenW * 1.15;
            const r2 = p2.screenW * 1.15;
            ctx.fillStyle = seg.colorRumble;
            ctx.beginPath();
            ctx.moveTo(p1.screenX - r1, p1.screenY);
            ctx.lineTo(p1.screenX + r1, p1.screenY);
            ctx.lineTo(p2.screenX + r2, p2.screenY);
            ctx.lineTo(p2.screenX - r2, p2.screenY);
            ctx.closePath();
            ctx.fill();

            // Draw Road Asphalt
            ctx.fillStyle = seg.colorRoad;
            ctx.beginPath();
            ctx.moveTo(p1.screenX - p1.screenW, p1.screenY);
            ctx.lineTo(p1.screenX + p1.screenW, p1.screenY);
            ctx.lineTo(p2.screenX + p2.screenW, p2.screenY);
            ctx.lineTo(p2.screenX - p2.screenW, p2.screenY);
            ctx.closePath();
            ctx.fill();

            // Draw Center Dashed Lane markings
            if (seg.colorLane !== 'transparent') {
              const lw1 = Math.max(2, p1.screenW * 0.022);
              const lw2 = Math.max(1, p2.screenW * 0.022);
              ctx.fillStyle = '#f8fafc';
              ctx.beginPath();
              ctx.moveTo(p1.screenX - lw1, p1.screenY);
              ctx.lineTo(p1.screenX + lw1, p1.screenY);
              ctx.lineTo(p2.screenX + lw2, p2.screenY);
              ctx.lineTo(p2.screenX - lw2, p2.screenY);
              ctx.closePath();
              ctx.fill();
            }

            // Draw Roadside scenery sprites
            if (seg.sprites && n % 3 === 0) {
              for (const sp of seg.sprites) {
                const spriteX = p1.screenX + p1.scale * sp.offset * ROAD_WIDTH * (width / 2);
                const spriteY = p1.screenY;
                const spriteSize = Math.max(10, 240 * p1.scale * (width / 600));

                if (sp.type === 'palm' || sp.type === 'tree') {
                  // Trunk
                  ctx.fillStyle = '#78350f';
                  ctx.fillRect(spriteX - spriteSize * 0.06, spriteY - spriteSize, spriteSize * 0.12, spriteSize);
                  // Foliage
                  ctx.fillStyle = '#15803d';
                  ctx.beginPath();
                  ctx.arc(spriteX, spriteY - spriteSize * 1.05, spriteSize * 0.42, 0, Math.PI * 2);
                  ctx.fill();
                } else if (sp.type === 'billboard') {
                  ctx.fillStyle = '#0f172a';
                  ctx.fillRect(spriteX - spriteSize * 0.4, spriteY - spriteSize * 0.9, spriteSize * 0.8, spriteSize * 0.45);
                  ctx.strokeStyle = '#f59e0b';
                  ctx.lineWidth = 2;
                  ctx.strokeRect(spriteX - spriteSize * 0.4, spriteY - spriteSize * 0.9, spriteSize * 0.8, spriteSize * 0.45);
                  ctx.fillStyle = '#fbbf24';
                  ctx.font = `bold ${Math.max(8, spriteSize * 0.18)}px sans-serif`;
                  ctx.textAlign = 'center';
                  ctx.fillText('ROAD RASH', spriteX, spriteY - spriteSize * 0.62);
                } else if (sp.type === 'light') {
                  ctx.fillStyle = '#cbd5e1';
                  ctx.fillRect(spriteX - 2, spriteY - spriteSize, 4, spriteSize);
                  ctx.fillStyle = '#fef08a';
                  ctx.beginPath();
                  ctx.arc(spriteX, spriteY - spriteSize, 6, 0, Math.PI * 2);
                  ctx.fill();
                }
              }
            }
          }

          // ---------- 4. DRAW CIVILIAN TRAFFIC ----------
          for (const car of s.traffic) {
            let relZ = car.z - s.cameraZ;
            if (relZ < 0) relZ += totalTrackLen;
            if (relZ <= 0 || relZ > DRAW_DISTANCE * SEGMENT_LENGTH) continue;

            const carSeg = getSeg(Math.floor(car.z / SEGMENT_LENGTH));
            const p = project3D(
              car.x * ROAD_WIDTH,
              carSeg.worldY,
              s.cameraZ + relZ,
              cameraX,
              cameraY,
              s.cameraZ,
              width,
              height
            );

            if (!p || p.screenY > height || p.screenY < height * 0.35) continue;

            const carW = Math.max(16, 260 * p.scale * (width / 600));
            const carH = carW * 0.65;

            // Car body
            ctx.fillStyle = car.color;
            ctx.beginPath();
            ctx.roundRect(p.screenX - carW / 2, p.screenY - carH, carW, carH, 6);
            ctx.fill();

            // Car Roof & Windshield
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(p.screenX - carW * 0.35, p.screenY - carH * 0.92, carW * 0.7, carH * 0.4);

            // Taillights
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(p.screenX - carW * 0.45, p.screenY - carH * 0.35, carW * 0.22, carH * 0.22);
            ctx.fillRect(p.screenX + carW * 0.23, p.screenY - carH * 0.35, carW * 0.22, carH * 0.22);
          }

          // ---------- 5. DRAW RIVAL BIKERS & POLICE ----------
          for (const opp of s.opponents) {
            let relZ = opp.z - s.cameraZ;
            if (relZ < 0) relZ += totalTrackLen;
            if (relZ <= 0 || relZ > DRAW_DISTANCE * SEGMENT_LENGTH) continue;

            const oppSeg = getSeg(Math.floor(opp.z / SEGMENT_LENGTH));
            const p = project3D(
              opp.x * ROAD_WIDTH,
              oppSeg.worldY,
              s.cameraZ + relZ,
              cameraX,
              cameraY,
              s.cameraZ,
              width,
              height
            );

            if (!p || p.screenY > height || p.screenY < height * 0.35) continue;

            const bikeW = Math.max(14, 180 * p.scale * (width / 600));
            const bikeH = bikeW * 1.35;

            if (opp.isCrashed) {
              // Draw ragdoll tumbling biker & sparks
              ctx.fillStyle = '#f59e0b';
              ctx.fillRect(p.screenX - bikeW * 0.6, p.screenY - bikeH * 0.3, bikeW * 1.2, bikeH * 0.2);
              // Sparks
              for (let sp = 0; sp < 4; sp++) {
                ctx.fillStyle = '#fde047';
                ctx.fillRect(
                  p.screenX + (Math.random() - 0.5) * bikeW,
                  p.screenY - Math.random() * 20,
                  3,
                  3
                );
              }
            } else {
              // Biker Name & HP bar
              ctx.fillStyle = '#0f172a';
              ctx.fillRect(p.screenX - 35, p.screenY - bikeH - 24, 70, 14);
              ctx.fillStyle = opp.isPolice ? '#38bdf8' : '#fbbf24';
              ctx.font = 'bold 9px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText(opp.name.split(' ')[0], p.screenX, p.screenY - bikeH - 13);

              // Mini HP bar
              const hpPct = opp.hp / opp.maxHp;
              ctx.fillStyle = '#334155';
              ctx.fillRect(p.screenX - 32, p.screenY - bikeH - 8, 64, 4);
              ctx.fillStyle = hpPct > 0.4 ? '#10b981' : '#ef4444';
              ctx.fillRect(p.screenX - 32, p.screenY - bikeH - 8, 64 * hpPct, 4);

              // Police Strobe Beacon Lights
              if (opp.isPolice) {
                const strobe = Math.floor(now / 120) % 2 === 0;
                ctx.fillStyle = strobe ? '#ef4444' : '#3b82f6';
                ctx.beginPath();
                ctx.arc(p.screenX - bikeW * 0.3, p.screenY - bikeH * 0.7, 5, 0, Math.PI * 2);
                ctx.arc(p.screenX + bikeW * 0.3, p.screenY - bikeH * 0.7, 5, 0, Math.PI * 2);
                ctx.fill();
              }

              // Motorcycle rear tire
              ctx.fillStyle = '#0f172a';
              ctx.fillRect(p.screenX - bikeW * 0.18, p.screenY - bikeH * 0.4, bikeW * 0.36, bikeH * 0.4);

              // Motorcycle Body & Pipes
              ctx.fillStyle = opp.isPolice ? '#ffffff' : opp.weapon === 'chain' ? '#991b1b' : '#1e3a8a';
              ctx.beginPath();
              ctx.roundRect(p.screenX - bikeW * 0.38, p.screenY - bikeH * 0.65, bikeW * 0.76, bikeH * 0.35, 4);
              ctx.fill();

              // Biker Torso & Helmet
              ctx.fillStyle = opp.isPolice ? '#1e293b' : '#334155';
              ctx.beginPath();
              ctx.arc(p.screenX, p.screenY - bikeH * 0.75, bikeW * 0.28, 0, Math.PI * 2);
              ctx.fill();

              // Helmet
              ctx.fillStyle = opp.isPolice ? '#ffffff' : '#f59e0b';
              ctx.beginPath();
              ctx.arc(p.screenX, p.screenY - bikeH * 0.95, bikeW * 0.24, 0, Math.PI * 2);
              ctx.fill();

              // Weapon in Hand
              if (opp.weapon === 'chain') {
                ctx.strokeStyle = '#cbd5e1';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(p.screenX + bikeW * 0.3, p.screenY - bikeH * 0.7);
                ctx.lineTo(p.screenX + bikeW * 0.65, p.screenY - bikeH * 0.9);
                ctx.stroke();
              } else if (opp.weapon === 'club') {
                ctx.strokeStyle = '#b45309';
                ctx.lineWidth = 3.5;
                ctx.beginPath();
                ctx.moveTo(p.screenX + bikeW * 0.3, p.screenY - bikeH * 0.7);
                ctx.lineTo(p.screenX + bikeW * 0.55, p.screenY - bikeH * 1.05);
                ctx.stroke();
              }
            }
          }

          // ---------- 6. DRAW FOREGROUND PLAYER MOTORCYCLE ----------
          const playerScreenX = width / 2;
          const playerScreenY = height * 0.92;
          const pBikeW = Math.max(90, width * 0.18);
          const pBikeH = pBikeW * 1.35;

          // Steer Lean angle
          let leanDeg = 0;
          if (s.keys.left) leanDeg = -14;
          else if (s.keys.right) leanDeg = 14;

          ctx.save();
          ctx.translate(playerScreenX, playerScreenY);
          ctx.rotate((leanDeg * Math.PI) / 180);

          if (s.isPlayerCrashed) {
            // Pelican in crash state: bike skidding on side with sparks
            ctx.fillStyle = '#475569';
            ctx.beginPath();
            ctx.roundRect(-pBikeW * 0.6, -pBikeH * 0.25, pBikeW * 1.2, pBikeH * 0.2, 8);
            ctx.fill();

            // Skid sparks
            for (let sp = 0; sp < 6; sp++) {
              ctx.fillStyle = '#fde047';
              ctx.fillRect(
                (Math.random() - 0.5) * pBikeW * 1.4,
                -Math.random() * 25,
                4,
                4
              );
            }

            // Tumbling Pelican (White feathered body rolling, wings flailing, throat pouch flopping)
            const rollAngle = (now * 0.015) % (Math.PI * 2);
            ctx.save();
            ctx.translate(Math.sin(now * 0.008) * 35, -pBikeH * 0.5);
            ctx.rotate(rollAngle);

            // Flailing Pelican body
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(0, 0, 26, 18, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Golden throat pouch flopping
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.ellipse(16, 4, 16, 10, 0.4, 0, Math.PI * 2);
            ctx.fill();

            // Scattered flying feathers
            for (let f = 0; f < 4; f++) {
              const fx = Math.cos(f * 1.5 + now * 0.005) * 45;
              const fy = Math.sin(f * 1.5 + now * 0.005) * 35;
              ctx.fillStyle = '#f8fafc';
              ctx.beginPath();
              ctx.ellipse(fx, fy, 8, 3, f, 0, Math.PI * 2);
              ctx.fill();
            }

            ctx.restore();

            // Label
            ctx.fillStyle = '#f43f5e';
            ctx.font = 'bold 20px "Chakra Petch", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('💥 PELICAN DOWN! 暴走鹈鹕正在爬起...', 0, -pBikeH * 0.85);
          } else {
            // Nitro Flame Jet from twin exhaust
            if (s.isNitroActive) {
              const flameH = 40 + Math.random() * 30;
              ctx.fillStyle = '#06b6d4';
              ctx.beginPath();
              ctx.moveTo(-pBikeW * 0.28, 0);
              ctx.lineTo(-pBikeW * 0.22, flameH);
              ctx.lineTo(-pBikeW * 0.16, 0);
              ctx.closePath();
              ctx.fill();

              ctx.beginPath();
              ctx.moveTo(pBikeW * 0.16, 0);
              ctx.lineTo(pBikeW * 0.22, flameH);
              ctx.lineTo(pBikeW * 0.28, 0);
              ctx.closePath();
              ctx.fill();
            }

            // Handlebars & Chrome Rearview Mirrors
            ctx.fillStyle = '#64748b';
            ctx.fillRect(-pBikeW * 0.48, -pBikeH * 0.88, pBikeW * 0.96, 6);
            // Rubber Grips
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(-pBikeW * 0.5, -pBikeH * 0.90, pBikeW * 0.12, 10);
            ctx.fillRect(pBikeW * 0.38, -pBikeH * 0.90, pBikeW * 0.12, 10);
            // Mirrors
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(-pBikeW * 0.52, -pBikeH * 1.02, 3, 16);
            ctx.fillRect(pBikeW * 0.49, -pBikeH * 1.02, 3, 16);
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.ellipse(-pBikeW * 0.52, -pBikeH * 1.04, 7, 5, 0, 0, Math.PI * 2);
            ctx.ellipse(pBikeW * 0.50, -pBikeH * 1.04, 7, 5, 0, 0, Math.PI * 2);
            ctx.fill();

            // Fat Rear Tire (rubber with tread grooves)
            ctx.fillStyle = '#090d16';
            ctx.beginPath();
            ctx.roundRect(-pBikeW * 0.22, -pBikeH * 0.42, pBikeW * 0.44, pBikeH * 0.42, 12);
            ctx.fill();
            // Rim & Hub
            ctx.fillStyle = '#475569';
            ctx.beginPath();
            ctx.arc(0, -pBikeH * 0.21, pBikeW * 0.12, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#94a3b8';
            ctx.beginPath();
            ctx.arc(0, -pBikeH * 0.21, pBikeW * 0.05, 0, Math.PI * 2);
            ctx.fill();

            // Twin Chrome Exhaust Pipes
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(-pBikeW * 0.34, -pBikeH * 0.35, pBikeW * 0.09, pBikeH * 0.3);
            ctx.fillRect(pBikeW * 0.25, -pBikeH * 0.35, pBikeW * 0.09, pBikeH * 0.3);
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.ellipse(-pBikeW * 0.295, -pBikeH * 0.06, 4, 3, 0, 0, Math.PI * 2);
            ctx.ellipse(pBikeW * 0.295, -pBikeH * 0.06, 4, 3, 0, 0, Math.PI * 2);
            ctx.fill();

            // Metallic Superbike Chassis
            const chassisGrad = ctx.createLinearGradient(-pBikeW * 0.4, 0, pBikeW * 0.4, 0);
            chassisGrad.addColorStop(0, '#991b1b');
            chassisGrad.addColorStop(0.3, '#ef4444');
            chassisGrad.addColorStop(0.5, '#f87171');
            chassisGrad.addColorStop(0.7, '#ef4444');
            chassisGrad.addColorStop(1, '#991b1b');
            ctx.fillStyle = chassisGrad;
            ctx.beginPath();
            ctx.roundRect(-pBikeW * 0.38, -pBikeH * 0.65, pBikeW * 0.76, pBikeH * 0.35, 10);
            ctx.fill();

            // Taillight Strip (bright neon red with brake glow)
            ctx.fillStyle = s.keys.down ? '#fca5a5' : '#ef4444';
            ctx.fillRect(-pBikeW * 0.26, -pBikeH * 0.62, pBikeW * 0.52, 9);

            // Orange Webbed Feet on Footpegs
            const footW = pBikeW * 0.18;
            const footH = pBikeH * 0.12;
            ctx.fillStyle = '#f59e0b';
            ctx.strokeStyle = '#d97706';
            ctx.lineWidth = 2;
            // Left Footpeg & Webbed Foot
            ctx.beginPath();
            ctx.ellipse(-pBikeW * 0.36, -pBikeH * 0.32, footW * 0.7, footH * 0.6, -0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            // Right Footpeg & Webbed Foot
            ctx.beginPath();
            ctx.ellipse(pBikeW * 0.36, -pBikeH * 0.32, footW * 0.7, footH * 0.6, 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Pelican Tail Feathers flared backwards over rear fender
            const tailWag = Math.sin(now * 0.012) * 5;
            ctx.save();
            ctx.translate(0, -pBikeH * 0.58);
            ctx.rotate((tailWag * Math.PI) / 180);
            ctx.fillStyle = '#f8fafc';
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 1.5;
            // 3 Layered Feathers
            ctx.beginPath();
            ctx.ellipse(-14, -6, 12, 22, -0.3, 0, Math.PI * 2);
            ctx.ellipse(0, -10, 14, 26, 0, 0, Math.PI * 2);
            ctx.ellipse(14, -6, 12, 22, 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // Plump Pelican Torso (White feathered body seated on saddle)
            const bodyGrad = ctx.createRadialGradient(0, -pBikeH * 0.76, 10, 0, -pBikeH * 0.76, pBikeW * 0.4);
            bodyGrad.addColorStop(0, '#ffffff');
            bodyGrad.addColorStop(0.65, '#f1f5f9');
            bodyGrad.addColorStop(1, '#cbd5e1');
            ctx.fillStyle = bodyGrad;
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(0, -pBikeH * 0.76, pBikeW * 0.35, pBikeH * 0.24, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Pelican Wings gripping Handlebars
            const wingW = pBikeW * 0.28;
            const wingH = pBikeH * 0.18;
            // Left Wing
            ctx.fillStyle = '#f8fafc';
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-pBikeW * 0.22, -pBikeH * 0.74);
            ctx.quadraticCurveTo(-pBikeW * 0.46, -pBikeH * 0.82, -pBikeW * 0.44, -pBikeH * 0.90);
            ctx.quadraticCurveTo(-pBikeW * 0.32, -pBikeH * 0.92, -pBikeW * 0.16, -pBikeH * 0.80);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            // Wingtip dark flight feathers
            ctx.fillStyle = '#64748b';
            ctx.beginPath();
            ctx.ellipse(-pBikeW * 0.44, -pBikeH * 0.90, 8, 5, -0.4, 0, Math.PI * 2);
            ctx.fill();

            // Right Wing
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.moveTo(pBikeW * 0.22, -pBikeH * 0.74);
            ctx.quadraticCurveTo(pBikeW * 0.46, -pBikeH * 0.82, pBikeW * 0.44, -pBikeH * 0.90);
            ctx.quadraticCurveTo(pBikeW * 0.32, -pBikeH * 0.92, pBikeW * 0.16, -pBikeH * 0.80);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            // Wingtip dark flight feathers
            ctx.fillStyle = '#64748b';
            ctx.beginPath();
            ctx.ellipse(pBikeW * 0.44, -pBikeH * 0.90, 8, 5, 0.4, 0, Math.PI * 2);
            ctx.fill();

            // Pelican S-Curved Neck
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-16, -pBikeH * 0.86);
            ctx.quadraticCurveTo(-22, -pBikeH * 1.05, 0, -pBikeH * 1.14);
            ctx.quadraticCurveTo(22, -pBikeH * 1.05, 16, -pBikeH * 0.86);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Occipital Crest Feathers at back of head
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.moveTo(-6, -pBikeH * 1.18);
            ctx.lineTo(-24, -pBikeH * 1.25);
            ctx.lineTo(-12, -pBikeH * 1.14);
            ctx.lineTo(-26, -pBikeH * 1.19);
            ctx.lineTo(-6, -pBikeH * 1.10);
            ctx.closePath();
            ctx.fill();

            // Pelican Head & Skull
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, -pBikeH * 1.16, pBikeW * 0.22, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // ICONIC GOLDEN THROAT POUCH (Gular Pouch)
            const pouchPulse = Math.sin(now * 0.008) * 4;
            const pouchGrad = ctx.createLinearGradient(0, -pBikeH * 1.16, 0, -pBikeH * 0.95);
            pouchGrad.addColorStop(0, '#fde047');
            pouchGrad.addColorStop(0.4, '#f59e0b');
            pouchGrad.addColorStop(0.85, '#ea580c');
            pouchGrad.addColorStop(1, '#c2410c');
            ctx.fillStyle = pouchGrad;
            ctx.strokeStyle = '#d97706';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(-pBikeW * 0.16, -pBikeH * 1.12);
            ctx.quadraticCurveTo(
              0,
              -pBikeH * 0.92 + pouchPulse,
              pBikeW * 0.16,
              -pBikeH * 1.12
            );
            ctx.quadraticCurveTo(0, -pBikeH * 1.16, -pBikeW * 0.16, -pBikeH * 1.12);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Fish swimming inside the translucent throat pouch!
            for (let fi = 0; fi < 3; fi++) {
              const fishX = (fi - 1) * 12 + Math.sin(now * 0.015 + fi) * 4;
              const fishY = -pBikeH * 1.04 + (fi % 2) * 6;
              ctx.fillStyle = '#38bdf8';
              ctx.beginPath();
              ctx.ellipse(fishX, fishY, 9, 4, 0.2, 0, Math.PI * 2);
              ctx.fill();
              // Fish tail
              ctx.fillStyle = '#0284c7';
              ctx.beginPath();
              ctx.moveTo(fishX - 7, fishY);
              ctx.lineTo(fishX - 13, fishY - 4);
              ctx.lineTo(fishX - 11, fishY);
              ctx.lineTo(fishX - 13, fishY + 4);
              ctx.closePath();
              ctx.fill();
            }

            // Big Upper Beak (Yellow-Orange with Hook Tip)
            const beakGrad = ctx.createLinearGradient(0, -pBikeH * 1.18, 0, -pBikeH * 1.12);
            beakGrad.addColorStop(0, '#fef08a');
            beakGrad.addColorStop(1, '#f59e0b');
            ctx.fillStyle = beakGrad;
            ctx.strokeStyle = '#ca8a04';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-pBikeW * 0.18, -pBikeH * 1.14);
            ctx.lineTo(0, -pBikeH * 1.28);
            ctx.lineTo(pBikeW * 0.18, -pBikeH * 1.14);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            // Hook at tip of beak
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(0, -pBikeH * 1.28, 4, 0, Math.PI * 2);
            ctx.fill();

            // Big Pelican Eyes
            // Left Eye
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.arc(-14, -pBikeH * 1.18, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(-14, -pBikeH * 1.18, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-15.5, -pBikeH * 1.195, 1.8, 0, Math.PI * 2);
            ctx.fill();

            // Right Eye
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.arc(14, -pBikeH * 1.18, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(14, -pBikeH * 1.18, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(15.5, -pBikeH * 1.195, 1.8, 0, Math.PI * 2);
            ctx.fill();

            // Badass Biker Helmet on Pelican's Head
            ctx.fillStyle = '#dc2626';
            ctx.strokeStyle = '#991b1b';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, -pBikeH * 1.22, pBikeW * 0.24, Math.PI * 0.85, Math.PI * 2.15);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Helmet Racing Stripe & Visor
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(-3, -pBikeH * 1.34, 6, 18);
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(-pBikeW * 0.16, -pBikeH * 1.24, pBikeW * 0.32, 6);

            // Active Attack Animation Rendering
            if (s.playerAttack) {
              const { type, dir } = s.playerAttack;
              const armX = dir * pBikeW * 0.55;

              if (type === 'punch') {
                // Pelican Wing-Jab Punch with Feathers!
                ctx.fillStyle = '#ffffff';
                ctx.strokeStyle = '#94a3b8';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.ellipse(armX * 1.3, -pBikeH * 0.85, 22, 14, dir * 0.4, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                // Speed burst feathers
                ctx.fillStyle = '#f1f5f9';
                ctx.fillRect(armX * 1.5, -pBikeH * 0.85, 8, 4);
                ctx.fillRect(armX * 1.6, -pBikeH * 0.82, 10, 3);
              } else if (type === 'kick') {
                // Pelican Webbed Foot Side-Kick!
                ctx.fillStyle = '#f59e0b';
                ctx.strokeStyle = '#d97706';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.ellipse(armX * 1.5, -pBikeH * 0.45, 26, 14, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                // 3 Sharp black claws
                ctx.fillStyle = '#0f172a';
                ctx.beginPath();
                ctx.arc(armX * 1.5 + dir * 26, -pBikeH * 0.45 - 6, 3, 0, Math.PI * 2);
                ctx.arc(armX * 1.5 + dir * 28, -pBikeH * 0.45, 3.5, 0, Math.PI * 2);
                ctx.arc(armX * 1.5 + dir * 26, -pBikeH * 0.45 + 6, 3, 0, Math.PI * 2);
                ctx.fill();
              } else if (type === 'weapon') {
                // Pelican Wing swinging Weapon
                if (s.playerWeapon === 'chain') {
                  ctx.strokeStyle = '#f8fafc';
                  ctx.lineWidth = 5;
                  ctx.beginPath();
                  ctx.arc(armX * 1.1, -pBikeH * 0.85, 48, 0, Math.PI);
                  ctx.stroke();
                } else {
                  // Spiked Club
                  ctx.fillStyle = '#78350f';
                  ctx.fillRect(armX * 0.9, -pBikeH * 1.35, 14, 65);
                  ctx.fillStyle = '#cbd5e1';
                  ctx.beginPath();
                  ctx.arc(armX * 0.9 + 7, -pBikeH * 1.38, 14, 0, Math.PI * 2);
                  ctx.fill();
                }
              }
            }
          }

          ctx.restore();

          // ---------- 7. FLOATING FX & TEXT LABELS ----------
          for (let f = s.floatingFx.length - 1; f >= 0; f--) {
            const fx = s.floatingFx[f];
            fx.y -= 45 * dt;
            fx.alpha -= 0.65 * dt;

            ctx.save();
            ctx.globalAlpha = Math.max(0, fx.alpha);
            ctx.fillStyle = fx.color;
            ctx.font = `italic 900 ${Math.round(20 * fx.scale)}px "Chakra Petch", sans-serif`;
            ctx.textAlign = 'center';
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 8;
            ctx.fillText(fx.text, fx.x, fx.y);
            ctx.restore();

            if (fx.alpha <= 0) {
              s.floatingFx.splice(f, 1);
            }
          }

          // Speed lines when exceeding 180 km/h
          if (s.playerSpeed > 175) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
            ctx.lineWidth = 2;
            for (let l = 0; l < 6; l++) {
              const lx = Math.random() * width;
              const ly = height * 0.4 + Math.random() * (height * 0.5);
              ctx.beginPath();
              ctx.moveTo(lx, ly);
              ctx.lineTo(lx, ly + 60);
              ctx.stroke();
            }
          }

          ctx.restore(); // Restore trauma shake
        }
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [trackIndex, onLapComplete, onLifeLost, onScoreAdd, onKnockoutRival, onGameOver, onVictory, onUpdateTelemetry]);

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair"
        data-testid="roadrash-canvas"
      />
    </div>
  );
};
