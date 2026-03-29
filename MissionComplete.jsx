import { useState, useRef, useCallback } from 'react';

export default function MissionComplete({ onRestart, audioCallbacks }) {
  const [restarting, setRestarting] = useState(false);

  const handleRestart = () => {
    setRestarting(true);
    setTimeout(() => {
      window.scrollTo({ top: 0 });
      onRestart?.();
    }, 600);
  };

  return (
    <div className="mission-complete" style={{ animation: 'fade-in-up 0.8s ease both' }}>
      {/* Radial glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 50%, rgba(193,68,14,0.3) 0%, transparent 80%)',
        pointerEvents: 'none',
      }} />
      
      {/* Animated scanlines/grid for the overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03))',
        backgroundSize: '100% 3px, 3px 100%',
        pointerEvents: 'none',
        opacity: 0.2
      }} />

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 24px', maxWidth: 600 }}>
        {/* Badge */}
        <div style={{
          display: 'inline-block',
          border: '1px solid rgba(0,212,255,0.4)',
          padding: '4px 16px',
          fontFamily: 'var(--font-hud)',
          fontSize: 9,
          letterSpacing: '0.35em',
          color: 'var(--hud-cyan)',
          marginBottom: 24,
          background: 'rgba(0,212,255,0.05)',
        }}>
          MISSION STATUS · COMPLETE
        </div>

        {/* Main title */}
        <div style={{
          fontFamily: 'var(--font-hud)',
          fontWeight: 900,
          fontSize: 'clamp(28px, 9vw, 56px)',
          letterSpacing: '0.08em',
          marginBottom: 10,
          background: 'linear-gradient(135deg, #fff 0%, var(--mars-orange) 50%, var(--mars-red) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          lineHeight: 1.1,
          textShadow: '0 0 40px rgba(193,68,14,0.4)',
          filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.5))',
        }}>
          MARS REACHED
        </div>

        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          letterSpacing: '0.2em',
          color: 'rgba(255,255,255,0.5)',
          marginBottom: 40,
        }}>
          MISSION MR-1 · SUCCESSFUL LANDING · ISRO-X SITE
        </div>

        {/* Stats grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          marginBottom: 40,
        }}>
          {[
            { label: 'DISTANCE', value: '225M KM', unit: 'TRAVELED' },
            { label: 'MISSION TIME', value: '7 MO', unit: 'DURATION' },
            { label: 'SYSTEMS', value: '100%', unit: 'INTEGRITY' },
          ].map((stat, i) => (
            <div key={i} style={{
              background: 'rgba(0,8,20,0.8)',
              border: '1px solid rgba(0,212,255,0.2)',
              borderRadius: 4,
              padding: '12px 8px',
              backdropFilter: 'blur(12px)',
            }}>
              <div style={{
                fontFamily: 'var(--font-hud)',
                fontSize: 8,
                letterSpacing: '0.2em',
                color: 'rgba(0,212,255,0.5)',
                marginBottom: 6,
              }}>{stat.label}</div>
              <div style={{
                fontFamily: 'var(--font-hud)',
                fontSize: 22,
                color: 'var(--mars-orange)',
                fontWeight: 700,
                textShadow: '0 0 15px rgba(232,99,42,0.6)',
                lineHeight: 1,
              }}>{stat.value}</div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 8,
                color: 'rgba(255,255,255,0.3)',
                letterSpacing: '0.12em',
                marginTop: 2,
              }}>{stat.unit}</div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{
          width: '100%', height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.3), rgba(193,68,14,0.3), transparent)',
          marginBottom: 32,
        }} />

        {/* Quote */}
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          fontStyle: 'italic',
          color: 'rgba(255,255,255,0.4)',
          lineHeight: 1.6,
          marginBottom: 36,
          padding: '0 20px',
        }}>
          "The Earth is the cradle of humanity, but mankind cannot stay in the cradle forever."
          <br />
          <span style={{ fontSize: 10, letterSpacing: '0.1em', fontStyle: 'normal' }}>
            — KONSTANTIN TSIOLKOVSKY
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            id="btn-restart"
            className="launch-btn"
            onClick={handleRestart}
            disabled={restarting}
            style={{ fontSize: 12, padding: '14px 36px' }}
          >
            {restarting ? 'RESETTING...' : 'REPLAY MISSION'}
          </button>
          <button
            id="btn-share"
            style={{
              background: 'transparent',
              border: '1px solid rgba(0,212,255,0.4)',
              color: 'var(--hud-cyan)',
              fontFamily: 'var(--font-hud)',
              fontSize: 12,
              letterSpacing: '0.2em',
              padding: '14px 36px',
              cursor: 'pointer',
              borderRadius: 0,
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={e => e.target.style.background = 'rgba(0,212,255,0.1)'}
            onMouseLeave={e => e.target.style.background = 'transparent'}
            onClick={() => {
              if (navigator.share) navigator.share({ title: 'Mission Red', text: 'I just reached Mars!', url: window.location.href });
            }}
          >
            SHARE MISSION
          </button>
        </div>
      </div>
    </div>
  );
}
