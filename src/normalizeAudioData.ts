// THESE CODE THAT ORIGINALY WRITTEN BY ME WAS OVERALL MODIFIED AND IMPROVED BY AI BECAUSE I'M SUFFERING FROM MAKING IT PERFECTLY RESPONSIVE TO BEATS

import { MediaUtilsAudioData, visualizeAudio } from "@remotion/media-utils";

interface VisualizeOptions {
  audioData: MediaUtilsAudioData;
  fps: number;
  frame: number;
  visualBarsCount?: number;
}

export default function getButterySmoothData({
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
      const startFreq = minFreq * Math.pow(maxFreq / minFreq, i / visualBarsCount);
      const endFreq = minFreq * Math.pow(maxFreq / minFreq, (i + 1) / visualBarsCount);

      const startIndex = Math.floor((startFreq / (sampleRate / 2)) * frequencyData.length);
      const endIndex = Math.floor((endFreq / (sampleRate / 2)) * frequencyData.length);

      const actualStartIndex = startIndex;
      const actualEndIndex = Math.max(endIndex, startIndex + 1);

      let maxAmp = 0;
      for (let j = actualStartIndex; j < actualEndIndex; j++) {
        const amplitude = frequencyData[Math.min(j, frequencyData.length - 1)] || 0;
        if (amplitude > maxAmp) {
          maxAmp = amplitude;
        }
      }

      // --- WEIGHTING (Versi Natural yang Anda setujui sebelumnya) ---
      let weighting = 1;
      if (i < 5) {
         weighting = 1.8 - (i * 0.1); 
      } else if (i > visualBarsCount * 0.6) {
         const progress = (i - (visualBarsCount * 0.6)) / (visualBarsCount * 0.4);
         weighting = 1 + (progress * 2);
      }

      const boostedAmp = maxAmp * weighting;

      const minDb = -70;
      const maxDb = -12;

      const db = 20 * Math.log10(boostedAmp + 1e-10);
      const scaled = (db - minDb) / (maxDb - minDb);

      let finalValue = Math.min(Math.max(scaled, 0), 1);
      finalValue = Math.pow(finalValue, 1.7); 

      bars.push(finalValue);
    }
    return bars;
  };

  // ------------------------------------------------------------------
  // LOGIKA "BUTTERY SMOOTH" (ANTI-JITTER)
  // ------------------------------------------------------------------

  const currentBars = calculateBars(frame);
  const prevBars = frame > 0 ? calculateBars(frame - 1) : currentBars.map(() => 0);

  return currentBars.map((curr, i) => {
    const prev = prevBars[i];

    // LOGIKA BARU:
    
    // 1. Kondisi NAIK (Attack)
    if (curr > prev) {
      // Trik Anti-Jitter saat naik:
      // Jangan langsung loncat 100% ke nilai baru (curr). 
      // Kita ambil rata-rata sedikit dengan frame sebelumnya.
      // Ini menghilangkan "spike" atau lonjakan noise tiba-tiba yang cuma 1 frame.
      
      // Bass (kiri) boleh responsif (0.8), Treble (kanan) lebih smooth (0.5)
      const responsiveness = i < 10 ? 0.9 : 0.6; 
      
      return (curr * responsiveness) + (prev * (1 - responsiveness));
    } 
    
    // 2. Kondisi TURUN (Decay) -> KUNCI UTAMA ANTI-GETAR
    else {
      // Kita buat turunnya LAMBAT (Gravity effect).
      // Kita pertahankan 85% - 90% dari tinggi sebelumnya.
      // Semakin besar angka smoothFactor, semakin "malas" turunnya (makin smooth).
      
      // Bass turun lebih cepat (biar ritmis), Treble turun lambat (biar elegan)
      const smoothFactor = i < 10 ? 0.85 : 0.92; 
      
      return (curr * (1 - smoothFactor)) + (prev * smoothFactor);
    }
  });
}