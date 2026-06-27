import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { PasswordEntry } from '../types';

interface VaultStatsProps {
  entries: PasswordEntry[];
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
}

export default function VaultStats({ entries, selectedFilter, onFilterChange }: VaultStatsProps) {
  // Compute real-time stats
  const total = entries.length;

  return (
    <div className="mb-6">
      {/* CARD: Total */}
      <button
        type="button"
        onClick={() => onFilterChange(selectedFilter === 'all' ? '' : 'all')}
        className={`w-full text-left p-5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
          selectedFilter === 'all'
            ? 'bg-blue-600 border-blue-600 text-white shadow-md hover:bg-blue-700'
            : 'bg-blue-50/40 border-blue-100/80 text-blue-950 hover:bg-blue-50 hover:border-blue-200'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-semibold uppercase tracking-wider ${selectedFilter === 'all' ? 'text-blue-100' : 'text-blue-600'}`}>Total Identifiants</span>
          <ShieldCheck className={selectedFilter === 'all' ? 'text-white w-5 h-5' : 'text-blue-600 w-5 h-5'} />
        </div>
        <p className={`text-3xl font-bold font-mono ${selectedFilter === 'all' ? 'text-white' : 'text-blue-950'}`}>{total}</p>
        <p className={`text-xs mt-1.5 ${selectedFilter === 'all' ? 'text-blue-200' : 'text-blue-700/80'}`}>Tous vos codes sont stockés localement et chiffrés de bout en bout.</p>
      </button>
    </div>
  );
}
