import React, { useState, useEffect } from 'react';
import { PasswordEntry, Category } from '../types';
import { X, Eye, EyeOff, RefreshCw, Key, ShieldCheck, ShieldAlert, BadgeAlert } from 'lucide-react';

interface EntryFormProps {
  entry?: PasswordEntry | null; // If provided, we are editing; else creating
  onSave: (entry: Omit<PasswordEntry, 'updatedAt'>) => void;
  onClose: () => void;
  categories?: { id: string; label: string; icon: string; color: string }[];
  COLOR_MAPS?: Record<string, { bg: string; border: string; text: string; bgLight: string; ring: string; activeClass: string }>;
  defaultCategory?: string;
  onManageCategories?: () => void;
}

export default function EntryForm({ entry, onSave, onClose, categories, COLOR_MAPS, defaultCategory, onManageCategories }: EntryFormProps) {
  const activeCategories = categories || [
    { id: 'web', label: 'E-mail / Site Web', icon: '', color: 'blue' },
    { id: 'bank', label: 'Banque / Carte', icon: '', color: 'emerald' },
    { id: 'social', label: 'Réseau Social', icon: '', color: 'pink' },
    { id: 'wifi', label: 'Réseau Wi-Fi', icon: '', color: 'amber' },
    { id: 'work', label: 'Pro / Travail', icon: '', color: 'violet' },
    { id: 'other', label: 'Autre Secrète', icon: '', color: 'slate' }
  ];

  const [category, setCategory] = useState<Category>('web');
  const [title, setTitle] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [url, setUrl] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  
  const [showPassword, setShowPassword] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Initialise fields if editing
  useEffect(() => {
    if (entry) {
      setCategory(entry.category);
      setTitle(entry.title);
      setUsername(entry.username || '');
      setPassword(entry.password || '');
      setUrl(entry.url || '');
      setNotes(entry.notes || '');
    } else {
      // Clear fields
      setCategory(defaultCategory || 'web');
      setTitle('');
      setUsername('');
      setPassword('');
      setUrl('');
      setNotes('');
    }
  }, [entry, defaultCategory]);

  // Generate helper
  const handleQuickGenerate = () => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]';
    let newPassword = '';
    const randomArray = new Uint32Array(16);
    window.crypto.getRandomValues(randomArray);
    for (let i = 0; i < 16; i++) {
      newPassword += charset[randomArray[i] % charset.length];
    }
    setPassword(newPassword);
    setShowPassword(true);
  };

  const getStrengthScore = () => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  };

  const getStrengthDetails = () => {
    const score = getStrengthScore();
    if (score <= 2) return { text: 'Faible - Risqué 🚨', color: 'text-red-500 bg-red-950/20 border-red-900/40' };
    if (score <= 4) return { text: 'Moyen - Acceptable ⚠️', color: 'text-warning text-amber-500 bg-amber-950/20 border-amber-900/40' };
    if (score <= 5) return { text: 'Fort - Sécurisé ✅', color: 'text-emerald-500 bg-emerald-950/20 border-emerald-900/40' };
    return { text: 'Excellent - Blindé 🔥', color: 'text-indigo-400 bg-indigo-950/20 border-indigo-900/40' };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Le titre ou nom de l\'élément est requis.');
      return;
    }

    if (category !== 'secure_note' && !password.trim()) {
      setError('Un mot de passe ou CODE est requis (sauf pour les notes sécurisées).');
      return;
    }

    onSave({
      id: entry?.id || crypto.randomUUID(),
      title: title.trim(),
      username: username.trim(),
      password: category !== 'secure_note' ? password : '',
      url: url.trim(),
      notes: notes.trim(),
      category,
    });
  };

  const strength = getStrengthDetails();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs">
      <div className="bg-white border border-neutral-200 w-full max-w-lg shadow-xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-100 bg-white">
          <div className="flex items-center gap-2">
            <Key className="text-neutral-700 w-4.5 h-4.5" />
            <h3 className="font-semibold text-neutral-900 text-sm tracking-tight">
              {entry ? 'Modifier l\'élément' : 'Ajouter un code'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-800 hover:bg-neutral-50 transition-all font-sans cursor-pointer"
            title="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-red-900 text-xs flex gap-2">
              <BadgeAlert className="shrink-0 text-red-650" size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Category SELECTOR */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500">
                Type de Code
              </label>
              {onManageCategories && (
                <button
                  type="button"
                  onClick={onManageCategories}
                  className="text-[11px] text-neutral-500 hover:text-neutral-900 font-sans font-medium flex items-center gap-1 cursor-pointer hover:underline"
                >
                  ⚙️ Configurer
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {activeCategories.map((cat) => {
                const colorConfig = (COLOR_MAPS && COLOR_MAPS[cat.color]) || {
                  bg: 'bg-slate-600',
                  border: 'border-slate-500',
                  text: 'text-white',
                  activeClass: 'bg-slate-600 text-white border-slate-600 ring-2 ring-slate-600/20'
                };
                const activeClass = colorConfig.activeClass || 'bg-slate-600 text-white border-slate-600 ring-2 ring-slate-600/20';
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => {
                      setCategory(cat.id);
                    }}
                    className={`py-3.5 px-3 text-sm sm:text-xs rounded-xl border-2 font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      category === cat.id
                        ? activeClass
                        : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100/50'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full inline-block shrink-0 ${category === cat.id ? 'bg-white' : colorConfig.bg}`} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="form-title" className="block text-xs font-mono uppercase tracking-wider text-neutral-500 mb-1.5">
              Service / Nom de l'élément <span className="text-red-500">*</span>
            </label>
            <input
              id="form-title"
              type="text"
              value={title}
              required
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Google, Netflix, Code de Récupération, Wi-Fi Salon"
              className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900/40 focus:ring-1 focus:ring-neutral-900/10 placeholder-neutral-400"
            />
          </div>

          {category !== 'secure_note' && (
            <>
              {/* Username */}
              <div>
                <label htmlFor="form-username" className="block text-xs font-mono uppercase tracking-wider text-neutral-500 mb-1.5">
                  Identifiant / Email {category === 'wifi' && '(Facultatif)'}
                </label>
                <input
                  id="form-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={category === 'wifi' ? "Ex: WPA2, WPA3, Invités" : "Ex: email@example.com ou pseudo"}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900/40 focus:ring-1 focus:ring-neutral-900/10 placeholder-neutral-400"
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label htmlFor="form-password" className="block text-xs font-mono uppercase tracking-wider text-neutral-500">
                    Mot de passe / Clé <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleQuickGenerate}
                    className="text-[11px] font-medium text-neutral-700 hover:text-neutral-950 flex items-center gap-1 transition-colors cursor-pointer font-mono"
                  >
                    <RefreshCw size={11} className="animate-hover-spin" /> Générer fort
                  </button>
                </div>
                
                <div className="relative flex items-center">
                  <input
                    id="form-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    required
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Saisissez ou générez un code solide"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg pl-3 pr-10 py-2 text-sm text-neutral-900 font-mono focus:outline-none focus:border-neutral-900/40 focus:ring-1 focus:ring-neutral-900/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
                    title={showPassword ? 'Cacher' : 'Afficher'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {password && (
                  <div className={`mt-2 p-2 rounded-lg border text-xs flex justify-between items-center bg-neutral-50 ${strength.color}`}>
                    <span className="font-semibold text-neutral-700">Force estimée:</span>
                    <span className="font-semibold">{strength.text}</span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* URL Website (for shortcuts) */}
          {category !== 'secure_note' && category !== 'wifi' && (
            <div>
              <label htmlFor="form-url" className="block text-xs font-mono uppercase tracking-wider text-neutral-500 mb-1.5">
                Adresse URL Web (Facultatif)
              </label>
              <input
                id="form-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Ex: https://accounts.google.com"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900/40 focus:ring-1 focus:ring-neutral-900/10 placeholder-neutral-400"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label htmlFor="form-notes" className="block text-xs font-mono uppercase tracking-wider text-neutral-500 mb-1.5">
              Description / Notes de Secours (Chiffrées)
            </label>
            <textarea
              id="form-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder={
                category === 'secure_note'
                  ? "Saisissez les informations secrètes à consigner en toute sécurité"
                  : "Détails optionnels, questions de sécurité secrètes, serveurs alternatifs..."
              }
              className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900/40 focus:ring-1 focus:ring-neutral-900/10 placeholder-neutral-400 font-sans"
            />
          </div>

          <div className="bg-neutral-50 p-3 rounded-lg flex items-center gap-2 text-[11px] text-neutral-500 border border-neutral-100">
            <span className="text-neutral-400">🛡️</span>
            <span>Cryptage de bout en bout : Ce code sera sauvegardé localement chiffré par AES-GCM.</span>
          </div>
        </form>

        {/* Footer actions */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-neutral-200 text-xs rounded-lg text-neutral-600 bg-white hover:bg-neutral-100 font-medium transition-colors cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs rounded-lg shadow transition-colors cursor-pointer"
          >
            {entry ? 'Enregistrer les modifications' : 'Ajouter au MDP'}
          </button>
        </div>
      </div>
    </div>
  );
}
