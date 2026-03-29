import { useState, useEffect, useCallback, useRef } from 'react';

const DIRECTIONS = {
  ArrowUp: 'up', w: 'up', W: 'up',
  ArrowDown: 'down', s: 'down', S: 'down',
  ArrowLeft: 'left', a: 'left', A: 'left',
  ArrowRight: 'right', d: 'right', D: 'right',
  ' ': 'brake',
};

export default function LandingControls({ visible, onThrusterFire, onBrake, stability }) {
  const [active, setActive] = useState({});
  const pressedRef = useRef({});

  // ── Keyboard handling ──
  const handleKey = useCallback((e, down) => {
    const dir = DIRECTIONS[e.key];
    if (!dir) return;
    if (down && !pressedRef.current[dir]) {
      pressedRef.current[dir] = true;
      setActive(prev => ({ ...prev, [dir]: true }));
      if (dir === 'brake') onBrake?.();
      else onThrusterFire?.(dir);
    }
    if (!down) {
      pressedRef.current[dir] = false;
      setActive(prev => ({ ...prev, [dir]: false }));
    }
  }, [onThrusterFire, onBrake]);

  useEffect(() => {
    if (!visible) return;
    const down = e => handleKey(e, true);
    const up = e => handleKey(e, false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [visible, handleKey]);

  const press = (dir) => {
    setActive(prev => ({ ...prev, [dir]: true }));
    if (dir === 'brake') onBrake?.();
    else onThrusterFire?.(dir);
    setTimeout(() => setActive(prev => ({ ...prev, [dir]: false })), 150);
  };

  if (!visible) return null;

  const stabilityColor = stability > 75 ? 'var(--hud-green)' : stability > 40 ? 'var(--hud-amber)' : 'var(--hud-red)';
  const stabilityLabel = stability > 75 ? 'STABLE' : stability > 40 ? 'CORRECTING' : 'CRITICAL';

  return (
    <div className="landing-controls">
      {/* ── Stability meter ── */}
      <div style={{
        textAlign: 'center',
        marginBottom: 12,
        fontFamily: 'var(--font-hud)',
      }}>
        <div style={{ fontSize: 8, letterSpacing: '0.25em', color: 'rgba(0,212,255,0.5)', marginBottom: 4 }}>
          LANDING STABILIZATION
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
          <div style={{
            width: 120, height: 4,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 2,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${stability}%`,
              background: stabilityColor,
              borderRadius: 2,
              boxShadow: `0 0 6px ${stabilityColor}`,
              transition: 'width 0.3s ease, background 0.3s ease',
            }} />
          </div>
          <span style={{ color: stabilityColor, fontSize: 10 }}>{stabilityLabel}</span>
        </div>
      </div>

      {/* ── Thruster pad ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        {/* Controls hint */}
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 8,
          color: 'rgba(255,255,255,0.25)',
          letterSpacing: '0.1em',
          marginBottom: 4,
          textAlign: 'center',
        }}>
          WASD / ARROWS · SPACE=BRAKE
        </div>

        <div className="thruster-grid">
          {/* Row 1 */}
          <div /> {/* empty */}
          <button
            id="thruster-up"
            className={`thruster-btn${active.up ? ' active' : ''}`}
            onPointerDown={() => press('up')}
            title="Thrust Up"
          >↑</button>
          <div />

          {/* Row 2 */}
          <button
            id="thruster-left"
            className={`thruster-btn${active.left ? ' active' : ''}`}
            onPointerDown={() => press('left')}
            title="Thrust Left"
          >←</button>
          <button
            id="thruster-brake"
            className={`thruster-btn center${active.brake ? ' active' : ''}`}
            onPointerDown={() => press('brake')}
            title="Brake"
          >■</button>
          <button
            id="thruster-right"
            className={`thruster-btn${active.right ? ' active' : ''}`}
            onPointerDown={() => press('right')}
            title="Thrust Right"
          >→</button>

          {/* Row 3 */}
          <div />
          <button
            id="thruster-down"
            className={`thruster-btn${active.down ? ' active' : ''}`}
            onPointerDown={() => press('down')}
            title="Thrust Down"
          >↓</button>
          <div />
        </div>
      </div>

      {/* Landing zone radar mini-map */}
      <LandingRadar stability={stability} />
    </div>
  );
}

// Mini radar showing landing zone approach
function LandingRadar({ stability }) {
  const dotX = 50 + (Math.random() - 0.5) * (100 - stability);
  const dotY = 50 + (Math.random() - 0.5) * (100 - stability);

  return (
    <div style={{ marginTop: 12, textAlign: 'center' }}>
      <div style={{
        fontFamily: 'var(--font-hud)',
        fontSize: 8,
        letterSpacing: '0.2em',
        color: 'rgba(0,212,255,0.4)',
        marginBottom: 4,
      }}>LANDING ZONE</div>
      <svg width={80} height={80} style={{ display: 'inline-block' }}>
        {/* Background */}
        <rect width={80} height={80} fill="rgba(0,8,20,0.8)" rx={4} />
        <rect width={80} height={80} fill="none" stroke="rgba(0,212,255,0.2)" strokeWidth={1} rx={4} />
        {/* Range rings */}
        {[30, 20, 10].map((r, i) => (
          <circle key={i} cx={40} cy={40} r={r} fill="none" stroke="rgba(0,212,255,0.15)" strokeWidth={1} strokeDasharray="3 3" />
        ))}
        {/* Crosshair */}
        <line x1={40} y1={5} x2={40} y2={75} stroke="rgba(0,212,255,0.2)" strokeWidth={0.5} />
        <line x1={5} y1={40} x2={75} y2={40} stroke="rgba(0,212,255,0.2)" strokeWidth={0.5} />
        {/* Target zone */}
        <circle cx={40} cy={40} r={6} fill="none" stroke="var(--hud-green)" strokeWidth={1} opacity={0.6} />
        {/* Vehicle dot */}
        <circle
          cx={40 + (50 - stability) * 0.3}
          cy={40 + Math.sin(Date.now() * 0.001) * (100 - stability) * 0.2}
          r={3}
          fill="var(--mars-orange)"
          style={{ filter: 'drop-shadow(0 0 3px var(--mars-orange))' }}
        />
        {/* Labels */}
        <text x={40} y={3} textAnchor="middle" fill="rgba(0,212,255,0.3)" fontSize={5} fontFamily="Orbitron">N</text>
      </svg>
    </div>
  );
}
