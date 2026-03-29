// Web Audio API procedural sound engine
let audioCtx = null;
let rocketRumbleNodes = null;
let ambientNodes = null;
let thrusterNodes = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

// Master gain with limiter
function createMasterChain(ctx, gainVal = 0.5) {
  const gain = ctx.createGain();
  gain.gain.value = gainVal;
  gain.connect(ctx.destination);
  return gain;
}

// Countdown beep — short electronic ping
export function playCountdownBeep(tick = 0) {
  const ctx = getCtx();
  const master = createMasterChain(ctx, tick === 0 ? 0.8 : 0.6);

  const osc = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const env = ctx.createGain();

  // Primary tone
  osc.type = tick === 0 ? 'sawtooth' : 'sine';
  osc.frequency.value = tick === 0 ? 110 : 880;

  // Secondary "click" tone for better transient
  osc2.type = 'sine';
  osc2.frequency.value = tick === 0 ? 55 : 1760;

  env.gain.setValueAtTime(0, ctx.currentTime);
  env.gain.linearRampToValueAtTime(0.8, ctx.currentTime + 0.01);
  env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (tick === 0 ? 0.8 : 0.1));

  osc.connect(env);
  osc2.connect(env);
  env.connect(master);
  
  osc.start(ctx.currentTime);
  osc2.start(ctx.currentTime);
  osc.stop(ctx.currentTime + (tick === 0 ? 0.8 : 0.2));
  osc2.stop(ctx.currentTime + (tick === 0 ? 0.8 : 0.1));
}

// Rocket rumble — layered noise + low oscillators
export function startRocketRumble() {
  const ctx = getCtx();
  if (rocketRumbleNodes) return;

  const master = createMasterChain(ctx, 0.0);
  master.gain.setValueAtTime(0, ctx.currentTime);
  master.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 2);

  // Low frequency thrum
  const osc1 = ctx.createOscillator();
  osc1.type = 'sawtooth';
  osc1.frequency.value = 55;

  const osc2 = ctx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.value = 110;

  // Noise buffer
  const bufferSize = ctx.sampleRate * 4;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) noiseData[i] = Math.random() * 2 - 1;

  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  noise.loop = true;

  // Low pass for rumble character
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 300;
  filter.Q.value = 2;

  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.3;

  const oscGain = ctx.createGain();
  oscGain.gain.value = 0.5;

  osc1.connect(oscGain);
  osc2.connect(oscGain);
  oscGain.connect(master);

  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(master);

  osc1.start();
  osc2.start();
  noise.start();

  rocketRumbleNodes = { osc1, osc2, noise, master };
}

export function stopRocketRumble() {
  if (!rocketRumbleNodes) return;
  const ctx = getCtx();
  rocketRumbleNodes.master.gain.linearRampToValueAtTime(0, ctx.currentTime + 3);
  setTimeout(() => {
    try {
      rocketRumbleNodes.osc1.stop();
      rocketRumbleNodes.osc2.stop();
      rocketRumbleNodes.noise.stop();
    } catch (e) {}
    rocketRumbleNodes = null;
  }, 3100);
}

export function setRumbleIntensity(value) {
  if (!rocketRumbleNodes) return;
  const ctx = getCtx();
  const clamped = Math.max(0, Math.min(1, value));
  rocketRumbleNodes.master.gain.setTargetAtTime(clamped * 0.3, ctx.currentTime, 0.3);
}

// Ambient space drone — eerie pads
export function startAmbientSpace() {
  const ctx = getCtx();
  if (ambientNodes) return;

  const master = createMasterChain(ctx, 0);
  master.gain.setValueAtTime(0, ctx.currentTime);
  master.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 4);

  const frequencies = [40, 60, 80, 120];
  const oscs = frequencies.map(freq => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    // Slow LFO modulation
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.05 + Math.random() * 0.1;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = freq * 0.02;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    osc.connect(master);
    lfo.start();
    osc.start();
    return { osc, lfo };
  });

  ambientNodes = { oscs, master };
}

export function stopAmbientSpace() {
  if (!ambientNodes) return;
  const ctx = getCtx();
  ambientNodes.master.gain.linearRampToValueAtTime(0, ctx.currentTime + 3);
  setTimeout(() => {
    ambientNodes.oscs.forEach(({ osc, lfo }) => {
      try { osc.stop(); lfo.stop(); } catch (e) {}
    });
    ambientNodes = null;
  }, 3100);
}

// Thruster pulse for landing
export function playThrusterPulse() {
  const ctx = getCtx();
  const master = createMasterChain(ctx, 0.3);

  const bufferSize = ctx.sampleRate * 0.3;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 800;
  filter.Q.value = 0.5;

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.8, ctx.currentTime);
  env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

  noise.connect(filter);
  filter.connect(env);
  env.connect(master);
  noise.start(ctx.currentTime);
}

// Mission complete fanfare
export function playMissionComplete() {
  const ctx = getCtx();
  const master = createMasterChain(ctx, 0.4);
  const notes = [261.63, 329.63, 392, 523.25, 659.25, 783.99];

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;

    const start = ctx.currentTime + i * 0.12;
    env.gain.setValueAtTime(0, start);
    env.gain.linearRampToValueAtTime(0.6, start + 0.05);
    env.gain.exponentialRampToValueAtTime(0.001, start + 0.5);

    osc.connect(env);
    env.connect(master);
    osc.start(start);
    osc.stop(start + 0.6);
  });
}

// Resume audio context (must be called on user interaction)
export function resumeAudio() {
  const ctx = getCtx();
  if (ctx.state === 'suspended') ctx.resume();
}
