export function playSoundEffect(type: "correct" | "wrong" | "clue" | "click" | "complete" | "start") {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();

    const makeOsc = (freq: number, startTime: number, duration: number, type: OscillatorType = "sine", vol = 0.15) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol, ctx.currentTime + startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);
      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + duration);
    };

    switch (type) {
      case "correct":
        makeOsc(523.25, 0, 0.4);
        makeOsc(659.25, 0.1, 0.4);
        makeOsc(783.99, 0.2, 0.5);
        makeOsc(1046.5, 0.3, 0.6, "sine", 0.12);
        break;
      case "wrong":
        makeOsc(300, 0, 0.15, "sawtooth", 0.18);
        makeOsc(200, 0.15, 0.15, "sawtooth", 0.14);
        makeOsc(150, 0.3, 0.2, "sawtooth", 0.1);
        break;
      case "clue":
        makeOsc(880, 0, 0.1, "sine", 0.1);
        makeOsc(1100, 0.08, 0.15, "sine", 0.08);
        break;
      case "click":
        makeOsc(440, 0, 0.1, "sine", 0.08);
        break;
      case "complete": {
        const fanfare = [523.25, 587.33, 659.25, 783.99, 1046.5];
        fanfare.forEach((f, i) => makeOsc(f, i * 0.13, 0.35, "sine", 0.18));
        break;
      }
      case "start":
        makeOsc(349.23, 0, 0.2, "sine", 0.12);
        makeOsc(440, 0.1, 0.2, "sine", 0.12);
        makeOsc(523.25, 0.2, 0.3, "sine", 0.15);
        break;
    }
  } catch {
    // AudioContext not available
  }
}
