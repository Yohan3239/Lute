let audioCtx: AudioContext | null = null;

export function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

const bufferCache = new Map<string, AudioBuffer>();

export async function loadSound(url: string): Promise<AudioBuffer> {
  if (bufferCache.has(url)) {
    return bufferCache.get(url)!;
  }

  const ctx = getAudioContext();
  const res = await fetch(url);
  const arrayBuffer = await res.arrayBuffer();
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

  bufferCache.set(url, audioBuffer);
  return audioBuffer;
}

export function playSound(
  buffer: AudioBuffer,
  volume = 0.6,
  playbackRate = 1,
  semitones = 1
) {
  const ctx = getAudioContext();

  // source (one-time use!)
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = playbackRate;

  // volume
  const gain = ctx.createGain();
  gain.gain.value = volume;

  var semitoneRatio = Math.pow(2, 1/12);
  source.playbackRate.value = semitoneRatio ** semitones;

  // wire it up
  source.connect(gain);
  gain.connect(ctx.destination);

  source.start();
}
