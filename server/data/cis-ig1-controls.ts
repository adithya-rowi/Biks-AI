/**
 * CIS Controls v8 IG1 Safeguard Definitions
 *
 * Source: CIS Controls v8.1.2
 * Total: 56 safeguards
 * Each safeguard has 3-7 criteria derived from evidence_examples
 */

import cisControlsRaw from './cis-ig1-controls.json';

interface RawSafeguard {
  safeguard_id: string;
  control_id: number;
  title: string;
  description: string;
  asset_class: string;
  security_function: string;
  ig1: boolean;
  ig2: boolean;
  ig3: boolean;
  evidence_type: string;
  evidence_required: string;
  evidence_examples: string[];
  practical_tip: string;
  for_beginners: string;
}

export interface Criterion {
  id: string;      // e.g., "1.1.a", "1.1.b"
  text: string;    // The evidence example text
}

export interface Safeguard {
  cisId: string;              // e.g., "1.1"
  title: string;
  description: string;
  assetClass: string;         // Devices, Software, Data, Users, Documentation, Network
  securityFunction: string;   // Identify, Protect, Detect, Respond, Recover, Govern
  criteria: Criterion[];
}

// Convert letter index to letter (0 -> 'a', 1 -> 'b', etc.)
function indexToLetter(index: number): string {
  return String.fromCharCode(97 + index); // 97 is 'a'
}

// Transform raw JSON into structured safeguards
function transformSafeguards(raw: RawSafeguard[]): Safeguard[] {
  return raw.map((item) => ({
    cisId: item.safeguard_id,
    title: item.title.trim(),
    description: item.description,
    assetClass: item.asset_class,
    securityFunction: item.security_function,
    criteria: item.evidence_examples.map((example, index) => ({
      id: `${item.safeguard_id}.${indexToLetter(index)}`,
      text: example,
    })),
  }));
}

// Pre-compute the safeguards array
const safeguards: Safeguard[] = transformSafeguards(cisControlsRaw as RawSafeguard[]);

// Pre-compute lookup map for O(1) access by cisId
const safeguardMap: Map<string, Safeguard> = new Map(
  safeguards.map((s) => [s.cisId, s])
);

/**
 * Get all 56 CIS IG1 safeguards
 */
export function getAllSafeguards(): Safeguard[] {
  return safeguards;
}

/**
 * Get a specific safeguard by its CIS ID (e.g., "1.1", "5.4")
 * Returns undefined if not found
 */
export function getSafeguardById(cisId: string): Safeguard | undefined {
  return safeguardMap.get(cisId);
}

/**
 * Get safeguards by asset class
 */
export function getSafeguardsByAssetClass(assetClass: string): Safeguard[] {
  return safeguards.filter((s) => s.assetClass === assetClass);
}

/**
 * Get safeguards by security function
 */
export function getSafeguardsBySecurityFunction(securityFunction: string): Safeguard[] {
  return safeguards.filter((s) => s.securityFunction === securityFunction);
}

/**
 * Get total count of safeguards (should be 56 for IG1)
 */
export function getSafeguardCount(): number {
  return safeguards.length;
}

/**
 * Get total count of all criteria across all safeguards
 */
export function getTotalCriteriaCount(): number {
  return safeguards.reduce((sum, s) => sum + s.criteria.length, 0);
}
