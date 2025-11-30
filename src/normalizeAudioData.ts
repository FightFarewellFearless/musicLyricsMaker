// THESE CODE THAT ORIGINALY WRITTEN BY ME WAS OVERALL MODIFIED AND IMPROVED BY AI BECAUSE I'M SUFFERING FROM MAKING IT PERFECTLY RESPONSIVE TO BEATS

import { MediaUtilsAudioData, visualizeAudio } from "@remotion/media-utils";

interface VisualizeOptions {
  audioData: MediaUtilsAudioData;
  fps: number;
  frame: number;
  visualBarsCount?: number;
}

export default function getSmoothedFrequencyData({
  audioData,
  fps,
  frame,
  visualBarsCount = 64,
}: VisualizeOptions) {

  // Fungsi Helper: Menghitung data raw untuk satu frame spesifik
  const calculateBars = (targetFrame: number) => {
    // 1. MAX RESOLUTION
    const fftSize = 4096;

    const frequencyData = visualizeAudio({
      fps,
      frame: targetFrame,
      audioData,
      numberOfSamples: fftSize,
      optimizeFor: "accuracy",
      smoothing: false, // Tetap FALSE agar data mentahnya akurat
    });

    const sampleRate = 44100;
    const minFreq = 20;
    const maxFreq = 16000;

    const bars: number[] = [];

    for (let i = 0; i < visualBarsCount; i++) {
      // Logarithmic Scale
      const startFreq = minFreq * Math.pow(maxFreq / minFreq, i / visualBarsCount);
      const endFreq = minFreq * Math.pow(maxFreq / minFreq, (i + 1) / visualBarsCount);

      const startIndex = Math.floor((startFreq / (sampleRate / 2)) * frequencyData.length);
      const endIndex = Math.floor((endFreq / (sampleRate / 2)) * frequencyData.length);

      const actualStartIndex = startIndex;
      const actualEndIndex = Math.max(endIndex, startIndex + 1);

      // Peak Detection
      let maxAmp = 0;
      for (let j = actualStartIndex; j < actualEndIndex; j++) {
        const amplitude = frequencyData[Math.min(j, frequencyData.length - 1)] || 0;
        if (amplitude > maxAmp) {
          maxAmp = amplitude;
        }
      }

      // Sensitivity Weighting (Bass Boost)
      let weighting = 1;
      if (i < 5) {
        weighting = 1.8 - (i * 0.1);
      } else if (i > visualBarsCount * 0.6) {
        weighting = 1.5 + ((i - visualBarsCount * 0.6) / (visualBarsCount * 0.4)) * 3;
      }

      const boostedAmp = maxAmp * weighting;

      // Db Conversion
      const minDb = -70;
      const maxDb = -10;

      const db = 20 * Math.log10(boostedAmp + 1e-10);
      const scaled = (db - minDb) / (maxDb - minDb);

      let finalValue = Math.min(Math.max(scaled, 0), 1);

      // Contrast Curve
      finalValue = Math.pow(finalValue, 1.8);

      bars.push(finalValue);
    }
    return bars;
  };

  // ------------------------------------------------------------------
  // LOGIKA SMOOTHING "ATTACK/DECAY"
  // ------------------------------------------------------------------

  // 1. Ambil data frame saat ini
  const currentBars = calculateBars(frame);

  // 2. Ambil data frame sebelumnya (jika ada)
  //    Ini menambah beban render sedikit, tapi hasilnya jauh lebih pro.
  const prevBars = frame > 0 ? calculateBars(frame - 1) : currentBars.map(() => 0);

  // 3. Blend keduanya
  return currentBars.map((curr, i) => {
    const prev = prevBars[i];

    // Logika Kunci:
    // Jika Curr > Prev (Suara naik/Kick): Gunakan Curr langsung (Instant Attack)
    // Jika Curr < Prev (Suara turun): Gunakan rata-rata (Smooth Decay)

    if (curr > prev) {
      // Opsi A: Sangat responsif (Jump langsung)
      return curr;

      // Opsi B: Jika ingin sedikit lebih halus saat naik, gunakan:
      // return (curr * 0.8) + (prev * 0.2);
    } else {
      // Saat turun, kita perlambat agar tidak terlihat "bergetar"
      // Semakin besar porsi 'prev', semakin lambat turunnya (seperti gravitasi)
      return (curr * 0.4) + (prev * 0.6);
    }
  });
}