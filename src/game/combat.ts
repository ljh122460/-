/**
 * Road Rash combat, weapon collisions, AI rules, difficulty scaling, scoring & lives system.
 * Decoupled for pure execution and unit testing.
 */

export type AttackType = 'punch' | 'kick' | 'weapon';
export type WeaponType = 'fists' | 'club' | 'chain';
export type DifficultyLevel = 'easy' | 'normal' | 'hard';

export interface DifficultyConfig {
  name: string;
  label: string;
  speedMultiplier: number;
  attackIntervalProbability: number;
  damageMultiplier: number;
  aiAggressiveness: number; // 0 to 1
  policePursuitIntensity: number;
}

export const DIFFICULTY_SETTINGS: Record<DifficultyLevel, DifficultyConfig> = {
  easy: {
    name: 'easy',
    label: '简单',
    speedMultiplier: 0.82,
    attackIntervalProbability: 0.02, // rare attacks
    damageMultiplier: 0.7,
    aiAggressiveness: 0.3,
    policePursuitIntensity: 0.4,
  },
  normal: {
    name: 'normal',
    label: '普通',
    speedMultiplier: 1.0,
    attackIntervalProbability: 0.06, // regular attacks
    damageMultiplier: 1.0,
    aiAggressiveness: 0.65,
    policePursuitIntensity: 0.75,
  },
  hard: {
    name: 'hard',
    label: '困难',
    speedMultiplier: 1.18,
    attackIntervalProbability: 0.14, // highly aggressive attacks
    damageMultiplier: 1.35,
    aiAggressiveness: 0.95,
    policePursuitIntensity: 1.0,
  },
};

export interface Combatant {
  id: string;
  name: string;
  x: number;       // lateral position (-1 to 1 is on road)
  z: number;       // distance along track
  speed: number;
  baseMaxSpeed: number;
  hp: number;
  maxHp: number;
  weapon: WeaponType;
  isCrashed: boolean;
  crashTimer: number; // seconds remaining in ragdoll/recovery
  isPolice?: boolean;
}

export interface AttackResult {
  hit: boolean;
  damage: number;
  knockbackX: number;
  stunDuration: number;
  isKnockout: boolean;
}

export const ATTACK_STATS: Record<AttackType, { baseDamage: number; knockback: number; rangeX: number; rangeZ: number }> = {
  punch: { baseDamage: 18, knockback: 0.18, rangeX: 0.44, rangeZ: 140 },
  kick: { baseDamage: 26, knockback: 0.45, rangeX: 0.50, rangeZ: 160 },
  weapon: { baseDamage: 42, knockback: 0.38, rangeX: 0.55, rangeZ: 190 },
};

/**
 * Check if an attack from attacker hits target based on 2.5D proximity
 */
export function resolveAttack(
  attacker: { x: number; z: number; weapon?: WeaponType; isPlayer?: boolean },
  target: Combatant,
  attackType: AttackType,
  difficulty: DifficultyLevel = 'normal'
): AttackResult {
  if (target.isCrashed) {
    return { hit: false, damage: 0, knockbackX: 0, stunDuration: 0, isKnockout: false };
  }

  const stats = ATTACK_STATS[attackType];
  const deltaX = Math.abs(attacker.x - target.x);
  const deltaZ = Math.abs(attacker.z - target.z);

  // Check if within lateral and longitudinal strike cone
  if (deltaX <= stats.rangeX && deltaZ <= stats.rangeZ) {
    let damage = stats.baseDamage;
    if (attackType === 'weapon') {
      if (attacker.weapon === 'chain') damage += 16;
      else if (attacker.weapon === 'club') damage += 10;
    }

    // Apply difficulty damage scaling for enemy attacks on player
    if (!attacker.isPlayer) {
      damage = Math.round(damage * DIFFICULTY_SETTINGS[difficulty].damageMultiplier);
    }

    // Direction of knockback: away from attacker
    const direction = target.x >= attacker.x ? 1 : -1;
    const knockbackX = stats.knockback * direction;

    const remainingHp = Math.max(0, target.hp - damage);
    const isKnockout = remainingHp <= 0;

    return {
      hit: true,
      damage,
      knockbackX,
      stunDuration: isKnockout ? 3.0 : 0.4,
      isKnockout,
    };
  }

  return { hit: false, damage: 0, knockbackX: 0, stunDuration: 0, isKnockout: false };
}

