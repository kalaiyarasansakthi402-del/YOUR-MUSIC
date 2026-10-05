const fs = require('fs');
const path = require('path');

/**
 * Procedural musical WAV audio synthesizer
 * Generates rich, harmonious, multi-layered music loops with zero external dependencies.
 */
function createWavTrack(sampleRate, bpm, numBars, synthCallback) {
  const beatSec = 60 / bpm;
  const barSec = beatSec * 4;
  const totalSec = barSec * numBars;
  const numSamples = Math.floor(sampleRate * totalSec);
  const dataSize = numSamples * 2; // 16-bit mono

  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // Subchunk1 'fmt '
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // PCM chunk size
  buffer.writeUInt16LE(1, 20);  // Audio format 1 (PCM)
  buffer.writeUInt16LE(1, 22);  // Mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28); // byte rate (sampleRate * 1 * 16/8)
  buffer.writeUInt16LE(2, 32);  // block align
  buffer.writeUInt16LE(16, 34); // bits per sample

  // Subchunk2 'data'
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let s = synthCallback(t, beatSec, totalSec);
    // Smooth master limiter / soft saturation
    s = Math.tanh(s * 1.1);
    const intSample = Math.max(-32767, Math.min(32767, Math.floor(s * 32767 * 0.85)));
    buffer.writeInt16LE(intSample, 44 + i * 2);
  }

  return { buffer, duration: Math.floor(totalSec) };
}

// 1. Midnight Horizon - Synthwave / Electronic (Am - F - C - G, 110 BPM)
function synthwave(t, beatSec) {
  const bar = Math.floor(t / (beatSec * 4)) % 4;
  const chords = [
    [220.0, 261.63, 329.63], // Am
    [174.61, 220.0, 261.63], // F
    [130.81, 164.81, 196.0], // C
    [196.0, 246.94, 293.66], // G
  ];
  const chord = chords[bar];

  let out = 0;
  // Lush synth pad
  chord.forEach((f) => {
    out += Math.sin(2 * Math.PI * f * t) * 0.12;
    out += Math.sin(2 * Math.PI * f * 2.01 * t) * 0.06;
  });

  // Rolling 16th-note arpeggiated bass
  const bassIdx = Math.floor(t / (beatSec / 4)) % 4;
  const bassNotes = [chord[0] / 2, chord[1] / 2, chord[2] / 2, chord[0]];
  const bFreq = bassNotes[bassIdx];
  const bEnv = Math.exp(-((t % (beatSec / 4)) * 12));
  out += (Math.sin(2 * Math.PI * bFreq * t) + 0.3 * Math.sin(4 * Math.PI * bFreq * t)) * 0.28 * bEnv;

  // Retro Kick & Snare
  const beatTime = t % beatSec;
  const isSnare = Math.floor(t / beatSec) % 2 === 1;
  if (!isSnare && beatTime < 0.18) {
    const kFreq = 130 * Math.exp(-beatTime * 28);
    out += Math.sin(2 * Math.PI * kFreq * beatTime) * 0.4 * Math.exp(-beatTime * 14);
  } else if (isSnare && beatTime < 0.22) {
    // Snare noise
    const noise = (Math.random() * 2 - 1) * 0.22 * Math.exp(-beatTime * 18);
    out += noise + Math.sin(2 * Math.PI * 180 * beatTime) * 0.15 * Math.exp(-beatTime * 20);
  }

  // Melodic Lead
  const leadIdx = Math.floor(t / (beatSec / 2)) % 8;
  const leadScale = [440, 523.25, 587.33, 659.25, 587.33, 523.25, 440, 392];
  const lFreq = leadScale[leadIdx];
  const lEnv = Math.exp(-((t % (beatSec / 2)) * 5));
  out += (Math.sin(2 * Math.PI * lFreq * t) + 0.25 * Math.sin(4 * Math.PI * lFreq * t)) * 0.22 * lEnv;

  return out;
}

