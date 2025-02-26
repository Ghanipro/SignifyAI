import whisper
import torch
import sounddevice as sd
import numpy as np
import queue
import fastapi
from fastapi import FastAPI

# Load Whisper Model (small for faster inference, or use 'base', 'medium', 'large')
model = whisper.load_model("small")

# Queue for storing audio data
audio_queue = queue.Queue()

# FastAPI app
app = FastAPI()

# Function to record audio and store it in the queue
def callback(indata, frames, time, status):
    if status:
        print(status)
    audio_queue.put(indata.copy())

# Record audio for a fixed duration and transcribe it
def record_and_transcribe(duration=5, samplerate=16000):
    print("Recording...")
    with sd.InputStream(samplerate=samplerate, channels=1, callback=callback):
        sd.sleep(duration * 1000)
    
    print("Processing...")
    audio_data = []
    while not audio_queue.empty():
        audio_data.append(audio_queue.get())
    
    audio_data = np.concatenate(audio_data, axis=0)
    audio_data = (audio_data * 32768).astype(np.int16)
    
    # Transcribe using Whisper
    result = model.transcribe(audio_data)
    return result["text"]

@app.get("/transcribe")
def transcribe_audio():
    text = record_and_transcribe()
    return {"transcription": text}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
