import { useState, useEffect, useRef, useCallback } from 'react';

const SYSTEM_CHECKS = [
  { id: 'nav', label: 'NAVIGATION SYSTEMS', duration: 600 },
  { id: 'prop', label: 'PROPULSION ARRAY', duration: 800 },
  { id: 'life', label: 'LIFE SUPPORT SYSTEMS', duration: 500 },
  { id: 'comm', label: 'COMM RELAY UPLINK', duration: 700 },
  { id: 'thm', label: 'THERMAL SHIELDING', duration: 550 },
  { id: 'fuel', label: 'FUEL CELL INTEGRITY', duration: 900 },
  { id: 'traj', label: 'TRAJECTORY COMPUTER', duration: 650 },
  { id: 'abort', label: 'ABORT SYSTEM STANDBY', duration: 400 },
];

export default function PreLaunch({ onLaunch, audioCallbacks }) {
  const { countdownBeep, resume } = audioCallbacks;

  const [phase, setPhase] = useState('idle'); // idle | checking | ready | countdown | launching
  const [checks, setChecks] = useState(SYSTEM_CHECKS.map(c => ({ ...c, status: 'pending' })));
  const [countdown, setCountdown] = useState(10);
  const [activeCheckIdx, setActiveCheckIdx] = useState(-1);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const timerRef = useRef(null);
  const countRef = useRef(null);

  // ── Start system check sequence ──
  const runChecks = useCallback(() => {
    setPhase('checking');
    let delay = 0;
    SYSTEM_CHECKS.forEach((check, i) => {
      // Set checking
      setTimeout(() => {
        setActiveCheckIdx(i);
        setChecks(prev => prev.map((c, idx) => idx === i ? { ...c, status: 'checking' } : c));
      }, delay);
      delay += 200;
      // Set OK
      setTimeout(() => {
        setChecks(prev => prev.map((c, idx) => idx === i ? { ...c, status: 'ok' } : c));
        if (i === SYSTEM_CHECKS.length - 1) {
          setTimeout(() => setPhase('ready'), 400);
        }
      }, delay + check.duration);
      delay += check.duration + 80;
    });
  }, []);

  // ── Start countdown ──
  const startCountdown = useCallback(() => {
    setPhase('countdown');
    setCountdown(10);
    if (audioEnabled) countdownBeep(1); // Immediate sound at T-10
    let tick = 10;

    countRef.current = setInterval(() => {
      tick -= 1;
      setCountdown(tick);
      if (audioEnabled) countdownBeep(tick === 0 ? 0 : 1);

      if (tick <= 0) {
        clearInterval(countRef.current);
        setPhase('launching');
        setTimeout(() => onLaunch(), 800);
      }
    }, 1000);
  }, [audioEnabled, countdownBeep, onLaunch]);

  useEffect(() => () => {
    clearInterval(timerRef.current);
    clearInterval(countRef.current);
  }, []);

  const handleStart = () => {
    resume?.();
    setAudioEnabled(true);
    runChecks();
  };

  // Animated title chars
  const titleChars = 'MISSION RED'.split('');

  return (
    <div className="prelaunch-overlay prelaunch-grid">
      {/* Background grid pulse */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 60%, rgba(193,68,14,0.08) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      {/* Scan line sweep */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(0,212,255,0.015) 0%, transparent 50%)',
        animation: 'scanline-scroll 4s linear infinite',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 760, padding: '0 24px' }}>

        {/* ── Header ── */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          {/* Agency badge */}
          <div style={{
            display: 'inline-block',
            border: '1px solid rgba(0,212,255,0.3)',
            padding: '4px 16px',
            fontFamily: 'var(--font-hud)',
            fontSize: 9,
            letterSpacing: '0.35em',
            color: 'rgba(0,212,255,0.6)',
            marginBottom: 20,
          }}>
            INTERPLANETARY SPACE AGENCY · MISSION CONTROL
          </div>

          {/* Mission title */}
          <div>
            <h1 className="mission-title" style={{ fontSize: 'clamp(48px, 10vw, 90px)', marginBottom: 8 }}>
              {titleChars.map((ch, i) => (
                <span key={i} style={{
                  display: 'inline-block',
                  animation: `fade-up 0.5s ease ${i * 0.05}s both`,
                }}>
                  {ch === ' ' ? '\u00A0' : ch}
                </span>
              ))}
            </h1>
            <div className="mission-subtitle" style={{ fontSize: 'clamp(10px, 2vw, 14px)' }}>
              A CINEMATIC JOURNEY TO MARS · MISSION MR-1
            </div>
          </div>

          {/* Decorative line */}
          <div style={{
            width: '100%', height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.4), rgba(193,68,14,0.4), transparent)',
            margin: '20px 0 0',
          }} />
        </div>

        {/* ── System Checks ── */}
        {phase !== 'idle' && phase !== 'countdown' && phase !== 'launching' && (
          <div style={{
            background: 'rgba(0,8,20,0.6)',
            border: '1px solid rgba(0,212,255,0.15)',
            borderRadius: 4,
            padding: '16px 20px',
            marginBottom: 24,
            backdropFilter: 'blur(12px)',
          }}>
            <div style={{
              fontFamily: 'var(--font-hud)',
              fontSize: 9,
              letterSpacing: '0.25em',
              color: 'rgba(0,212,255,0.5)',
              marginBottom: 12,
              borderBottom: '1px solid rgba(0,212,255,0.1)',
              paddingBottom: 8,
            }}>
              PRE-LAUNCH DIAGNOSTICS
            </div>
            {checks.map((check, i) => (
              <div key={check.id} className={`system-check-item ${check.status === 'pending' ? '' : check.status}`}>
                <div className="check-indicator" />
                <span style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em' }}>
                  {check.label}
                </span>
                <span style={{ fontFamily: 'var(--font-hud)', fontSize: 9, letterSpacing: '0.1em' }}>
                  {check.status === 'pending' && '—'}
                  {check.status === 'checking' && 'CHECKING...'}
                  {check.status === 'ok' && 'NOMINAL'}
                  {check.status === 'fail' && 'FAULT'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ── Countdown display ── */}
        {(phase === 'countdown' || phase === 'launching') && (
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              fontFamily: 'var(--font-hud)',
              fontSize: 11,
              letterSpacing: '0.5em',
              color: 'rgba(0,212,255,0.6)',
              marginBottom: 8,
            }}>
              T-MINUS
            </div>
            <div className="countdown-display">
              {phase === 'launching' ? 'IGNITION' : countdown.toString().padStart(2, '0')}
            </div>
            <div className="countdown-label">SECONDS TO LAUNCH</div>

            {/* Countdown bars */}
            <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 20 }}>
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} style={{
                  width: 28, height: 6,
                  borderRadius: 2,
                  background: i < (10 - countdown)
                    ? 'var(--mars-orange)'
                    : 'rgba(255,255,255,0.1)',
                  boxShadow: i < (10 - countdown) ? '0 0 8px var(--mars-orange)' : 'none',
                  transition: 'all 0.3s ease',
                }} />
              ))}
            </div>
          </div>
        )}

        {/* ── Action area ── */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>

          {/* Idle: Start checks */}
          {phase === 'idle' && (
            <>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'rgba(255,255,255,0.35)',
                letterSpacing: '0.1em',
                marginBottom: 8,
              }}>
                INITIATE SYSTEM DIAGNOSTICS TO BEGIN LAUNCH SEQUENCE
              </div>
              <button
                id="btn-start-checks"
                className="launch-btn"
                onClick={handleStart}
              >
                INITIALIZE SYSTEMS
              </button>
            </>
          )}

          {/* Checking: progress bar */}
          {phase === 'checking' && (
            <div style={{
              fontFamily: 'var(--font-hud)',
              fontSize: 10,
              letterSpacing: '0.2em',
              color: 'var(--hud-amber)',
              animation: 'blink 1s ease-in-out infinite',
            }}>
              RUNNING DIAGNOSTICS...
            </div>
          )}

          {/* Ready: Launch button */}
          {phase === 'ready' && (
            <>
              <div style={{
                fontFamily: 'var(--font-hud)',
                fontSize: 9,
                letterSpacing: '0.2em',
                color: 'var(--hud-green)',
                marginBottom: 4,
              }}>
                ✓ ALL SYSTEMS NOMINAL · READY FOR LAUNCH
              </div>
              <button
                id="btn-launch"
                className="launch-btn"
                onClick={startCountdown}
                style={{ fontSize: 16, padding: '20px 60px' }}
              >
                INITIATE LAUNCH
              </button>
            </>
          )}
        </div>

        {/* ── Footer data strip ── */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 40,
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          color: 'rgba(255,255,255,0.2)',
          letterSpacing: '0.1em',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingTop: 12,
          flexWrap: 'wrap',
          gap: 8,
        }}>
          <span>VEH: SRV-ARES-01</span>
          <span>LAUNCH SITE: LC-39A</span>
          <span>MISSION: MR-1</span>
          <span>CREW: 1 AUTONOMOUS</span>
          <span>DEST: MARS · 225M KM</span>
        </div>
      </div>

      {/* Flash overlay */}
      {phase === 'launching' && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 50% 80%, rgba(255,140,0,0.3) 0%, transparent 60%)',
          animation: 'countdown-pulse 0.3s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
      )}
    </div>
  );
}
