"use client";
import { useState } from 'react';
import { buildApiUrl } from '../lib/api';

export default function ChatbotPage() {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setUploadStatus('Uploading...');
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(buildApiUrl('/api/upload'), {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        setUploadStatus('Upload and training successful!');
      } else {
        setUploadStatus('Upload failed.');
      }
    } catch (error) {
      setUploadStatus('Error connecting to backend.');
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: 'user', text: input }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(buildApiUrl('/api/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });
      
      const data = await res.json();
      
      setMessages([...newMessages, { role: 'bot', text: data.answer }]);
    } catch (error) {
      setMessages([...newMessages, { role: 'bot', text: 'Error connecting to server.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Admin Upload Screen */}
        <div className="bg-white p-6 rounded-lg shadow-md col-span-1 h-fit">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Admin Panel</h2>
          <p className="text-sm text-gray-600 mb-4">Upload a PDF to train the chatbot.</p>
          <input 
            type="file" 
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mb-4 w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <button 
            onClick={handleUpload}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
          >
            Upload & Train
          </button>
          {uploadStatus && <p className="mt-4 text-sm font-medium text-green-600">{uploadStatus}</p>}
        </div>

        {/* Chat Interface */}
        <div className="bg-white rounded-lg shadow-md col-span-2 flex flex-col h-[600px]">
          <div className="p-4 bg-gray-800 text-white rounded-t-lg">
            <h2 className="text-xl font-bold">Customer Support Bot</h2>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
            {messages.length === 0 && (
              <p className="text-gray-400 text-center mt-10">Ask a question about the uploaded document!</p>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-500 text-white self-end rounded-br-none' : 'bg-gray-100 text-gray-800 self-start rounded-bl-none'}`}>
                {msg.text}
              </div>
            ))}
            {/* Display a loading indicator while waiting */}
            {isLoading && (
              <div className="bg-gray-100 text-gray-500 p-3 rounded-lg self-start rounded-bl-none animate-pulse">
                Thinking...
              </div>
            )}
          </div>

          <div className="p-4 border-t flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your message..."
              className="flex-1 border rounded-md px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button 
              onClick={handleSendMessage}
              disabled={isLoading}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition"
            >
              Send
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}