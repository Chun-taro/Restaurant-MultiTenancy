// Web Audio API Synthesizer for Restaurant Customer Order Pager / Beeper Sound

let activeAudioCtx = null;
let activeTimeouts = [];
let isPlaying = false;
let stopCallbacks = new Set();

/**
 * Play authentic restaurant customer pager / buzzer beeping sound
 * Pattern: High-clarity double/triple chime pulses repeated in burst cycles.
 * @param {Object} options
 * @param {number} options.cycles Number of burst cycles (default 4)
 * @param {number} options.volume Volume level between 0.1 and 1.0 (default 0.7)
 * @param {Function} options.onStart Callback when beeper starts
 * @param {Function} options.onEnd Callback when beeper completes or is silenced
 */
export function playRestaurantBeeper({ cycles = 4, volume = 0.7, onStart, onEnd } = {}) {
  // Silence any existing playback first
  stopRestaurantBeeper();

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      console.warn('Web Audio API not supported in this browser.');
      return false;
    }

    const ctx = new AudioContextClass();
    activeAudioCtx = ctx;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    isPlaying = true;
    if (onStart) onStart();
    if (onEnd) stopCallbacks.add(onEnd);

    const now = ctx.currentTime + 0.05;
    const burstInterval = 0.9; // Time between burst cycles in seconds

    for (let c = 0; c < cycles; c++) {
      const cycleStart = now + c * burstInterval;

      // 3 crisp high-pitch pager beeps per burst cycle
      for (let b = 0; b < 3; b++) {
        const beepStart = cycleStart + b * 0.14;
        const beepDuration = 0.085;

        // Primary buzzer tone (high piercing alert freq)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        // Authentic guest buzzer tones (A5 harmonic blend ~ 880Hz / 1760Hz)
        osc1.type = 'square';
        osc1.frequency.setValueAtTime(1046.5, beepStart); // C6 Note
        osc1.frequency.exponentialRampToValueAtTime(1318.5, beepStart + beepDuration); // E6 chirp

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(2093.0, beepStart); // C7 overtone for shimmer

        // Envelope shape: fast attack, crisp decay
        const maxGain = Math.min(1.0, Math.max(0.1, volume)) * 0.4;
        gain.gain.setValueAtTime(0.0001, beepStart);
        gain.gain.linearRampToValueAtTime(maxGain, beepStart + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, beepStart + beepDuration);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(beepStart);
        osc2.start(beepStart);
        osc1.stop(beepStart + beepDuration);
        osc2.stop(beepStart + beepDuration);
      }
    }

    // Trigger mobile physical vibration if supported
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([200, 100, 200, 100, 200, 400, 200, 100, 200, 400, 200, 100, 200]);
      } catch (err) {}
    }

    // Schedule cleanup after all cycles finish
    const totalDurationMs = (cycles * burstInterval + 0.5) * 1000;
    const timeoutId = setTimeout(() => {
      stopRestaurantBeeper();
    }, totalDurationMs);
    activeTimeouts.push(timeoutId);

    return true;
  } catch (err) {
    console.warn('Could not initialize beeper audio:', err);
    stopRestaurantBeeper();
    return false;
  }
}

/**
 * Stop and silence the beeper immediately
 */
export function stopRestaurantBeeper() {
  activeTimeouts.forEach(t => clearTimeout(t));
  activeTimeouts = [];

  if (activeAudioCtx) {
    try {
      if (activeAudioCtx.state !== 'closed') {
        activeAudioCtx.close().catch(() => {});
      }
    } catch (e) {}
    activeAudioCtx = null;
  }

  const wasPlaying = isPlaying;
  isPlaying = false;

  if (wasPlaying && stopCallbacks.size > 0) {
    stopCallbacks.forEach(cb => {
      try { cb(); } catch (e) {}
    });
    stopCallbacks.clear();
  }
}

/**
 * Check if the order buzzer is currently beeping
 */
export function isBeeperActive() {
  return isPlaying;
}
