import { useState } from "react";

function App() {
  const [speechText, setSpeechText] = useState("");
  const [islText, setIslText] = useState("");

  const recognizeSpeech = () => {
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-US";

    recognition.onresult = async (event) => {
      const spokenText = event.results[0][0].transcript;
      setSpeechText(spokenText);

      // Send text to FastAPI backend for ISL conversion
      const response = await fetch("http://localhost:8000/convert_speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: spokenText }),
      });

      const data = await response.json();
      setIslText(data.isl_text);
    };

    recognition.start();
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Speech to ISL Grammar Converter</h1>
      <button onClick={recognizeSpeech} style={{ padding: "10px 20px", fontSize: "18px", cursor: "pointer" }}>
        🎤 Start Speaking
      </button>
      
      <div style={{ display: "flex", justifyContent: "center", marginTop: "30px" }}>
        <div style={{ marginRight: "40px", textAlign: "left" }}>
          <h3>🎙️ Normal Text (Speech)</h3>
          <p style={{ fontSize: "18px", fontWeight: "bold" }}>{speechText || "..."}</p>
        </div>

        <div style={{ textAlign: "left" }}>
          <h3>🤟 ISL Grammar Text</h3>
          <p style={{ fontSize: "18px", fontWeight: "bold", color: "blue" }}>{islText || "..."}</p>
        </div>
      </div>
    </div>
  );
}

export default App;
