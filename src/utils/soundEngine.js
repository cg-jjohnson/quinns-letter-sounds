import { PHONICS_DATA } from './phonicsData';

let audioCtx = null;
let currentAudio = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// User gesture unlock listener
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    getAudioContext();
    if ('speechSynthesis' in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  };
  window.addEventListener('click', unlockAudio, { once: false });
  window.addEventListener('touchstart', unlockAudio, { once: false });
}

// -------------------------------------------------------------
// 1. STATIC AUDIO PLAYBACK
// -------------------------------------------------------------

export function playStaticAudio(audioFilename, fallbackText = null) {
  if (!audioFilename) return;

  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }

  // Try .m4a first, then .wav
  const baseName = audioFilename.replace(/\.(m4a|wav|mp3)$/, '');
  const audio = new Audio(`/audio/${baseName}.m4a`);
  currentAudio = audio;

  audio.onended = () => {
    if (currentAudio === audio) currentAudio = null;
  };

  audio.onerror = () => {
    // Try wav
    const wavAudio = new Audio(`/audio/${baseName}.wav`);
    currentAudio = wavAudio;
    wavAudio.play().catch(() => {
      if (fallbackText && 'speechSynthesis' in window) {
        speakFallback(fallbackText);
      }
    });
  };

  audio.play().catch(e => {
    if (fallbackText && 'speechSynthesis' in window) {
      speakFallback(fallbackText);
    }
  });
}

function speakFallback(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.9;
  utter.pitch = 1.2;
  window.speechSynthesis.speak(utter);
}

// -------------------------------------------------------------
// 2. PHONICS GAME PROMPTS
// -------------------------------------------------------------

export function speakPhonicsPrompt(letter) {
  const upper = (letter || 'A').toUpperCase();
  const data = PHONICS_DATA[upper];
  const fallback = data ? `Which letter makes the ${data.sound} sound, as in ${data.word}?` : `Find letter ${upper}`;
  playStaticAudio(`prompt_${upper}`, fallback);
}

export function speakPhonicsSoundOnly(letter) {
  const upper = (letter || 'A').toUpperCase();
  const data = PHONICS_DATA[upper];
  const fallback = data ? `${data.sound}! ${data.sound}! ${upper} makes the ${data.sound} sound for ${data.word}!` : `${upper}`;
  playStaticAudio(`sound_${upper}`, fallback);
}

export function speakShortSound(letter) {
  const upper = (letter || 'A').toUpperCase();
  const data = PHONICS_DATA[upper];
  playStaticAudio(`short_${upper}`, data?.sound || upper);
}

export function speakSuccessPraise() {
  const praiseIdx = Math.floor(Math.random() * 6) + 1;
  const praises = [
    'Yay! You found the right letter sound! Great job, Quinn!',
    'Awesome! That is the right letter sound!',
    'Super star Quinn! You know your letter sounds!',
    'Woohoo! Fantastic job!',
    'Spot on! Fantastic phonics practice!',
    'You nailed that letter sound!'
  ];
  playStaticAudio(`praise_${praiseIdx}`, praises[praiseIdx - 1]);
}

export function speakIntro(gameType = 'balloons') {
  if (gameType === 'fishing') {
    playStaticAudio('intro_fishing', 'Listen closely and catch the fish with the matching letter sound!');
  } else {
    playStaticAudio('intro_balloons', 'Listen to the letter sound and pop the balloon that matches!');
  }
}

// -------------------------------------------------------------
// 3. PROCEDURAL SOUND FX (Web Audio API)
// -------------------------------------------------------------

export function playPopSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const bufferSize = ctx.sampleRate * 0.12;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 650;
    filter.Q.value = 3.2;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.8, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.08);

    oscGain.gain.setValueAtTime(0.6, ctx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch (e) {
    console.error('Audio pop sound error', e);
  }
}

export function playSplashSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const bufferSize = ctx.sampleRate * 0.35;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.1));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.35);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.7, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  } catch (e) {
    console.error('Splash sound error', e);
  }
}

export function playReelSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    for (let i = 0; i < 6; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(900 + (i % 2) * 200, ctx.currentTime + i * 0.05);

      gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.05 + 0.03);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + i * 0.05);
      osc.stop(ctx.currentTime + i * 0.05 + 0.03);
    }
  } catch (e) {
    console.error('Reel sound error', e);
  }
}

export function playCheerSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.06);

      gain.gain.setValueAtTime(0.25, ctx.currentTime + index * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.06 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + index * 0.06);
      osc.stop(ctx.currentTime + index * 0.06 + 0.4);
    });
  } catch (e) {
    console.error('Cheer sound error', e);
  }
}

export function playLevelUpFanfare() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [
      { freq: 523.25, delay: 0, dur: 0.12 },
      { freq: 659.25, delay: 0.12, dur: 0.12 },
      { freq: 783.99, delay: 0.24, dur: 0.12 },
      { freq: 1046.50, delay: 0.36, dur: 0.6 },
    ];

    notes.forEach(({ freq, delay, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);

      gain.gain.setValueAtTime(0.35, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + dur);
    });
  } catch (e) {
    console.error('Level up fanfare error', e);
  }
}

export function playClickSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch (e) {
    console.error('Click sound error', e);
  }
}
