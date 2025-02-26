from transformers import T5ForConditionalGeneration, T5Tokenizer
import torch
from fastapi import FastAPI

# Load the pretrained T5 model for text-to-gloss translation
MODEL_NAME = "t5-small"
tokenizer = T5Tokenizer.from_pretrained(MODEL_NAME)
model = T5ForConditionalGeneration.from_pretrained(MODEL_NAME)

app = FastAPI()

# Function to convert text to ISL gloss
def convert_to_gloss(text: str):
    input_text = "translate English to Gloss: " + text
    input_ids = tokenizer.encode(input_text, return_tensors="pt", max_length=512, truncation=True)
    output_ids = model.generate(input_ids, max_length=50)
    gloss_text = tokenizer.decode(output_ids[0], skip_special_tokens=True)
    return gloss_text

@app.get("/text-to-gloss")
def translate_text_to_gloss(text: str):
    gloss = convert_to_gloss(text)
    return {"gloss": gloss}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
