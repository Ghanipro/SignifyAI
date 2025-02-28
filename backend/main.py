from fastapi import FastAPI, UploadFile, Form, File, Depends
from sqlalchemy import Column, Integer, String, Boolean, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import shutil
import os
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


DATABASE_URL = "sqlite:///./words.db"  # Use PostgreSQL if needed
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()

# Static Folder for Approved Files
STATIC_FOLDER = "static/uploads"
os.makedirs(STATIC_FOLDER, exist_ok=True)

# Database Model
class WordModel(Base):
    __tablename__ = "words"
    id = Column(Integer, primary_key=True, index=True)
    word = Column(String, unique=True, nullable=False)
    file_path = Column(String, nullable=False)
    is_approved = Column(Boolean, default=False)

Base.metadata.create_all(bind=engine)



@app.post("/upload_word/")
async def upload_word(word: str = Form(...), file: UploadFile = File(...)):
    db = SessionLocal()
    
    temp_path = f"static/uploads/temp_{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    word_entry = WordModel(word=word, file_path=temp_path, is_approved=False)
    db.add(word_entry)
    db.commit()
    db.close()

    return {"message": "File uploaded, waiting for approval"}

@app.put("/approve_word/{word_id}")
async def approve_word(word_id: int):
    db = SessionLocal()
    word_entry = db.query(WordModel).filter(WordModel.id == word_id).first()

    if not word_entry:
        db.close()
        return {"error": "Word not found"}

    new_path = os.path.join(STATIC_FOLDER, f"{word_entry.word}_{os.path.basename(word_entry.file_path)}")
    
    # Move file to permanent static location
    shutil.move(word_entry.file_path, new_path)

    # Update database entry
    word_entry.file_path = new_path
    word_entry.is_approved = True
    db.commit()
    db.close()

    return {"message": "Word approved and file moved"}

@app.get("/pending_words/")
async def get_pending_words():
    db = SessionLocal()
    pending_words = db.query(WordModel).filter(WordModel.is_approved == False).all()
    
    # Convert ORM objects to JSON
    words_list = [{"id": word.id, "word": word.word, "file_path": word.file_path} for word in pending_words]
    
    db.close()
    return words_list



def convert_to_isl(sentence):
    doc = nlp(sentence)

    subject, verb, object_, nouns, extra = [], [], [], [], []
    
    for token in doc:
        print(f"Word: {token.text}, POS: {token.pos_}, Dep: {token.dep_}")  # Debugging line

        if "subj" in token.dep_:
            subject.append(token.lemma_)  # Use lemma (root form)
        elif "obj" in token.dep_:
            object_.append(token.lemma_)
        elif token.pos_ == "VERB":
            verb.append(token.lemma_)  
        elif token.pos_ in ["NOUN", "PROPN"]:  # Include both common and proper nouns
            nouns.append(token.lemma_)  
        else:
            extra.append(token.lemma_)

    # Construct ISL sentence (SOV order with all nouns)
    isl_sentence = " ".join(subject + object_ + nouns + verb)
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