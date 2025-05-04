import { HapaDID } from './HapaDID';

export interface ConsulTemplate {
  type: 'template';
  emoji: string;        // Base emoji for this template
  name: string;         // Unique name for the template (e.g., job_contract_v1)
  fields: string[];     // Required field names for the contract terms
  creator: HapaDID;     // Consul's DID
  description: string;  // Template description
  version: number;      // Version number
  created: number;      // Unix timestamp (milliseconds) when created
} 