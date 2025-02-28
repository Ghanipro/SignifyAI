import React, { useState, useEffect } from "react";
import axios from "axios";
import { CheckCircle, AlertCircle, Eye, Shield, RefreshCw } from "lucide-react";

const AdminPanel = () => {
  const [pendingWords, setPendingWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeItem, setActiveItem] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const fetchPendingWords = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get("http://localhost:8000/pending_words/");
      setPendingWords(response.data);
    } catch (error) {
      console.error("Error fetching pending words:", error);
      setError("Failed to load pending words. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingWords();
  }, []);

  const approveWord = async (wordId) => {
    setProcessingId(wordId);
    try {
      await axios.put(`http://localhost:8000/approve_word/${wordId}`);
      setPendingWords(pendingWords.filter(word => word.id !== wordId));
    } catch (error) {
      console.error("Error approving word:", error);
      setError("Failed to approve word. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  const handlePreview = (wordId) => {
    setActiveItem(activeItem === wordId ? null : wordId);
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-500 bg-opacity-30 p-2 rounded-lg">
            <Shield size={20} className="text-indigo-100" />
          </div>
          <h2 className="text-2xl font-bold text-white">Admin Panel - Sign Language Approval</h2>
        </div>
        <button 
          onClick={fetchPendingWords} 
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition duration-200"
        >
          <RefreshCw size={16} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500 bg-opacity-20 text-red-100 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-500"></div>
          <span className="ml-3 text-indigo-200">Loading pending submissions...</span>
        </div>
      ) : pendingWords.length === 0 ? (
        <div className="bg-white bg-opacity-10 backdrop-blur-lg p-8 rounded-2xl shadow-xl border border-white border-opacity-20 text-center">
          <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-400" />
          <p className="text-xl text-white font-medium">No pending sign language words to approve</p>
          <p className="mt-2 text-indigo-300">All submissions have been processed</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-indigo-200 mb-4">
            {pendingWords.length} {pendingWords.length === 1 ? 'submission' : 'submissions'} pending approval
          </p>
          
          {pendingWords.map((word) => (
            <div 
              key={word.id} 
              className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl shadow-lg border border-white border-opacity-20 overflow-hidden"
            >
              <div className="p-4 flex justify-between items-center">
                <div className="flex-1">
                  <h3 className="text-xl font-medium text-white">{word.word}</h3>
                  <p className="text-sm text-indigo-300 truncate mt-1">File: {word.file_path}</p>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handlePreview(word.id)}
                    className="p-2 rounded-lg bg-indigo-800 hover:bg-indigo-700 transition"
                  >
                    <Eye size={18} />
                  </button>
                  <button 
                    onClick={() => approveWord(word.id)}
                    disabled={processingId === word.id}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                      processingId === word.id 
                        ? "bg-green-700 cursor-wait" 
                        : "bg-green-600 hover:bg-green-500 transition"
                    }`}
                  >
                    {processingId === word.id ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle size={18} />
                        <span>Approve</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              {activeItem === word.id && (
                <div className="bg-black bg-opacity-30 p-4 border-t border-indigo-900">
                  <div className="aspect-video rounded overflow-hidden">
                    <video
                      src={`http://localhost:8000/static/${word.file_path}`}
                      controls
                      className="w-full h-full object-contain"
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="bg-indigo-900 bg-opacity-30 p-3 rounded">
                      <p className="text-xs uppercase text-indigo-300 font-semibold">Submitted On</p>
                      <p className="text-white">{new Date(word.created_at || Date.now()).toLocaleString()}</p>
                    </div>
                    <div className="bg-indigo-900 bg-opacity-30 p-3 rounded">
                      <p className="text-xs uppercase text-indigo-300 font-semibold">Submitted By</p>
                      <p className="text-white">{word.submitted_by || "Anonymous User"}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;