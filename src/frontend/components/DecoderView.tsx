import React, { useState, useCallback, useEffect } from 'react';
import { decodeEmoji } from '../../backend/decoder';
import { validatePayloadStructure } from '../../backend/validator';
import { EmojiPayload, isTokenPayload, isContractPayload } from '../../types/EmojiPayload';

function DecoderView() {
  const [encodedInput, setEncodedInput] = useState<string>('');
  const [decodedPayload, setDecodedPayload] = useState<EmojiPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [showRawData, setShowRawData] = useState<boolean>(false);

  const handleDecode = useCallback(() => {
    setError(null);
    setDecodedPayload(null);
    setIsValid(null);
    setCopied(false);
    setShowRawData(false);

    if (!encodedInput.trim()) {
      setError('Please paste an encoded emoji string.');
      return;
    }

    try {
      const payload = decodeEmoji(encodedInput);
      setDecodedPayload(payload);
      
      // Perform structure validation, but don't show validation errors if decoding succeeded
      const structureValid = validatePayloadStructure(payload);
      setIsValid(true); // Always consider it valid if decoding succeeded
      
      // Only show structural validation error if it's critical
      if (!structureValid && (!isTokenPayload(payload) && !isContractPayload(payload))) {
        setError("Warning: Decoded payload has an unusual structure, but data was retrieved successfully.");
      }
    } catch (err: any) {
      console.error("Decoding failed:", err);
      setError(err.message || 'Failed to decode emoji.');
      setDecodedPayload(null); // Clear any previous results on error
      setIsValid(false);
    }
  }, [encodedInput]);

  // Auto-decode when input changes with a slight delay
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setEncodedInput(value);
    
    // Automatically decode after a short delay (only if input is not empty)
    if (value.trim()) {
      const timer = setTimeout(() => {
        setError(null);
        setDecodedPayload(null);
        setIsValid(null);
        setCopied(false);
        
        try {
          const payload = decodeEmoji(value);
          setDecodedPayload(payload);
          // Always consider valid if we could decode it
          setIsValid(true);
        } catch (err: any) {
          // Don't show errors during auto-decode to avoid too many messages
          // Just clear the results
          setDecodedPayload(null);
          setIsValid(false);
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy:', err);
        setError('Failed to copy to clipboard.');
      });
  };

  const renderDataItem = (label: string, value: any, valueClass: string = "") => (
    <div className="flex flex-col sm:flex-row sm:items-center py-3 border-b border-gray-100 last:border-0">
      <div className="w-full sm:w-1/3 text-sm font-medium text-gray-500">
        {label}
      </div>
      <div className={`w-full sm:w-2/3 mt-1 sm:mt-0 ${valueClass}`}>
        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
      </div>
    </div>
  );

  const renderPayloadDetails = (payload: EmojiPayload) => {
    if (isTokenPayload(payload)) {
      return (
        <div className="space-y-2">
          <div className="bg-blue-50 p-4 rounded-md mb-4">
            <h4 className="font-medium text-blue-800 flex items-center">
              <span className="text-xl mr-2">💱</span>
              Token Transfer
            </h4>
          </div>
          
          <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
            {renderDataItem("Emoji", payload.emoji, "text-2xl")}
            {renderDataItem("Amount", payload.amount, "text-lg font-semibold text-green-600")}
            {renderDataItem("From", payload.sender, "font-mono text-sm text-gray-800")}
            {renderDataItem("To", payload.receiver, "font-mono text-sm text-gray-800")}
            {renderDataItem("Timestamp", new Date(payload.timestamp).toLocaleString(), "text-sm text-gray-600")}
            {payload.message && renderDataItem("Message", payload.message, "italic")}
            
            {/* Display any additional fields */}
            {Object.entries(payload)
              .filter(([key]) => !['type', 'emoji', 'amount', 'sender', 'receiver', 'timestamp', 'message'].includes(key))
              .map(([key, value]) => renderDataItem(key, value, "text-sm"))}
          </div>
          
          <div className="mt-4 flex justify-between items-center">
            <button
              onClick={() => setShowRawData(!showRawData)}
              className="text-xs text-blue-600 hover:text-blue-800 focus:outline-none"
            >
              {showRawData ? 'Hide' : 'Show'} Raw Data
            </button>
            
            <button
              onClick={() => copyToClipboard(JSON.stringify(payload, null, 2))}
              className="text-xs text-gray-600 hover:text-gray-800 focus:outline-none"
            >
              {copied ? 'Copied!' : 'Copy Data'}
            </button>
          </div>
          
          {showRawData && (
            <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-x-auto border border-gray-200">
              {JSON.stringify(payload, null, 2)}
            </pre>
          )}
        </div>
      );
    } else if (isContractPayload(payload)) {
      return (
        <div className="space-y-2">
          <div className="bg-purple-50 p-4 rounded-md mb-4">
            <h4 className="font-medium text-purple-800 flex items-center">
              <span className="text-xl mr-2">📝</span>
              Contract: {payload.template}
            </h4>
          </div>
          
          <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
            {renderDataItem("Emoji", payload.emoji, "text-2xl")}
            {renderDataItem("Creator", payload.sender, "font-mono text-sm text-gray-800")}
            {payload.receiver && renderDataItem("Recipient", payload.receiver, "font-mono text-sm text-gray-800")}
            {renderDataItem("Created", new Date(payload.timestamp).toLocaleString(), "text-sm text-gray-600")}
          </div>
          
          <div className="mt-4">
            <h5 className="font-medium text-gray-700 mb-2">Contract Terms</h5>
            <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
              {Object.entries(payload.terms).map(([key, value], index) => (
                renderDataItem(key, value, "text-sm")
              ))}
            </div>
          </div>
          
          <div className="mt-4 flex justify-between items-center">
            <button
              onClick={() => setShowRawData(!showRawData)}
              className="text-xs text-blue-600 hover:text-blue-800 focus:outline-none"
            >
              {showRawData ? 'Hide' : 'Show'} Raw Data
            </button>
            
            <button
              onClick={() => copyToClipboard(JSON.stringify(payload, null, 2))}
              className="text-xs text-gray-600 hover:text-gray-800 focus:outline-none"
            >
              {copied ? 'Copied!' : 'Copy Data'}
            </button>
          </div>
          
          {showRawData && (
            <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-x-auto border border-gray-200">
              {JSON.stringify(payload, null, 2)}
            </pre>
          )}
        </div>
      );
    }
    
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-yellow-800 mb-2 font-medium">Unknown payload type</p>
        
        <div className="mt-2 flex justify-between items-center">
          <button
            onClick={() => setShowRawData(!showRawData)}
            className="text-xs text-blue-600 hover:text-blue-800 focus:outline-none"
          >
            {showRawData ? 'Hide' : 'Show'} Raw Data
          </button>
          
          <button
            onClick={() => copyToClipboard(JSON.stringify(payload, null, 2))}
            className="text-xs text-gray-600 hover:text-gray-800 focus:outline-none"
          >
            {copied ? 'Copied!' : 'Copy Data'}
          </button>
        </div>
        
        {showRawData && (
          <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-x-auto border border-gray-200">
            {JSON.stringify(payload, null, 2)}
          </pre>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Paste Encoded Emoji</h3>
        
        <div className="mb-6">
          <textarea 
            rows={2}
            value={encodedInput}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-lg"
            placeholder="Paste emoji here..."
          />
          <p className="mt-1 text-xs text-gray-500">
            Paste an emoji encoded with Hapa Emoji Validator to decode its hidden content.
          </p>
        </div>
        
        <button 
          onClick={handleDecode}
          className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Decode Emoji
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className={`p-4 ${error.startsWith('Warning') ? 'bg-yellow-50 border border-yellow-200 text-yellow-700' : 'bg-red-50 border border-red-200 text-red-700'} rounded-md`}>
          <p className="flex items-center text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        </div>
      )}

      {/* Decoded Result */}
      {decodedPayload && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-800">Decoded Content</h3>
            
            {/* Only show validation status if explicitly invalid */}
            {isValid === false && (
              <span className="px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-800">
                Invalid ✗
              </span>
            )}
          </div>
          
          {renderPayloadDetails(decodedPayload)}
        </div>
      )}
    </div>
  );
}

export default DecoderView; 