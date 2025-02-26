import React, { useState } from "react";

const SpeechToText = () => {
  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);

  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "en-US";

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    setText(transcript);
    sendToBackend(transcript);
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error", event);
  };

  const startListening = () => {
    setIsListening(true);
    recognition.start();
  };

  const stopListening = () => {
    setIsListening(false);
    recognition.stop();
  };

  const sendToBackend = async (transcript) => {
    try {
      await fetch("http://localhost:8000/process_text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcript }),
      });
    } catch (error) {
      console.error("Error sending data to backend", error);
    }
  };

  return (
    <div className="p-4 text-center">
      <h1 className="text-2xl font-bold mb-4">Speech to Text</h1>
      <p className="mb-4 border p-2 rounded">{text || "Start speaking..."}</p>
      <button
        onClick={isListening ? stopListening : startListening}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        {isListening ? "Stop Listening" : "Start Listening"}
      </button>
    </div>
  );
};

export default SpeechToText;
