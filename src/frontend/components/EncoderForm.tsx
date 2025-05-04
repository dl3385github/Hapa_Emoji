import React, { useState, useCallback, useEffect } from 'react';
import { encodeEmoji } from '../../backend/encoder';
import EmojiPicker from './EmojiPicker';
import { TokenPayload, ContractPayload, EmojiPayload } from '../../types/EmojiPayload';

// Mock function - replace with actual DID from Hapa auth context if available
const getCurrentUserDID = (): string => "did:hapa:currentUser123";

// Predefined operation types
const OPERATIONS = [
  { value: "send", label: "Send Token" },
  { value: "transfer", label: "Transfer" },
  { value: "contract", label: "Contract" }
];

// Predefined DIDs for easy selection
const SAMPLE_DIDS = [
  { id: "did:hapa:alex123", name: "Alex (did:hapa:alex123)" },
  { id: "did:hapa:bob456", name: "Bob (did:hapa:bob456)" },
  { id: "did:hapa:charlie789", name: "Charlie (did:hapa:charlie789)" }
];

interface FormField {
  key: string;
  value: string;
}

function EncoderForm() {
  const [selectedEmoji, setSelectedEmoji] = useState<string>('🍌');
  const [operation, setOperation] = useState<string>('send');
  const [amount, setAmount] = useState<string>('100');
  const [recipient, setRecipient] = useState<string>(SAMPLE_DIDS[0].id);
  const [message, setMessage] = useState<string>('');
  const [customFields, setCustomFields] = useState<FormField[]>([]);
  const [newFieldKey, setNewFieldKey] = useState<string>('');
  const [newFieldValue, setNewFieldValue] = useState<string>('');
  
  const [encodedResult, setEncodedResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isEncoding, setIsEncoding] = useState<boolean>(false);

  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    setSelectedEmoji(emoji);
    console.log(`Selected emoji: ${emoji}`);
  };

  // Add custom field
  const handleAddCustomField = () => {
    if (!newFieldKey.trim()) {
      setError('Please enter a field name');
      return;
    }
    
    setCustomFields([...customFields, { key: newFieldKey, value: newFieldValue }]);
    setNewFieldKey('');
    setNewFieldValue('');
  };

  // Remove custom field
  const handleRemoveField = (index: number) => {
    const updatedFields = [...customFields];
    updatedFields.splice(index, 1);
    setCustomFields(updatedFields);
  };

  // Create a minimal payload with the actual emoji to ensure it's preserved
  const createMinimalPayload = (): EmojiPayload => {
    // Parse amount as number, default to 0 if invalid
    const parsedAmount = parseInt(amount) || 0;
    
    // Log the emoji for debugging
    console.log(`Emoji used in payload: ${selectedEmoji}`);
    
    // Create a simple base payload with minimal data
    if (operation === 'contract') {
      const payload: ContractPayload = {
        type: 'contract',
        emoji: selectedEmoji, // Use full emoji
        template: 'generic',
        sender: getCurrentUserDID().split(':').pop() || 'currentUser', // Use short sender ID
        receiver: recipient.split(':').pop() || 'recipient', // Use short receiver ID
        timestamp: Date.now(),
        terms: {
          amount: parsedAmount
        }
      };
      
      // Add message if provided
      if (message) {
        payload.terms.message = message;
      }
      
      // Add at most 3 custom fields to reduce payload size
      const limitedCustomFields = customFields.slice(0, 3);
      limitedCustomFields.forEach(field => {
        payload.terms[field.key] = field.value;
      });
      
      return payload;
    } else {
      const payload: TokenPayload = {
        type: 'token',
        emoji: selectedEmoji, // Use full emoji
        amount: parsedAmount,
        sender: getCurrentUserDID().split(':').pop() || 'currentUser', // Use short sender ID
        receiver: recipient.split(':').pop() || 'recipient', // Use short receiver ID
        timestamp: Date.now()
      };
      
      // Add message if provided
      if (message) {
        payload.message = message;
      }
      
      return payload;
    }
  };

  // Handle encode button click with better error handling
  const handleEncode = useCallback(async () => {
    setError(null);
    setEncodedResult(null);
    setCopied(false);
    setIsEncoding(true);

    try {
      console.log('Creating minimal payload...');
      const payload = createMinimalPayload();
      console.log('Payload created:', payload);
      
      console.log('Encoding emoji...');
      const result = encodeEmoji(selectedEmoji, payload);
      console.log('Encoding successful, result:', result);
      
      // Verify that the result starts with the selected emoji
      if (!result.startsWith(selectedEmoji.charAt(0))) {
        console.warn('Warning: Encoded result does not start with selected emoji');
      }
      
      setEncodedResult(result);
    } catch (err: any) {
      console.error("Encoding failed:", err);
      setError(err.message || 'Failed to encode emoji.');
    } finally {
      setIsEncoding(false);
    }
  }, [selectedEmoji, operation, amount, recipient, message, customFields]);

  // Handle copy to clipboard
  const handleCopyToClipboard = () => {
    if (encodedResult) {
      navigator.clipboard.writeText(encodedResult)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(err => {
          console.error('Failed to copy:', err);
          setError('Failed to copy to clipboard.');
        });
    }
  };

  // Reset form when operation changes
  useEffect(() => {
    setCustomFields([]);
  }, [operation]);

  return (
    <div className="space-y-6">
      {/* Top Section with Emoji Picker */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-white rounded-full shadow-sm flex items-center justify-center" style={{ minWidth: '60px', minHeight: '60px' }}>
            <span className="text-4xl font-emoji">{selectedEmoji}</span>
          </div>
          <EmojiPicker 
            onEmojiSelect={handleEmojiSelect} 
            buttonContent="Choose Emoji" 
          />
        </div>
        <div className="text-sm text-gray-500">
          Encode data into an emoji that preserves through copy & paste
        </div>
      </div>

      {/* Form Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Encoding Details</h3>
        
        {/* Operation Type */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Operation</label>
          <select
            value={operation}
            onChange={(e) => setOperation(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {OPERATIONS.map(op => (
              <option key={op.value} value={op.value}>{op.label}</option>
            ))}
          </select>
        </div>
        
        {/* Amount Field */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter amount"
          />
        </div>
        
        {/* Recipient Field */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Recipient</label>
          <select
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {SAMPLE_DIDS.map(did => (
              <option key={did.id} value={did.id}>{did.name}</option>
            ))}
          </select>
        </div>
        
        {/* Message Field */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Add a message (optional)"
            rows={2}
          />
        </div>
        
        {/* Custom Fields Section */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-gray-700">Custom Fields (max 3)</h4>
            <span className="text-xs text-gray-500">
              Add additional information to your emoji
            </span>
          </div>
          
          {/* Display existing custom fields */}
          {customFields.length > 0 && (
            <div className="mb-4 space-y-2">
              {customFields.map((field, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md">
                  <div className="flex-1 overflow-hidden">
                    <span className="font-medium text-sm text-gray-700">{field.key}:</span>
                    <span className="ml-2 text-sm text-gray-600">{field.value}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveField(index)}
                    className="text-red-500 hover:text-red-700 text-sm"
                    aria-label="Remove field"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* Add new custom field */}
          {customFields.length < 3 && (
            <div className="flex space-x-2">
              <input
                type="text"
                value={newFieldKey}
                onChange={(e) => setNewFieldKey(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Field name"
              />
              <input
                type="text"
                value={newFieldValue}
                onChange={(e) => setNewFieldValue(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Field value"
              />
              <button
                onClick={handleAddCustomField}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Encode Button */}
      <button
        onClick={handleEncode}
        disabled={isEncoding}
        className={`w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
          ${isEncoding ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'} 
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
      >
        {isEncoding ? 'Encoding...' : 'Encode Emoji'}
      </button>
      
      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
          <p className="flex items-center text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        </div>
      )}
      
      {/* Encoded Result */}
      {encodedResult && (
        <div className="p-6 bg-gradient-to-r from-green-50 to-teal-50 border border-green-100 rounded-lg">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Encoded Result</h3>
          <div className="emoji-result">
            {encodedResult}
          </div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={handleCopyToClipboard}
              className={`px-4 py-2 rounded-md text-sm font-medium ${copied ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}`}
            >
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            This emoji contains hidden data that can be decoded in the Decode tab.
          </p>
        </div>
      )}
    </div>
  );
}

export default EncoderForm; 