// 2. Solar Flare - Cyberpunk / Bass (Dm - Bb - Gm - A, 126 BPM)
function cyberpunk(t, beatSec) {
  const bar = Math.floor(t / (beatSec * 4)) % 4;
  const bassNotes = [146.83 / 2, 116.54 / 2, 98.0 / 2, 110.0 / 2];
  const bFreq = bassNotes[bar];

  let out = 0;
  // Aggressive sawtooth bass (Fourier series)
  for (let h = 1; h <= 6; h++) {
    out += (Math.sin(2 * Math.PI * bFreq * h * t) / h) * 0.18;
  }

  // Heavy industrial 4-on-the-floor kick
  const beatTime = t % beatSec;
  if (beatTime < 0.2) {
    const kFreq = 160 * Math.exp(-beatTime * 35);
    out += Math.sin(2 * Math.PI * kFreq * beatTime) * 0.45 * Math.exp(-beatTime * 16);
  }

  // Sharp metallic hi-hat on offbeats
  const offbeat = (t + beatSec / 2) % beatSec;
  if (offbeat < 0.08) {
    out += (Math.random() * 2 - 1) * 0.15 * Math.exp(-offbeat * 40);
  }

  // Cyber lead stab
  const stabTime = t % (beatSec * 2);
  if (stabTime < 0.4) {
    const stabFreq = [587.33, 698.46, 880][bar % 3];
    out += (Math.sin(2 * Math.PI * stabFreq * t) + 0.5 * Math.sin(4 * Math.PI * stabFreq * t)) * 0.25 * Math.exp(-stabTime * 4);
  }

  return out;
}

// 3. Rainy Afternoon Coffee - Lofi Chill (Cmaj7 - Dm7 - Em7 - Fmaj7, 78 BPM)
function lofi(t, beatSec) {
  const bar = Math.floor(t / (beatSec * 4)) % 4;
  const chords = [
    [261.63, 329.63, 392.0, 493.88], // Cmaj7
    [293.66, 349.23, 440.0, 523.25], // Dm7
    [329.63, 392.0, 493.88, 587.33], // Em7
    [349.23, 440.0, 523.25, 659.25], // Fmaj7
  ];
  const chord = chords[bar];

  let out = 0;
  // Warm electric piano chords with tremolo
  const tremolo = 1 + 0.15 * Math.sin(2 * Math.PI * 4 * t);
  chord.forEach((f) => {
    out += Math.sin(2 * Math.PI * f * t) * 0.1 * tremolo;
  });

  // Soft upright bass
  const bFreq = chord[0] / 2;
  const bEnv = Math.exp(-((t % beatSec) * 3));
  out += Math.sin(2 * Math.PI * bFreq * t) * 0.25 * bEnv;

  // Gentle lofi beat (soft kick, rimshot, vinyl crackle)
  const beatTime = t % beatSec;
  const isRim = Math.floor(t / beatSec) % 2 === 1;
  if (!isRim && beatTime < 0.15) {
    const kFreq = 80 * Math.exp(-beatTime * 20);
    out += Math.sin(2 * Math.PI * kFreq * beatTime) * 0.28 * Math.exp(-beatTime * 12);
  } else if (isRim && beatTime < 0.08) {
    out += (Math.random() * 2 - 1) * 0.12 * Math.exp(-beatTime * 35);
  }

  // Subtle vinyl warmth
  out += (Math.random() * 2 - 1) * 0.015;

  return out;
}

// 4. Echoes of the Valley - Ambient / Classical (D - A - Bm - G, 64 BPM)
function ambient(t, beatSec) {
  const bar = Math.floor(t / (beatSec * 4)) % 4;
  const chords = [
    [146.83, 220.0, 293.66, 369.99], // D
    [110.0, 164.81, 220.0, 277.18],  // A
    [123.47, 185.0, 246.94, 293.66], // Bm
    [98.0, 146.83, 196.0, 246.94],   // G
  ];
  const chord = chords[bar];

  let out = 0;
  // Slow orchestral pad with slow chorus
  chord.forEach((f, idx) => {
    const detune = Math.sin(2 * Math.PI * 0.3 * t + idx);
    out += Math.sin(2 * Math.PI * (f + detune * 0.8) * t) * 0.12;
  });

  // Harp / Celeste bell plucks
  const pluckIdx = Math.floor(t / beatSec) % 4;
  const pFreq = chord[pluckIdx] * 2;
  const pEnv = Math.exp(-((t % beatSec) * 2.5));
  out += Math.sin(2 * Math.PI * pFreq * t) * 0.2 * pEnv;

  // Sub bass drone
  out += Math.sin(2 * Math.PI * (chord[0] / 2) * t) * 0.2;

  return out;
}

