import React, { useState } from "react";
import axios from "axios";
import { Upload, CheckCircle, AlertCircle } from "lucide-react";

const UploadForm = () => {
  const [word, setWord] = useState("");
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!word || !file) {
      setStatus({
        type: "error",
        message: "Please provide both word and file!"
      });
      return;
    }

    setIsLoading(true);
    setStatus({ type: "", message: "" });

    const formData = new FormData();
    formData.append("word", word);
    formData.append("file", file);

    try {
      await axios.post("http://localhost:8000/upload_word/", formData);
      setStatus({
        type: "success",
        message: "File uploaded successfully!"
      });
      setWord("");
      setFile(null);
      setFileName("");
    } catch (error) {
      console.error("Error uploading file:", error);
      setStatus({
        type: "error",
        message: error.response?.data?.detail || "Error uploading file. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-6 text-white">Upload Sign Language Content</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="word" className="block text-indigo-200 font-medium">
            Sign Language Word/Phrase
          </label>
          <input
            id="word"
            type="text"
            placeholder="Enter word or phrase for the sign"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            className="w-full px-4 py-3 bg-white bg-opacity-10 rounded-lg border border-indigo-300 border-opacity-30 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-indigo-300 placeholder-opacity-60"
          />
          <p className="text-xs text-indigo-300">Enter the word or phrase this sign represents</p>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="file" className="block text-indigo-200 font-medium">
            Video File
          </label>
          
          <div className="flex flex-col">
            <div className={`relative w-full border-2 border-dashed rounded-lg p-8 text-center ${fileName ? 'border-green-400 border-opacity-50' : 'border-indigo-300 border-opacity-30'}`}>
              <input
                id="file"
                type="file"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept="video/*"
              />
              
              <div className="flex flex-col items-center justify-center">
                <Upload className="h-10 w-10 text-indigo-300 mb-2" />
                {fileName ? (
                  <div>
                    <p className="text-green-400 font-medium">{fileName}</p>
                    <p className="text-xs text-indigo-300 mt-1">Click or drag to replace</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-indigo-300 font-medium">Drag and drop a video file here, or click to select</p>
                    <p className="text-xs text-indigo-300 mt-1">Support for MP4, MOV, and WebM formats</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {status.message && (
          <div className={`p-4 rounded-lg flex items-start space-x-3 ${
            status.type === "error" ? "bg-red-500 bg-opacity-20 text-red-100" : 
            "bg-green-500 bg-opacity-20 text-green-100"
          }`}>
            {status.type === "error" ? 
              <AlertCircle className="h-5 w-5 mt-0.5" /> : 
              <CheckCircle className="h-5 w-5 mt-0.5" />
            }
            <span>{status.message}</span>
          </div>
        )}
        
        <button 
          type="submit"
          disabled={isLoading}
          className={`w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-medium shadow-lg ${
            isLoading 
              ? "bg-indigo-700 cursor-not-allowed" 
              : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
          } transition duration-300`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Upload className="h-5 w-5" />
              <span>Upload Sign</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default UploadForm;