from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import spacy

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
async def process_text(speech: SpeechText):
    isl_text = convert_to_isl(speech.text)
    return {"original_text": speech.text, "isl_text": isl_text}
