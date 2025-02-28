import { useState } from "react";
import { Mic, Volume2, Heart, Activity, Square, Film } from "lucide-react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";
import UploadForm from "./components/UploadForm";
import AdminPanel from "./components/AdminPanel";


// Enhanced Navbar component with active link styling
const Navbar = () => {
  return (
    <nav className="w-full bg-indigo-900 bg-opacity-50 backdrop-blur-md shadow-lg px-6 py-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-white text-2xl font-bold flex items-center">
          <Volume2 className="mr-2" />
          Signify AI
        </Link>
        <div className="flex space-x-6">
          <Link to="/" className="text-white hover:text-indigo-300 transition duration-200 font-medium">
            Home
          </Link>
          <Link to="/upload" className="text-white hover:text-indigo-300 transition duration-200 font-medium">
            Upload
          </Link>
          <Link to="/admin" className="text-white hover:text-indigo-300 transition duration-200 font-medium">
            Admin Panel
          </Link>
        </div>
      </div>
    </nav>
  );
};

// Home component that contains the main speech-to-sign functionality
const Home = () => {
  const [speechText, setSpeechText] = useState("");
  const [islText, setIslText] = useState("");
  const [emotion, setEmotion] = useState("");
  const [confidence, setConfidence] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const startRecognition = () => {
    setIsListening(true);
    const recognitionInstance = new window.webkitSpeechRecognition();
    recognitionInstance.lang = "en-US";
    setRecognition(recognitionInstance);

    recognitionInstance.onresult = async (event) => {
      const spokenText = event.results[0][0].transcript;
      setSpeechText(spokenText);

      // Set loading state for video generation
      setIsLoading(true);
      setVideoUrl("");

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
      
      // Assuming the API now returns a video URL as well
      if (data.video_url) {
        setVideoUrl(data.video_url);
      }
      
      setIsLoading(false);
      setIsListening(false);
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
      setRecognition(null);
    };

    recognitionInstance.onerror = () => {
      setIsListening(false);
      setRecognition(null);
      setIsLoading(false);
    };

    recognitionInstance.start();
  };

  const stopRecognition = () => {
    if (recognition) {
      recognition.stop();
    }
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
    <>
      {/* Main content */}
      <main className="w-full max-w-6xl mx-auto px-6 py-8 flex-1 flex flex-col items-center">
        <h2 className="text-2xl mb-8 text-center font-light">Bridging Speech and Sign Language with AI</h2>
        
        {/* Main button area */}
        <div className="w-full flex justify-center mb-12 space-x-4">
          {!isListening ? (
            <button
              onClick={startRecognition}
              className="relative flex items-center justify-center space-x-3 px-8 py-4 rounded-full shadow-lg transition duration-300 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
            >
              <div className="bg-white rounded-full p-2">
                <Mic size={24} className="text-indigo-700" />
              </div>
              <span className="font-semibold text-lg">Start Speaking</span>
            </button>
          ) : (
            <button
              onClick={stopRecognition}
              className="relative flex items-center justify-center space-x-3 px-8 py-4 rounded-full shadow-lg transition duration-300 bg-red-500 hover:bg-red-600"
            >
              <div className="bg-white rounded-full p-2 animate-pulse">
                <Square size={24} className="text-red-700" />
              </div>
              <span className="font-semibold text-lg">Stop Recording</span>
              
              {/* Ripple effect when listening */}
              <span className="absolute w-full h-full rounded-full animate-ping bg-red-400 opacity-50"></span>
            </button>
          )}
        </div>
        
        {/* Cards area */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mb-12">
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
        
        {/* Sign Language Video Section - Now after the cards */}
        <div className="w-full mb-12 bg-white bg-opacity-10 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-white border-opacity-20">
          <div className="flex items-center mb-6">
            <div className="bg-indigo-500 bg-opacity-30 p-2 rounded-lg mr-3">
              <Film size={24} className="text-indigo-100" />
            </div>
            <h3 className="text-2xl font-medium">Sign Language Visualization</h3>
          </div>
          
          <div className="flex justify-center rounded-lg overflow-hidden bg-black bg-opacity-40 aspect-video">
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
                <p className="ml-4 text-lg">Generating sign language animation...</p>
              </div>
            ) : videoUrl ? (
              <video 
                className="w-full max-h-96 object-contain"
                src={videoUrl}
                controls
                autoPlay
                loop
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="w-full h-full flex items-center justify-center p-8">
                <p className="text-lg text-center">Speak or type to generate a sign language animation</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
};

// Enhanced Upload Form Page with transitions
const EnhancedUploadForm = () => {
  const navigate = useNavigate();
  
  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-12 flex-1 flex flex-col">
      <div className="mb-8 flex justify-between items-center">
        <h2 className="text-3xl font-bold text-white">File Upload</h2>
        <button 
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-800 transition duration-200"
        >
          Back to Home
        </button>
      </div>
      
      <div className="bg-white bg-opacity-10 backdrop-blur-lg p-8 rounded-2xl shadow-xl border border-white border-opacity-20">
        <UploadForm />
      </div>
    </div>
  );
};

// Enhanced Admin Panel Page with transitions
const EnhancedAdminPanel = () => {
  const navigate = useNavigate();
  
  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-12 flex-1 flex flex-col">
      <div className="mb-8 flex justify-between items-center">
        <h2 className="text-3xl font-bold text-white">Admin Dashboard</h2>
        <button 
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-800 transition duration-200"
        >
          Back to Home
        </button>
      </div>
      
      <div className="bg-white bg-opacity-10 backdrop-blur-lg p-8 rounded-2xl shadow-xl border border-white border-opacity-20">
        <AdminPanel />
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-indigo-900 via-blue-800 to-purple-900 text-white">
      <Router>
        <Navbar />
        {/* Header Section */}
        <header className="w-full p-6 flex items-center justify-center">
          <div className="flex items-center space-x-4">
            <div className="bg-white p-3 rounded-full shadow-lg">
              <Volume2 size={32} className="text-indigo-700" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Signify AI</h1>
          </div>
        </header>
        
        {/* Routes Section with Page Transitions */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<EnhancedUploadForm />} />
          <Route path="/admin" element={<EnhancedAdminPanel />} />
        </Routes>

        {/* Footer */}
        <footer className="w-full py-6 text-center text-white text-opacity-60 text-sm mt-auto">
          <p>© 2025 Signify - Making communication accessible</p>
        </footer>
      </Router>
    </div>
  );
}

export default App;