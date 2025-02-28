from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import spacy
from transformers import pipeline

app = FastAPI()
nlp = spacy.load("en_core_web_sm")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

emotion_model = pipeline("text-classification", model="bhadresh-savani/distilbert-base-uncased-emotion", return_all_scores=True)

# Request model
class TextInput(BaseModel):
    text: str

# Request model
class SpeechText(BaseModel):
    text: str

# Function to convert English to ISL Grammar
def convert_to_isl(sentence):
    doc = nlp(sentence)

    subject, verb, object_, extra = [], [], [], []
    
    for token in doc:
        if "subj" in token.dep_:
            subject.append(token.text)
        elif "obj" in token.dep_:
            object_.append(token.text)
        elif token.pos_ == "VERB":
            verb.append(token.text)
        else:
            extra.append(token.text)

    isl_sentence = " ".join(subject + object_ + verb)  # SOV format
    return isl_sentence

@app.post("/convert_speech")
async def convert_speech(input_data: TextInput):  # 🛠️ Use input_data instead of input_text
    isl_text = convert_to_isl(input_data.text)  # 🛠️ Fix variable name

    # Perform sentiment analysis
    emotions = emotion_model(input_data.text)[0]
    highest_emotion = max(emotions, key=lambda x: x["score"])

    return {
        "speech_text": input_data.text,
        "isl_text": isl_text,
        "emotion": highest_emotion["label"],
        "confidence": highest_emotion["score"],
    }