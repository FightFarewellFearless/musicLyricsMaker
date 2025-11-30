// THESE CODE THAT ORIGINALY WRITTEN BY ME WAS OVERALL MODIFIED AND IMPROVED BY AI BECAUSE I'M SUFFERING FROM MAKING IT PERFECTLY RESPONSIVE TO BEATS

import { MediaUtilsAudioData, visualizeAudio } from "@remotion/media-utils";

interface VisualizeOptions {
  audioData: MediaUtilsAudioData;
  fps: number;
  frame: number;
  visualBarsCount?: number;
}

export default function getResponsiveTrebleData({
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

      // --- 1. WEIGHTING YANG LEBIH AGRESIF UNTUK TREBLE ---
      let weighting = 1;

      // KICK / BASS (Bar 0 - 5)
      if (i < 5) {
         weighting = 1.8 - (i * 0.1); 
      } 
      // CLAP / SNARE / HI-HAT (Mulai dari 20% bar ke atas)
      // Kita majukan start boost-nya agar Clap (Mid-freq) kena dampaknya.
      else if (i > visualBarsCount * 0.2) {
         // Progress 0.0 sampai 1.0
         const progress = (i - (visualBarsCount * 0.2)) / (visualBarsCount * 0.8);
         
         // FORMULA BARU:
         // Kita gunakan pangkat kuadrat (progress * progress) agar boost di ujung kanan EKSTRIM.
         // Hi-hats yang sangat lemah akan dikali sampai 12x lipat.
         // Clap (di tengah) akan dikali sekitar 2x - 4x.
         weighting = 1 + (progress * progress * 12);
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

  // --- 2. LOGIKA RESPONSIVITAS BARU ---
  
  const currentBars = calculateBars(frame);
  const prevBars = frame > 0 ? calculateBars(frame - 1) : currentBars.map(() => 0);

  return currentBars.map((curr, i) => {
    const prev = prevBars[i];

    // KONDISI NAIK (ATTACK) -> "SNAP!"
    if (curr > prev) {
      // PERUBAHAN PENTING DISINI:
      // Bass (kiri): Kita beri sedikit smoothing (0.85) agar terlihat berbobot.
      // Treble (kanan): HARUS 1.0 (Instant).
      // Kenapa? Karena suara Hi-hat itu durasinya mikro-detik.
      // Kalau kita rata-rata (smooth), puncaknya hilang duluan sebelum ter-render.
      
      const isBass = i < 10;
      const responsiveness = isBass ? 0.85 : 1.0; 
      
      return (curr * responsiveness) + (prev * (1 - responsiveness));
    } 
    
    // KONDISI TURUN (DECAY) -> "SMOOTH..."
    else {
      // Saat turun, kita perlambat agar tidak bergetar (anti-jitter).
      // Treble kita buat turunnya sangat lambat (0.94) agar terlihat 'mahal' dan jelas.
      
      const smoothFactor = i < 10 ? 0.85 : 0.94; 
      
      return (curr * (1 - smoothFactor)) + (prev * smoothFactor);
    }
  });
}