// Placeholder for Hapa DID type definition
// In a real implementation, this might involve specific validation or structure
export type HapaDID = string; // Simple string type for now

export function isValidHapaDID(did: string): boolean {
  // Basic validation example - checks prefix and minimum length
  return typeof did === 'string' && did.startsWith('did:hapa:') && did.length > 10;
} 