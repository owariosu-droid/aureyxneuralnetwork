// Every cue is a filtered, enveloped excerpt of the caller's audio buffer.
// This module never synthesizes tones, plays audio, or opens a network connection.
const SAMPLE_RATE = 22050;
const CUES = ['click', 'navigate', 'confirm', 'toggle'];
const MAX_CUE_SAMPLES = Math.floor(SAMPLE_RATE * 1.3);
const MAX_PACKED_BYTES = 300000;
const encoderVersion = 'nox-derived-sounds-v1';
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

function requireContext(context) {
  if (!context || typeof context.createBuffer !== 'function') throw new Error('A browser audio context is required to prepare interface sounds.');
}
function sourceReader(source) {
  if (!source || typeof source.getChannelData !== 'function' || !Number.isInteger(source.numberOfChannels) || source.numberOfChannels < 1 || source.numberOfChannels > 8 || !Number.isInteger(source.length) || source.length < 1 || !Number.isFinite(source.sampleRate) || source.sampleRate < 8000 || source.sampleRate > 192000) {
    throw new Error('Choose a decoded mono or multichannel audio recording with a supported sample rate.');
  }
  if (source.length / source.sampleRate < .2) throw new Error('This audio is too short. Choose at least 0.2 seconds of audible music.');
  const channels = Array.from({ length: source.numberOfChannels }, (_, index) => source.getChannelData(index));
  if (channels.some(channel => !channel || channel.length !== source.length)) throw new Error('The decoded source audio is incomplete.');
  // Avoid cancelling an audible, phase-inverted stereo recording when reducing to mono.
  let preferredChannel = -1;
  if (channels.length > 1) {
    const energies = new Float64Array(channels.length); let mixedEnergy = 0;
    for (let i = 0; i < 256; i++) {
      const index = Math.floor(source.length * (.05 + .75 * i / 256)); let mix = 0;
      for (let channel = 0; channel < channels.length; channel++) {
        const value = Number.isFinite(channels[channel][index]) ? clamp(channels[channel][index], -4, 4) : 0;
        energies[channel] += value * value; mix += value / channels.length;
      }
      mixedEnergy += mix * mix;
    }
    let largest = 0;
    for (let i = 1; i < energies.length; i++) if (energies[i] > energies[largest]) largest = i;
    if (mixedEnergy < energies[largest] * .08) preferredChannel = largest;
  }
  return index => {
    if (preferredChannel >= 0) { const value = channels[preferredChannel][index]; return Number.isFinite(value) ? clamp(value, -4, 4) : 0; }
    let sum = 0;
    for (const channel of channels) {
      const value = channel[index];
      sum += Number.isFinite(value) ? clamp(value, -4, 4) : 0;
    }
    return sum / channels.length;
  };
}

function selectWindows(read, source) {
  const start = Math.floor(source.length * .05), end = Math.floor(source.length * .8);
  const windowSize = Math.min(Math.floor(source.sampleRate * .095), end - start);
  const count = Math.min(72, Math.max(1, Math.floor((end - start) / (source.sampleRate * .045))));
  const sampleCount = Math.min(192, windowSize);
  const candidates = [];
  for (let candidate = 0; candidate < count; candidate++) {
    const offset = Math.round(start + (end - start - windowSize) * candidate / Math.max(1, count - 1));
    const samples = new Float32Array(sampleCount);
    let mean = 0;
    for (let i = 0; i < sampleCount; i++) { samples[i] = read(offset + Math.floor(i * windowSize / sampleCount)); mean += samples[i]; }
    mean /= sampleCount;
    let energy = 0, first = 0, second = 0, peak = 0;
    for (let i = 0; i < sampleCount; i++) {
      samples[i] -= mean;
      const square = samples[i] * samples[i]; energy += square;
      if (i < sampleCount / 2) first += square; else second += square;
      peak = Math.max(peak, Math.abs(samples[i]));
    }
    const rms = Math.sqrt(energy / sampleCount);
    if (rms < .00002 || peak < .00005) continue;
    // Positive autocorrelation favors sustained source material over isolated spikes.
    let periodicity = 0;
    for (const lag of [3, 5, 8, 12, 17, 24, 31]) {
      let dot = 0, left = 0, right = 0;
      for (let i = lag; i < sampleCount; i++) { dot += samples[i] * samples[i - lag]; left += samples[i] ** 2; right += samples[i - lag] ** 2; }
      if (left && right) periodicity = Math.max(periodicity, dot / Math.sqrt(left * right));
    }
    const balance = Math.min(first, second) / Math.max(first, second, 1e-12);
    const crest = peak / rms;
    const score = rms * (.35 + .65 * periodicity) * (.5 + .5 * balance) / (1 + Math.max(0, crest - 4) * .18);
    candidates.push({ offset, score });
  }
  candidates.sort((a, b) => b.score - a.score);
  if (!candidates.length) throw new Error('No usable audible material was found between 5% and 80% of this recording. Choose a nonsilent music clip.');
  const choices = [];
  for (const candidate of candidates) {
    if (choices.every(choice => Math.abs(candidate.offset - choice.offset) > source.sampleRate * .055)) choices.push(candidate);
    if (choices.length === 4) break;
  }
  while (choices.length < 4) choices.push(choices[0]);
  return { choices, start, end };
}

