/**
 * Web Audio Synthesizer for celebration chimes and auction donation sounds
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playDonationChime() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Major chord arpeggio chime (C5 -> E5 -> G5 -> C6)
    const notes = [523.25, 659.25, 783.99, 1046.50];
    
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.12);

      gain.gain.setValueAtTime(0.01, now + index * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.3, now + index * 0.12 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.12 + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + index * 0.12);
      osc.stop(now + index * 0.12 + 1.3);
    });
  } catch (err) {
    console.warn('Audio feedback error:', err);
  }
}

export function playGoalCelebrationFanfare() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const notes = [
      { freq: 523.25, time: 0, duration: 0.2 },
      { freq: 659.25, time: 0.2, duration: 0.2 },
      { freq: 783.99, time: 0.4, duration: 0.2 },
      { freq: 1046.50, time: 0.6, duration: 0.8 },
      { freq: 880.00, time: 1.5, duration: 0.2 },
      { freq: 1046.50, time: 1.7, duration: 1.2 },
    ];

    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.freq, now + n.time);

      gain.gain.setValueAtTime(0.01, now + n.time);
      gain.gain.exponentialRampToValueAtTime(0.4, now + n.time + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + n.time);
      osc.stop(now + n.time + n.duration + 0.1);
    });
  } catch (err) {
    console.warn('Audio fanfare error:', err);
  }
}
