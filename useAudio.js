import { useRef, useCallback } from 'react';
import * as Audio from '../audio/audioEngine';

export function useAudio() {
  const enabled = useRef(true);

  const countdownBeep = useCallback((tick) => {
    if (!enabled.current) return;
    Audio.resumeAudio();
    Audio.playCountdownBeep(tick);
  }, []);

  const startRumble = useCallback(() => {
    if (!enabled.current) return;
    Audio.resumeAudio();
    Audio.startRocketRumble();
  }, []);

  const stopRumble = useCallback(() => {
    Audio.stopRocketRumble();
  }, []);

  const setRumbleIntensity = useCallback((v) => {
    Audio.setRumbleIntensity(v);
  }, []);

  const startAmbient = useCallback(() => {
    if (!enabled.current) return;
    Audio.resumeAudio();
    Audio.startAmbientSpace();
  }, []);

  const stopAmbient = useCallback(() => {
    Audio.stopAmbientSpace();
  }, []);

  const thrusterPulse = useCallback(() => {
    if (!enabled.current) return;
    Audio.resumeAudio();
    Audio.playThrusterPulse();
  }, []);

  const missionComplete = useCallback(() => {
    if (!enabled.current) return;
    Audio.resumeAudio();
    Audio.playMissionComplete();
  }, []);

  const toggle = useCallback(() => {
    enabled.current = !enabled.current;
    return enabled.current;
  }, []);

  const resume = useCallback(() => {
    Audio.resumeAudio();
  }, []);

  return { resume, countdownBeep, startRumble, stopRumble, setRumbleIntensity, startAmbient, stopAmbient, thrusterPulse, missionComplete, toggle };
}
