import { useMemo, useEffect, useRef } from 'react';

// Formats large numbers with commas
function fmt(n) {
  return Math.round(n).toLocaleString();
}

// Animated counter hook
function useCounter(target, duration = 300) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.textContent = fmt(target);
    }
  }, [target]);
  return ref;
}

// Single HUD metric panel
function HUDPanel({ label, value, unit = '', color = '', bar = null, barColor = '' }) {
  return (
    <div className="hud-panel" style={{ minWidth: 110 }}>
      <div className="hud-label">{label}</div>
      <div className={`hud-value${color ? ' ' + color : ''}`} style={{ fontSize: 15 }}>
        {value}
        {unit && <span style={{ fontSize: 10, opacity: 0.6, marginLeft: 3 }}>{unit}</span>}
      </div>
      {bar !== null && (
        <div className="hud-bar-track">
          <div
            className={`hud-bar-fill${barColor ? ' ' + barColor : ''}`}
            style={{ width: `${Math.max(0, Math.min(100, bar))}%` }}
          />
        </div>
      )}
    </div>
  );
}

// System status badge
function StatusBadge({ status }) {
  const map = {
    NOMINAL: { color: 'green', icon: '●' },
    CAUTION: { color: 'amber', icon: '◆' },
    WARNING: { color: 'red', icon: '▲' },
    STANDBY: { color: '', icon: '○' },
  };
  const s = map[status] || map.STANDBY;
  return (
    <div className="hud-panel" style={{ minWidth: 80 }}>
      <div className="hud-label">SYS STATUS</div>
      <div className={`hud-value${s.color ? ' ' + s.color : ''}`} style={{ fontSize: 12, letterSpacing: '0.05em' }}>
        {s.icon} {status}
      </div>
    </div>
  );
}

// Camera mode indicator
function CameraMode({ section }) {
  const modes = ['COCKPIT · FPV', 'LAUNCH · CAM', 'CINEMATIC · ORBIT', 'TRACKING · CAM', 'RE-ENTRY · FPV', 'DESCENT · CAM'];
  const mode = modes[Math.min(section, modes.length - 1)];
  return (
    <div style={{
      fontFamily: 'var(--font-hud)',
      fontSize: 9,
      letterSpacing: '0.2em',
      color: 'rgba(0,212,255,0.5)',
      border: '1px solid rgba(0,212,255,0.15)',
      padding: '3px 8px',
      borderRadius: 2,
    }}>
      {mode}
    </div>
  );
}

// Trajectory indicator — simple compass-style ring
function TrajectoryIndicator({ angle }) {
  const size = 70;
  const cx = size / 2;
  const cy = size / 2;
  const r = 28;
  const needleAngle = (angle * Math.PI) / 180;

  return (
    <div className="hud-panel" style={{ padding: 8 }}>
      <div className="hud-label" style={{ marginBottom: 4 }}>TRAJECTORY</div>
      <svg width={size} height={size} style={{ display: 'block' }}>
        {/* Ring */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,212,255,0.2)" strokeWidth={1} />
        {/* Tick marks */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map(a => {
          const rad = (a * Math.PI) / 180;
          return (
            <line
              key={a}
              x1={cx + (r - 4) * Math.cos(rad)}
              y1={cy + (r - 4) * Math.sin(rad)}
              x2={cx + r * Math.cos(rad)}
              y2={cy + r * Math.sin(rad)}
              stroke="rgba(0,212,255,0.35)"
              strokeWidth={1}
            />
          );
        })}
        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={cx + (r - 6) * Math.cos(needleAngle - Math.PI / 2)}
          y2={cy + (r - 6) * Math.sin(needleAngle - Math.PI / 2)}
          stroke="var(--mars-orange)"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
        {/* Center dot */}
        <circle cx={cx} cy={cy} r={2} fill="var(--hud-cyan)" />
        {/* N label */}
        <text x={cx} y={cy - r + 10} textAnchor="middle" fill="rgba(0,212,255,0.5)" fontSize={6} fontFamily="Orbitron">N</text>
      </svg>
    </div>
  );
}

// Altitude/speed graph mini sparkline
function MiniGraph({ values, color = 'var(--hud-cyan)' }) {
  if (!values || values.length < 2) return null;
  const w = 90, h = 30;
  const max = Math.max(...values, 1);
  const min = Math.min(...values);
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={w} height={h} style={{ display: 'block', marginTop: 4 }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.8} />
      {/* Fill area */}
      <polyline
        points={`0,${h} ${points} ${w},${h}`}
        fill={color}
        stroke="none"
        opacity={0.08}
      />
    </svg>
  );
}

