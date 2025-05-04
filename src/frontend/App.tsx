import React, { useState } from 'react';
import EncoderForm from './components/EncoderForm';
import DecoderView from './components/DecoderView';

function App() {
  const [activeTab, setActiveTab] = useState('encode');

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans">
      <div className="container mx-auto max-w-2xl bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Hapa Emoji Validator</h1>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-300 mb-6">
          <button 
            className={`py-2 px-4 font-semibold ${activeTab === 'encode' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('encode')}
          >
            Encode
          </button>
          <button 
            className={`py-2 px-4 font-semibold ${activeTab === 'decode' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('decode')}
          >
            Decode
          </button>
        </div>

        {/* Content based on active tab */}
        <div>
          {activeTab === 'encode' && <EncoderForm />}
          {activeTab === 'decode' && <DecoderView />}
        </div>
      </div>
       <footer className="text-center text-gray-500 text-sm mt-4">
            Compatible with Hapa Ecosystem v1.2+
        </footer>
    </div>
  );
}

export default App; 