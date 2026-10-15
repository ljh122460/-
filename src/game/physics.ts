/**
 * Pure physics & projection logic for pseudo-3D curved road and motorcycle dynamics.
 * Decoupled from React and DOM for high performance and unit testing.
 */

export interface RoadSegment {
  index: number;
  worldY: number;      // hill height
  worldZ: number;      // distance along road
  curve: number;       // curvature of segment
  colorGrass: string;
  colorRumble: string;
  colorRoad: string;
  colorLane: string;
  sprites?: {
    type: 'tree' | 'billboard' | 'rock' | 'palm' | 'light' | 'cactus';
    offset: number; // -2 to -1.2 (left), 1.2 to 2 (right)
  }[];
}

export const SEGMENT_LENGTH = 200;
export const ROAD_WIDTH = 2200;
export const CAMERA_HEIGHT = 1000;
export const CAMERA_DEPTH = 0.84; // field of view factor
export const DRAW_DISTANCE = 300;

export interface ProjectedPoint {
  scale: number;
  screenX: number;
  screenY: number;
  screenW: number;
}

/**
 * Project a 3D road point onto 2D screen coordinates
 */
export function project3D(
  worldX: number,
  worldY: number,
  worldZ: number,
  cameraX: number,
  cameraY: number,
  cameraZ: number,
  screenWidth: number,
  screenHeight: number
): ProjectedPoint | null {
  const relativeZ = worldZ - cameraZ;
  if (relativeZ <= 0) return null;

  const scale = CAMERA_DEPTH / relativeZ;
  const screenX = Math.round((screenWidth / 2) + (scale * (worldX - cameraX) * screenWidth / 2));
  const screenY = Math.round((screenHeight / 2) - (scale * (worldY - cameraY) * screenHeight / 2));
  const screenW = Math.round(scale * ROAD_WIDTH * screenWidth / 2);

  return { scale, screenX, screenY, screenW };
}

/**
 * Calculate player motorcycle speed update based on input, terrain, and nitro
 */
export function updatePlayerSpeed(
  currentSpeed: number,
  maxSpeed: number,
  accel: number,
  braking: number,
  isAccelerating: boolean,
  isBraking: boolean,
  isOffroad: boolean,
  isNitro: boolean,
  dt: number
): number {
  let speed = currentSpeed;
  const effectiveMax = isNitro ? maxSpeed * 1.35 : maxSpeed;
  const offroadSpeedLimit = maxSpeed * 0.35;

  if (isAccelerating) {
    const boost = isNitro ? accel * 2.2 : accel;
    speed += boost * dt;
  } else if (isBraking) {
    speed -= braking * dt;
  } else {
    // Natural deceleration / engine braking
    speed -= (accel * 0.45) * dt;
  }

  // Off-road penalty
  if (isOffroad && speed > offroadSpeedLimit) {
    speed -= braking * 1.5 * dt;
  }

  return Math.max(0, Math.min(speed, isOffroad ? Math.max(speed - 100 * dt, offroadSpeedLimit) : effectiveMax));
}

/**
 * Calculate centrifugal lateral force on motorcycle when turning in curved road
 */
export function calculateCentrifugalForce(
  speedRatio: number,
  curve: number,
  dt: number
): number {
  // force pushes vehicle outward relative to curve direction
  return curve * (speedRatio * speedRatio) * 1.8 * dt;
}

/**
 * Generate a track with curves, hills, and scenery
 */
export function buildTrack(totalSegments: number = 2500): RoadSegment[] {
  const segments: RoadSegment[] = [];

  for (let i = 0; i < totalSegments; i++) {
    // Determine curve pattern
    let curve = 0;
    const section = Math.floor(i / 150);
    if (section % 5 === 1) curve = 2.4;
    else if (section % 5 === 2) curve = -2.8;
    else if (section % 5 === 3) curve = 3.6;
    else if (section % 5 === 4) curve = -1.8;

    // Determine hill height pattern (undulations)
    const hillHeight = Math.sin(i / 30) * 1200 + Math.sin(i / 80) * 1600;

    const isAlt = Math.floor(i / 3) % 2 === 0;

    const seg: RoadSegment = {
      index: i,
      worldY: hillHeight,
      worldZ: i * SEGMENT_LENGTH,
      curve,
      colorGrass: isAlt ? '#10381e' : '#0d2c18',
      colorRumble: isAlt ? '#ffffff' : '#c92a2a',
      colorRoad: isAlt ? '#2b2f3a' : '#232730',
      colorLane: isAlt ? '#f8f9fa' : 'transparent',
    };

    // Add scenery props
    if (i % 20 === 0) {
      seg.sprites = [
        { type: i % 40 === 0 ? 'billboard' : 'palm', offset: -1.6 - (i % 3) * 0.3 },
        { type: i % 60 === 0 ? 'light' : 'rock', offset: 1.6 + (i % 2) * 0.4 },
      ];
    }

    segments.push(seg);
  }

  return segments;
}
