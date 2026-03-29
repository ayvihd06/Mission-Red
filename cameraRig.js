// Camera waypoints for the 5 sections
// Each waypoint: { position: [x,y,z], lookAt: [x,y,z], fov: number }

export const CAMERA_WAYPOINTS = [
  // 0 — Pre-Launch: inside cockpit, looking forward
  { position: [0, 0.5, 8], lookAt: [0, 0, 0], fov: 75 },
  // 1 — Launch ignition: pulling back slightly
  { position: [0, 2, 14], lookAt: [0, 1, 0], fov: 70 },
  // 2 — Ascent: third-person cinematic, below & behind
  { position: [3, -4, 22], lookAt: [0, 0, 0], fov: 65 },
  // 3 — Deep space: wide orbit angle
  { position: [-8, 3, 18], lookAt: [0, 0, 0], fov: 60 },
  // 4 — Mars approach: first-person, heading toward mars
  { position: [0, 0.5, 10], lookAt: [0, 0, -60], fov: 80 },
  // 5 — Landing: slow cinematic descent
  { position: [4, 2, -50], lookAt: [0, -1, -80], fov: 55 },
];

// Lerp camera between two waypoints by t (0–1)
export function lerpCameraWaypoint(a, b, t) {
  const ease = easeInOutCubic(t);
  return {
    position: [
      a.position[0] + (b.position[0] - a.position[0]) * ease,
      a.position[1] + (b.position[1] - a.position[1]) * ease,
      a.position[2] + (b.position[2] - a.position[2]) * ease,
    ],
    lookAt: [
      a.lookAt[0] + (b.lookAt[0] - a.lookAt[0]) * ease,
      a.lookAt[1] + (b.lookAt[1] - a.lookAt[1]) * ease,
      a.lookAt[2] + (b.lookAt[2] - a.lookAt[2]) * ease,
    ],
    fov: a.fov + (b.fov - a.fov) * ease,
  };
}

// Scroll progress (0–1) → section index + local progress
export function getScrollSection(progress, numSections) {
  const sectionSize = 1 / (numSections - 1);
  const rawSection = progress / sectionSize;
  const section = Math.min(Math.floor(rawSection), numSections - 2);
  const localT = rawSection - section;
  return { section, localT };
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
