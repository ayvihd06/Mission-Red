import { useState } from 'react';

export default function AudioToggle({ onToggle }) {
  const [enabled, setEnabled] = useState(true);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    onToggle?.(next);
  };

  return (
    <button
      id="btn-audio-toggle"
      title={enabled ? 'Mute Audio' : 'Enable Audio'}
      onClick={toggle}
      style={{
        position: 'fixed',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 20,
        background: 'rgba(0,8,20,0.7)',
        border: `1px solid ${enabled ? 'rgba(0,212,255,0.35)' : 'rgba(255,255,255,0.15)'}`,
        borderRadius: 2,
        padding: '5px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        cursor: 'pointer',
        backdropFilter: 'blur(8px)',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Sound wave icon */}
      <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
        {enabled ? (
          <>
            <path d="M11 5L6 9H2v6h4l5 4V5z" fill={enabled ? 'var(--hud-cyan)' : 'rgba(255,255,255,0.3)'} />
            <path d="M15.54 8.46a5 5 0 010 7.07" stroke="var(--hud-cyan)" strokeWidth="2" strokeLinecap="round" />
            <path d="M19.07 4.93a10 10 0 010 14.14" stroke="var(--hud-cyan)" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          </>
        ) : (
          <>
            <path d="M11 5L6 9H2v6h4l5 4V5z" fill="rgba(255,255,255,0.3)" />
            <line x1="23" y1="9" x2="17" y2="15" stroke="rgba(255,80,80,0.8)" strokeWidth="2" strokeLinecap="round" />
            <line x1="17" y1="9" x2="23" y2="15" stroke="rgba(255,80,80,0.8)" strokeWidth="2" strokeLinecap="round" />
          </>
        )}
      </svg>
      <span style={{
        fontFamily: 'var(--font-hud)',
        fontSize: 8,
        letterSpacing: '0.2em',
        color: enabled ? 'var(--hud-cyan)' : 'rgba(255,255,255,0.3)',
      }}>
        {enabled ? 'AUDIO ON' : 'AUDIO OFF'}
      </span>
    </button>
  );
}
