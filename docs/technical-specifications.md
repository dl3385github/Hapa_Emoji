### **Hapa Emoji Validator Technical Specifications**  
**Compatible with Hapa Ecosystem v1.2+**  

---

### **Technology Stack**

#### **Frontend**
- **Framework**: React 18+
- **Build Tool**: Vite
- **UI Components**: Custom components with potential for Material UI integration
- **State Management**: React Context API for local state, potential for Zustand/Redux
- **Styling**: CSS Modules or Styled Components

#### **Backend**
- **Runtime**: Node.js 16+
- **Framework**: Express.js for API endpoints
- **Dependencies**: Hapa Core SDK v2.1+, Hypercore Protocol v10.3+

---

### **Encoding Logic**

The core functionality of the Emoji Validator revolves around the encoding and decoding of data using Unicode Variation Selectors (VS).

#### **Encoding Function (TypeScript)**

```typescript
// src/backend/encoder.ts
function encodeEmoji(baseEmoji: string, payload: Uint8Array): string {  
  let result = baseEmoji;  
  for (const byte of payload) {  
    const vs = byte < 16 ? 0xFE00 + byte : 0xE0100 + (byte - 16);  
    result += String.fromCodePoint(vs);  
  }  
  return result;  
}  

// Example usage
const payload = {
  type: 'token',
  emoji: '🍌',
  amount: 500,
  sender: 'did:hapa:123',
  receiver: 'did:hapa:456',
  timestamp: Date.now()
};

// Convert payload to bytes
const bytes = encodePayload(payload);
const encodedEmoji = encodeEmoji('🍌', bytes); // Returns "🍌󠄀󠄁..."
```

#### **Decoding Function (TypeScript)**

```typescript
// src/backend/decoder.ts
function decodeEmoji(encodedEmoji: string): Uint8Array {
  const baseEmoji = encodedEmoji.charAt(0); // First character is the base emoji
  const vsData = encodedEmoji.slice(1); // Rest are variation selectors
  
  const bytes: number[] = [];
  for (let i = 0; i < vsData.length; i++) {
    const codePoint = vsData.codePointAt(i) || 0;
    
    // Handle different VS ranges
    if (codePoint >= 0xFE00 && codePoint <= 0xFE0F) {
      bytes.push(codePoint - 0xFE00);
    } else if (codePoint >= 0xE0100 && codePoint <= 0xE01EF) {
      bytes.push((codePoint - 0xE0100) + 16);
    }
    
    // Skip surrogate pairs
    if (codePoint > 0xFFFF) {
      i++;
    }
  }
  
  return new Uint8Array(bytes);
}

// Example usage
const encodedEmoji = "🍌󠄀󠄁..."; // VS-laden emoji
const bytes = decodeEmoji(encodedEmoji);
const payload = decodePayload(bytes); // Convert bytes back to structured data
```

---

### **Data Structure**

#### **Token Payload**

```typescript
// src/types/EmojiPayload.ts
interface TokenPayload {
  type: 'token';
  emoji: string;        // Base emoji used
  amount: number;       // Token amount
  sender: string;       // Sender's DID
  receiver: string;     // Receiver's DID
  timestamp: number;    // Unix timestamp
  message?: string;     // Optional message
}
```

#### **Contract Payload**

```typescript
// src/types/EmojiPayload.ts
interface ContractPayload {
  type: 'contract';
  emoji: string;        // Base emoji used
  template: string;     // Template ID
  sender: string;       // Creator's DID
  receiver: string;     // Recipient's DID
  timestamp: number;    // Unix timestamp
  terms: Record<string, any>; // Contract terms
}

// Union type for all payload types
type EmojiPayload = TokenPayload | ContractPayload;
```

#### **Consul Template**

```typescript
// src/types/ConsulTemplate.ts
interface ConsulTemplate {
  type: 'template';
  emoji: string;        // Base emoji for this template
  fields: string[];     // Required fields
  creator: string;      // Consul's DID
  description: string;  // Template description
  version: number;      // Version number
}
```

---

### **File Structure**

```
emoji-validator/  
├── docs/  
│   └── SPEC.md                  // Encoding standard & Consul governance rules  
├── src/  
│   ├── backend/                 // TypeScript services  
│   │   ├── encoder.ts           // Encoding functions
│   │   ├── decoder.ts           // Decoding functions
│   │   ├── validator.ts         // Payload validation
│   │   └── consul.ts            // Consul template management
│   │
│   ├── frontend/                // React components  
│   │   ├── App.tsx              // Main application component
│   │   ├── components/          // Reusable UI components
│   │   │   ├── EmojiPicker.tsx  // Emoji selection component
│   │   │   ├── EncoderForm.tsx  // Form for encoding
│   │   │   └── DecoderView.tsx  // UI for decoding results
│   │   │
│   │   ├── hooks/               // Custom React hooks
│   │   │   ├── useEncoder.ts    // Hook for encoding logic
│   │   │   └── useDecoder.ts    // Hook for decoding logic
│   │   │
│   │   └── styles/              // CSS modules or styled components
│   │
│   └── types/                   // TypeScript type definitions
│       ├── EmojiPayload.ts      // Payload type definitions
│       ├── ConsulTemplate.ts    // Template type definitions
│       └── HapaDID.ts           // DID type definitions
│
├── public/                      // Static assets
│
├── tests/                       // Jest unit tests
│   ├── encoder.test.ts
│   ├── decoder.test.ts
│   └── validator.test.ts
│
├── package.json                 // Dependencies and scripts
├── tsconfig.json                // TypeScript configuration
├── vite.config.ts               // Vite configuration
└── hapa-module.json             // Module metadata
```

---

### **API Endpoints**

The application will primarily function as a standalone app, but could expose these API endpoints for integration with the Hapa ecosystem:

#### **Encode API**

```
POST /api/encode
Content-Type: application/json

{
  "baseEmoji": "🍌",
  "payload": {
    "type": "token",
    "amount": 500,
    "receiver": "did:hapa:456"
  }
}

Response:
{
  "success": true,
  "encodedEmoji": "🍌󠄀󠄁...",
  "payloadSize": 42
}
```

#### **Decode API**

```
POST /api/decode
Content-Type: application/json

{
  "encodedEmoji": "🍌󠄀󠄁..."
}

Response:
{
  "success": true,
  "payload": {
    "type": "token",
    "emoji": "🍌",
    "amount": 500,
    "sender": "did:hapa:123",
    "receiver": "did:hapa:456",
    "timestamp": 1647869431000
  },
  "isValid": true
}
```

---

### **Dependencies**

#### **Core Dependencies**
- Hapa Core SDK v2.1+
- Hypercore Protocol v10.3+
- React v18+
- Node.js v16+

#### **Development Dependencies**
- TypeScript v4.5+
- Vite v2.8+
- Jest v27+
- ESLint v8+
- Prettier v2.5+

---

### **Performance Considerations**

- **Encoding/Decoding Latency**: Target < 100ms on consumer hardware
- **Maximum Payload Size**: 64 bytes (16 VS) per emoji
- **Browser Compatibility**: Ensure VS rendering works across browsers
- **Mobile Performance**: Optimize for mobile devices with limited CPU
- **Bundle Size**: Keep bundle size under 200KB for faster loading 