export default function HUD({ scrollProgress, section, missionTime, speedHistory, visible }) {
  // Derived mission data from scroll progress
  const TOTAL_DISTANCE_KM = 225_000_000; // Earth–Mars average
  const distance = useMemo(() => Math.round(scrollProgress * TOTAL_DISTANCE_KM), [scrollProgress]);
  const velocity = useMemo(() => {
    // Peaks at launch, stabilises, then decreases at approach
    const base = 28 + scrollProgress * 12;
    const dip = section >= 4 ? (section - 4) * 8 : 0;
    return Math.max(5, base - dip);
  }, [scrollProgress, section]);
  const fuel = useMemo(() => Math.max(0, 100 - scrollProgress * 85), [scrollProgress]);
  const altitude = useMemo(() => {
    if (section < 2) return scrollProgress * 200;
    if (section < 4) return 200 + scrollProgress * 300;
    return Math.max(10, 500 - (scrollProgress - 0.7) * 1600);
  }, [scrollProgress, section]);
  const trajectoryAngle = useMemo(() => scrollProgress * 360 * 0.8, [scrollProgress]);
  const sysStatus = useMemo(() => {
    if (fuel < 5) return 'WARNING';
    if (fuel < 20) return 'CAUTION';
    if (section >= 4) return 'CAUTION';
    return 'NOMINAL';
  }, [fuel, section]);

  // Format mission time
  const timeStr = useMemo(() => {
    const s = Math.round(missionTime);
    const h = Math.floor(s / 3600).toString().padStart(2, '0');
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${h}:${m}:${sec}`;
  }, [missionTime]);

  if (!visible) return null;

  return (
    <div className="hud-overlay">
      {/* ── TOP LEFT: Distance + velocity ── */}
      <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <HUDPanel
          label="DIST TO MARS"
          value={fmt(Math.max(0, TOTAL_DISTANCE_KM - distance))}
          unit="km"
          color={section >= 4 ? 'amber' : ''}
        />
        <HUDPanel
          label="VELOCITY"
          value={velocity.toFixed(1)}
          unit="km/s"
          color="green"
        />
        <HUDPanel
          label="ALTITUDE"
          value={fmt(altitude)}
          unit="km"
        />
      </div>

      {/* ── TOP RIGHT: Status + fuel + timer ── */}
      <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
        <StatusBadge status={sysStatus} />
        <HUDPanel
          label="FUEL"
          value={fuel.toFixed(1)}
          unit="%"
          color={fuel < 15 ? 'red' : fuel < 30 ? 'amber' : ''}
          bar={fuel}
          barColor="fuel"
        />
        <div className="hud-panel">
          <div className="hud-label">MISSION TIME</div>
          <div className="hud-value" style={{ fontSize: 13, letterSpacing: '0.12em' }}>{timeStr}</div>
        </div>
      </div>

      {/* ── BOTTOM LEFT: Trajectory + graph ── */}
      <div style={{ position: 'absolute', bottom: 100, left: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <TrajectoryIndicator angle={trajectoryAngle} />
        {speedHistory && speedHistory.length > 2 && (
          <div className="hud-panel" style={{ padding: 8 }}>
            <div className="hud-label" style={{ marginBottom: 2 }}>VELOCITY TREND</div>
            <MiniGraph values={speedHistory} color="var(--hud-cyan)" />
          </div>
        )}
      </div>

      {/* ── BOTTOM RIGHT: Camera mode + section ── */}
      <div style={{ position: 'absolute', bottom: 100, right: 16, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
        <CameraMode section={section} />
        <div className="hud-panel" style={{ minWidth: 110 }}>
          <div className="hud-label">PROGRESS</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <div style={{
              flex: 1,
              height: 3,
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 2,
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${scrollProgress * 100}%`,
                background: 'linear-gradient(90deg, var(--mars-red), var(--mars-orange))',
                borderRadius: 2,
                boxShadow: '0 0 6px var(--mars-orange)',
                transition: 'width 0.3s ease',
              }} />
            </div>
            <span style={{
              fontFamily: 'var(--font-hud)',
              fontSize: 10,
              color: 'var(--mars-orange)',
            }}>{Math.round(scrollProgress * 100)}%</span>
          </div>
        </div>
        {/* TRAJ LOCK */}
        <div className="hud-panel" style={{ minWidth: 110 }}>
          <div className="hud-label">TRAJ LOCK</div>
          <div className="hud-value green" style={{ fontSize: 11, letterSpacing: '0.05em' }}>
            {section >= 4 ? '▲ ADJUSTING' : '✓ LOCKED'}
          </div>
        </div>
      </div>

      {/* ── CENTER CROSSHAIR (first-person sections) ── */}
      {(section === 0 || section >= 4) && (
        <div className="crosshair" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          <div className="crosshair-ring" />
        </div>
      )}

      {/* ── Section label overlay ── */}
      <SectionLabel section={section} scrollProgress={scrollProgress} />
    </div>
  );
}

const SECTION_INFO = [
  { badge: 'SEC 01 // PRE-LAUNCH', title: null },
  { badge: 'SEC 02 // IGNITION & ASCENT', title: 'T+00:00 · MAIN ENGINE IGNITION' },
  { badge: 'SEC 03 // DEEP SPACE TRANSIT', title: 'EARTH DEPARTURE · HELIOCENTRIC ORBIT' },
  { badge: 'SEC 04 // MARS APPROACH', title: 'MARS ORBIT INSERTION · STAND BY' },
  { badge: 'SEC 05 // ATMOSPHERIC ENTRY', title: 'RE-ENTRY SEQUENCE · ACTIVE' },
  { badge: 'SEC 06 // LANDING', title: 'POWERED DESCENT · THRUSTER ACTIVE' },
];

function SectionLabel({ section, scrollProgress }) {
  const info = SECTION_INFO[Math.min(section, SECTION_INFO.length - 1)];
  const opacity = scrollProgress > 0.02 ? 1 : 0;

  return (
    <div style={{
      position: 'absolute',
      bottom: 55,
      left: '50%',
      transform: 'translateX(-50%)',
      textAlign: 'center',
      pointerEvents: 'none',
      opacity,
      transition: 'opacity 1s ease',
    }}>
      <div className="section-badge">{info.badge}</div>
      {info.title && (
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'rgba(255,255,255,0.4)',
          letterSpacing: '0.15em',
          marginTop: 4,
        }}>
          {info.title}
        </div>
      )}
    </div>
  );
}
