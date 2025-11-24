import { useCallback, useRef } from 'react';

export const useGameSound = (enabled: boolean = true) => {
  // Use a static reference to ensuring one AudioContext per session
  const getCtx = () => {
    const win = window as any;
    if (!win._nexusAudioCtx) {
      win._nexusAudioCtx = new (window.AudioContext || win.webkitAudioContext)();
    }
    const ctx = win._nexusAudioCtx;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  };

  // Helper for basic tones
  const playTone = useCallback((freq: number, type: OscillatorType, duration: number, vol: number = 0.1, delay: number = 0) => {
    if (!enabled) return;
    const ctx = getCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);

    gain.gain.setValueAtTime(vol, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration + delay);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + duration + delay);
  }, [enabled]);

  // Helper for noise (explosions, impacts)
  const playNoise = useCallback((duration: number, vol: number = 0.2) => {
    if (!enabled) return;
    const ctx = getCtx();
    if (!ctx) return;

    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = ctx.createGain();
    
    // Lowpass filter for "thud" or explosion feel
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;

    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  }, [enabled]);

  // --- Specific FX ---

  const playClick = useCallback(() => playTone(600, 'sine', 0.05, 0.05), [playTone]);
  
  const playPop = useCallback(() => {
    if (!enabled) return;
    const ctx = getCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }, [enabled]);

  const playPing = useCallback(() => playTone(1200, 'triangle', 0.2, 0.05), [playTone]);

  const playWin = useCallback(() => {
    if (!enabled) return;
    const now = 0;
    // Major Arpeggio
    playTone(523.25, 'sine', 0.3, 0.1, now);       // C5
    playTone(659.25, 'sine', 0.3, 0.1, now + 0.1); // E5
    playTone(783.99, 'sine', 0.4, 0.1, now + 0.2); // G5
    playTone(1046.50, 'square', 0.6, 0.05, now + 0.3); // C6
  }, [enabled, playTone]);

  const playLoss = useCallback(() => {
    if (!enabled) return;
    playTone(300, 'sawtooth', 0.4, 0.1);
    playTone(200, 'sawtooth', 0.5, 0.1, 0.2);
  }, [enabled, playTone]);

  const playExplode = useCallback(() => playNoise(0.4, 0.3), [playNoise]);

  const playGlass = useCallback(() => {
    // High pitched cluster
    playTone(2000, 'sawtooth', 0.1, 0.05);
    playTone(2200, 'sawtooth', 0.1, 0.05, 0.02);
    playTone(1800, 'sawtooth', 0.1, 0.05, 0.04);
  }, [playTone]);

  const playJump = useCallback(() => {
    if (!enabled) return;
    const ctx = getCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }, [enabled]);

  const playChip = useCallback(() => playTone(1800, 'sine', 0.03, 0.05), [playTone]);

  return { playClick, playPop, playPing, playWin, playLoss, playExplode, playGlass, playJump, playChip };
};
