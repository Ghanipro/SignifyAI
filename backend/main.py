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
import dotenv
import requests
from fastapi import HTTPException
from dotenv import load_dotenv
from deep_translator import GoogleTranslator
import langcodes
import asyncio
from typing import Optional

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

# Load environment variables
load_dotenv()

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

# Update the language code mapping to match deep-translator's supported codes
LANGUAGE_CODES = {
    "en-US": "en",
    "te-IN": "te",  # Telugu
    "ur-PK": "ur",  # Urdu
    "hi-IN": "hi",  # Hindi
    "es-ES": "es",  # Spanish
    "fr-FR": "fr",  # French
    "de-DE": "de",  # German
    "it-IT": "it",  # Italian
    "ja-JP": "ja",  # Japanese
    "ko-KR": "ko",  # Korean
    "zh-CN": "zh-CN",  # Chinese (Simplified)
    "ar-SA": "ar",  # Arabic
    "ru-RU": "ru",  # Russian
    "pt-BR": "pt",  # Portuguese
    "ta-IN": "ta",  # Tamil
    "bn-IN": "bn",  # Bengali
    "ml-IN": "ml",  # Malayalam
    "gu-IN": "gu",  # Gujarati
    "kn-IN": "kn",  # Kannada
    "mr-IN": "mr",  # Marathi
}

# Create translator instances for each language
translators = {}
for source_code in LANGUAGE_CODES.values():
    if source_code != 'en':
        translators[source_code] = GoogleTranslator(source=source_code, target='en')

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
    try:
        doc = nlp(sentence)

        # Initialize word categories
        subject, verb, object_, nouns, time_words, adjectives = [], [], [], [], [], []
        
        for token in doc:
            print(f"Word: {token.text}, POS: {token.pos_}, Dep: {token.dep_}")  # Debugging line

            # Convert to uppercase at token level
            word = token.lemma_.upper()  # Use lemma (root form) for all words

            # Categorize words
            if "subj" in token.dep_:
                subject.append(word)
            elif "obj" in token.dep_:
                object_.append(word)
            elif token.pos_ == "VERB":
                verb.append(word)
            elif token.pos_ in ["NOUN", "PROPN"]:
                if word not in subject and word not in object_:
                    nouns.append(word)
            elif token.pos_ == "ADJ":
                adjectives.append(word)
            elif token.pos_ == "ADV" and token.lemma_.lower() in ["now", "today", "tomorrow", "yesterday"]:
                time_words.append(word)

        # Construct ISL sentence following SOV order:
        # Time + Subject + Object + Other Nouns + Verb
        isl_parts = []
        
        # Add time references first
        if time_words:
            isl_parts.extend(time_words)
        
        # Add subject
        if subject:
            isl_parts.extend(subject)
        
        # Add objects
        if object_:
            isl_parts.extend(object_)
            
        # Add other nouns
        if nouns:
            isl_parts.extend(nouns)
            
        # Add adjectives before their nouns if any
        if adjectives:
            isl_parts.extend(adjectives)
            
        # Add verbs at the end (SOV order)
        if verb:
            isl_parts.extend(verb)

        # Remove duplicates while maintaining order
        seen = set()
        unique_parts = []
        for part in isl_parts:
            if part not in seen:
                seen.add(part)
                unique_parts.append(part)

        # Join with spaces
        isl_sentence = " ".join(unique_parts)
        return isl_sentence

    except Exception as e:
        print(f"Error in ISL conversion: {str(e)}")
        # Fallback: return original text in uppercase
        return sentence.upper()

# New model for translation
class TranslationInput(BaseModel):
    text: str
    source_language: str
    target_language: str = "en-US"

@app.post("/convert_speech")
async def convert_speech(input_data: TextInput):
    try:
        # Convert to ISL using Grok
        isl_text = convert_to_isl(input_data.text)

        # Perform sentiment analysis
        emotions = emotion_model(input_data.text)[0]
        highest_emotion = max(emotions, key=lambda x: x["score"])

        return {
            "speech_text": input_data.text,
            "isl_text": isl_text,
            "emotion": highest_emotion["label"],
            "confidence": highest_emotion["score"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/translate_text")
async def translate_text(translation_input: TranslationInput):
    try:
        # Get source language code
        source_lang = LANGUAGE_CODES.get(translation_input.source_language)
        if not source_lang:
            raise HTTPException(
                status_code=400, 
                detail=f"Language {translation_input.source_language} not supported"
            )

        # If already English, skip translation
        if source_lang == 'en':
            translated_text = translation_input.text
        else:
            translator = GoogleTranslator(source=source_lang, target='en')
            translated_text = translator.translate(translation_input.text)

        # Convert to ISL format
        isl_text = convert_to_isl(translated_text)

        return {
            "original_text": translation_input.text,
            "translated_text": translated_text,
            "isl_text": isl_text,
            "source_language": translation_input.source_language,
            "target_language": "en-US"
        }

    except Exception as e:
        print(f"Translation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))