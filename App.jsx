import { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';

import MarsScene from './scenes/MarsScene';
import HUD from './components/HUD';
import PreLaunch from './components/PreLaunch';
import LandingControls from './components/LandingControls';
import MissionComplete from './components/MissionComplete';
import AudioToggle from './components/AudioToggle';
import { useAudio } from './hooks/useAudio';

// Total scroll height = 500vh  
const TOTAL_SCROLL_VH = 500;

// Section boundaries (scroll progress 0–1)
const SECTIONS = [
  { id: 'prelaunch',   start: 0,    end: 0.05 },
  { id: 'launch',      start: 0.05, end: 0.25 },
  { id: 'deepspace',   start: 0.25, end: 0.55 },
  { id: 'approach',    start: 0.55, end: 0.75 },
  { id: 'landing',     start: 0.75, end: 1.00 },
];

function getCurrentSection(progress) {
  for (let i = SECTIONS.length - 1; i >= 0; i--) {
    if (progress >= SECTIONS[i].start) return i;
  }
  return 0;
}

export default function App() {
  const [launched, setLaunched]             = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [section, setSection]               = useState(0);
  const [shaking, setShaking]               = useState(false);
  const [missionTime, setMissionTime]       = useState(0);
  const [missionDone, setMissionDone]       = useState(false);
  const [stability, setStability]           = useState(100);
  const [speedHistory, setSpeedHistory]     = useState([]);
  const [showScrollHint, setShowScrollHint] = useState(false);
  const [audioOn, setAudioOn]               = useState(true);

  const flashRef         = useRef(null);
  const progressBarRef   = useRef(null);
  const missionTimerRef  = useRef(null);
  const stabilityRef     = useRef(null);
  const speedHistoryRef  = useRef([]);
  const rumbleActiveRef  = useRef(false);
  const scrollProgRef    = useRef(0);
  
  const audio = useAudio();

  // ── Scroll tracking via native window scroll ──────────────────────────────
  useEffect(() => {
    if (!launched) return;

    const handleScroll = () => {
      const scrollTop    = window.scrollY;
      const docHeight    = document.documentElement.scrollHeight - window.innerHeight;
      const prog         = docHeight > 0 ? Math.min(1, Math.max(0, scrollTop / docHeight)) : 0;
      scrollProgRef.current = prog;
      setScrollProgress(prog);
      setSection(getCurrentSection(prog));
      if (progressBarRef.current) {
        progressBarRef.current.style.width = `${prog * 100}%`;
      }
    };

    // Listen on window scroll
    window.addEventListener('scroll', handleScroll, { passive: true });
    // Initial call
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [launched]);

  // ── Ensure body is scrollable when launched ───────────────────────────────
  useEffect(() => {
    if (launched) {
      document.body.style.overflowY = 'scroll';
      document.documentElement.style.overflowY = 'scroll';
      // Scroll to top on launch
      window.scrollTo(0, 0);
    } else {
      document.body.style.overflowY = 'hidden';
      document.documentElement.style.overflowY = 'hidden';
    }
  }, [launched]);

  // ── Mission timer ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!launched || missionDone) return;
    missionTimerRef.current = setInterval(() => {
      setMissionTime(t => t + 1);
    }, 1000);
    return () => clearInterval(missionTimerRef.current);
  }, [launched, missionDone]);

  // ── Speed history tracker ──────────────────────────────────────────────────
  useEffect(() => {
    if (!launched) return;
    const id = setInterval(() => {
      const vel = 28 + scrollProgRef.current * 12;
      const sec = getCurrentSection(scrollProgRef.current);
      const adjusted = Math.max(5, vel - (sec >= 4 ? (sec - 4) * 8 : 0));
      speedHistoryRef.current = [...speedHistoryRef.current.slice(-29), adjusted];
      setSpeedHistory([...speedHistoryRef.current]);
    }, 1000);
    return () => clearInterval(id);
  }, [launched]);

  // ── Landing stability sim ──────────────────────────────────────────────────
  useEffect(() => {
    if (section < 4) { setStability(100); return; }
    stabilityRef.current = setInterval(() => {
      setStability(prev => {
        const drift = (Math.random() - 0.55) * 3;
        return Math.max(0, Math.min(100, prev + drift));
      });
    }, 300);
    return () => clearInterval(stabilityRef.current);
  }, [section]);

  // ── Mission complete trigger ───────────────────────────────────────────────
  useEffect(() => {
    if (scrollProgress >= 0.99 && !missionDone && launched) {
      setMissionDone(true);
      audio.missionComplete();
      audio.stopRumble();
      audio.stopAmbient();
    }
  }, [scrollProgress, missionDone, launched, audio]);

  // ── Audio reactive to scroll section ──────────────────────────────────────
  useEffect(() => {
    if (!launched || !audioOn) return;

    if (section === 1 && !rumbleActiveRef.current) {
      audio.startRumble();
      rumbleActiveRef.current = true;
    }
    if (section >= 3 && rumbleActiveRef.current) {
      audio.stopRumble();
      audio.startAmbient();
      rumbleActiveRef.current = false;
    }
    if (section >= 2 && section < 3) {
      audio.setRumbleIntensity(0.3);
    }
    if (section === 1) audio.setRumbleIntensity(0.8);
  }, [section, launched, audioOn, audio]);

  // ── Camera shake during launch ─────────────────────────────────────────────
  useEffect(() => {
    setShaking(section === 1 && scrollProgress < 0.18);
  }, [section, scrollProgress]);

  // ── Launch callback ───────────────────────────────────────────────────────
  const handleLaunch = useCallback(() => {
    if (flashRef.current) {
      gsap.fromTo(flashRef.current,
        { opacity: 0.9 },
        { opacity: 0, duration: 1.5, ease: 'power2.out' }
      );
    }
    setLaunched(true);
    if (audioOn) {
      audio.startRumble();
      rumbleActiveRef.current = true;
    }
    // Show scroll hint for 5 seconds
    setShowScrollHint(true);
    setTimeout(() => setShowScrollHint(false), 6000);
  }, [audioOn, audio]);

  // ── Thruster actions ──────────────────────────────────────────────────────
  const handleThruster = useCallback(() => {
    if (audioOn) audio.thrusterPulse();
    setStability(prev => Math.min(100, prev + 5));
  }, [audioOn, audio]);

  const handleBrake = useCallback(() => {
    if (audioOn) audio.thrusterPulse();
    setStability(prev => Math.min(100, prev + 8));
  }, [audioOn, audio]);

  // ── Restart ───────────────────────────────────────────────────────────────
  const handleRestart = useCallback(() => {
    audio.stopRumble();
    audio.stopAmbient();
    rumbleActiveRef.current = false;
    scrollProgRef.current = 0;
    window.scrollTo(0, 0);
    setLaunched(false);
    setScrollProgress(0);
    setSection(0);
    setMissionDone(false);
    setMissionTime(0);
    setShaking(false);
    setStability(100);
    setSpeedHistory([]);
    speedHistoryRef.current = [];
  }, [audio]);

  const handleAudioToggle = useCallback((on) => {
    setAudioOn(on);
    if (!on) { audio.stopRumble(); audio.stopAmbient(); rumbleActiveRef.current = false; }
  }, [audio]);

  const showLanding = section >= 4 && launched && !missionDone;

  return (
    <>
      {/* ── Three.js Canvas (fixed background) ── */}
      <MarsScene scrollProgress={scrollProgress} shaking={shaking} />

      {/* ── Visual overlays ── */}
      <div className="vignette" />
      <div className="scanlines" />

      {/* ── Launch flash ── */}
      <div ref={flashRef} className="launch-flash" />

      {/* ── Mission progress bar (top edge) ── */}
      {launched && (
        <div
          ref={progressBarRef}
          className="mission-progress-bar"
          style={{ width: 0 }}
        />
      )}

      {/* ── Pre-launch screen ── */}
      {!launched && (
        <PreLaunch
          onLaunch={handleLaunch}
          audioCallbacks={{ countdownBeep: audio.countdownBeep, resume: audio.resume }}
        />
      )}

      {/* ── Scroll driver spacer — makes page TOTAL_SCROLL_VH tall ── */}
      {launched && (
        <div
          id="scroll-driver"
          style={{
            height: `${TOTAL_SCROLL_VH}vh`,
            width: '100%',
            position: 'relative',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* ── HUD ── */}
      <HUD
        scrollProgress={scrollProgress}
        section={section}
        missionTime={missionTime}
        speedHistory={speedHistory}
        visible={launched && !missionDone}
      />

      {/* ── Audio toggle ── */}
      {launched && !missionDone && (
        <AudioToggle onToggle={handleAudioToggle} />
      )}

      {/* ── Scroll hint ── */}
      {showScrollHint && launched && (
        <div className="scroll-indicator">
          <span>SCROLL TO JOURNEY</span>
          <div className="scroll-arrow" />
        </div>
      )}

      {/* ── Landing controls (section 4+) ── */}
      <LandingControls
        visible={showLanding}
        onThrusterFire={handleThruster}
        onBrake={handleBrake}
        stability={stability}
      />

      {/* ── Trajectory alert (section 3) ── */}
      {section === 3 && launched && !missionDone && (
        <TrajectoryAlert scrollProgress={scrollProgress} />
      )}

      {/* ── Narrative overlays ── */}
      {launched && !missionDone && (
        <NarrativeOverlay section={section} scrollProgress={scrollProgress} />
      )}

      {/* ── Mars atmosphere glow ── */}
      <div
        className="mars-atmosphere"
        style={{ opacity: section >= 3 ? Math.min(1, (scrollProgress - 0.55) * 5) : 0 }}
      />

      {/* ── Mission complete ── */}
      {missionDone && (
        <MissionComplete
          onRestart={handleRestart}
          audioCallbacks={audio}
        />
      )}
    </>
  );
}

// ── Trajectory stabilization alert (section 3) ────────────────────────────
function TrajectoryAlert({ scrollProgress }) {
  const localProgress = Math.min(1, Math.max(0, (scrollProgress - 0.55) / 0.2));
  const opacity = Math.min(1, localProgress * 3);

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 12,
      textAlign: 'center',
      pointerEvents: 'none',
      opacity,
      transition: 'opacity 0.5s ease',
    }}>
      <div style={{
        background: 'rgba(255,170,0,0.08)',
        border: '1px solid rgba(255,170,0,0.4)',
        borderRadius: 4,
        padding: '12px 24px',
        backdropFilter: 'blur(8px)',
        fontFamily: 'var(--font-hud)',
      }}>
        <div style={{ fontSize: 9, letterSpacing: '0.3em', color: 'var(--hud-amber)', marginBottom: 6 }}>
          ▲ TRAJECTORY CORRECTION REQUIRED
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em' }}>
          MARS ORBITAL INSERTION IN {Math.max(0, Math.round((1 - localProgress) * 180))}s
        </div>
        <div style={{
          width: '100%', height: 2,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 1,
          marginTop: 8,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${localProgress * 100}%`,
            background: 'var(--hud-amber)',
            borderRadius: 1,
            boxShadow: '0 0 6px var(--hud-amber)',
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>
    </div>
  );
}

// ── Narrative text overlays per section ──────────────────────────────────
const NARRATIVES = [
  null,
  {
    headline: 'IGNITION SEQUENCE',
    body: 'Main engines at full thrust. You are leaving Earth behind.',
    align: 'right',
  },
  {
    headline: 'THE VOID BETWEEN WORLDS',
    body: '225 million kilometres of silence. Only velocity and stars.',
    align: 'left',
  },
  {
    headline: 'MARS ON SENSORS',
    body: 'The red planet fills your instruments. Orbital insertion imminent.',
    align: 'right',
  },
  {
    headline: 'ATMOSPHERIC ENTRY',
    body: 'Friction. Heat. The air of another world. Deploy retro thrusters.',
    align: 'center',
  },
];

function NarrativeOverlay({ section, scrollProgress }) {
  const info = NARRATIVES[section];
  if (!info) return null;

  const sectionStart = SECTIONS[section]?.start ?? 0;
  const sectionEnd   = SECTIONS[section]?.end   ?? 1;
  const local        = (scrollProgress - sectionStart) / Math.max(0.01, sectionEnd - sectionStart);
  const opacity      = local < 0.1
    ? local / 0.1
    : local > 0.8
      ? Math.max(0, (1 - local) / 0.2)
      : 1;

  const leftPos  = info.align === 'left'   ? '5%'  : info.align === 'right' ? 'auto' : '50%';
  const rightPos = info.align === 'right'  ? '5%'  : 'auto';
  const xForm    = info.align === 'center' ? 'translateX(-50%)' : 'none';

  return (
    <div style={{
      position: 'fixed',
      top: '30%',
      left: leftPos,
      right: rightPos,
      transform: xForm,
      zIndex: 11,
      maxWidth: 280,
      pointerEvents: 'none',
      opacity,
      transition: 'opacity 0.5s ease',
      padding: '0 20px',
    }}>
      <div style={{
        width: 30, height: 2,
        background: 'var(--mars-orange)',
        boxShadow: '0 0 8px var(--mars-orange)',
        marginBottom: 10,
        marginLeft: info.align === 'right' ? 'auto' : 0,
      }} />
      <div style={{
        fontFamily: 'var(--font-hud)',
        fontSize: 14,
        fontWeight: 700,
        letterSpacing: '0.12em',
        color: '#fff',
        marginBottom: 8,
        textAlign: info.align,
      }}>
        {info.headline}
      </div>
      <div style={{
        fontFamily: 'var(--font-body)',
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
        lineHeight: 1.7,
        textAlign: info.align,
        letterSpacing: '0.04em',
      }}>
        {info.body}
      </div>
    </div>
  );
}
