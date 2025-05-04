import { TokenPayload, ContractPayload, EmojiPayload } from '../types/EmojiPayload';

interface ParsedForm {
  emoji: string;
  from?: string;
  to?: string[];
  operation?: string;
  amount?: number;
  message?: string;
  [key: string]: any;
}

/**
 * Parses a free-form text input in the format:
 * /emoji {from:xxx; to:xxx,xxx; operation: xxx; amount: xxx; message: xxx;}
 */
export function parseFormText(text: string): ParsedForm | null {
  if (!text || !text.trim()) {
    return null;
  }

  try {
    // Extract emoji - should be the first character or emoji after the "/" if present
    let emoji = '';
    let remaining = text.trim();

    // Handle "/emoji" format or just the emoji itself
    if (remaining.startsWith('/')) {
      const spaceIndex = remaining.indexOf(' ');
      if (spaceIndex !== -1) {
        emoji = remaining.substring(1, spaceIndex);
        remaining = remaining.substring(spaceIndex + 1).trim();
      } else {
        emoji = remaining.substring(1);
        remaining = '';
      }
    } else if (remaining.length > 0) {
      // First character should be the emoji
      emoji = remaining.charAt(0);
      remaining = remaining.substring(1).trim();
    }

    // Return early if no content to parse
    if (!remaining) {
      return emoji ? { emoji } : null;
    }

    // Extract data between curly braces if present
    const result: ParsedForm = { emoji };
    
    const openBraceIndex = remaining.indexOf('{');
    const closeBraceIndex = remaining.lastIndexOf('}');
    
    if (openBraceIndex !== -1 && closeBraceIndex !== -1 && openBraceIndex < closeBraceIndex) {
      const content = remaining.substring(openBraceIndex + 1, closeBraceIndex).trim();
      
      // Split by semicolons to get key-value pairs
      const pairs = content.split(';').filter(Boolean).map(pair => pair.trim());
      
      for (const pair of pairs) {
        const colonIndex = pair.indexOf(':');
        if (colonIndex !== -1) {
          const key = pair.substring(0, colonIndex).trim().toLowerCase();
          const value = pair.substring(colonIndex + 1).trim();
          
          if (key === 'to') {
            // Handle multiple recipients
            result.to = value.split(',').map(v => v.trim()).filter(Boolean);
          } else if (key === 'amount') {
            const parsedAmount = parseInt(value, 10);
            if (!isNaN(parsedAmount)) {
              result.amount = parsedAmount;
            }
          } else {
            result[key] = value;
          }
        }
      }
      
      // Handle any content after the closing brace as additional message
      if (closeBraceIndex < remaining.length - 1) {
        const additionalMessage = remaining.substring(closeBraceIndex + 1).trim();
        if (additionalMessage) {
          result.message = (result.message || '') + additionalMessage;
        }
      }
    } else {
      // If no curly braces, treat the whole remaining text as message
      result.message = remaining.trim();
    }
    
    return result;
  } catch (error) {
    console.error('Error parsing form text:', error);
    return null;
  }
}

/**
 * Converts parsed form data into an EmojiPayload
 */
export function convertToPayload(parsedForm: ParsedForm, defaultSender: string = 'did:hapa:default'): EmojiPayload {
  const now = Date.now();
  
  // Default to token type payload
  const operation = parsedForm.operation?.toLowerCase() || 'send';
  
  if (operation === 'contract') {
    // Handle contract type
    return {
      type: 'contract',
      emoji: parsedForm.emoji,
      template: parsedForm.message || 'generic',
      sender: parsedForm.from || defaultSender,
      receiver: (parsedForm.to && parsedForm.to.length > 0) ? parsedForm.to[0] : 'did:hapa:receiver',
      timestamp: now,
      terms: {
        amount: parsedForm.amount || 0,
        recipients: parsedForm.to || [],
        message: parsedForm.message || '',
        // Add other terms from the parsedForm
        ...Object.entries(parsedForm)
          .filter(([key]) => !['emoji', 'from', 'to', 'operation', 'amount', 'message'].includes(key))
          .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {})
      }
    };
  } else {
    // Default to token type
    return {
      type: 'token',
      emoji: parsedForm.emoji,
      amount: parsedForm.amount || 0,
      sender: parsedForm.from || defaultSender,
      receiver: (parsedForm.to && parsedForm.to.length > 0) ? parsedForm.to[0] : 'did:hapa:receiver',
      timestamp: now,
      message: parsedForm.message || undefined
    };
  }
} 