import React, { useState, useEffect } from "react";

const SpeechToText = () => {
  const [text, setText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en-US");
  const [translationStatus, setTranslationStatus] = useState("");
  
  // Available languages
  const languages = [
    { code: "en-US", name: "English" },
    { code: "te-IN", name: "Telugu" },
    { code: "ur-PK", name: "Urdu" },
    { code: "hi-IN", name: "Hindi" },
    { code: "es-ES", name: "Spanish" },
    { code: "fr-FR", name: "French" },
    { code: "de-DE", name: "German" },
    { code: "it-IT", name: "Italian" },
    { code: "ja-JP", name: "Japanese" },
    { code: "ko-KR", name: "Korean" },
    { code: "zh-CN", name: "Chinese (Simplified)" },
    { code: "ar-SA", name: "Arabic" },
    { code: "ru-RU", name: "Russian" },
    { code: "pt-BR", name: "Portuguese" }
  ];
  
  // Initialize recognition with useEffect to avoid errors with window object
  const [recognition, setRecognition] = useState(null);
  
  useEffect(() => {
    // Initialize the speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = selectedLanguage;
      
      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setText(transcript);
        processText(transcript, selectedLanguage);
      };
      
      recognitionInstance.onerror = (event) => {
        console.error("Speech recognition error", event);
        setIsListening(false);
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
    }
  }, [selectedLanguage]);
  
  const startListening = () => {
    if (recognition) {
      setIsListening(true);
      recognition.start();
    }
  };
  
  const stopListening = () => {
    if (recognition) {
      setIsListening(false);
      recognition.stop();
    }
  };
  
  const handleLanguageChange = (e) => {
    const langCode = e.target.value;
    setSelectedLanguage(langCode);
    if (isListening && recognition) {
      recognition.stop();
      setIsListening(false);
    }
    // Reset translation-related states
    setText("");
    setTranslatedText("");
    setTranslationStatus("");
  };
  
  const processText = async (transcript, language) => {
    try {
      setIsProcessing(true);
      setTranslationStatus("Translating with Grok AI...");
      
      // Always translate if not English
      if (language !== "en-US") {
        const translationResponse = await fetch("http://localhost:8000/translate_text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            text: transcript,
            source_language: language,
            target_language: "en-US" 
          }),
        });
        
        if (!translationResponse.ok) {
          throw new Error("Translation failed");
        }
        
        const translationData = await translationResponse.json();
        setTranslatedText(translationData.translated_text);
        setTranslationStatus("Translation complete");
        
        // Send translated text for ISL conversion
        await sendToConvertSpeech(translationData.translated_text);
      } else {
        // For English, skip translation
        setTranslatedText(transcript);
        await sendToConvertSpeech(transcript);
      }
    } catch (error) {
      console.error("Error processing text:", error);
      setTranslationStatus(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const sendToConvertSpeech = async (englishText) => {
    try {
      const response = await fetch("http://localhost:8000/convert_speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text: englishText
        }),
      });
      
      if (!response.ok) {
        throw new Error("Error converting speech");
      }
      
      const data = await response.json();
      console.log("Conversion result:", data);
      // You can handle the response data here (e.g., display ISL text, emotion, etc.)
    } catch (error) {
      console.error("Error sending data to convert_speech:", error);
    }
  };
  
  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md">
      <h1 className="text-2xl font-bold mb-4 text-center">Multi-Language Speech to Text</h1>
      <p className="text-sm text-gray-500 text-center mb-4">Powered by Grok AI Translation</p>
      
      <div className="mb-4">
        <label htmlFor="language-select" className="block text-sm font-medium text-gray-700 mb-1">
          Select Language:
        </label>
        <select 
          id="language-select"
          value={selectedLanguage}
          onChange={handleLanguageChange}
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Original Speech:
        </label>
        <div className="border p-3 rounded-md min-h-16 bg-gray-50">
          {text || `Start speaking in ${languages.find(l => l.code === selectedLanguage)?.name || 'selected language'}...`}
        </div>
      </div>
      
      {selectedLanguage !== "en-US" && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            English Translation:
          </label>
          <div className="border p-3 rounded-md min-h-16 bg-gray-50">
            {translatedText || "Translation will appear here"}
          </div>
          {translationStatus && (
            <p className="text-xs text-gray-500 mt-1">{translationStatus}</p>
          )}
        </div>
      )}
      
      <div className="flex justify-center">
        <button
          onClick={isListening ? stopListening : startListening}
          className={`px-4 py-2 text-white rounded-md transition-colors ${
            isListening ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"
          }`}
          disabled={!recognition || isProcessing}
        >
          {isListening ? "Stop Listening" : "Start Listening"}
        </button>
      </div>
      
      {isProcessing && (
        <p className="mt-2 text-center text-sm text-gray-500">
          Processing your speech...
        </p>
      )}
      
      {!window.SpeechRecognition && !window.webkitSpeechRecognition && (
        <p className="mt-4 text-red-500 text-sm text-center">
          Speech recognition is not supported in this browser.
        </p>
      )}
    </div>
  );
};

export default SpeechToText;