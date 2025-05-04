import React, { useState, useRef, useEffect } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  buttonContent?: React.ReactNode;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ 
  onEmojiSelect, 
  buttonContent = '😊' 
}) => {
  const [showPicker, setShowPicker] = useState<boolean>(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  const handleEmojiSelect = (emoji: any) => {
    onEmojiSelect(emoji.native);
    setShowPicker(false);
  };
  
  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current && 
        !pickerRef.current.contains(event.target as Node) &&
        buttonRef.current && 
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  return (
    <div className="relative inline-block">
      <button 
        ref={buttonRef}
        onClick={() => setShowPicker(!showPicker)}
        className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-colors"
        aria-label="Select emoji"
      >
        {typeof buttonContent === 'string' ? (
          <>
            <span className="text-lg">🙂</span>
            <span className="text-sm font-medium text-gray-700">{buttonContent}</span>
          </>
        ) : (
          buttonContent
        )}
      </button>
      
      {showPicker && (
        <div 
          ref={pickerRef}
          className="absolute z-10 mt-2 shadow-xl rounded-lg overflow-hidden"
          style={{ 
            left: '50%', 
            transform: 'translateX(-50%)',
            width: '320px' 
          }}
        >
          <div className="absolute inset-0 bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg" style={{ zIndex: -1 }}></div>
          <Picker 
            data={data}
            onEmojiSelect={handleEmojiSelect}
            theme="light"
            searchPosition="top"
            previewPosition="none"
            skinTonePosition="none"
            navPosition="top"
          />
        </div>
      )}
    </div>
  );
};

export default EmojiPicker; 