// 5. Hyperdrive Anthem - Dance / EDM (Em - C - G - D, 128 BPM)
function edm(t, beatSec) {
  const bar = Math.floor(t / (beatSec * 4)) % 4;
  const rootFreqs = [164.81, 130.81, 196.0, 146.83];
  const root = rootFreqs[bar];

  let out = 0;
  // Punchy Four-on-the-floor kick
  const beatTime = t % beatSec;
  if (beatTime < 0.22) {
    const kFreq = 150 * Math.exp(-beatTime * 32);
    out += Math.sin(2 * Math.PI * kFreq * beatTime) * 0.5 * Math.exp(-beatTime * 15);
  }

  // Offbeat energetic open hi-hat
  const offbeat = (t + beatSec / 2) % beatSec;
  if (offbeat < 0.12) {
    out += (Math.random() * 2 - 1) * 0.18 * Math.exp(-offbeat * 25);
  }

  // Supersaw lead arpeggio (16th notes)
  const arpIdx = Math.floor(t / (beatSec / 4)) % 4;
  const arpNotes = [root * 2, root * 2.4, root * 3, root * 4];
  const aFreq = arpNotes[arpIdx];
  const aEnv = Math.exp(-((t % (beatSec / 4)) * 8));
  for (let h = 1; h <= 4; h++) {
    out += (Math.sin(2 * Math.PI * aFreq * h * t) / h) * 0.12 * aEnv;
  }

  // Sidechain pumping bass
  const pump = Math.min(1, beatTime * 5);
  out += Math.sin(2 * Math.PI * (root / 2) * t) * 0.3 * pump;

  return out;
}

// 6. Velvet Sunset - World / Fusion (Raag Bhupali: C, D, E, G, A, 94 BPM)
function fusion(t, beatSec) {
  const scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];
  const bar = Math.floor(t / (beatSec * 4)) % 4;

  let out = 0;
  // Sitar-like resonant plucked melody
  const melIdx = Math.floor(t / (beatSec / 2)) % scale.length;
  const mFreq = scale[melIdx];
  const mEnv = Math.exp(-((t % (beatSec / 2)) * 6));
  out += (Math.sin(2 * Math.PI * mFreq * t) + 0.4 * Math.sin(3 * Math.PI * mFreq * t)) * 0.28 * mEnv;

  // Tanpura drone (C + G continuous)
  out += Math.sin(2 * Math.PI * 130.81 * t) * 0.12;
  out += Math.sin(2 * Math.PI * 196.0 * t) * 0.1;

  // Tabla rhythmic pulse (Bayan bass + Dayan treble)
  const beatTime = t % beatSec;
  if (beatTime < 0.18) {
    const bFreq = 95 * Math.exp(-beatTime * 15);
    out += Math.sin(2 * Math.PI * bFreq * beatTime) * 0.32 * Math.exp(-beatTime * 10);
  }
  const subdivision = (t % (beatSec / 2));
  if (subdivision < 0.08) {
    out += (Math.random() * 2 - 1) * 0.1 * Math.exp(-subdivision * 35);
  }

  return out;
}

// 7. Desert Mirage - World / Acoustic (Hijaz Arabic scale: D, Eb, F#, G, A, Bb, C, 86 BPM)
function desert(t, beatSec) {
  const hijaz = [293.66, 311.13, 369.99, 392.0, 440.0, 466.16, 523.25, 587.33];

  let out = 0;
  // Oud pluck
  const noteIdx = Math.floor(t / (beatSec / 2)) % hijaz.length;
  const oFreq = hijaz[noteIdx];
  const oEnv = Math.exp(-((t % (beatSec / 2)) * 7));
  out += (Math.sin(2 * Math.PI * oFreq * t) + 0.35 * Math.sin(2 * Math.PI * oFreq * 2 * t)) * 0.3 * oEnv;

  // Mystic ambient pad
  out += Math.sin(2 * Math.PI * 146.83 * t) * 0.15;
  out += Math.sin(2 * Math.PI * 220.0 * t) * 0.08;

  // Darbuka / Doumbek beat
  const beatTime = t % beatSec;
  const doum = beatTime < 0.2;
  const tek = (t % (beatSec / 2)) < 0.08;
  if (doum) {
    const dFreq = 110 * Math.exp(-beatTime * 20);
    out += Math.sin(2 * Math.PI * dFreq * beatTime) * 0.35 * Math.exp(-beatTime * 12);
  } else if (tek) {
    out += (Math.random() * 2 - 1) * 0.12 * Math.exp(-(t % (beatSec / 2)) * 30);
  }

  return out;
}

