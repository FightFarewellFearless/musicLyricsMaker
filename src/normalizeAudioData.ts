// THESE CODE THAT ORIGINALY WRITTEN BY ME WAS OVERALL MODIFIED AND IMPROVED BY AI BECAUSE I'M SUFFERING FROM MAKING IT PERFECTLY RESPONSIVE TO BEATS

import { MediaUtilsAudioData, visualizeAudio } from "@remotion/media-utils";

interface VisualizeOptions {
  audioData: MediaUtilsAudioData;
  fps: number;
  frame: number;
  visualBarsCount?: number;
}

export default function getFullRangeSeparatedData({
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
    // KEMBALIKAN KE 20Hz (Sub-bass area)
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
      // ZONING STRATEGY (UPDATED UNTUK SUB-BASS)
      // ---------------------------------------------------------
      let weighting = 1;
      const ratio = i / visualBarsCount;

      // ZONA 1: SUB-BASS & KICK (0% - 16% area kiri)
      // Karena minFreq = 20Hz, area ini sekarang mencakup getaran rendah DAN kick drum.
      // Kita beri boost besar (1.8x - 2.0x) agar "nendang" dan "bergetar".
      if (ratio < 0.16) {
         // Sedikit gradasi: Sub-bass (paling kiri) butuh boost lebih besar dari Kick
         weighting = 2.2 - (ratio * 2); 
      }
      
      // ZONA 2: VOCAL / INSTRUMEN UTAMA (16% - 55%)
      // Kita biarkan natural (weighting ~1.0)
      else if (ratio < 0.55) {
         weighting = 1.0;
      }

      // ZONA 3: THE SEPARATION GAP (55% - 62%)
      // "Lembah" pemisah antara Vokal dan Treble.
      // Kita tekan (0.7) agar terlihat ada jarak kosong visual.
      else if (ratio < 0.62) {
         weighting = 0.7; 
      }

      // ZONA 4: HIGH TREBLE / AIR (62% ke atas)
      // Area Hi-hats, Cymbal, 'Sss'.
      // Boost agresif agar tidak terlihat mati.
      else {
         const trebleProgress = (ratio - 0.62) / 0.38;
         // Boost bertingkat dari 2x sampai 8x
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