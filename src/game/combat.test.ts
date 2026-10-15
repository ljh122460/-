import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveAttack,
  calculateRaceReward,
  processCrashLifeDeduction,
  calculateScoreAddition,
  DIFFICULTY_SETTINGS,
  ATTACK_STATS,
} from './combat.ts';

test('resolveAttack inflicts punch damage and knockback when in range', () => {
  const attacker = { x: 0.1, z: 500, weapon: 'fists' as const, isPlayer: true };
  const target = {
    id: 'biker1',
    name: 'Viper',
    x: 0.25,
    z: 550,
    speed: 120,
    baseMaxSpeed: 160,
    hp: 100,
    maxHp: 100,
    weapon: 'fists' as const,
    isCrashed: false,
    crashTimer: 0,
  };

  const result = resolveAttack(attacker, target, 'punch', 'normal');
  assert.equal(result.hit, true);
  assert.equal(result.damage, ATTACK_STATS.punch.baseDamage);
  assert.ok(result.knockbackX > 0, 'Knockback should be positive (away from attacker)');
  assert.equal(result.isKnockout, false);
});

test('difficulty settings affect damage when enemy attacks player', () => {
  const enemyAttacker = { x: 0.1, z: 500, weapon: 'fists' as const, isPlayer: false };
  const player = {
    id: 'player',
    name: 'Player',
    x: 0.25,
    z: 550,
    speed: 120,
    baseMaxSpeed: 180,
    hp: 100,
    maxHp: 100,
    weapon: 'fists' as const,
    isCrashed: false,
    crashTimer: 0,
  };

  const easyResult = resolveAttack(enemyAttacker, player, 'punch', 'easy');
  const hardResult = resolveAttack(enemyAttacker, player, 'punch', 'hard');

  assert.ok(easyResult.damage < hardResult.damage, 'Hard difficulty should deal more damage than easy');
  assert.equal(DIFFICULTY_SETTINGS.easy.speedMultiplier < DIFFICULTY_SETTINGS.hard.speedMultiplier, true);
});

test('3 lives system deducts life on severe collision or knockout', () => {
  const firstCrash = processCrashLifeDeduction(3, 'heavy_crash');
  assert.equal(firstCrash.remainingLives, 2);
  assert.equal(firstCrash.isGameOver, false);

  const secondCrash = processCrashLifeDeduction(firstCrash.remainingLives, 'heavy_crash');
  assert.equal(secondCrash.remainingLives, 1);
  assert.equal(secondCrash.isGameOver, false);

  const thirdCrash = processCrashLifeDeduction(secondCrash.remainingLives, 'knockout');
  assert.equal(thirdCrash.remainingLives, 0);
  assert.equal(thirdCrash.isGameOver, true);
});

test('score addition increases with difficulty and lap/knockout events', () => {
  const easyHit = calculateScoreAddition('hit', 'easy', 0);
  const hardHit = calculateScoreAddition('hit', 'hard', 0);
  const hardKnockout = calculateScoreAddition('knockout', 'hard', 1500);
  const lapBonus = calculateScoreAddition('lap_completed', 'normal', 0);

  assert.ok(hardHit.points > easyHit.points, 'Hard difficulty yields higher score per hit');
  assert.ok(hardKnockout.points > hardHit.points, 'Knockout yields much higher points than regular hit');
  assert.ok(lapBonus.points >= 2500, 'Lap completion gives major bonus');
});

test('calculateRaceReward gives higher rewards for top positions and knockouts with difficulty bonus', () => {
  const winnerHard = calculateRaceReward(1, 3, 8, 'hard');
  const runnerUpEasy = calculateRaceReward(4, 0, 8, 'easy');

  assert.ok(winnerHard.prizeMoney > runnerUpEasy.prizeMoney, '1st place on hard earns significantly more');
});