/**
 * AI Opponent decision tick governed by difficulty
 */
export function updateOpponentAI(
  ai: Combatant,
  player: { x: number; z: number; speed: number },
  difficulty: DifficultyLevel,
  dt: number
): { steerX: number; targetSpeed: number; attack?: AttackType } {
  if (ai.isCrashed) {
    return { steerX: 0, targetSpeed: 0 };
  }

  const diffConfig = DIFFICULTY_SETTINGS[difficulty];
  const targetSpeed = ai.baseMaxSpeed * diffConfig.speedMultiplier;

  const deltaZ = player.z - ai.z;
  const deltaX = player.x - ai.x;

  let steerX = 0;
  let attack: AttackType | undefined;

  // In close proximity with player in longitudinal track distance
  if (Math.abs(deltaZ) < 220) {
    // Steer towards player to contest line and engage
    if (Math.abs(deltaX) > 0.22) {
      const steerIntensity = diffConfig.aiAggressiveness * 0.9;
      steerX = deltaX > 0 ? steerIntensity : -steerIntensity;
    } else {
      // In strike range! Probability of attack per frame scaled by difficulty
      if (Math.random() < diffConfig.attackIntervalProbability) {
        if (ai.weapon !== 'fists') {
          attack = 'weapon';
        } else {
          attack = Math.random() < (difficulty === 'hard' ? 0.75 : 0.45) ? 'kick' : 'punch';
        }
      }
    }
  } else if (Math.abs(deltaZ) > 600) {
    // Return to racing line towards center
    steerX = ai.x > 0 ? -0.3 : 0.3;
  }

  return { steerX, targetSpeed, attack };
}

/**
 * Handle player life deduction and crash state
 */
export function processCrashLifeDeduction(
  currentLives: number,
  severity: 'heavy_crash' | 'knockout'
): { remainingLives: number; isGameOver: boolean } {
  const remainingLives = Math.max(0, currentLives - 1);
  return {
    remainingLives,
    isGameOver: remainingLives <= 0,
  };
}

/**
 * Calculate dynamic score addition with difficulty bonus
 */
export function calculateScoreAddition(
  event: 'hit' | 'knockout' | 'lap_completed' | 'near_miss',
  difficulty: DifficultyLevel,
  currentScore: number
): { points: number; comboMultiplier: number } {
  const diffMultiplier = difficulty === 'hard' ? 1.5 : difficulty === 'normal' ? 1.0 : 0.8;
  
  // Calculate dynamic multiplier based on score tier
  let comboMultiplier = 1.0;
  if (currentScore > 5000) comboMultiplier = 1.6;
  else if (currentScore > 2500) comboMultiplier = 1.3;
  else if (currentScore > 1000) comboMultiplier = 1.15;

  let basePoints = 0;
  switch (event) {
    case 'hit':
      basePoints = 150;
      break;
    case 'knockout':
      basePoints = 650;
      break;
    case 'lap_completed':
      basePoints = 2500;
      break;
    case 'near_miss':
      basePoints = 90;
      break;
  }

  const points = Math.round(basePoints * diffMultiplier * comboMultiplier);
  return { points, comboMultiplier };
}

/**
 * Calculate race reward money and reputation
 */
export function calculateRaceReward(
  position: number,
  knockouts: number,
  totalRacers: number,
  difficulty: DifficultyLevel = 'normal'
): { prizeMoney: number; reputation: number } {
  let basePrize = 0;
  if (position === 1) basePrize = 2000;
  else if (position === 2) basePrize = 1300;
  else if (position === 3) basePrize = 850;
  else if (position <= 5) basePrize = 450;
  else basePrize = 200;

  const diffMultiplier = difficulty === 'hard' ? 1.4 : difficulty === 'normal' ? 1.0 : 0.8;
  const knockoutBonus = knockouts * 150;
  const prizeMoney = Math.round((basePrize + knockoutBonus) * diffMultiplier);
  const reputation = Math.max(10, (totalRacers - position + 1) * 25 + knockouts * 20);

  return { prizeMoney, reputation };
}
