export const WALKING_MOVEMENT_THRESHOLD_METERS = 3;

export function isWalkingMotion(speed: number | null, displacement: number, accuracy: number, wasMoving = false, stepDistance = 0) {
  if (!Number.isFinite(accuracy) || accuracy < 0 || accuracy > 25) return false;
  const speedShowsMovement = speed !== null && Number.isFinite(speed) && speed >= 0.5;
  // Some devices keep reporting zero speed while their coordinates move.
  // Accumulate displacement from the last movement anchor in that case too.
  const distanceShowsMovement = displacement >= Math.max(WALKING_MOVEMENT_THRESHOLD_METERS, Math.min(accuracy, 8));
  // Once walking is established, smaller steps must not stop the animation
  // while the next full anchor displacement accumulates on speed-less devices.
  const continuingMovement = wasMoving && Number.isFinite(stepDistance) && stepDistance >= 1;
  return speedShowsMovement || distanceShowsMovement || continuingMovement;
}
