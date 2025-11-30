// THESE CODE THAT ORIGINALY WRITTEN BY ME WAS OVERALL MODIFIED AND IMPROVED BY AI BECAUSE I'M SUFFERING FROM MAKING IT PERFECTLY RESPONSIVE TO BEATS

import { MediaUtilsAudioData, visualizeAudio } from "@remotion/media-utils";

interface VisualizeOptions {
  audioData: MediaUtilsAudioData;
  fps: number;
  frame: number;
  visualBarsCount?: number; // Optional, default nanti di set
}

export default function getHighResFrequencyData({
  audioData,
  fps,
  frame,
  visualBarsCount = 64, // Default ke 64 sesuai request
}: VisualizeOptions) {
  
  // 1. MAX RESOLUTION
  // 4096 memberikan resolusi sekitar ~5Hz per bin.
  // Ini memisahkan Sub-bass (30Hz) dan Kick (60Hz) dengan sangat tegas.
  const fftSize = 4096; 
  
  const frequencyData = visualizeAudio({
    fps,
    frame,
    audioData,
    numberOfSamples: fftSize,
    optimizeFor: "accuracy",
    smoothing: false, // MATIKAN smoothing bawaan remotion untuk akurasi 'hit' instan
  });

  const sampleRate = 44100; 
  // Kita persempit sedikit range-nya agar bar tidak kosong di ujung
  const minFreq = 20;   
  const maxFreq = 16000; // Di atas 16k biasanya hanya "udara"/desis halus

  const logData: number[] = [];

  for (let i = 0; i < visualBarsCount; i++) {
    // Logarithmic Scale Logic
    const startFreq = minFreq * Math.pow(maxFreq / minFreq, i / visualBarsCount);
    const endFreq = minFreq * Math.pow(maxFreq / minFreq, (i + 1) / visualBarsCount);

    const startIndex = Math.floor((startFreq / (sampleRate / 2)) * frequencyData.length);
    const endIndex = Math.floor((endFreq / (sampleRate / 2)) * frequencyData.length);

    const actualStartIndex = startIndex;
    const actualEndIndex = Math.max(endIndex, startIndex + 1);

    // 2. PEAK DETECTION (Pengganti Rata-rata)
    // Alih-alih rata-rata, kita cari nilai TERTINGGI (peak) di range ini.
    // Ini membuat visualizer sangat responsif terhadap beat.
    let maxAmp = 0;
    for (let j = actualStartIndex; j < actualEndIndex; j++) {
      const amplitude = frequencyData[Math.min(j, frequencyData.length - 1)] || 0;
      if (amplitude > maxAmp) {
        maxAmp = amplitude;
      }
    }

    // 3. SPECTRAL BALANCING (High Frequency Boost)
    // Musik cenderung memiliki energi bass besar dan treble kecil (Pink Noise).
    // Kita kalikan frekuensi tinggi agar visualnya terlihat rata tingginya.
    // Semakin ke kanan (i makin besar), multiplier makin besar.
    const multiplier = 1 + (i / visualBarsCount) * 2.5; 
    const boostedAmp = maxAmp * multiplier;

    // 4. DECIBEL CONVERSION
    // Range dinamis disesuaikan untuk musik modern
    const minDb = -70; // Noise floor
    const maxDb = -10; // Ceiling

    const db = 20 * Math.log10(boostedAmp + 1e-10);
    const scaled = (db - minDb) / (maxDb - minDb);
    
    // Output 0-1
    let finalValue = Math.min(Math.max(scaled, 0), 1);
    
    // Opsional: Sedikit curve agar bar rendah tidak terlalu "jittery"
    finalValue = finalValue * finalValue; 

    logData.push(finalValue);
  }

  return logData;
}