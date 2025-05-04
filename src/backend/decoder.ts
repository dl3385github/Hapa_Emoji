import { EmojiPayload, isTokenPayload, isContractPayload } from '../types/EmojiPayload';

/**
 * Improved deserialization function to handle both standard and compact formats
 */
function deserializePayload(bytes: Uint8Array): EmojiPayload {
  try {
    const decoder = new TextDecoder();
    const jsonString = decoder.decode(bytes);
    console.log("Decoded JSON string:", jsonString);
    
    // Parse the JSON string to get the raw payload
    const rawPayload = JSON.parse(jsonString);
    
    // Check if it's a compact format
    if (rawPayload.t && (rawPayload.t === 'token' || rawPayload.t === 'contract')) {
      console.log("Detected compact payload format");
      // Convert from compact format to standard format
      if (rawPayload.t === 'token') {
        return {
          type: 'token',
          emoji: rawPayload.e,
          amount: rawPayload.a,
          sender: rawPayload.s,
          receiver: rawPayload.r,
          timestamp: rawPayload.ts,
          message: rawPayload.m
        };
      } else { // contract
        return {
          type: 'contract',
          emoji: rawPayload.e,
          template: rawPayload.tp,
          sender: rawPayload.s,
          receiver: rawPayload.r,
          timestamp: rawPayload.ts,
          terms: rawPayload.tr || {}
        };
      }
    }
    
    return rawPayload;
  } catch (error) {
    console.error("Failed to deserialize payload:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to deserialize payload: ${error.message}`);
    }
    throw new Error("Failed to deserialize payload: Invalid format or data.");
  }
}

/**
 * Decodes an emoji string with embedded Variation Selectors back into a payload.
 * Based on the technique described at https://paulbutler.org/2025/smuggling-arbitrary-data-through-an-emoji/
 * 
 * @param encodedEmoji The emoji string with embedded VS data.
 * @returns The decoded data payload (TokenPayload or ContractPayload).
 * @throws Error if the input is invalid or decoding fails.
 */
export function decodeEmoji(encodedEmoji: string): EmojiPayload {
  if (!encodedEmoji || encodedEmoji.length < 2) {
    throw new Error('Invalid encoded emoji string: too short.');
  }

  try {
    // More robust grapheme splitting might be needed for complex emojis
    const baseEmoji = encodedEmoji[0]; 
    const vsData = encodedEmoji.slice(1);
    
    console.log(`Decoding emoji: ${baseEmoji} (with ${vsData.length} characters of additional data)`);
    
    const bytes: number[] = [];
    
    for (let i = 0; i < vsData.length; i++) {
      const codePoint = vsData.codePointAt(i);
      
      if (codePoint === undefined) {
        console.error('Invalid codepoint at position', i);
        continue;
      }
      
      console.log(`Char at ${i}: ${vsData[i]}, codepoint: U+${codePoint.toString(16)}`);
      
      // VS1-VS16 Range
      if (codePoint >= 0xFE00 && codePoint <= 0xFE0F) {
        bytes.push(codePoint - 0xFE00);
      } 
      // VS17-VS256 Range
      else if (codePoint >= 0xE0100 && codePoint <= 0xE01EF) {
        bytes.push((codePoint - 0xE0100) + 16);
      } 
      // Ignore other characters/codepoints silently
      else {
        console.log(`Skipping non-VS codepoint: U+${codePoint.toString(16)}`);
      }
      
      // Handle surrogate pairs correctly: if codepoint > 0xFFFF, it used two UTF-16 code units
      if (codePoint > 0xFFFF) {
        i++; // Increment index to skip the second part of the surrogate pair
      }
    }
    
    if (bytes.length === 0) {
      throw new Error("No valid variation selector data found in the emoji string.");
    }

    console.log(`Found ${bytes.length} bytes of encoded data`);
    
    const rawPayload = deserializePayload(new Uint8Array(bytes));
    
    // Validate the structure of the deserialized payload
    if (isTokenPayload(rawPayload) || isContractPayload(rawPayload)) {
      console.log("Successfully decoded payload:", rawPayload.type);
      return rawPayload;
    } else {
      console.error("Invalid payload structure:", rawPayload);
      throw new Error("Decoded payload does not match expected structure.");
    }
  } catch (error) {
    console.error("Error during emoji decoding:", error);
    if (error instanceof Error) {
      throw error; // Re-throw if it's already an Error object
    }
    throw new Error("Failed to decode emoji data.");
  }
} 