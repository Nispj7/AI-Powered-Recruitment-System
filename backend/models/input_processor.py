import os
import tempfile

def validate_text(text: str) -> str:
    text = (text or "").strip()
    if len(text) == 0:
        return ""
    if len(text) > 5000:
        return text[:5000]
    return text

def save_audio_blob(audio_bytes: bytes) -> str:
    # Store temporarily; in production you'd store with proper naming/security
    fd, path = tempfile.mkstemp(suffix=".webm")
    os.close(fd)
    with open(path, "wb") as f:
        f.write(audio_bytes)
    return path

def speech_to_text_placeholder(audio_path: str) -> str:
    """
    Research prototype placeholder.
    Replace with Whisper/faster-whisper later.
    """
    return "[STT not enabled in this lightweight prototype]"
