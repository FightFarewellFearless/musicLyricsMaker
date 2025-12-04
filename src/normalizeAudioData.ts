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
    // Tetap di 2048 untuk respon cepat (snappy)
    const fftSize = 2048; 

    const frequencyData = visualizeAudio({
      fps,
      frame: targetFrame,
      audioData,
      numberOfSamples: fftSize,
      optimizeFor: "accuracy",
      smoothing: true, 
    });

    const sampleRate = 44100;
    
    // Range frekuensi difokuskan
    // Max diturunkan sedikit ke 14000 agar bar paling kanan fokus ke suara "cis" hi-hat, 
    // bukan "udara" (air/hiss) yang tidak terdengar.
    const minFreq = 40; 
    const maxFreq = 14000;

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

      // --- PERBAIKAN UTAMA: DYNAMIC SPECTRAL BOOST ---
      // Kita menyeimbangkan energi: Bass butuh sedikit boost, Treble butuh RAKSASA boost.
      
      let weighting = 1;
      const progress = i / visualBarsCount; // 0.0 (kiri) s/d 1.0 (kanan)

      if (i < 5) {
         // AREA BASS: Boost moderat agar Kick tetap nendang
         weighting = 2.5; 
      } else {
         // AREA MIDS & TREBLE: Exponential Growth
         // Rumus ini membuat multiplier naik drastis semakin ke kanan.
         // Di tengah (mids) ~4x boost
         // Di ujung kanan (treble) ~24x boost
         weighting = 2 + Math.pow(progress, 2) * 22;
      }

      const boostedAmp = maxAmp * weighting;

      // Settings dB
      const minDb = -55; 
      const maxDb = -10; 

      const db = 20 * Math.log10(boostedAmp + 1e-10);
      const scaled = (db - minDb) / (maxDb - minDb);

      let finalValue = Math.min(Math.max(scaled, 0), 1);

      // --- PERBAIKAN RESPONSIVITAS TREBLE ---
      // Bass (kiri) butuh kurva tajam (pow 3.0) agar terlihat "thump-thump".
      // Treble (kanan) sering hilang jika di-pow terlalu tinggi.
      // Jadi kita kurangi pow untuk treble agar lebih mudah naik, tapi tetap bersih.
      
      const variablePow = 3.0 - (progress * 0.8); 
      // Hasil: Kiri pakai pangkat 3.0 (Ketata), Kanan pakai pangkat 2.2 (Lebih sensitif)
      
      finalValue = Math.pow(finalValue, variablePow); 

      bars.push(finalValue);
    }
    return bars;
  };
  return calculateBars(frame);
}