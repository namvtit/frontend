// ── PISI State Storage ──
// Versioned localStorage persistence for PISI engine state.
// Spec Section 15.1 — uses localStorage (not sessionStorage).
// Key: 'pisi_state_v1'

import type { PresetCode } from './types/pisi';
import { PresetCode as PC } from './types/pisi';

// ═══════════════════════════════════════════════════════════════
// State shape
// ═══════════════════════════════════════════════════════════════

export interface PisiLocalState {
  version: 1;
  selectedPresetCode: PresetCode;
  customOverrides: Record<string, number>;
  profileLocked: boolean;
}

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

const STORAGE_KEY = 'pisi_state_v1';
const CURRENT_VERSION = 1 as const;

// ═══════════════════════════════════════════════════════════════
// Default state
// ═══════════════════════════════════════════════════════════════

/** Default PISI state: STAND preset, no overrides, unlocked */
export function getDefaultPisiState(): PisiLocalState {
  return {
    version: CURRENT_VERSION,
    selectedPresetCode: PC.STAND, // code 2
    customOverrides: {},
    profileLocked: false,
  };
}

// ═══════════════════════════════════════════════════════════════
// Validation
// ═══════════════════════════════════════════════════════════════

const VALID_PRESET_CODES = new Set<number>([
  PC.ECO, PC.STAND, PC.SPEED, PC.WAVE, PC.GUARD,
]);

function isValidState(data: unknown): data is PisiLocalState {
  if (data === null || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  if (obj.version !== CURRENT_VERSION) return false;
  if (typeof obj.selectedPresetCode !== 'number') return false;
  if (!VALID_PRESET_CODES.has(obj.selectedPresetCode)) return false;
  if (typeof obj.customOverrides !== 'object' || obj.customOverrides === null) return false;
  if (typeof obj.profileLocked !== 'boolean') return false;

  // Verify all override values are numbers
  const overrides = obj.customOverrides as Record<string, unknown>;
  for (const val of Object.values(overrides)) {
    if (typeof val !== 'number' || isNaN(val)) return false;
  }

  return true;
}

// ═══════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════

/** Load PISI state from localStorage. Returns default if missing or invalid. */
export function loadPisiState(): PisiLocalState {
  if (typeof window === 'undefined') return getDefaultPisiState();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultPisiState();

    const parsed: unknown = JSON.parse(raw);
    if (isValidState(parsed)) return parsed;

    // Invalid shape → return defaults
    return getDefaultPisiState();
  } catch {
    return getDefaultPisiState();
  }
}

/** Save PISI state to localStorage. */
export function savePisiState(state: PisiLocalState): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota exceeded or other storage error — silently ignore
  }
}

/** Clear PISI state from localStorage. */
export function clearPisiState(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silently ignore
  }
}
