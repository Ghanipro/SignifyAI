import { useState } from "react";
import { Mic, Volume2, Heart, Activity } from "lucide-react";

function App() {
  const [speechText, setSpeechText] = useState("");
  const [islText, setIslText] = useState("");
  const [emotion, setEmotion] = useState("");
  const [confidence, setConfidence] = useState("");
  const [isListening, setIsListening] = useState(false);

  const recognizeSpeech = () => {
    setIsListening(true);
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-US";

    recognition.onresult = async (event) => {
      const spokenText = event.results[0][0].transcript;
      setSpeechText(spokenText);

      // Send text to FastAPI backend for ISL conversion and Sentiment Analysis
      const response = await fetch("http://localhost:8000/convert_speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: spokenText }),
      });

      const data = await response.json();
      setIslText(data.isl_text);
      setEmotion(data.emotion);
      setConfidence((data.confidence * 100).toFixed(2));
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // Function to get emoji based on emotion
  const getEmotionEmoji = () => {
    switch (emotion.toLowerCase()) {
      case "happy":
        return "😊";
      case "sad":
        return "😢";
      case "angry":
        return "😠";
      case "surprised":
        return "😲";
      case "neutral":
        return "😐";
      case "fear":
        return "😨";
      default:
        return "🤔";
    }
  };

  // Function to get confidence color
  const getConfidenceColor = () => {
    const conf = parseFloat(confidence);
    if (conf >= 80) return "text-green-500";
    if (conf >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-indigo-900 via-blue-800 to-purple-900 text-white">
      {/* Header with logo */}
      <header className="w-full p-6 flex items-center justify-center">
        <div className="flex items-center space-x-4">
          <div className="bg-white p-3 rounded-full">
            <Volume2 size={32} className="text-indigo-700" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Signify</h1>
        </div>
      </header>

      {/* Main content */}
      <main className="w-full max-w-6xl px-6 py-8 flex-1 flex flex-col items-center">
        <h2 className="text-2xl mb-8 text-center font-light">Speech to ISL & Emotion Detection Platform</h2>
        
        {/* Main button area */}
        <div className="w-full flex justify-center mb-12">
          <button
            onClick={recognizeSpeech}
            disabled={isListening}
            className={`relative flex items-center justify-center space-x-3 px-8 py-4 rounded-full shadow-lg transition duration-300 ${
              isListening 
                ? "bg-red-500 hover:bg-red-600" 
                : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
            }`}
          >
            <div className={`${isListening ? "animate-pulse" : ""} bg-white rounded-full p-2`}>
              <Mic size={24} className="text-indigo-700" />
            </div>
            <span className="font-semibold text-lg">
              {isListening ? "Listening..." : "Start Speaking"}
            </span>
            
            {/* Ripple effect when listening */}
            {isListening && (
              <span className="absolute w-full h-full rounded-full animate-ping bg-red-400 opacity-50"></span>
            )}
          </button>
        </div>
        
        {/* Cards area */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mt-4">
          {/* Speech Text Card */}
          <div className="bg-white bg-opacity-10 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-white border-opacity-20">
            <div className="flex items-center mb-4">
              <div className="bg-blue-500 bg-opacity-30 p-2 rounded-lg mr-3">
                <Volume2 size={20} className="text-blue-100" />
              </div>
              <h3 className="text-xl font-medium">Speech Text</h3>
            </div>
            <div className="h-32 flex items-center justify-center">
              <p className="text-lg">{speechText || "Your speech will appear here..."}</p>
            </div>
          </div>
          
          {/* ISL Grammar Card */}
          <div className="bg-white bg-opacity-10 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-white border-opacity-20">
            <div className="flex items-center mb-4">
              <div className="bg-purple-500 bg-opacity-30 p-2 rounded-lg mr-3">
                <Activity size={20} className="text-purple-100" />
              </div>
              <h3 className="text-xl font-medium">ISL Grammar</h3>
            </div>
            <div className="h-32 flex items-center justify-center">
              <p className="text-lg font-medium text-indigo-200">{islText || "ISL conversion will appear here..."}</p>
            </div>
          </div>
          
          {/* Emotion Card */}
          <div className="bg-white bg-opacity-10 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-white border-opacity-20">
            <div className="flex items-center mb-4">
              <div className="bg-pink-500 bg-opacity-30 p-2 rounded-lg mr-3">
                <Heart size={20} className="text-pink-100" />
              </div>
              <h3 className="text-xl font-medium">Emotion Analysis</h3>
            </div>
            <div className="h-32 flex flex-col items-center justify-center">
              {emotion ? (
                <>
                  <div className="text-4xl mb-2">{getEmotionEmoji()}</div>
                  <p className="text-lg font-medium">{emotion}</p>
                  <p className={`text-sm ${getConfidenceColor()}`}>
                    Confidence: {confidence}%
                  </p>
                </>
              ) : (
                <p className="text-lg">Emotion will appear here...</p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-white text-opacity-60 text-sm">
        <p>© 2025 Signify - Making communication accessible</p>
      </footer>
    </div>
  );
}

export default App;