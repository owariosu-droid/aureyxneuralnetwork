// An original, source-independent interface pack. Nothing here plays audio or creates a context.
const SAMPLE_RATE = 22050;
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

function requireContext(context) {
  if (!context || typeof context.createBuffer !== 'function') throw new Error('An audio context is required to prepare interface sounds.');
}
function envelope(index, length, attack = .006, release = .04) {
  const age = index / SAMPLE_RATE, remaining = (length - 1 - index) / SAMPLE_RATE;
  return Math.sin(Math.min(1, age / attack) * Math.PI / 2) ** 2 * Math.sin(Math.min(1, remaining / release) * Math.PI / 2) ** 2;
}
function tone(target, { start = 0, duration, from, to = from, gain = 1, attack = .006, release = .04, decay = 1.5, glass = 0, fm = 0 }) {
  const begin = Math.round(start * SAMPLE_RATE), count = Math.round(duration * SAMPLE_RATE);
  let phase = 0;
  for (let i = 0; i < count && begin + i < target.length; i++) {
    const progress = i / Math.max(1, count - 1);
    const frequency = from + (to - from) * progress;
    phase += 2 * Math.PI * frequency / SAMPLE_RATE;
    const signal = Math.sin(phase + fm * Math.sin(phase * 1.5)) + glass * .22 * Math.sin(phase * 2.013) + glass * .08 * Math.sin(phase * 3.027);
    target[begin + i] += signal * gain * envelope(i, count, attack, release) * Math.exp(-decay * progress);
  }
}
function soften(samples, cutoff = 3500) {
  const lowPass = 1 - Math.exp(-2 * Math.PI * cutoff / SAMPLE_RATE), highPass = Math.exp(-2 * Math.PI * 65 / SAMPLE_RATE);
  let previous = 0, high = 0, low = 0;
  for (let i = 0; i < samples.length; i++) {
    const current = samples[i];
    high = highPass * (high + current - previous); previous = current;
    low += lowPass * (high - low); samples[i] = low;
  }
}
function finish(context, samples, targetPeak, cutoff = 3500) {
  soften(samples, cutoff);
  let peak = 0;
  for (let i = 0; i < samples.length; i++) {
    samples[i] *= envelope(i, samples.length, .0035, .018);
    peak = Math.max(peak, Math.abs(samples[i]));
  }
  const gain = peak > 1e-9 ? Math.min(targetPeak, .4) / peak : 0;
  for (let i = 0; i < samples.length; i++) samples[i] = clamp(samples[i] * gain, -.4, .4);
  samples[0] = 0; samples[samples.length - 1] = 0;
  const buffer = context.createBuffer(1, samples.length, SAMPLE_RATE);
  buffer.copyToChannel(samples, 0);
  return buffer;
}

export function createCyberneticPalette(context) {
  requireContext(context);
  const hover = new Float32Array(Math.round(.058 * SAMPLE_RATE));
  tone(hover, { duration: .058, from: 1430, to: 1600, gain: .7, attack: .005, release: .028, decay: 1.8, glass: .2 });

  const click = new Float32Array(Math.round(.105 * SAMPLE_RATE));
  tone(click, { duration: .092, from: 760, to: 1220, gain: .8, attack: .004, release: .038, decay: 2, fm: .1 });
  tone(click, { start: .012, duration: .093, from: 420, to: 360, gain: .14, attack: .006, release: .05, decay: 2.5 });

  const toggle = new Float32Array(Math.round(.165 * SAMPLE_RATE));
  tone(toggle, { duration: .095, from: 570, to: 620, gain: .65, attack: .006, release: .055, decay: 1.8 });
  tone(toggle, { start: .064, duration: .101, from: 850, to: 920, gain: .52, attack: .008, release: .06, decay: 1.8, glass: .25 });

  const navigate = new Float32Array(Math.round(.3 * SAMPLE_RATE));
  tone(navigate, { duration: .3, from: 310, to: 970, gain: .65, attack: .025, release: .12, decay: .8, fm: .12 });
  tone(navigate, { start: .027, duration: .255, from: 470, to: 1390, gain: .17, attack: .028, release: .12, decay: 1.4, glass: .2 });
  // A deterministic, heavily smoothed air layer: it stays far below the tonal sweep.
  let seed = 0x4e4f58, air = 0;
  for (let i = 0; i < navigate.length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    air += ((seed / 4294967296 * 2 - 1) - air) * .12;
    navigate[i] += air * .08 * envelope(i, navigate.length, .04, .14);
  }

  const confirm = new Float32Array(Math.round(.45 * SAMPLE_RATE));
  tone(confirm, { duration: .36, from: 660, to: 655, gain: .6, attack: .009, release: .17, decay: 2.1, glass: 1 });
  tone(confirm, { start: .092, duration: .358, from: 990, to: 985, gain: .47, attack: .012, release: .18, decay: 2.2, glass: .8 });
  tone(confirm, { start: .16, duration: .25, from: 1320, gain: .055, attack: .03, release: .13, decay: 2.6, glass: .3 });

  return {
    hover: finish(context, hover, .16, 3400),
    click: finish(context, click, .3, 3700),
    navigate: finish(context, navigate, .27, 3100),
    toggle: finish(context, toggle, .28, 3500),
    confirm: finish(context, confirm, .33, 3800),
  };
}

// Old imported packs keep their source identity: hover is made from their click, never synthesized.
export function createHoverCue(clickBuffer, context) {
  requireContext(context);
  if (!clickBuffer || typeof clickBuffer.getChannelData !== 'function' || !Number.isInteger(clickBuffer.length) || clickBuffer.length < 32 || !Number.isFinite(clickBuffer.sampleRate) || clickBuffer.sampleRate < 8000 || clickBuffer.sampleRate > 192000 || clickBuffer.length / clickBuffer.sampleRate > 1.3 || !Number.isInteger(clickBuffer.numberOfChannels) || clickBuffer.numberOfChannels < 1) throw new Error('The imported click sound is invalid.');
  const source = clickBuffer.getChannelData(0);
  if (!source || source.length !== clickBuffer.length) throw new Error('The imported click sound is incomplete.');
  let sourcePeak = 0, peakIndex = 0;
  for (let i = 0; i < source.length; i++) {
    if (!Number.isFinite(source[i])) throw new Error('The imported click sound contains invalid samples.');
    if (Math.abs(source[i]) > sourcePeak) { sourcePeak = Math.abs(source[i]); peakIndex = i; }
  }
  const output = new Float32Array(Math.round(.058 * SAMPLE_RATE));
  const count = Math.min(source.length, Math.ceil(.058 * clickBuffer.sampleRate * 1.06));
  const start = clamp(peakIndex - Math.round(.012 * clickBuffer.sampleRate), 0, source.length - count);
  for (let i = 0; i < output.length; i++) {
    const position = start + i / (output.length - 1) * (count - 1), index = Math.floor(position), fraction = position - index;
    const sample = source[index] + (source[Math.min(source.length - 1, index + 1)] - source[index]) * fraction;
    output[i] = sample * envelope(i, output.length, .004, .026);
  }
  return finish(context, output, Math.min(.16, sourcePeak * .5), 2900);
}
