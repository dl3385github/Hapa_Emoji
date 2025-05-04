import { EmojiPayload } from '../types/EmojiPayload';

const MAX_PAYLOAD_BYTES = 256; // Increased limit for more flexibility

/**
 * Improved serialization function that handles circular references and logs errors properly
 */
function serializePayload(payload: EmojiPayload): Uint8Array {
  try {
    // Create a safe copy of the payload without circular references
    const payloadCopy = { ...payload };
    
    // Convert emoji to a string representation if it's not already
    if (typeof payloadCopy.emoji === 'object') {
      payloadCopy.emoji = String(payloadCopy.emoji);
    }
    
    // For debugging - log the payload before serialization
    console.log('Payload to serialize:', payloadCopy);
    
    // Use the replacer function to handle any potential circular references
    const jsonString = JSON.stringify(payloadCopy, (key, value) => {
      // Avoid circular references
      if (typeof value === 'object' && value !== null) {
        if (key === '' || key === 'terms') {
          return value; // Keep main object and terms object
        }
        
        // For other objects, use string representation if too complex
        if (Object.keys(value).length > 5) {
          return JSON.stringify(value);
        }
      }
      return value;
    });
    
    // Log the serialized string for debugging
    console.log('Serialized JSON (length):', jsonString.length);
    
    // If string is too long, try a more compact representation
    if (jsonString.length > MAX_PAYLOAD_BYTES) {
      console.warn(`JSON string length (${jsonString.length}) exceeds limit, using compact representation`);
      
      // Create a more compact representation
      const compactPayload = {
        t: payload.type,
        e: String(payload.emoji),
        s: payload.sender,
        r: payload.receiver,
        ts: payload.timestamp
      };
      
      // Add type-specific fields
      if (payload.type === 'token') {
        // @ts-ignore
        compactPayload.a = payload.amount;
        // @ts-ignore
        if (payload.message) compactPayload.m = payload.message;
      } else if (payload.type === 'contract') {
        // @ts-ignore
        compactPayload.tp = payload.template;
        // @ts-ignore
        if (payload.terms) compactPayload.tr = payload.terms;
      }
      
      const compactJson = JSON.stringify(compactPayload);
      console.log('Compact JSON (length):', compactJson.length);
      
      if (compactJson.length > MAX_PAYLOAD_BYTES) {
        throw new Error(`Payload exceeds maximum size of ${MAX_PAYLOAD_BYTES} bytes even after compaction.`);
      }
      
      // Encode the compact representation
      const encoder = new TextEncoder();
      return encoder.encode(compactJson);
    }
    
    // Encode the normal representation
    const encoder = new TextEncoder();
    return encoder.encode(jsonString);
  } catch (error) {
    console.error("Failed to serialize payload:", error);
    // Include more information in the error message
    if (error instanceof Error) {
      throw new Error(`Failed to serialize payload: ${error.message}`);
    }
    throw new Error("Failed to serialize payload due to unknown error.");
  }
}

/**
 * Encodes a payload into an emoji string with embedded Variation Selectors.
 * Based on the technique described at https://paulbutler.org/2025/smuggling-arbitrary-data-through-an-emoji/
 * 
 * @param baseEmoji The base emoji character (e.g., '🍌').
 * @param payload The data payload (TokenPayload or ContractPayload).
 * @returns The emoji string with embedded VS data.
 */
export function encodeEmoji(baseEmoji: string, payload: EmojiPayload): string {
  if (!baseEmoji || baseEmoji.trim() === '') {
    throw new Error('Base emoji cannot be empty.');
  }

  // Extract the first emoji character - handle multi-codepoint emojis more carefully
  let firstEmoji = '';
  
  // Simple approach: Check if the string starts with a surrogate pair or single emoji
  const trimmedEmoji = baseEmoji.trim();
  const codePoint = trimmedEmoji.codePointAt(0);
  
  if (codePoint !== undefined) {
    // If it's a surrogate pair (astral emoji), take two characters
    if (codePoint > 0xFFFF) {
      firstEmoji = trimmedEmoji.substring(0, 2);
    } else {
      firstEmoji = trimmedEmoji[0];
    }
  } else {
    // Fallback
    firstEmoji = trimmedEmoji[0] || '😊'; // Default emoji if all else fails
  }
  
  console.log(`Using emoji: ${firstEmoji}`);
  
  try {
    const payloadBytes = serializePayload(payload);
    
    // Log byte length for debugging
    console.log(`Payload byte length: ${payloadBytes.length} bytes`);
    
    if (payloadBytes.length > MAX_PAYLOAD_BYTES) {
      throw new Error(`Payload size (${payloadBytes.length} bytes) exceeds maximum of ${MAX_PAYLOAD_BYTES} bytes.`);
    }
    
    let result = firstEmoji;

    // Create variation selectors for each byte
    for (let i = 0; i < payloadBytes.length; i++) {
      const byte = payloadBytes[i];
      // VS1-VS16 for bytes 0-15
      // VS17-VS256 (U+E0100-U+E01EF) for bytes 16-255
      const vsCodePoint = byte < 16 ? 0xFE00 + byte : 0xE0100 + (byte - 16);
      
      try {
        result += String.fromCodePoint(vsCodePoint);
      } catch (error) {
        console.error(`Failed to add codepoint ${vsCodePoint.toString(16)} for byte ${byte}:`, error);
        throw new Error(`Failed to create variation selector for byte ${byte}.`);
      }
    }
    
    return result;
  } catch (error) {
    console.error("Error in encodeEmoji:", error);
    if (error instanceof Error) {
      throw error; // Re-throw if it's already an Error object
    }
    throw new Error("Failed to encode emoji with payload.");
  }
} 