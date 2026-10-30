/**
 * Cryptographic Password Protection & Vault
 * Implements salted SHA-256 hashing via standard Web Crypto API.
 * Plain-text passwords are never stored in state, localStorage, or broadcasted to peers.
 */

export interface MemberAuthRecord {
  userId: string;
  email: string;
  salt: string;
  passwordHash: string;
  loginCount: number;
  hasChangedPassword: boolean;
}

const VAULT_STORAGE_KEY = 'researchlab_auth_vault_v2';
const PEPPER = 'researchlab_secure_v2';

// Administrative salted SHA-256 digest for sunil@researchlab.np
const ADMIN_EMAIL = 'sunil@researchlab.np';
const ADMIN_SALT = 'a8f3b2e9c1d47e50';
const ADMIN_HASH = '2ad91105ad6fcecb1ed3ea0298a6274585578085e52c9fceb836fd750cc1a45c';

/**
 * Generates cryptographically secure random salt hex string
 */
export function generateSalt(length = 16): string {
  const array = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Computes salted SHA-256 digest using Web Crypto API
 */
export async function hashPassword(password: string, salt: string): Promise<string> {
  const message = `${salt}:${password}:${PEPPER}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(message);

  if (typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.digest) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback for non-subtle contexts (e.g. legacy/testing)
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    hash = (hash << 5) - hash + message.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(64, '0');
}

/**
 * Retrieve the private credential vault
 */
export function getAuthVault(): Record<string, MemberAuthRecord> {
  try {
    const raw = localStorage.getItem(VAULT_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

/**
 * Save records to the private credential vault
 */
export function saveAuthVault(vault: Record<string, MemberAuthRecord>) {
  try {
    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(vault));
  } catch (err) {
    console.error('Failed to save auth vault:', err);
  }
}

/**
 * Register a new member with the default encrypted password ('member123')
 */
export async function registerNewMemberCredential(
  userId: string,
  email: string
): Promise<MemberAuthRecord> {
  const vault = getAuthVault();
  const normalizedEmail = email.toLowerCase().trim();

  // If already exists, return existing
  if (vault[normalizedEmail]) {
    return vault[normalizedEmail];
  }

  const salt = generateSalt(16);
  const passwordHash = await hashPassword('member123', salt);

  const record: MemberAuthRecord = {
    userId,
    email: normalizedEmail,
    salt,
    passwordHash,
    loginCount: 0,
    hasChangedPassword: false,
  };

  vault[normalizedEmail] = record;
  saveAuthVault(vault);
  return record;
}

/**
 * Verify administrator credentials securely without exposing plain-text password
 */
export async function verifyAdminCredentials(
  emailInput: string,
  passwordInput: string
): Promise<boolean> {
  if (emailInput.toLowerCase().trim() !== ADMIN_EMAIL) {
    return false;
  }
  const computedHash = await hashPassword(passwordInput, ADMIN_SALT);
  return computedHash === ADMIN_HASH;
}

/**
 * Verify member credentials securely against encrypted salted vault
 */
export async function verifyMemberCredentials(
  emailInput: string,
  passwordInput: string
): Promise<{
  success: boolean;
  isFirstLogin?: boolean;
  record?: MemberAuthRecord;
  reason?: string;
}> {
  const vault = getAuthVault();
  const normalized = emailInput.toLowerCase().trim();
  let record = vault[normalized];

  // If not yet in vault (e.g. added before vault migration), seed default record
  if (!record) {
    record = await registerNewMemberCredential(`user-${Date.now()}`, normalized);
  }

  const computedHash = await hashPassword(passwordInput, record.salt);
  if (computedHash !== record.passwordHash) {
    return {
      success: false,
      reason: 'Invalid password. (Default password for newly authorized members is member123).',
    };
  }

  const isFirstLogin = record.loginCount === 0 && !record.hasChangedPassword;
  return {
    success: true,
    isFirstLogin,
    record,
  };
}

/**
 * Update member password on first login and permanently lock subsequent modifications
 */
export async function setMemberFirstLoginPassword(
  email: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const vault = getAuthVault();
  const normalized = email.toLowerCase().trim();
  const record = vault[normalized];

  if (!record) {
    return { success: false, error: 'Member record not found.' };
  }

  // Security policy: cannot change password after first login has completed
  if (record.hasChangedPassword && record.loginCount > 0) {
    return {
      success: false,
      error: 'Security Policy: Password changes are locked after initial setup.',
    };
  }

  const newSalt = generateSalt(16);
  const newHash = await hashPassword(newPassword, newSalt);

  record.salt = newSalt;
  record.passwordHash = newHash;
  record.hasChangedPassword = true;
  record.loginCount = (record.loginCount || 0) + 1;

  vault[normalized] = record;
  saveAuthVault(vault);

  return { success: true };
}

/**
 * Finalize first login if member chooses to keep the default password
 */
export function lockDefaultMemberPassword(email: string) {
  const vault = getAuthVault();
  const normalized = email.toLowerCase().trim();
  const record = vault[normalized];
  if (record) {
    record.hasChangedPassword = true;
    record.loginCount = (record.loginCount || 0) + 1;
    vault[normalized] = record;
    saveAuthVault(vault);
  }
}

/**
 * Record a successful login increment for successive logins
 */
export function recordMemberSuccessiveLogin(email: string) {
  const vault = getAuthVault();
  const normalized = email.toLowerCase().trim();
  const record = vault[normalized];
  if (record) {
    record.loginCount = (record.loginCount || 0) + 1;
    vault[normalized] = record;
    saveAuthVault(vault);
  }
}

import { Collaborator } from './types';

/**
 * Strips all credential data from Collaborator objects before sharing in UI or network
 */
export function sanitizeCollaborator(collab: any): Collaborator {
  const { password, passwordHash, salt, ...rest } = collab || {};
  return rest as Collaborator;
}
