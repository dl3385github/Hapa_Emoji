export interface TokenPayload {
      type: 'token';
      emoji: string;        // Base emoji used
      amount: number;       // Token amount
      sender: string;       // Sender's DID (e.g., did:hapa:...)
      receiver: string;     // Receiver's DID (e.g., did:hapa:...)
      timestamp: number;    // Unix timestamp (milliseconds)
      message?: string;     // Optional message
    }
    
    export interface ContractPayload {
      type: 'contract';
      emoji: string;        // Base emoji used
      template: string;     // Template ID or name
      sender: string;       // Creator's DID
      receiver: string;     // Recipient's DID (optional for some contracts)
      timestamp: number;    // Unix timestamp (milliseconds)
      terms: Record<string, any>; // Contract-specific terms
    }
    
    // Union type for all supported payload types
    export type EmojiPayload = TokenPayload | ContractPayload; // Add other types here if needed
    
    // Type guard to check if an object is a TokenPayload
    export function isTokenPayload(payload: any): payload is TokenPayload {
      return payload && payload.type === 'token' &&
             typeof payload.emoji === 'string' &&
             typeof payload.amount === 'number' &&
             typeof payload.sender === 'string' &&
             typeof payload.receiver === 'string' &&
             typeof payload.timestamp === 'number';
    }
    
    // Type guard to check if an object is a ContractPayload
    export function isContractPayload(payload: any): payload is ContractPayload {
      return payload && payload.type === 'contract' &&
             typeof payload.emoji === 'string' &&
             typeof payload.template === 'string' &&
             typeof payload.sender === 'string' &&
             typeof payload.timestamp === 'number' &&
             typeof payload.terms === 'object';
    } 