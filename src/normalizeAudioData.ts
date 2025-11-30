// THESE CODE THAT ORIGINALY WRITTEN BY ME WAS OVERALL MODIFIED AND IMPROVED BY AI BECAUSE I'M SUFFERING FROM MAKING IT PERFECTLY RESPONSIVE TO BEATS

import { MediaUtilsAudioData, visualizeAudio } from "@remotion/media-utils";

interface VisualizeOptions {
  audioData: MediaUtilsAudioData;
  fps: number;
  frame: number;
  visualBarsCount?: number;
}

export default function getSeparatedFrequencyData({
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
    // Tweak: Naikkan minFreq ke 40Hz agar kita tidak membuang bar untuk sub-bass yang tak terdengar
    // Ini memberi lebih banyak ruang (bar) untuk Vocal dan Treble agar terpisah.
    const minFreq = 40; 
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
      // ZONING STRATEGY (PEMISAHAN WILAYAH)
      // ---------------------------------------------------------
      let weighting = 1;

      // Rasio posisi bar saat ini (0.0 sampai 1.0)
      const ratio = i / visualBarsCount;

      // ZONA 1: BASS & KICK (0% - 10% bar pertama)
      if (ratio < 0.1) {
         weighting = 1.8; 
      }
      
      // ZONA 2: VOCAL / MID RANGE (10% - 55%)
      // Vokal biasanya sangat keras, jadi kita JANGAN boost terlalu besar.
      // Kita biarkan natural (sekitar 1.0 - 1.2) agar tidak "memakan" treble.
      else if (ratio < 0.55) {
         weighting = 1.2;
      }

      // ZONA 3: GAP / PEMISAH (55% - 65%)
      // Ini trik visual: Kita sedikit "tekan" area transisi antara vokal dan treble.
      // Ini menciptakan "lembah" visual agar vokal dan treble tidak terlihat menyatu.
      else if (ratio < 0.65) {
         weighting = 0.8; // Sedikit diturunkan (attenuation)
      }

      // ZONA 4: HIGH TREBLE / AIR (65% ke atas)
      // Ini area 'Sss', hi-hats, dan cymbals.
      // Karena energinya kecil, kita boost GILA-GILAAN secara eksponensial.
      else {
         // Progress dari 0.0 (awal zona treble) sampai 1.0 (ujung kanan)
         const trebleProgress = (ratio - 0.65) / 0.35;
         // Boost dari 2x sampai 8x lipat
         weighting = 2 + (trebleProgress * 6);
      }

      const boostedAmp = maxAmp * weighting;

      // Db Conversion
      const minDb = -70;
      const maxDb = -10;

      const db = 20 * Math.log10(boostedAmp + 1e-10);
      const scaled = (db - minDb) / (maxDb - minDb);

      let finalValue = Math.min(Math.max(scaled, 0), 1);
      finalValue = Math.pow(finalValue, 1.7);

      bars.push(finalValue);
    }
    return bars;
  };

  // --- LOGIKA SMOOTHING ---
  const currentBars = calculateBars(frame);
  const prevBars = frame > 0 ? calculateBars(frame - 1) : currentBars.map(() => 0);

  return currentBars.map((curr, i) => {
    const prev = prevBars[i];
    if (curr > prev) {
      return curr; 
    } else {
      return (curr * 0.4) + (prev * 0.6); 
    }
  });
}