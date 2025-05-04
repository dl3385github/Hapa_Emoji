import { EmojiPayload, isTokenPayload, isContractPayload } from '../types/EmojiPayload';
import { isValidHapaDID } from '../types/HapaDID';

/**
 * Validates the structural integrity and basic constraints of an EmojiPayload.
 * This is a preliminary validation step. Deeper validation (e.g., balance checks)
 * would happen in a Gatekeeper or integrated Hapa system.
 * 
 * @param payload The decoded payload to validate.
 * @returns True if the payload is structurally valid, false otherwise.
 */
export function validatePayloadStructure(payload: any): payload is EmojiPayload {
  if (!payload || typeof payload !== 'object') {
    console.error('Invalid payload: not an object.');
    return false;
  }

  if (isTokenPayload(payload)) {
    // Validate Token specific fields
    if (payload.amount <= 0) {
      console.error('Invalid token payload: amount must be positive.');
      return false;
    }
    if (!isValidHapaDID(payload.sender)) {
      console.error('Invalid token payload: invalid sender DID format.');
      return false;
    }
    if (!isValidHapaDID(payload.receiver)) {
      console.error('Invalid token payload: invalid receiver DID format.');
      return false;
    }
    // Add more token-specific checks if needed (e.g., timestamp range)
    return true;
  } else if (isContractPayload(payload)) {
    // Validate Contract specific fields
    if (!isValidHapaDID(payload.sender)) {
      console.error('Invalid contract payload: invalid sender DID format.');
      return false;
    }
    if (payload.receiver && !isValidHapaDID(payload.receiver)) { // Receiver is optional sometimes
      console.error('Invalid contract payload: invalid receiver DID format.');
      return false;
    }
    if (!payload.template || typeof payload.template !== 'string' || payload.template.length === 0) {
      console.error('Invalid contract payload: template name is missing or invalid.');
      return false;
    }
     if (typeof payload.terms !== 'object' || payload.terms === null) {
      console.error('Invalid contract payload: terms must be an object.');
      return false;
    }
    // Add more contract-specific checks if needed
    return true;
  }

  console.error('Invalid payload: unknown payload type.');
  return false;
} 