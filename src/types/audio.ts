export interface AudioData {
  bass: number            // 60–250 Hz  0–1
  mid: number             // 500–2000 Hz 0–1
  treble: number          // 4000+ Hz   0–1
  volume: number          // RMS overall 0–1
  beat: boolean           // onset this frame
  bpm: number
  frequencies: Uint8Array // full FFT (2048 bins)
  waveform: Uint8Array    // time-domain
  spectralCentroid: number // 0–1 brightness
}