// 8. Urban Groove - Hip-Hop / Funk (E minor groove, 92 BPM)
function hiphopFunk(t, beatSec) {
  let out = 0;
  // Bouncy walking funk bass
  const bassIdx = Math.floor(t / (beatSec / 2)) % 8;
  const bassNotes = [82.41, 82.41, 98.0, 110.0, 123.47, 110.0, 98.0, 73.42];
  const bFreq = bassNotes[bassIdx];
  const bEnv = Math.exp(-((t % (beatSec / 2)) * 5));
  out += (Math.sin(2 * Math.PI * bFreq * t) + 0.3 * Math.sin(4 * Math.PI * bFreq * t)) * 0.32 * bEnv;

  // Boom-Bap Drums (heavy kick on 1 and 3, snare on 2 and 4)
  const beatInBar = Math.floor(t / beatSec) % 4;
  const beatTime = t % beatSec;
  const isKick = beatInBar === 0 || beatInBar === 2 || (beatInBar === 3 && beatTime > beatSec * 0.7);
  const isSnare = beatInBar === 1 || beatInBar === 3;

  if (isKick && beatTime < 0.2) {
    const kFreq = 110 * Math.exp(-beatTime * 30);
    out += Math.sin(2 * Math.PI * kFreq * beatTime) * 0.45 * Math.exp(-beatTime * 15);
  } else if (isSnare && beatTime < 0.2) {
    out += (Math.random() * 2 - 1) * 0.25 * Math.exp(-beatTime * 20);
  }

  // Funk clavinet chords
  const clavTime = t % (beatSec / 2);
  if (clavTime < 0.12) {
    const clavChord = [329.63, 392.0, 493.88];
    clavChord.forEach((f) => {
      out += Math.sin(2 * Math.PI * f * t) * 0.08 * Math.exp(-clavTime * 15);
    });
  }

  return out;
}

// Execute Generation for all 8 tracks
const TRACK_DEFS = [
  { id: 'track_1', name: 'Midnight Horizon', bpm: 110, bars: 6, fn: synthwave },
  { id: 'track_2', name: 'Solar Flare', bpm: 126, bars: 6, fn: cyberpunk },
  { id: 'track_3', name: 'Rainy Afternoon Coffee', bpm: 78, bars: 4, fn: lofi },
  { id: 'track_4', name: 'Echoes of the Valley', bpm: 64, bars: 4, fn: ambient },
  { id: 'track_5', name: 'Hyperdrive Anthem', bpm: 128, bars: 6, fn: edm },
  { id: 'track_6', name: 'Velvet Sunset', bpm: 94, bars: 5, fn: fusion },
  { id: 'track_7', name: 'Desert Mirage', bpm: 86, bars: 5, fn: desert },
  { id: 'track_8', name: 'Urban Groove', bpm: 92, bars: 5, fn: hiphopFunk },
];

const targetDir = path.join(__dirname, '..', 'assets', 'audio');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

console.log('Generating bundled offline audio tracks in', targetDir);

const durations = {};

TRACK_DEFS.forEach((t) => {
  const { buffer, duration } = createWavTrack(22050, t.bpm, t.bars, t.fn);
  const outPath = path.join(targetDir, `${t.id}.wav`);
  fs.writeFileSync(outPath, buffer);
  durations[t.id] = duration;
  console.log(`Generated ${t.id}.wav (${t.name}) - ${duration}s, ${buffer.length} bytes`);
});

console.log('Finished generating all 8 audio assets successfully.');
console.log('Durations:', JSON.stringify(durations));
