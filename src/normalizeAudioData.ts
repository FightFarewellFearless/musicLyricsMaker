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

  const calculateBars = (targetFrame: number) => {
    const fftSize = 4096;

    const frequencyData = visualizeAudio({
      fps,
      frame: targetFrame,
      audioData,
      numberOfSamples: fftSize,
      optimizeFor: "accuracy",
      smoothing: false, 
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

      // ---------------------------------------------------------
      // PERUBAHAN UTAMA: SENSITIVITY WEIGHTING
      // ---------------------------------------------------------
      let weighting = 1;

      if (i < 5) {
        // Area BASS (Tetap)
        weighting = 1.8 - (i * 0.1); 
      } 
      // Area CLAP/SNARE/TREBLE (Dimulai dari 25% bar, bukan 60%)
      // Clap biasanya ada di index 16 ke atas (dari 64 bar)
      else if (i > visualBarsCount * 0.25) {
        
        // Kita hitung seberapa jauh posisi bar saat ini dari titik mulai (0.25)
        const progress = (i - (visualBarsCount * 0.25)) / (visualBarsCount * 0.75);
        
        // FORMULA BARU:
        // Kita boost secara eksponensial.
        // Di awal (area clap) naik 2x, di ujung (hi-hat) naik sampai 8x lipat.
        // Ini mengkompensasi energi treble yang kecil.
        weighting = 1 + (progress * 8); 
      }

      const boostedAmp = maxAmp * weighting;

      // Db Conversion
      const minDb = -70;
      const maxDb = -10; // Pertahankan -10 agar tidak terlalu mudah clipping

      const db = 20 * Math.log10(boostedAmp + 1e-10);
      const scaled = (db - minDb) / (maxDb - minDb);

      let finalValue = Math.min(Math.max(scaled, 0), 1);

      // Contrast Curve
      // Sedikit dikurangi dari 1.8 ke 1.7 agar treble yang lemah tidak "mati" karena curve
      finalValue = Math.pow(finalValue, 1.7);

      bars.push(finalValue);
    }
    return bars;
  };

  // --- LOGIKA SMOOTHING (Tetap Sama karena sudah bagus) ---
  const currentBars = calculateBars(frame);
  const prevBars = frame > 0 ? calculateBars(frame - 1) : currentBars.map(() => 0);

  return currentBars.map((curr, i) => {
    const prev = prevBars[i];
    if (curr > prev) {
      return curr; // Instant Attack
    } else {
      return (curr * 0.4) + (prev * 0.6); // Smooth Decay
    }
  });
}