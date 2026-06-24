/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Category = string;

export interface PasswordEntry {
  id: string;
  title: string;
  username: string;
  password?: string; // Optional for pure secure notes
  url?: string;
  notes?: string;
  category: Category;
  strength?: 'weak' | 'medium' | 'strong' | 'excellent';
  updatedAt: string;
}

export interface SecurityStats {
  total: number;
  weakCount: number;
  reusedCount: number;
  secureNotesCount: number;
}
