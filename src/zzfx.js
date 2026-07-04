export let zzfxX;

export const initAudio = () => {
    if (!zzfxX && (window.AudioContext || window.webkitAudioContext)) {
        zzfxX = new (window.AudioContext || window.webkitAudioContext)();
    }
};

export const zzfxR = 44100;

export const zzfx = (...parameters) => {
    if (!zzfxX) initAudio();
    if (!zzfxX) return;
    return zzfxP(zzfxG(...parameters));
};

export const zzfxP = (...samples) => {
    let bufferSource = zzfxX.createBufferSource(),
        buffer = zzfxX.createBuffer(samples.length, samples[0].length, zzfxR);
    samples.map((d, i) => buffer.getChannelData(i).set(d));
    bufferSource.buffer = buffer;
    bufferSource.connect(zzfxX.destination);
    bufferSource.start();
    return bufferSource;
};

export const zzfxG = (volume=1, randomness=.05, frequency=220, attack=0, sustain=0,
    release=.1, shape=0, shapeCurve=1, slide=0, deltaSlide=0,
    pitchJump=0, pitchJumpTime=0, repeatTime=0, noise=0, modulation=0,
    bitCrush=0, delay=0, sustainVolume=1, decay=0, tremolo=0) => {

    let PI2 = Math.PI * 2,
        sign = v => v > 0 ? 1 : -1,
        startSlide = slide *= 500 * PI2 / zzfxR / zzfxR,
        startFrequency = frequency *= (1 + randomness * 2 * Math.random() - randomness) * PI2 / zzfxR,
        b = [], t = 0, tm = 0, i = 0, j = 1, r = 0, c = 0, s = 0, f, length;

    attack = attack * zzfxR + 9;
    decay *= zzfxR;
    sustain *= zzfxR;
    release *= zzfxR;
    delay *= zzfxR;
    deltaSlide *= 500 * PI2 / zzfxR ** 3;
    modulation *= PI2 / zzfxR;
    pitchJump *= PI2 / zzfxR;
    pitchJumpTime *= zzfxR;
    repeatTime = repeatTime * zzfxR | 0;

    for (length = attack + decay + sustain + release + delay | 0; i < length; b[i++] = s) {
        if (!(++c % (bitCrush * 100 | 0))) {
            s = shape ? shape > 1 ? shape > 2 ? shape > 3 ?
                Math.sin((t % PI2) ** 3) : 
                Math.max(Math.min(Math.tan(t), 1), -1) : 
                1 - (2 * t / PI2 % 2 + 2) % 2 : 
                1 - 4 * Math.abs(Math.round(t / PI2) - t / PI2) : 
                Math.sin(t);
            s = (repeatTime ?
                1 - tremolo + tremolo * Math.sin(PI2 * i / repeatTime) : 1) *
                sign(s) * Math.abs(s) ** shapeCurve * volume * (
                i < attack ? i / attack :
                i < attack + decay ? 1 - ((i - attack) / decay) * (1 - sustainVolume) :
                i < attack + decay + sustain ? sustainVolume :
                i < length - delay ? (length - i - delay) / release * sustainVolume : 0);
            s = delay ? s / 2 + (delay > i ? 0 :
                (i < length - delay ? 1 : (length - i) / delay) * b[i - delay | 0] / 2) : s;
        }
        f = (frequency += slide += deltaSlide) * Math.cos(modulation * tm++);
        t += f - f * noise * (1 - (Math.sin(i) + 1) * 1e9 % 2);
        if (j && ++j > pitchJumpTime) {
            frequency += pitchJump;
            startFrequency += pitchJump;
            j = 0;
        }
        if (repeatTime && !(++r % repeatTime)) {
            frequency = startFrequency;
            slide = startSlide;
            j = j || 1;
        }
    }
    return b;
}
