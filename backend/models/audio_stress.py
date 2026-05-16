import numpy as np
try:
    import librosa
    HAS_LIBROSA = True
except ImportError:
    HAS_LIBROSA = False

def stress_from_audio(wav_path: str) -> float:
    if not HAS_LIBROSA:
        return 0.0
    
    y, sr = librosa.load(wav_path, sr=None)

    if y is None or len(y) < sr * 0.3:
        return 0.0

    # Energy
    rms = librosa.feature.rms(y=y)[0]
    rms_mean = float(np.mean(rms))

    # Pitch (fundamental freq estimate via librosa.yin)
    try:
        f0 = librosa.yin(y, fmin=50, fmax=300, sr=sr)
        f0 = f0[np.isfinite(f0)]
        if len(f0) == 0:
            f0_var = 0.0
        else:
            f0_var = float(np.std(f0) / (np.mean(f0) + 1e-6))
    except Exception:
        f0_var = 0.0

    # Normalize roughly (empirical stable mapping)
    energy_norm = min(1.0, rms_mean * 10.0)
    pitch_norm = min(1.0, f0_var * 3.0)

    stress = 0.6 * energy_norm + 0.4 * pitch_norm
    return float(max(0.0, min(1.0, stress)))