function makeVoice(read, source, region, choice, duration, pitch, cutoff, attack, release) {
  const length = Math.max(2, Math.round(duration * SAMPLE_RATE));
  const sourceCount = Math.max(2, Math.min(region.end - region.start, Math.ceil(duration * pitch * source.sampleRate)));
  const offset = clamp(choice.offset, region.start, region.end - sourceCount);
  const filtered = new Float32Array(sourceCount);
  // Filter at the native rate before resampling to avoid folding bright material into the cue.
  const highPass = Math.exp(-2 * Math.PI * 75 / source.sampleRate);
  const lowPass = 1 - Math.exp(-2 * Math.PI * Math.min(cutoff, SAMPLE_RATE * .38 / pitch) / source.sampleRate);
  let previousInput = read(offset), high = 0, low = 0;
  for (let i = 0; i < sourceCount; i++) {
    const sample = read(offset + i);
    high = highPass * (high + sample - previousInput); previousInput = sample;
    low += lowPass * (high - low); filtered[i] = low;
  }
  const output = new Float32Array(length), step = (sourceCount - 1) / (length - 1);
  for (let i = 0; i < length; i++) {
    const position = i * step, index = Math.floor(position), fraction = position - index;
    const sample = filtered[index] + ((filtered[Math.min(index + 1, sourceCount - 1)] || 0) - filtered[index]) * fraction;
    const time = i / SAMPLE_RATE, remaining = (length - 1 - i) / SAMPLE_RATE;
    const envelope = Math.sin(Math.min(1, time / attack) * Math.PI / 2) ** 2 * Math.sin(Math.min(1, remaining / release) * Math.PI / 2) ** 2;
    output[i] = sample * envelope;
  }
  output[0] = 0; output[length - 1] = 0;
  return output;
}
function addVoice(target, voice, delay, gain = 1, reverse = false, stretch = 1) {
  const start = Math.round(delay * SAMPLE_RATE), samples = Math.round(voice.length * stretch);
  for (let i = 0; i < samples && start + i < target.length; i++) {
    const position = Math.min(voice.length - 1, i / stretch);
    const source = reverse ? voice.length - 1 - position : position;
    const index = Math.floor(source), fraction = source - index;
    const value = voice[index] + (voice[Math.min(voice.length - 1, index + 1)] - voice[index]) * fraction;
    // The tail inherits the source timbre; no generated impulse/noise is added.
    const fade = reverse ? Math.sin(Math.PI * i / Math.max(1, samples - 1)) ** 2 : 1;
    target[start + i] += value * gain * fade;
  }
}

export async function deriveSoundPalette(source, context) {
  requireContext(context);
  const read = sourceReader(source), region = selectWindows(read, source);
  const settings = {
    click: { duration: .12, body: .06, pitch: 1.12, cutoff: 3400, attack: .004, release: .025, peak: .34, choice: 0 },
    toggle: { duration: .2, body: .11, pitch: .88, cutoff: 3000, attack: .009, release: .05, peak: .36, choice: 1 },
    navigate: { duration: .38, body: .21, pitch: .74, cutoff: 2600, attack: .015, release: .105, peak: .37, choice: 2 },
    confirm: { duration: .5, body: .22, pitch: .92, cutoff: 3300, attack: .009, release: .1, peak: .4, choice: 3 },
  };
  const palette = {};
  for (const name of CUES) {
    const config = settings[name], output = new Float32Array(Math.round(config.duration * SAMPLE_RATE));
    const voice = makeVoice(read, source, region, region.choices[config.choice], config.body, config.pitch, config.cutoff, config.attack, config.release);
    addVoice(output, voice, 0);
    addVoice(output, voice, config.body * .62, .12, true, 1.18);
    addVoice(output, voice, config.body * .9, .06, false, 1.25);
    if (name === 'confirm') {
      const overtone = makeVoice(read, source, region, region.choices[0], .22, 1.08, 3700, .015, .1);
      addVoice(output, overtone, .105, .38);
      addVoice(output, overtone, .23, .055, true, 1.12);
    }
    let peak = 0;
    for (let i = 0; i < output.length; i++) {
      const tail = (output.length - 1 - i) / SAMPLE_RATE;
      output[i] *= Math.sin(Math.min(1, tail / .026) * Math.PI / 2) ** 2;
      peak = Math.max(peak, Math.abs(output[i]));
    }
    if (peak < 1e-7) throw new Error('The selected source windows contain no usable sound after filtering. Choose another music clip.');
    const gain = config.peak / peak;
    for (let i = 0; i < output.length; i++) output[i] = clamp(output[i] * gain, -.5, .5);
    output[0] = 0; output[output.length - 1] = 0;
    const buffer = context.createBuffer(1, output.length, SAMPLE_RATE);
    buffer.copyToChannel(output, 0); palette[name] = buffer;
  }
  return palette;
}

function encodeBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(binary);
}
export function packPalette(palette) {
  const cues = {}; let total = 0;
  for (const name of CUES) {
    const buffer = palette?.[name];
    if (!buffer || buffer.numberOfChannels !== 1 || buffer.sampleRate !== SAMPLE_RATE || !Number.isInteger(buffer.length) || buffer.length < 32 || buffer.length > MAX_CUE_SAMPLES || typeof buffer.getChannelData !== 'function') throw new Error(`Invalid ${name} sound buffer.`);
    total += buffer.length * 2;
    if (total > MAX_PACKED_BYTES) throw new Error('The sound palette is too large to save.');
    const input = buffer.getChannelData(0);
    if (!input || input.length !== buffer.length) throw new Error(`The ${name} sound buffer is incomplete.`);
    const bytes = new Uint8Array(buffer.length * 2), view = new DataView(bytes.buffer);
    for (let i = 0; i < input.length; i++) {
      if (!Number.isFinite(input[i])) throw new Error('Sound samples must be finite numbers.');
      view.setInt16(i * 2, Math.round(clamp(input[i], -.5, .5) * 32767), true);
    }
    cues[name] = { samples: buffer.length, pcm16: encodeBase64(bytes) };
  }
  return { version: encoderVersion, sampleRate: SAMPLE_RATE, encoding: 'pcm16-base64-le', cues };
}
export function unpackPalette(data, context) {
  requireContext(context);
  if (!data || typeof data !== 'object' || Array.isArray(data) || data.version !== encoderVersion || data.sampleRate !== SAMPLE_RATE || data.encoding !== 'pcm16-base64-le' || !data.cues || typeof data.cues !== 'object' || Array.isArray(data.cues) || Object.keys(data.cues).length !== CUES.length || CUES.some(name => !Object.hasOwn(data.cues, name))) throw new Error('This is not a supported Nox interface sound palette.');
  let total = 0;
  for (const name of CUES) {
    const cue = data.cues[name];
    if (!cue || typeof cue !== 'object' || !Number.isInteger(cue.samples) || cue.samples < 32 || cue.samples > MAX_CUE_SAMPLES || typeof cue.pcm16 !== 'string' || cue.pcm16.length !== 4 * Math.ceil(cue.samples * 2 / 3) || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(cue.pcm16)) throw new Error(`The ${name} sound data is invalid.`);
    total += cue.samples * 2;
    if (total > MAX_PACKED_BYTES) throw new Error('The sound palette exceeds the storage limit.');
  }
  const palette = {};
  for (const name of CUES) {
    const cue = data.cues[name]; let binary;
    try { binary = atob(cue.pcm16); } catch { throw new Error(`The ${name} sound data could not be decoded.`); }
    if (binary.length !== cue.samples * 2 || btoa(binary) !== cue.pcm16) throw new Error(`The ${name} sound encoding is invalid.`);
    const bytes = Uint8Array.from(binary, character => character.charCodeAt(0)), view = new DataView(bytes.buffer), output = new Float32Array(cue.samples);
    for (let i = 0; i < output.length; i++) {
      const sample = view.getInt16(i * 2, true);
      if (Math.abs(sample) > 16384) throw new Error('A saved interface sound exceeds the allowed peak level.');
      output[i] = sample / 32768;
    }
    const buffer = context.createBuffer(1, output.length, SAMPLE_RATE);buffer.copyToChannel(output, 0);palette[name] = buffer;
  }
  return palette;
}
