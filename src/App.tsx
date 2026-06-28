/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Key,
  Unlock,
  Lock,
  Search,
  Plus,
  Trash2,
  Edit,
  ExternalLink,
  Printer,
  Download,
  Upload,
  Copy,
  Check,
  Eye,
  EyeOff,
  AlertTriangle,
  FileText,
  Globe,
  Smartphone,
  RefreshCw,
  X,
  ChevronRight,
  HelpCircle,
  Clock,
  Info,
  Menu
} from 'lucide-react';

import { motion, AnimatePresence } from 'motion/react';

import { PasswordEntry, Category } from './types';
import { encryptData, decryptData, generateCanary, verifyCanary } from './lib/crypto';
import EntryForm from './components/EntryForm';

import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

declare global {
  interface Window {
    cordova?: any;
    resolveLocalFileSystemURL?: any;
    LocalFileSystem?: any;
  }
}

// Initialize pdfMake virtual fonts
if (pdfFonts && (pdfFonts as any).pdfMake) {
  (pdfMake as any).vfs = (pdfFonts as any).pdfMake.vfs;
}

export interface CustomCategory {
  id: string;
  label: string;
  icon: string;
  color: string;
}

export const COLOR_MAPS: Record<string, { bg: string; border: string; text: string; bgLight: string; ring: string; activeClass: string }> = {
  blue: {
    bg: 'bg-blue-600',
    border: 'border-blue-200',
    text: 'text-blue-700',
    bgLight: 'bg-blue-50',
    ring: 'ring-blue-500/25',
    activeClass: 'bg-blue-600 border-blue-600 text-white shadow-xs'
  },
  emerald: {
    bg: 'bg-emerald-600',
    border: 'border-emerald-200',
    text: 'text-emerald-800',
    bgLight: 'bg-emerald-50',
    ring: 'ring-emerald-500/25',
    activeClass: 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
  },
  pink: {
    bg: 'bg-pink-600',
    border: 'border-pink-200',
    text: 'text-pink-700',
    bgLight: 'bg-pink-50',
    ring: 'ring-pink-500/25',
    activeClass: 'bg-pink-600 border-pink-600 text-white shadow-xs'
  },
  amber: {
    bg: 'bg-amber-500',
    border: 'border-amber-200',
    text: 'text-amber-800',
    bgLight: 'bg-amber-50',
    ring: 'ring-amber-500/25',
    activeClass: 'bg-amber-500 border-amber-500 text-neutral-950 font-semibold shadow-xs'
  },
  violet: {
    bg: 'bg-violet-600',
    border: 'border-violet-200',
    text: 'text-violet-700',
    bgLight: 'bg-violet-50',
    ring: 'ring-violet-500/25',
    activeClass: 'bg-violet-600 border-violet-600 text-white shadow-xs'
  },
  purple: {
    bg: 'bg-purple-600',
    border: 'border-purple-200',
    text: 'text-purple-700',
    bgLight: 'bg-purple-50',
    ring: 'ring-purple-500/25',
    activeClass: 'bg-purple-600 border-purple-600 text-white shadow-xs'
  },
  slate: {
    bg: 'bg-slate-600',
    border: 'border-slate-200',
    text: 'text-slate-705',
    bgLight: 'bg-slate-50',
    ring: 'ring-slate-500/25',
    activeClass: 'bg-slate-600 border-slate-600 text-white shadow-xs'
  },
  red: {
    bg: 'bg-red-650',
    border: 'border-red-200',
    text: 'text-red-700',
    bgLight: 'bg-red-50',
    ring: 'ring-red-500/25',
    activeClass: 'bg-red-650 border-red-650 text-white shadow-xs'
  },
  indigo: {
    bg: 'bg-indigo-600',
    border: 'border-indigo-200',
    text: 'text-indigo-700',
    bgLight: 'bg-indigo-50',
    ring: 'ring-indigo-500/25',
    activeClass: 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
  },
  cyan: {
    bg: 'bg-cyan-600',
    border: 'border-cyan-200',
    text: 'text-cyan-700',
    bgLight: 'bg-cyan-50',
    ring: 'ring-cyan-500/25',
    activeClass: 'bg-cyan-600 border-cyan-600 text-white shadow-xs'
  }
};

export default function App() {
  // Initialization states
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [masterPasswordInput, setMasterPasswordInput] = useState<string>('');
  const [setupPassword, setSetupPassword] = useState<string>('');
  const [setupConfirm, setSetupConfirm] = useState<string>('');
  
  // Real memory states
  const [masterPassword, setMasterPassword] = useState<string>('');
  const [entries, setEntries] = useState<PasswordEntry[]>([]);
  
  // Vault configuration local storage states
  const [canary, setCanary] = useState<string>('');
  const [encryptedDataPayload, setEncryptedDataPayload] = useState<string>('');

  // Master password visibility states
  const [showSetupPassword, setShowSetupPassword] = useState<boolean>(false);
  const [showSetupConfirm, setShowSetupConfirm] = useState<boolean>(false);
  const [showUnlockPassword, setShowUnlockPassword] = useState<boolean>(false);

  // Dynamic custom categories
  const [categories, setCategories] = useState<CustomCategory[]>(() => {
    const saved = localStorage.getItem('vault_categories');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Clear icons and exclude secure notes from loaded categories
          return parsed
            .filter((c: any) => c.id !== 'secure_note')
            .map((c: any) => ({ ...c, icon: '' }));
        }
      } catch (e) {
        // fallback
      }
    }
    return [
      { id: 'web', label: 'E-mail / Site Web', icon: '', color: 'blue' },
      { id: 'bank', label: 'Banque / Carte', icon: '', color: 'emerald' },
      { id: 'social', label: 'Réseau Social', icon: '', color: 'pink' },
      { id: 'wifi', label: 'Réseau Wi-Fi', icon: '', color: 'amber' },
      { id: 'work', label: 'Pro / Travail', icon: '', color: 'violet' },
      { id: 'other', label: 'Autre Secrète', icon: '', color: 'slate' }
    ];
  });

  // Category modal & editor states
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);
  const [catEditId, setCatEditId] = useState<string | null>(null);
  const [catLabel, setCatLabel] = useState<string>('');
  const [catColor, setCatColor] = useState<string>('slate');

  // Save category
  const handleSaveCategory = () => {
    if (!catLabel.trim()) return;
    const sanitizedId = catEditId || 'cat_' + Date.now();
    const newCat: CustomCategory = {
      id: sanitizedId,
      label: catLabel.trim(),
      icon: '',
      color: catColor
    };

    let updatedList: CustomCategory[] = [];
    if (catEditId) {
      updatedList = categories.map((c) => (c.id === catEditId ? newCat : c));
    } else {
      updatedList = [...categories, newCat];
    }

    setCategories(updatedList);
    localStorage.setItem('vault_categories', JSON.stringify(updatedList));

    setCatEditId(null);
    setCatLabel('');
    setCatColor('slate');
  };

  // Delete category
  const handleDeleteCategory = async (catId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Supprimer la catégorie ?",
      message: "Êtes-vous sûr de vouloir supprimer cette catégorie ? Les codes associés seront transférés vers la catégorie 'Autre'.",
      confirmText: "Supprimer",
      danger: true,
      onConfirm: async () => {
        const updatedList = categories.filter((c) => c.id !== catId);
        setCategories(updatedList);
        localStorage.setItem('vault_categories', JSON.stringify(updatedList));

        const count = entries.filter((e) => e.category === catId).length;
        if (count > 0) {
          const fallbackCat = updatedList.some(c => c.id === 'other') 
            ? 'other' 
            : (updatedList.length > 0 ? updatedList[0].id : 'other');

          const remainingEntries = entries.map((e) => {
            if (e.category === catId) {
              return { ...e, category: fallbackCat };
            }
            return e;
          });

          try {
            const newlyEncryptedPayload = await encryptData(JSON.stringify(remainingEntries), masterPassword);
            const recoveryEncryptedPayload = await encryptData(JSON.stringify(remainingEntries), '&');

            localStorage.setItem('vault_data', newlyEncryptedPayload);
            localStorage.setItem('vault_data_recovery', recoveryEncryptedPayload);

            setEncryptedDataPayload(newlyEncryptedPayload);
            setEntries(remainingEntries);
          } catch (err) {
            console.warn("Erreur lors du transfert de codes après suppression de la catégorie:", err);
          }
        }

        if (selectedCategory === catId) {
          setSelectedCategory('all');
        }
        setConfirmModal(null);
      }
    });
  };

  // UI Flow states
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [editingEntry, setEditingEntry] = useState<PasswordEntry | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showSidebarMenu, setShowSidebarMenu] = useState<boolean>(false);
  const [showPdfOptionsModal, setShowPdfOptionsModal] = useState<boolean>(false);
  const [pdfPasswordsVisible, setPdfPasswordsVisible] = useState<boolean>(true);

  // Custom non-blocking dialog states (confirm & prompt) for reliable execution on Android Webviews
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    danger?: boolean;
    confirmText?: string;
    isAlertOnly?: boolean;
  } | null>(null);

  const [promptModal, setPromptModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    placeholder?: string;
    onConfirm: (val: string) => void;
    validateValue?: string;
    isPassword?: boolean;
  } | null>(null);

  const [promptInputText, setPromptInputText] = useState<string>('');

  const showCustomAlert = (title: string, message: string) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText: "OK",
      onConfirm: () => setConfirmModal(null),
      isAlertOnly: true
    });
  };
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);

  // Error/Success state managers
  const [authError, setAuthError] = useState<string>('');
  const [setupError, setSetupError] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string>('');
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});

  // Recovery code states
  const [showRecoveryModal, setShowRecoveryModal] = useState<boolean>(false);
  const [recoveryCodeInput, setRecoveryCodeInput] = useState<string>('');
  const [recoveryError, setRecoveryError] = useState<string>('');
  const [recoveryStep, setRecoveryStep] = useState<'code' | 'new_password'>('code');
  const [recoveryNewPassword, setRecoveryNewPassword] = useState<string>('');
  const [recoveryNewConfirm, setRecoveryNewConfirm] = useState<string>('');
  const [showRecoveryNewPass, setShowRecoveryNewPass] = useState<boolean>(false);
  const [showRecoveryNewConf, setShowRecoveryNewConf] = useState<boolean>(false);
  const [recoveryDecryptedEntries, setRecoveryDecryptedEntries] = useState<PasswordEntry[]>([]);

  // Auto-lock configurations
  const [autoLockMinutes, setAutoLockMinutes] = useState<number>(10); // Default 10 mins
  const [secondsRemaining, setSecondsRemaining] = useState<number>(600);
  const activityTimeoutRef = useRef<number | null>(null);

  // Load vault state checks on mount
  useEffect(() => {
    const savedCanary = localStorage.getItem('vault_canary');
    const savedData = localStorage.getItem('vault_data');
    const savedAutoLock = localStorage.getItem('vault_autolock_minutes');

    if (savedAutoLock) {
      const mins = parseInt(savedAutoLock, 10);
      setAutoLockMinutes(mins);
      setSecondsRemaining(mins * 60);
    }

    if (savedCanary && savedData) {
      setIsConfigured(true);
      setCanary(savedCanary);
      setEncryptedDataPayload(savedData);
    } else {
      setIsConfigured(false);
    }
  }, []);

  // Timer of 2 seconds for splash screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Activity listeners to reset the session countdown
  useEffect(() => {
    if (isLocked || autoLockMinutes === 0) return;

    const handleUserActivity = () => {
      setSecondsRemaining(autoLockMinutes * 60);
    };

    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('mousedown', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('mousedown', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
    };
  }, [isLocked, autoLockMinutes]);

  // Session Autolock countdown subtraction
  useEffect(() => {
    if (isLocked || autoLockMinutes === 0) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Lock immediately
          handleLock();
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isLocked, autoLockMinutes]);

  // Handle Locking
  const handleLock = () => {
    setIsLocked(true);
    setMasterPassword('');
    setEntries([]);
    setRevealedIds({});
    setShowAddForm(false);
    setEditingEntry(null);
    setSearchQuery('');
  };

  // Setup master password
  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError('');

    if (setupPassword.length < 4) {
      setSetupError('Le mot de passe maître doit comporter au moins 4 caractères.');
      return;
    }

    if (setupPassword !== setupConfirm) {
      setSetupError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    try {
      const generatedCanaryString = await generateCanary(setupPassword);
      const emptyVaultEncrypted = await encryptData(JSON.stringify([]), setupPassword);
      const emptyVaultRecovery = await encryptData(JSON.stringify([]), '&'); // default recovery seed code '&'

      localStorage.setItem('vault_canary', generatedCanaryString);
      localStorage.setItem('vault_data', emptyVaultEncrypted);
      localStorage.setItem('vault_data_recovery', emptyVaultRecovery);
      localStorage.setItem('vault_autolock_minutes', autoLockMinutes.toString());

      setCanary(generatedCanaryString);
      setEncryptedDataPayload(emptyVaultEncrypted);
      setMasterPassword(setupPassword);
      setEntries([]);
      setIsConfigured(true);
      setIsLocked(false);
      setSetupPassword('');
      setSetupConfirm('');
    } catch (err) {
      setSetupError('Une erreur cryptographique est survenue lors de la configuration.');
    }
  };

  // Unlock Vault
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!masterPasswordInput) return;

    const verified = await verifyCanary(canary, masterPasswordInput);
    if (!verified) {
      setAuthError('Mot de passe maître incorrect. Veuillez réessayer.');
      return;
    }

    try {
      const decryptedString = await decryptData(encryptedDataPayload, masterPasswordInput);
      const parsedEntries = JSON.parse(decryptedString) as PasswordEntry[];

      setMasterPassword(masterPasswordInput);
      setEntries(parsedEntries);
      setIsLocked(false);
      setMasterPasswordInput('');
      setSecondsRemaining(autoLockMinutes * 60);

      // Passive upgrade: always save the recovery payload encrypted with '&' if not present or changed
      try {
        const recoveryEncryptedPayload = await encryptData(JSON.stringify(parsedEntries), '&');
        localStorage.setItem('vault_data_recovery', recoveryEncryptedPayload);
      } catch (e) {
        console.warn('Could not passively encrypt recovery copy:', e);
      }
    } catch (err) {
      setAuthError('Impossible de déchiffrer les données. Clé corrompue.');
    }
  };

  // Save new/edited password entry
  const handleSaveEntry = async (updatedEntryData: Omit<PasswordEntry, 'updatedAt'>) => {
    const now = new Date().toISOString();
    let newEntriesList: PasswordEntry[] = [];

    const existingIndex = entries.findIndex((e) => e.id === updatedEntryData.id);
    if (existingIndex > -1) {
      // Editing
      newEntriesList = [...entries];
      newEntriesList[existingIndex] = {
        ...updatedEntryData,
        updatedAt: now,
      };
    } else {
      // Adding new
      newEntriesList = [
        ...entries,
        {
          ...updatedEntryData,
          updatedAt: now,
        },
      ];
    }

    try {
      const newlyEncryptedPayload = await encryptData(JSON.stringify(newEntriesList), masterPassword);
      const recoveryEncryptedPayload = await encryptData(JSON.stringify(newEntriesList), '&');

      localStorage.setItem('vault_data', newlyEncryptedPayload);
      localStorage.setItem('vault_data_recovery', recoveryEncryptedPayload);

      setEncryptedDataPayload(newlyEncryptedPayload);
      setEntries(newEntriesList);
      setShowAddForm(false);
      setEditingEntry(null);
    } catch (err) {
      showCustomAlert('Erreur', 'Erreur lors du chiffrement et de la sauvegarde.');
    }
  };

  // Delete Entry
  const handleDeleteEntry = async (id: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Supprimer le code ?",
      message: `Êtes-vous sûr de vouloir supprimer définitivement le compte d'accès pour "${name}" ? Cette action est irréversible.`,
      confirmText: "Supprimer",
      danger: true,
      onConfirm: async () => {
        const remainingEntries = entries.filter((e) => e.id !== id);

        try {
          const newlyEncryptedPayload = await encryptData(JSON.stringify(remainingEntries), masterPassword);
          const recoveryEncryptedPayload = await encryptData(JSON.stringify(remainingEntries), '&');

          localStorage.setItem('vault_data', newlyEncryptedPayload);
          localStorage.setItem('vault_data_recovery', recoveryEncryptedPayload);

          setEncryptedDataPayload(newlyEncryptedPayload);
          setEntries(remainingEntries);
        } catch (err) {
          showCustomAlert('Erreur', 'Erreur lors de la suppression.');
        }
        setConfirmModal(null);
      }
    });
  };

  // Recovery verification and setup
  const handleVerifyRecoveryCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');

    if (!recoveryCodeInput) return;

    const savedRecoveryPayload = localStorage.getItem('vault_data_recovery');
    if (!savedRecoveryPayload) {
      setRecoveryError("Aucune donnée de récupération active n'a été trouvée sur cet appareil.");
      return;
    }

    try {
      const decryptedString = await decryptData(savedRecoveryPayload, recoveryCodeInput);
      const parsedEntries = JSON.parse(decryptedString) as PasswordEntry[];
      setRecoveryDecryptedEntries(parsedEntries);
      setRecoveryStep('new_password');
    } catch (err) {
      setRecoveryError("Code de récupération incorrect. Veuillez réessayer.");
    }
  };

  const handleSetupNewPasswordFromRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');

    if (recoveryNewPassword.length < 4) {
      setRecoveryError('Le nouveau mot de passe maître doit comporter au moins 4 caractères.');
      return;
    }

    if (recoveryNewPassword !== recoveryNewConfirm) {
      setRecoveryError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    try {
      const generatedCanaryString = await generateCanary(recoveryNewPassword);
      const newEncryptedPayload = await encryptData(JSON.stringify(recoveryDecryptedEntries), recoveryNewPassword);
      const newRecoveryPayload = await encryptData(JSON.stringify(recoveryDecryptedEntries), '&');

      localStorage.setItem('vault_canary', generatedCanaryString);
      localStorage.setItem('vault_data', newEncryptedPayload);
      localStorage.setItem('vault_data_recovery', newRecoveryPayload);

      setCanary(generatedCanaryString);
      setEncryptedDataPayload(newEncryptedPayload);
      setMasterPassword(recoveryNewPassword);
      setEntries(recoveryDecryptedEntries);
      setIsLocked(false);

      // Reset recovery flow state
      setShowRecoveryModal(false);
      setRecoveryCodeInput('');
      setRecoveryNewPassword('');
      setRecoveryNewConfirm('');
      setRecoveryStep('code');
      setRecoveryDecryptedEntries([]);
    } catch (err) {
      setRecoveryError('Une erreur cryptographique est survenue lors du renouvellement.');
    }
  };

  // Reset/Factory wipe everything
  const handleFactoryReset = () => {
    setPromptModal({
      isOpen: true,
      title: "⚠️ Confirmation de Réinitialisation",
      message: "Cette opération supprimera définitivement TOUS vos codes d'accès synchronisés localement et votre mot de passe maître.\n\nVeuillez taper \"EFFACER\" en capitales pour confirmer le nettoyage complet :",
      placeholder: "EFFACER",
      validateValue: "EFFACER",
      onConfirm: (val) => {
        if (val === 'EFFACER') {
          localStorage.removeItem('vault_canary');
          localStorage.removeItem('vault_data');
          localStorage.removeItem('vault_autolock_minutes');
          localStorage.removeItem('vault_data_recovery');
          setIsConfigured(false);
          setIsLocked(true);
          setEntries([]);
          setMasterPassword('');
          setShowSettingsModal(false);
          setPromptModal(null);
          showCustomAlert('Données Réinitialisées', 'Toutes les données ont été supprimées avec succès.');
        }
      }
    });
  };

  // Copy to Clipboard interaction helper
  const copyText = (text: string, id: string, type: 'username' | 'password' | 'note') => {
    navigator.clipboard.writeText(text);
    setCopiedId(`${id}-${type}`);
    setTimeout(() => setCopiedId(''), 2000);
  };

  // Toggle reveal password
  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Format Auto Lock remaining minutes
  const formatTimeLeft = () => {
    if (autoLockMinutes === 0) return 'Jamais';
    const m = Math.floor(secondsRemaining / 60);
    const s = secondsRemaining % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Handle change auto lock duration
  const changeAutoLock = (mins: number) => {
    setAutoLockMinutes(mins);
    setSecondsRemaining(mins * 60);
    localStorage.setItem('vault_autolock_minutes', mins.toString());
  };

  // Cordova Native helper to save a blob as a file and open it using Cordova plugins
  const saveAndOpenPdfCordova = (blob: Blob, fileName: string) => {
    if (!window.cordova || !window.resolveLocalFileSystemURL) {
      console.error("Cordova File API standard is not loaded.");
      showCustomAlert("Erreur de stockage", "Le plugin Cordova File n'est pas prêt.");
      return;
    }

    // Use standard cache directory since it is private and accessible for opening
    const storageDir = window.cordova.file.cacheDirectory || window.cordova.file.externalCacheDirectory || window.cordova.file.dataDirectory;

    window.resolveLocalFileSystemURL(storageDir, (dirEntry: any) => {
      dirEntry.getFile(fileName, { create: true, exclusive: false }, (fileEntry: any) => {
        fileEntry.createWriter((fileWriter: any) => {
          fileWriter.onwriteend = () => {
            console.log("Fichier écrit avec succès: " + fileEntry.toURL());
            
            // Open the file with cordova-plugin-file-opener2
            if (window.cordova.plugins && window.cordova.plugins.fileOpener2) {
              window.cordova.plugins.fileOpener2.open(
                fileEntry.toURL(),
                'application/pdf',
                {
                  error: (err: any) => {
                    console.error("Erreur d'ouverture via fileOpener2: ", err);
                    showCustomAlert(
                      "Erreur d'ouverture", 
                      "Fichier enregistré mais impossible d'ouvrir le PDF automatiquement. Veuillez vérifier que vous avez un lecteur PDF installé sur votre appareil Android."
                    );
                  },
                  success: () => {
                    console.log("PDF ouvert avec succès via fileOpener2 !");
                  }
                }
              );
            } else {
              console.warn("Le plugin fileOpener2 n'est pas disponible.");
              showCustomAlert(
                "Fichier enregistré", 
                `Votre PDF a été enregistré avec succès sous ${fileName} dans le cache local.`
              );
            }
          };

          fileWriter.onerror = (e: any) => {
            console.error("Erreur d'écriture du fichier: ", e);
            showCustomAlert("Erreur d'enregistrement", "Échec de l'écriture physique du fichier.");
          };

          fileWriter.write(blob);
        }, (err: any) => {
          console.error("Erreur de création de fileWriter: ", err);
          showCustomAlert("Erreur technique", "Impossible d'initialiser le gestionnaire d'écriture.");
        });
      }, (err: any) => {
        console.error("Erreur getFile: ", err);
        showCustomAlert("Erreur d'accès", "Impossible de créer le fichier d'exportation.");
      });
    }, (err: any) => {
      console.error("Erreur resolveLocalFileSystemURL: ", err);
      showCustomAlert("Erreur d'accès", "Impossible de résoudre le dossier de stockage local de l'application.");
    });
  };

  // Main pdfMake builder & generator
  const generateAndExportPdf = (showPasswords: boolean) => {
    // 1. Group entries by their type (category), then alphabetically by title
    const groupedEntries = categories.map(cat => {
      const catEntries = entries
        .filter(e => e.category === cat.id)
        .sort((a, b) => a.title.localeCompare(b.title));
      return {
        category: cat,
        entries: catEntries
      };
    }).filter(group => group.entries.length > 0);

    const extraEntries = entries
      .filter(e => !categories.some(c => c.id === e.category))
      .sort((a, b) => a.title.localeCompare(b.title));
    
    if (extraEntries.length > 0) {
      groupedEntries.push({
        category: { id: 'other', label: 'Autres fiches / Notes', color: 'slate' },
        entries: extraEntries
      });
    }

    // 2. Build the PDF content definition
    const pdfContent: any[] = [
      { text: "Rapport de Sauvegarde des Codes d'Accès", style: 'header', alignment: 'center' },
      { 
        text: `Généré en toute sécurité le ${new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 
        style: 'subheader',
        alignment: 'center'
      },
      { text: `Fiches totales : ${entries.length} | Statut : Chiffré en local`, style: 'info', alignment: 'center' },
      { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 1.5, color: '#1f2937' }] },
      { text: ' ', margin: [0, 8] }
    ];

    if (groupedEntries.length === 0) {
      pdfContent.push({ text: 'Aucune fiche trouvée dans votre coffre-fort.', style: 'emptyText' });
    } else {
      groupedEntries.forEach((group) => {
        // Group heading (Category)
        pdfContent.push({
          text: `${group.category.label.toUpperCase()} (${group.entries.length})`,
          style: 'categoryHeader',
          margin: [0, 15, 0, 6]
        });

        // Create table
        const tableBody: any[] = [];
        // Add headers
        tableBody.push([
          { text: 'Titre / Nom', style: 'tableHeader' },
          { text: 'Identifiant / Compte', style: 'tableHeader' },
          { text: 'Mot de Passe', style: 'tableHeader' },
          { text: 'Notes & URL / Site', style: 'tableHeader' }
        ]);

        // Add rows
        group.entries.forEach((entry) => {
          const titleVal = entry.title || '';
          const userVal = entry.username || '-';
          const passVal = showPasswords ? (entry.password || '-') : '••••••••';
          
          const details: any[] = [];
          if (entry.url) {
            details.push({ text: entry.url + '\n', color: '#2563eb', fontSize: 8 });
          }
          if (entry.notes) {
            details.push({ text: entry.notes, fontStyle: 'italic', color: '#4b5563', fontSize: 8 });
          }
          if (details.length === 0) {
            details.push({ text: '-', color: '#9ca3af' });
          }

          tableBody.push([
            { text: titleVal, bold: true },
            { text: userVal },
            { text: passVal, color: showPasswords ? '#b91c1c' : '#4b5563', bold: showPasswords },
            { text: details }
          ]);
        });

        pdfContent.push({
          table: {
            headerRows: 1,
            widths: ['25%', '25%', '22%', '28%'],
            body: tableBody
          },
          layout: {
            hLineWidth: (i: number, node: any) => (i === 0 || i === node.table.body.length) ? 1.5 : 0.5,
            vLineWidth: (i: number, node: any) => (i === 0 || i === node.table.widths.length) ? 1.5 : 0.5,
            hLineColor: () => '#d1d5db',
            vLineColor: () => '#e5e7eb',
            paddingLeft: () => 6,
            paddingRight: () => 6,
            paddingTop: () => 5,
            paddingBottom: () => 5,
          }
        });
      });
    }

    // Document footer lines
    pdfContent.push({
      text: '\n\nDocument confidentiel • Ne pas partager sans protection\nFichier de tableur généré via l\'application MDP Hors Ligne en local.',
      style: 'footerText',
      alignment: 'center'
    });

    const docDefinition: any = {
      content: pdfContent,
      styles: {
        header: {
          fontSize: 15,
          bold: true,
          color: '#111827',
          margin: [0, 0, 0, 2]
        },
        subheader: {
          fontSize: 9,
          color: '#4b5563',
          margin: [0, 0, 0, 2]
        },
        info: {
          fontSize: 8.5,
          color: '#4f46e5',
          bold: true,
          margin: [0, 0, 0, 6]
        },
        categoryHeader: {
          fontSize: 10,
          bold: true,
          color: '#374151',
          keepWithNext: true
        },
        tableHeader: {
          bold: true,
          fontSize: 9,
          color: '#111827',
          fillColor: '#f9fafb'
        },
        emptyText: {
          fontSize: 10,
          fontStyle: 'italic',
          color: '#9ca3af',
          alignment: 'center',
          margin: [0, 25, 0, 25]
        },
        footerText: {
          fontSize: 8,
          color: '#9ca3af'
        }
      },
      defaultStyle: {
        fontSize: 8.5
      }
    };

    const fileName = `mdp_coffre_sauvegarde_${new Date().toISOString().slice(0, 10)}.pdf`;

    try {
      const pdfDocGenerator = pdfMake.createPdf(docDefinition);

      if (window.cordova) {
        // Android Cordova Context: Generate as blob and save natively
        (pdfDocGenerator as any).getBlob((blob: any) => {
          saveAndOpenPdfCordova(blob, fileName);
        });
      } else {
        // Browser Preview Context: Download file
        pdfDocGenerator.download(fileName);
        showCustomAlert('Rapport PDF Généré', 'Le PDF trié par catégorie a été généré et téléchargé avec succès !');
      }
    } catch (err) {
      console.error("Erreur de génération pdfMake:", err);
      showCustomAlert("Erreur", "Impossible de générer le fichier PDF.");
    }
  };

  // Cordova Backup & Export Handlers (JSON Format via cordova-plugin-file)
  const handleCordovaBackupExport = () => {
    try {
      const backupData = {
        vault_canary: localStorage.getItem('vault_canary') || '',
        vault_data: localStorage.getItem('vault_data') || '',
        vault_categories: localStorage.getItem('vault_categories') || '',
        vault_autolock_minutes: localStorage.getItem('vault_autolock_minutes') || '10',
        vault_data_recovery: localStorage.getItem('vault_data_recovery') || '',
        export_date: new Date().toISOString()
      };

      if (!backupData.vault_data || !backupData.vault_canary) {
        showCustomAlert("Export impossible", "Votre coffre-fort n'est pas encore configuré ou est vide.");
        return;
      }

      const jsonString = JSON.stringify(backupData, null, 2);
      const fileName = `sauvegarde_mdp_horsligne_${new Date().toISOString().slice(0, 10)}.json`;

      if (window.cordova && window.resolveLocalFileSystemURL) {
        // Android Cordova File Storage: save natively in device memory
        const directory = window.cordova.file.externalRootDirectory || 
                          window.cordova.file.documentsDirectory || 
                          window.cordova.file.externalDataDirectory || 
                          window.cordova.file.dataDirectory;

        window.resolveLocalFileSystemURL(directory, (dirEntry: any) => {
          dirEntry.getFile(fileName, { create: true, exclusive: false }, (fileEntry: any) => {
            fileEntry.createWriter((fileWriter: any) => {
              fileWriter.onwriteend = () => {
                showCustomAlert(
                  "Exportation Cordova Réussie",
                  `Fichier sauvegardé avec succès !\n\nNom : ${fileName}\nEmplacement : ${fileEntry.toURL()}\n\nVous pouvez copier ce fichier de sauvegarde sur un autre support.`
                );
              };

              fileWriter.onerror = (e: any) => {
                console.error("Erreur d'écriture du fichier:", e);
                showCustomAlert("Erreur d'écriture", "Impossible d'écrire les données de sauvegarde.");
              };

              const blob = new Blob([jsonString], { type: 'application/json' });
              fileWriter.write(blob);
            }, (err: any) => {
              console.error("Erreur createWriter:", err);
              showCustomAlert("Erreur technique", "Impossible d'initialiser le système d'écriture.");
            });
          }, (err: any) => {
            console.error("Erreur getFile:", err);
            showCustomAlert("Erreur de fichier", "Impossible de créer le fichier sauvegarde.json");
          });
        }, (err: any) => {
          console.error("Erreur resolveLocalFileSystemURL:", err);
          // Fallback to cache
          const cacheDir = window.cordova.file.cacheDirectory || window.cordova.file.tempDirectory;
          if (cacheDir) {
            window.resolveLocalFileSystemURL(cacheDir, (fallbackDir: any) => {
              fallbackDir.getFile(fileName, { create: true, exclusive: false }, (fileEntry: any) => {
                fileEntry.createWriter((fileWriter: any) => {
                  fileWriter.onwriteend = () => {
                    showCustomAlert(
                      "Sauvegarde enregistrée (Cache)",
                      `Fichier enregistré dans le dossier temporaire :\n${fileEntry.toURL()}`
                    );
                  };
                  const blob = new Blob([jsonString], { type: 'application/json' });
                  fileWriter.write(blob);
                });
              });
            }, (err2: any) => {
              showCustomAlert("Erreur", "Impossible d'accéder au système de fichiers.");
            });
          } else {
            showCustomAlert("Erreur de stockage", "Impossible d'accéder à l'espace de stockage Android.");
          }
        });
      } else {
        // Fallback for browser preview
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showCustomAlert("Exportation Locale", "Fichier de sauvegarde JSON téléchargé avec succès !");
      }
    } catch (err) {
      console.error("Erreur d'export:", err);
      showCustomAlert("Erreur", "Une erreur est survenue lors de la création de la sauvegarde.");
    }
  };

  // Cordova Import Handler
  const handleCordovaBackupImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (!parsed.vault_canary || !parsed.vault_data) {
          showCustomAlert(
            "Format invalide", 
            "Ce fichier ne semble pas être une sauvegarde valide de l'application MDP Hors Ligne (clés de sécurité manquantes)."
          );
          return;
        }

        setConfirmModal({
          isOpen: true,
          title: "Confirmer l'importation ?",
          message: "⚠️ Attention : L'importation de cette sauvegarde va écraser TOUTES vos fiches actuelles et réinitialiser votre session. Voulez-vous continuer ?",
          danger: true,
          confirmText: "Restaurer",
          onConfirm: () => {
            // Restore localStorage data
            localStorage.setItem('vault_canary', parsed.vault_canary);
            localStorage.setItem('vault_data', parsed.vault_data);
            
            if (parsed.vault_categories) {
              localStorage.setItem('vault_categories', parsed.vault_categories);
              try {
                setCategories(JSON.parse(parsed.vault_categories));
              } catch (_) {}
            }
            if (parsed.vault_autolock_minutes) {
              localStorage.setItem('vault_autolock_minutes', parsed.vault_autolock_minutes);
              setAutoLockMinutes(parseInt(parsed.vault_autolock_minutes, 10));
            }
            if (parsed.vault_data_recovery) {
              localStorage.setItem('vault_data_recovery', parsed.vault_data_recovery);
            }

            // Sync component states
            setCanary(parsed.vault_canary);
            setEncryptedDataPayload(parsed.vault_data);
            setIsConfigured(true);
            setIsLocked(true); // Lock so they must type the password of the backup
            setEntries([]);
            setMasterPassword('');
            setShowSettingsModal(false);

            showCustomAlert(
              "Restauration Réussie",
              "Votre sauvegarde a été restaurée avec succès ! Connectez-vous maintenant avec le mot de passe maître associé à ce fichier de sauvegarde."
            );
          }
        });
      } catch (err) {
        console.error("Erreur d'importation JSON:", err);
        showCustomAlert("Erreur de lecture", "Impossible de lire ou de parser le fichier de sauvegarde sélectionné.");
      }
    };

    reader.onerror = (err) => {
      console.error("Erreur FileReader:", err);
      showCustomAlert("Erreur", "Une erreur s'est produite lors de la lecture physique du fichier.");
    };

    reader.readAsText(file);
    // Reset the input value so the same file can be selected again
    e.target.value = '';
  };



  // Helper method: assess strength rating of single entries
  const getEntryStrength = (p?: string) => {
    if (!p) return 'weak';
    if (p.length < 8) return 'weak';
    
    const hasUpper = /[A-Z]/.test(p);
    const hasLower = /[a-z]/.test(p);
    const hasDigit = /[0-9]/.test(p);
    const hasSpecial = /[^A-Za-z0-9]/.test(p);
    const uniqueTypes = [hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length;
    
    if (p.length >= 14 && uniqueTypes >= 3) return 'excellent';
    if (p.length >= 10 && uniqueTypes >= 3) return 'strong';
    if (p.length >= 8 && uniqueTypes >= 2) return 'medium';
    return 'weak';
  };

  const getEntryDuplicatesMap = () => {
    const map = new Map<string, number>();
    entries.forEach((e) => {
      if (e.password && e.category !== 'secure_note') {
        map.set(e.password, (map.get(e.password) || 0) + 1);
      }
    });
    return map;
  };

  const duplicatesMap = getEntryDuplicatesMap();

  // Filters application
  const filteredEntries = entries.filter((e) => {
    // 1. Category Filter Choice
    if (selectedCategory !== 'all' && e.category !== selectedCategory) {
      return false;
    }

    // 2. Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inTitle = e.title.toLowerCase().includes(q);
      const inUser = (e.username || '').toLowerCase().includes(q);
      const inNotes = (e.notes || '').toLowerCase().includes(q);
      const inUrl = (e.url || '').toLowerCase().includes(q);
      return inTitle || inUser || inNotes || inUrl;
    }

    return true;
  });

  // UI elements render
  if (showSplash) {
    return (
      <div className="font-sans min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-700 via-purple-600 to-rose-500 text-white select-none relative overflow-hidden">
        {/* Quiet decorative background gradient orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-20%] left-[-20%] w-[70%] h-[70%] rounded-full bg-blue-400/20 blur-3xl"></div>
          <div className="absolute bottom-[-20%] right-[-20%] w-[70%] h-[70%] rounded-full bg-pink-400/20 blur-3xl"></div>
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:20px_20px]"></div>
        </div>

        <motion.div 
          className="relative z-10 flex flex-col items-center text-center space-y-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* Padlock logo */}
          <motion.div 
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-[0_8px_32px_rgba(0,0,0,0.15)] relative overflow-hidden"
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 80, delay: 0.15 }}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/15 rotate-45"></div>
            <Lock size={44} className="text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.1)]" />
          </motion.div>

          <div className="space-y-1.5">
            <motion.h1 
              className="text-4xl sm:text-5xl font-black tracking-tight font-sans select-none"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <span className="bg-gradient-to-b from-white to-neutral-200 bg-clip-text text-transparent">
                Mon MDP
              </span>
            </motion.h1>

            <motion.p 
              className="text-[10px] text-white/50 font-mono tracking-widest uppercase font-bold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.4 }}
            >
              🔒 Hors-ligne & Sécurisé
            </motion.p>
          </div>
        </motion.div>
      </div>
    );
  }



  const isAuthScreen = !isConfigured || isLocked;

  return (
    <div className={`font-sans min-h-screen flex flex-col justify-between selection:bg-neutral-200 relative overflow-hidden transition-all duration-500 ${
      isAuthScreen 
        ? 'bg-gradient-to-br from-indigo-700 via-purple-600 to-rose-500 text-neutral-850' 
        : 'bg-neutral-50/50 text-neutral-800'
    }`}>
      {/* Decorative colored glow background orbs for auth screens */}
      {isAuthScreen && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-15%] left-[-15%] w-[60%] h-[60%] rounded-full bg-blue-400/20 blur-3xl"></div>
          <div className="absolute bottom-[-15%] right-[-15%] w-[60%] h-[60%] rounded-full bg-pink-400/20 blur-3xl"></div>
          <div className="absolute top-[35%] left-[25%] w-[70%] h-[70%] rounded-full bg-purple-500/15 blur-3xl"></div>
          {/* Subtle grid mesh pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:20px_20px]"></div>
        </div>
      )}
      
      {/* ==================== SCREEN 1: CONFIGURE VAULT ==================== */}
      {!isConfigured && (
        <div className="flex-1 flex items-center justify-center p-4 relative z-10">
          <div className="bg-white/95 backdrop-blur-md border border-white/20 p-8 rounded-3xl w-full max-w-md shadow-2xl space-y-6 transform hover:scale-[1.01] transition-all duration-300">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-gradient-to-tr from-indigo-100 via-purple-100 to-pink-100 border border-purple-200 text-indigo-650 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <Shield size={28} />
              </div>
              <h2 className="text-xl font-extrabold tracking-tight text-neutral-900 bg-gradient-to-r from-indigo-700 to-purple-800 bg-clip-text text-transparent">Initialisation de MDP</h2>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
                Configurez votre clé d'accès locale maîtresse (au moins 4 caractères ou chiffres). Vos codes sont cryptés au sein même de votre navigateur et ne quittent jamais votre terminal.
              </p>
            </div>

            <form onSubmit={handleSetup} className="space-y-4">
              {setupError && (
                <div className="bg-red-50 border border-red-150 p-3 rounded-xl text-red-800 text-xs text-center font-medium">
                  {setupError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 font-bold">
                  Code ou Mot de passe Maître
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showSetupPassword ? "text" : "password"}
                    required
                    value={setupPassword}
                    onChange={(e) => setSetupPassword(e.target.value)}
                    placeholder="L'équivalent d'un code PIN (min 4)"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-4 pr-10 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-105 font-mono transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSetupPassword(!showSetupPassword)}
                    className="absolute right-3 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
                    title={showSetupPassword ? "Masquer" : "Afficher"}
                  >
                    {showSetupPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 font-bold">
                  Confirmer le mot de passe
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showSetupConfirm ? "text" : "password"}
                    required
                    value={setupConfirm}
                    onChange={(e) => setSetupConfirm(e.target.value)}
                    placeholder="Ressaisissez le code"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-4 pr-10 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-105 font-mono transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSetupConfirm(!showSetupConfirm)}
                    className="absolute right-3 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
                    title={showSetupConfirm ? "Masquer" : "Afficher"}
                  >
                    {showSetupConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600 hover:from-indigo-700 hover:to-rose-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-md hover:shadow-lg text-sm cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                >
                  Créer mon MDP Local
                </button>
              </div>
            </form>

            <div className="pt-4 border-t border-neutral-100 flex items-center justify-center text-[11px] text-neutral-500 select-none">
              <span className="flex items-center gap-1 font-semibold">🟢 100% Hors-ligne & Sécurisé</span>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SCREEN 2: VAULT LOCKED ==================== */}
      {isConfigured && isLocked && (
        <div className="flex-1 flex items-center justify-center p-4 relative z-10">
          <div className="bg-white/95 backdrop-blur-md border border-white/20 p-8 rounded-3xl w-full max-w-sm shadow-2xl space-y-6 transform hover:scale-[1.01] transition-all duration-300">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-gradient-to-tr from-purple-100 via-pink-100 to-indigo-100 border border-pink-200 text-purple-650 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <Lock size={26} />
              </div>
              <h2 className="text-xl font-extrabold tracking-tight text-neutral-900 bg-gradient-to-r from-purple-700 to-pink-700 bg-clip-text text-transparent">MDP Verrouillé</h2>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Entrez votre code secret maître pour déchiffrer votre base de données locale.
              </p>
            </div>

            <form onSubmit={handleUnlock} className="space-y-4">
              {authError && (
                <div className="bg-red-50 border border-red-150 p-3 rounded-xl text-red-800 text-xs text-center font-medium animate-bounce">
                  {authError}
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 font-bold">
                    Mot de passe Maître / Code
                  </label>
                </div>
                <div className="relative flex items-center">
                  <input
                    type={showUnlockPassword ? "text" : "password"}
                    required
                    autoFocus
                    value={masterPasswordInput}
                    onChange={(e) => setMasterPasswordInput(e.target.value)}
                    placeholder="Saisissez votre code..."
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-3 pr-10 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 font-mono transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowUnlockPassword(!showUnlockPassword)}
                    className="absolute right-3 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
                    title={showUnlockPassword ? "Masquer" : "Afficher"}
                  >
                    {showUnlockPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-md hover:shadow-lg text-sm flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Unlock size={16} /> Déverrouiller le MDP
                </button>
              </div>
            </form>

            <div className="pt-4 border-t border-neutral-100 flex flex-col gap-3 text-center text-xs text-neutral-500">

              <button
                type="button"
                onClick={() => {
                  setRecoveryStep('code');
                  setRecoveryCodeInput('');
                  setRecoveryError('');
                  setShowRecoveryModal(true);
                }}
                className="text-indigo-650 hover:text-indigo-800 hover:underline font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                🔑 Récupérer avec le code de secours
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SCREEN 3: WORKING DESKTOP / MAIN WORKSPACE ==================== */}
      {isConfigured && !isLocked && (
        <div className="flex-1 max-w-3xl w-full mx-auto p-4 md:p-6 space-y-6">
          
          {/* Main workspace container */}
          <main className="flex-1 flex flex-col space-y-6">

            {/* Consolidated Elegant Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSidebarMenu(true)}
                    className="p-2.5 bg-white border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-350 rounded-xl text-neutral-600 hover:text-neutral-900 transition-all cursor-pointer shadow-2xs"
                    title="Menu de catégories"
                  >
                    <Menu size={22} />
                  </button>
                </div>
                <p className="text-xs text-neutral-500 mt-2 ml-0.5">
                  {autoLockMinutes > 0 ? (
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <Clock size={12} className="text-neutral-400" /> Auto-Lock actif • Session se ferme dans {formatTimeLeft()}
                    </span>
                  ) : (
                    "Codes chiffrés en mémoire locale par clé AES-GCM-256"
                  )}
                </p>
              </div>

              {/* Dynamic Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleLock}
                  className="bg-white border border-neutral-200 hover:bg-neutral-50 p-2.5 px-3.5 text-xs text-neutral-700 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer font-semibold shadow-2xs"
                  title="Verrouiller la session immédiatement"
                >
                  <Lock size={13} /> Verrouiller
                </button>
                <button
                  onClick={() => setShowSearchModal(true)}
                  className="bg-white border border-neutral-200 hover:bg-neutral-100 p-3 text-neutral-700 hover:text-neutral-950 rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-2xs hover:scale-[1.03] active:scale-95"
                  title="Rechercher dans le coffre"
                >
                  <Search size={18} className="stroke-[2.5]" />
                </button>
                <button
                  onClick={() => setShowPdfOptionsModal(true)}
                  className="bg-white border border-neutral-200 hover:bg-neutral-100 p-3 text-neutral-700 hover:text-neutral-950 rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-2xs hover:scale-[1.03] active:scale-95"
                  title="Exporter en PDF"
                >
                  <Download size={18} className="stroke-[2.5] text-indigo-600" />
                </button>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center cursor-pointer transform hover:scale-[1.03] active:scale-95"
                  title="Nouveau code"
                >
                  <Plus size={22} className="stroke-[2.5]" />
                </button>
              </div>
            </div>



            {/* Active Filters Pill Indicator Row */}
            {(selectedCategory !== 'all' || searchQuery.trim() !== '') && (
              <div className="flex flex-wrap items-center gap-2 bg-neutral-50 border border-neutral-150 p-2.5 px-3.5 rounded-xl text-xs text-neutral-600">
                <span className="font-medium text-neutral-500 font-mono uppercase tracking-wider text-[10px] mr-1">Filtres actifs :</span>
                {selectedCategory !== 'all' && (
                  <div className="inline-flex items-center gap-1.5 bg-white border border-neutral-200 pl-2.5 pr-1.5 py-0.5 rounded-lg text-neutral-850 font-medium shadow-2xs">
                    <span>Catégorie: {categories.find(c => c.id === selectedCategory)?.label || selectedCategory}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('all')}
                      className="p-0.5 hover:bg-neutral-100 rounded text-neutral-400 hover:text-neutral-700 cursor-pointer"
                      title="Effacer le filtre"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
                {searchQuery.trim() !== '' && (
                  <div className="inline-flex items-center gap-1.5 bg-white border border-neutral-200 pl-2.5 pr-1.5 py-0.5 rounded-lg text-neutral-850 font-medium shadow-2xs">
                    <span className="truncate max-w-[120px]">Recherche: "{searchQuery}"</span>
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="p-0.5 hover:bg-neutral-100 rounded text-neutral-400 hover:text-neutral-700 cursor-pointer"
                      title="Effacer la recherche"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                  }}
                  className="ml-auto text-neutral-500 hover:text-neutral-900 font-semibold cursor-pointer underline text-[10px]"
                >
                  Tout réinitialiser
                </button>
              </div>
            )}

            {/* List Results */}
            {filteredEntries.length === 0 ? (
              <div className="bg-white border border-neutral-200 border-dashed rounded-xl p-12 text-center text-neutral-500 flex flex-col items-center justify-center space-y-3 shadow-xs">
                <Shield className="text-neutral-400" size={32} />
                <p className="text-sm font-medium text-neutral-850">Aucun code ne correspond à vos filtres.</p>
                <p className="text-xs text-neutral-400 max-w-xs">{searchQuery ? "Modifiez votre recherche textuelle." : "Commencez dès maintenant en ajoutant votre premier code local !"}</p>
                {!searchQuery && (
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="mt-2 bg-neutral-900 hover:bg-neutral-800 text-white font-medium px-4 py-2 rounded-xl text-xs flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Plus size={14} /> Créer un premier code
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3.5">
                {filteredEntries.map((e) => {
                  const strengthValue = getEntryStrength(e.password);
                  const isDup = e.password && e.category !== 'secure_note' && (duplicatesMap.get(e.password) || 0) > 1;
                  const matchedCat = categories.find((c) => c.id === e.category) || {
                    id: 'other',
                    label: 'Autre',
                    icon: '',
                    color: 'slate'
                  };
                  const colorConfig = COLOR_MAPS[matchedCat.color] || COLOR_MAPS.slate;

                  return (
                    <div
                      key={e.id}
                      id={`entry-${e.id}`}
                      className={`bg-white border ${colorConfig.border} p-4.5 rounded-xl flex flex-col md:flex-row justify-between md:items-center gap-4 group shadow-sm hover:shadow-md transition-all duration-300`}
                    >
                      <div className="flex items-start gap-4 min-w-0">
                        {/* Category identity */}
                        <div className={`w-9 h-9 shrink-0 border rounded-lg flex items-center justify-center font-sans font-bold text-xs shadow-xs ${colorConfig.bgLight} ${colorConfig.text} ${colorConfig.border}`}>
                          {matchedCat.label ? matchedCat.label[0].toUpperCase() : 'S'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-col gap-1">
                            <div>
                              <span className={`text-[9px] border rounded px-1.5 py-0.5 font-mono font-bold uppercase tracking-wider ${colorConfig.bgLight} ${colorConfig.text} ${colorConfig.border}/60`}>
                                {matchedCat.label}
                              </span>
                            </div>
                            <h3 className="font-semibold text-neutral-900 text-sm tracking-tight capitalize truncate">
                              {e.title}
                            </h3>
                          </div>

                          {/* Username & URL labels */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500 mt-1">
                            {e.url && (
                              <a
                                href={e.url.startsWith('http') ? e.url : `https://${e.url}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-neutral-450 hover:text-neutral-800 flex items-center gap-0.5 transition-colors text-[10px]"
                              >
                                <ExternalLink size={10} /> {e.url.replace(/^https?:\/\//, '')}
                              </a>
                            )}
                          </div>

                          {/* Notes if expanded */}
                          {e.notes && (
                            <p className="text-xs text-neutral-500 border-l border-neutral-200 pl-2 mt-2 font-serif italic max-w-xl truncate">
                              {e.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Decoded Secret & Actions */}
                      <div className="flex flex-col items-start md:items-end gap-2 text-xs border-t md:border-t-0 border-neutral-100 pt-3.5 md:pt-0 shrink-0">
                        {e.category !== 'secure_note' && e.username && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-neutral-400 font-mono w-[45px] text-right">Log :</span>
                            <div className="relative bg-indigo-50/80 border border-indigo-200/90 rounded-lg px-3 py-1.5 font-mono text-xs flex items-center gap-3.5 select-all text-indigo-900 w-44 sm:w-52 justify-between shadow-xs">
                              <span className="truncate pr-1 font-medium">
                                {e.username}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => copyText(e.username || '', e.id, 'username')}
                                  className={`transition-all cursor-pointer ${copiedId === `${e.id}-username` ? 'text-indigo-950 font-bold scale-105' : 'text-indigo-400 hover:text-indigo-700'}`}
                                  title="Copier le log"
                                >
                                  {copiedId === `${e.id}-username` ? <Check size={13} /> : <Copy size={13} />}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {e.category !== 'secure_note' && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-neutral-400 font-mono w-[45px] text-right">Clé :</span>
                            <div className="relative bg-rose-50/80 border border-rose-200/90 rounded-lg px-3 py-1.5 font-mono text-xs flex items-center gap-3.5 select-all text-rose-900 w-44 sm:w-52 justify-between shadow-xs">
                              <span className="truncate pr-1 font-medium">
                                {e.password}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => copyText(e.password || '', e.id, 'password')}
                                  className={`transition-all cursor-pointer ${copiedId === `${e.id}-password` ? 'text-rose-950 font-bold scale-105' : 'text-rose-400 hover:text-rose-700'}`}
                                  title="Copier le code secret"
                                >
                                  {copiedId === `${e.id}-password` ? <Check size={13} /> : <Copy size={13} />}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {e.category === 'secure_note' && e.notes && (
                          <button
                            type="button"
                            onClick={() => copyText(e.notes || '', e.id, 'note')}
                            className={`text-xs px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 hover:bg-neutral-100 hover:border-neutral-300 rounded transition-all flex items-center gap-1 cursor-pointer ${
                              copiedId === `${e.id}-note` ? 'text-neutral-900 font-semibold' : 'text-neutral-700'
                            }`}
                          >
                            {copiedId === `${e.id}-note` ? <Check size={13} /> : <Copy size={13} />}
                            <span>Copier la note</span>
                          </button>
                        )}

                        {/* Alterations */}
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-[11px] text-neutral-455 font-mono bg-neutral-50 px-2 py-1 rounded border border-neutral-150 whitespace-nowrap font-medium" title="Date de mise à jour">
                            {new Date(e.updatedAt).toLocaleDateString('fr-FR')}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingEntry(e);
                                setShowAddForm(true);
                              }}
                              className="p-3 hover:bg-neutral-100 rounded-lg text-neutral-550 hover:text-neutral-900 transition-all font-sans cursor-pointer"
                              title="Modifier"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteEntry(e.id, e.title)}
                              className="p-3 hover:bg-red-50 rounded-lg text-neutral-550 hover:text-red-600 transition-all font-sans cursor-pointer"
                              title="Supprimer"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      )}

      {/* ==================== SCREEN 4: EDIT/CREATE DIALOG ==================== */}
      {showAddForm && (
        <EntryForm
          entry={editingEntry}
          onSave={handleSaveEntry}
          categories={categories}
          COLOR_MAPS={COLOR_MAPS}
          defaultCategory={selectedCategory !== 'all' ? selectedCategory : 'web'}
          onManageCategories={() => setShowCategoryModal(true)}
          onClose={() => {
            setShowAddForm(false);
            setEditingEntry(null);
          }}
        />
      )}

      {/* ==================== SCREEN 5: CATEGORY MANAGER MODAL ==================== */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs">
          <div className="bg-white border border-neutral-200 rounded-2xl w-full max-w-md shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-semibold text-neutral-900 text-sm flex items-center gap-1.5 font-sans tracking-tight">
                <Edit size={16} className="text-neutral-700" /> Modifier mes Catégories
              </h3>
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setCatEditId(null);
                  setCatLabel('');
                  setCatColor('slate');
                }}
                className="p-1 rounded text-neutral-400 hover:text-neutral-800 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* List and manage current custom categories */}
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {categories.map((cat) => {
                const styling = COLOR_MAPS[cat.color] || COLOR_MAPS.slate;
                const count = entries.filter((e) => e.category === cat.id).length;
                return (
                  <div key={cat.id} className="flex items-center justify-between p-2 rounded-lg border border-neutral-150 bg-neutral-50 hover:bg-neutral-100/50">
                    <div className="flex items-center gap-2">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-sans font-bold text-xs border ${styling.bgLight} ${styling.text} ${styling.border}`}>
                        {cat.label ? cat.label[0].toUpperCase() : 'C'}
                      </span>
                      <div>
                        <div className="text-xs font-semibold text-neutral-900">{cat.label}</div>
                        <div className="text-[10px] text-neutral-400 font-mono">{count} code(s)</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setCatEditId(cat.id);
                          setCatLabel(cat.label);
                          setCatColor(cat.color);
                        }}
                        className="p-2.5 text-neutral-600 hover:text-neutral-950 hover:bg-white rounded-lg border border-neutral-200 hover:border-neutral-300 shadow-xs transition-all cursor-pointer"
                        title="Modifier"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-2.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-lg border border-neutral-200 hover:border-red-200 shadow-xs transition-all cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add/Edit Form section */}
            <div className="bg-neutral-50/70 border border-neutral-200 rounded-xl p-3.5 space-y-3">
              <span className="text-xs font-bold text-neutral-805 block">
                {catEditId ? "✏️ Modifier la catégorie" : "➕ Créer une catégorie"}
              </span>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-neutral-500 uppercase">Nom de catégorie</label>
                <input
                  type="text"
                  value={catLabel}
                  onChange={(e) => setCatLabel(e.target.value)}
                  placeholder="Ex: Réseau Interne"
                  className="w-full bg-white border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-neutral-400"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-neutral-500 uppercase">Couleur</label>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {Object.keys(COLOR_MAPS).map((colorName) => {
                    const styling = COLOR_MAPS[colorName];
                    const isSelected = catColor === colorName;
                    return (
                      <button
                        key={colorName}
                        type="button"
                        onClick={() => setCatColor(colorName)}
                        className={`w-5 h-5 rounded-full border-2 transition-transform cursor-pointer ${styling.bg} ${
                          isSelected ? 'border-neutral-900 scale-110 shadow-xs' : 'border-transparent hover:scale-105'
                        }`}
                        title={colorName}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 justify-end">
                {catEditId && (
                  <button
                    type="button"
                    onClick={() => {
                      setCatEditId(null);
                      setCatLabel('');
                      setCatColor('slate');
                    }}
                    className="bg-white border border-neutral-200 px-3 py-1.5 hover:bg-neutral-100 rounded-lg text-xs font-semibold text-neutral-600 cursor-pointer"
                  >
                    Annuler
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSaveCategory}
                  className="bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-1.5 rounded-lg text-xs font-semibold shadow cursor-pointer transition-colors"
                >
                  {catEditId ? "Sauvegarder" : "Créer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== RECOVERY MODAL ==================== */}
      {showRecoveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs">
          <div className="bg-white border border-neutral-200 rounded-xl w-full max-w-md shadow-xl p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100">
              <h3 className="font-semibold text-neutral-900 text-sm flex items-center gap-1.5 font-sans tracking-tight">
                <Key className="text-neutral-700 w-4 h-4" /> Récupération du mot de passe maître
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowRecoveryModal(false);
                  setRecoveryError('');
                  setRecoveryCodeInput('');
                  setRecoveryNewPassword('');
                  setRecoveryNewConfirm('');
                  setRecoveryStep('code');
                }}
                className="p-1 rounded text-neutral-400 hover:text-neutral-800 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {recoveryStep === 'code' ? (
              <form onSubmit={handleVerifyRecoveryCode} className="space-y-4">
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Veuillez entrer votre code de récupération pour réinitialiser le mot de passe maître de votre coffre-fort sans perdre vos codes locaux.
                </p>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500">
                    Code de secours / récupération
                  </label>
                  <input
                    type="text"
                    required
                    value={recoveryCodeInput}
                    onChange={(e) => setRecoveryCodeInput(e.target.value)}
                    placeholder="Saisissez le code"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900/40 focus:ring-1 focus:ring-neutral-900/10 font-mono"
                  />
                </div>

                {recoveryError && (
                  <div className="bg-red-50 border border-red-200 p-2.5 rounded text-red-800 text-xs text-center font-medium">
                    {recoveryError}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-medium py-2 rounded-lg transition-all shadow text-xs cursor-pointer"
                  >
                    Vérifier le code de secours
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSetupNewPasswordFromRecovery} className="space-y-4">
                <p className="text-xs text-emerald-600 leading-relaxed font-medium">
                  ✓ Code validé avec succès ! Saisissez maintenant votre nouveau mot de passe maître pour rechiffrer vos clés d'accès locales.
                </p>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500">
                    Nouveau mot de passe Maître
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showRecoveryNewPass ? "text" : "password"}
                      required
                      value={recoveryNewPassword}
                      onChange={(e) => setRecoveryNewPassword(e.target.value)}
                      placeholder="Code ou mot de passe (min 4)"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg pl-3 pr-10 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900/40 focus:ring-1 focus:ring-neutral-900/10 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRecoveryNewPass(!showRecoveryNewPass)}
                      className="absolute right-3 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
                    >
                      {showRecoveryNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showRecoveryNewConf ? "text" : "password"}
                      required
                      value={recoveryNewConfirm}
                      onChange={(e) => setRecoveryNewConfirm(e.target.value)}
                      placeholder="Ressaisissez le mot de passe"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg pl-3 pr-10 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900/40 focus:ring-1 focus:ring-neutral-900/10 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRecoveryNewConf(!showRecoveryNewConf)}
                      className="absolute right-3 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
                    >
                      {showRecoveryNewConf ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {recoveryError && (
                  <div className="bg-red-50 border border-red-200 p-2.5 rounded text-red-800 text-xs text-center font-medium">
                    {recoveryError}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-medium py-2 rounded-lg transition-all shadow text-xs cursor-pointer"
                  >
                    Enregistrer le nouveau mot de passe
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ==================== SETTINGS MODAL ==================== */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs">
          <div className="bg-white border border-neutral-200 rounded-2xl w-full max-w-md shadow-xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-semibold text-neutral-900 text-sm flex items-center gap-1.5 font-sans tracking-tight">
                <Shield size={16} className="text-neutral-700" /> Options de Sécurité
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-800 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Auto lock */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-neutral-800">
                  Temps d'auto-verrouillage
                </label>
                <p className="text-[11px] text-neutral-500">
                  Verrouille automatiquement votre session en cas d'inactivité pour protéger vos données locales.
                </p>
                <select
                  value={autoLockMinutes}
                  onChange={(e) => changeAutoLock(parseInt(e.target.value))}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs text-neutral-800 focus:outline-none cursor-pointer focus:border-neutral-900/40"
                >
                  <option value={1}>Auto-verrouiller après 1 Minute</option>
                  <option value={5}>Auto-verrouiller après 5 Minutes</option>
                  <option value={10}>Auto-verrouiller après 10 Minutes</option>
                  <option value={30}>Auto-verrouiller après 30 Minutes</option>
                  <option value={0}>Ne jamais auto-verrouiller (⚠️ Risqué)</option>
                </select>
              </div>

              {/* Backup and Restore Zone */}
              <div className="pt-3 border-t border-neutral-100 space-y-2.5">
                <label className="block text-xs font-semibold text-neutral-800">
                  Sauvegarde & Restauration (JSON)
                </label>
                <p className="text-[11px] text-neutral-500 leading-relaxed">
                  Exportez un fichier de sauvegarde physique sur la mémoire de l'appareil via <code className="bg-neutral-100 px-1 py-0.5 rounded text-[10px] text-indigo-650 font-mono font-bold">cordova-plugin-file</code> ou restaurez-le depuis le sélecteur d'Android.
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleCordovaBackupExport}
                    className="bg-neutral-900 hover:bg-neutral-800 text-white font-semibold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <Download size={13} /> Exporter JSON
                  </button>
                  <label className="bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-semibold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs text-center border-dashed">
                    <Upload size={13} className="text-indigo-600" /> Importer JSON
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleCordovaBackupImport}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Danger zone */}
              <div className="pt-3 border-t border-neutral-100 space-y-2">
                <label className="block text-xs font-semibold text-red-700">
                  Zone de Danger
                </label>
                <button
                  type="button"
                  onClick={handleFactoryReset}
                  className="w-full bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 font-semibold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Trash2 size={14} /> Réinitialiser MDP
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== LEFT SIDEBAR DRAWER (CATEGORIES PANEL) ==================== */}
      <AnimatePresence>
        {showSidebarMenu && (
          <div className="fixed inset-0 z-50 flex">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSidebarMenu(false)}
              className="fixed inset-0 bg-neutral-900/50 backdrop-blur-xs transition-opacity"
            />

            {/* Sliding Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="relative flex flex-col w-72 sm:w-80 h-full bg-white border-r border-neutral-200 shadow-2xl p-6 z-51 overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-6">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 animate-pulse" />
                  <h3 className="font-bold text-neutral-900 text-sm tracking-tight select-none">
                    Catégories de Codes
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSidebarMenu(false)}
                  className="p-1 px-1.5 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-neutral-800 transition-colors cursor-pointer"
                  title="Fermer le menu"
                >
                  <X size={16} />
                </button>
              </div>



              {/* Categories list */}
              <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
                {/* TOUS (All) option */}
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setShowSidebarMenu(false);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border border-transparent transition-all cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-neutral-900 text-white shadow-md font-semibold'
                      : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${selectedCategory === 'all' ? 'bg-white' : 'bg-neutral-450'}`} />
                    <span className="text-xs">Tous les codes</span>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${selectedCategory === 'all' ? 'bg-white/10 text-neutral-200' : 'bg-neutral-200/60 text-neutral-500'}`}>
                    {entries.length}
                  </span>
                </button>

                {/* Custom categories mapping */}
                {categories.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  const styling = COLOR_MAPS[cat.color] || COLOR_MAPS.slate;
                  const count = entries.filter((e) => e.category === cat.id).length;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setShowSidebarMenu(false);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border border-transparent transition-all cursor-pointer ${
                        isActive
                          ? `${styling.bg} text-white shadow-md font-semibold`
                          : `bg-neutral-50 hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900`
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-white' : styling.bg}`} />
                        <span className="text-xs text-left truncate max-w-[130px]">{cat.label}</span>
                      </div>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${isActive ? 'bg-white/20 text-white' : 'bg-neutral-200/60 text-neutral-500'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Action / footer at the bottom of the sidebar */}
              <div className="pt-4 border-t border-neutral-100 mt-6 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowSidebarMenu(false);
                    setShowCategoryModal(true);
                  }}
                  className="w-full bg-white border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 text-neutral-700 font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <Edit size={14} /> Gérer mes catégories
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSidebarMenu(false);
                    setShowSettingsModal(true);
                  }}
                  className="w-full bg-white border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 text-neutral-700 font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                  title="Paramètres de sécurité & Sauvegardes"
                >
                  <Key size={14} /> Options du coffre
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== SEARCH & FILTERS DIALOG POPUP ==================== */}
      <AnimatePresence>
        {showSearchModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSearchModal(false)}
              className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs transition-opacity"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ ease: "easeInOut", duration: 0.18 }}
              className="relative w-full max-w-lg bg-white border border-neutral-200 rounded-2xl shadow-2xl p-6 z-51 flex flex-col gap-4 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-neutral-800 animate-pulse" />
                  <h3 className="font-bold text-neutral-900 text-sm tracking-tight select-none">
                    Moteur de Recherche & Filtres
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSearchModal(false)}
                  className="p-1 px-1.5 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-neutral-800 transition-colors cursor-pointer"
                  title="Fermer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Large Input with auto-focus */}
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher par service, identifiant, notes, URL..."
                  className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-xl pl-11 pr-10 py-3 text-sm text-neutral-950 focus:outline-none focus:border-neutral-900/40 focus:ring-1 focus:ring-neutral-900/10 placeholder:text-neutral-400 font-medium font-sans"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer p-1.5"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* Simple Bottom Action Bar */}
              <div className="pt-1 border-t border-neutral-100 flex items-center justify-end select-none">
                <button
                  type="button"
                  onClick={() => {
                    setShowSearchModal(false);
                  }}
                  className="bg-neutral-100 hover:bg-neutral-200 text-neutral-600 font-semibold px-4 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== PDF OPTIONS MODAL ==================== */}
      {showPdfOptionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs">
          <div className="bg-white border border-neutral-200 rounded-2xl w-full max-w-sm shadow-xl p-6 space-y-4">
            <div className="flex items-center gap-2 pb-1 text-neutral-900">
              <FileText className="w-5 h-5 text-indigo-600" />
              <h3 className="font-semibold text-sm tracking-tight font-sans">Options d'exportation PDF</h3>
            </div>
            
            <p className="text-xs text-neutral-500 leading-relaxed font-sans">
              Toutes vos fiches seront classées par ordre de type (catégorie) et présentées sous forme de tableau dans un document PDF structuré.
            </p>

            <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-150 space-y-2 select-none">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-neutral-700">
                <input
                  type="checkbox"
                  checked={pdfPasswordsVisible}
                  onChange={(e) => setPdfPasswordsVisible(e.target.checked)}
                  className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <span className="font-sans">Afficher les mots de passe</span>
              </label>
              <p className="text-[10px] text-neutral-400 leading-normal pl-6.5 font-sans">
                Si coché, vos mots de passe seront visibles en clair dans le document généré. Sinon, ils seront masqués par "••••••••".
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPdfOptionsModal(false)}
                className="bg-white border border-neutral-200 px-3.5 py-1.5 hover:bg-neutral-100 rounded-lg text-xs font-semibold text-neutral-600 transition-colors cursor-pointer font-sans"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPdfOptionsModal(false);
                  generateAndExportPdf(pdfPasswordsVisible);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold shadow transition-colors cursor-pointer flex items-center gap-1.5 font-sans"
              >
                <Download size={13} />
                Générer le PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== CUSTOM DIALOGS FOR ANDROID WORKAROUNDS ==================== */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs">
          <div className="bg-white border border-neutral-200 rounded-2xl w-full max-w-sm shadow-xl p-6 space-y-4">
            <div className="flex items-center gap-2 pb-1 text-neutral-900">
              <AlertTriangle className={`w-5 h-5 ${confirmModal.danger ? 'text-red-500' : 'text-neutral-700'}`} />
              <h3 className="font-semibold text-sm tracking-tight">{confirmModal.title}</h3>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed whitespace-pre-line">
              {confirmModal.message}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              {!confirmModal.isAlertOnly && (
                <button
                  type="button"
                  onClick={() => setConfirmModal(null)}
                  className="bg-white border border-neutral-200 px-3.5 py-1.1 hover:bg-neutral-100 rounded-lg text-xs font-semibold text-neutral-600 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  confirmModal.onConfirm();
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold shadow transition-colors cursor-pointer text-white ${
                  confirmModal.danger ? 'bg-red-650 hover:bg-red-700' : 'bg-neutral-900 hover:bg-neutral-800'
                }`}
              >
                {confirmModal.confirmText || "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {promptModal && promptModal.isOpen && (
        <div 
          className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs"
          onClick={() => {
            setPromptModal(null);
            setPromptInputText('');
          }}
        >
          <div 
            className="bg-white border border-neutral-200 rounded-2xl w-full max-w-sm shadow-xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 pb-1 text-neutral-900">
              <Key className="w-5 h-5 text-neutral-700" />
              <h3 className="font-semibold text-sm tracking-tight">{promptModal.title}</h3>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed whitespace-pre-line">
              {promptModal.message}
            </p>
            <div>
              <input
                type={promptModal.isPassword ? "password" : "text"}
                autoFocus
                value={promptInputText}
                onChange={(e) => setPromptInputText(e.target.value)}
                placeholder={promptModal.placeholder || "Saisissez ici..."}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-neutral-900/40 focus:ring-1 focus:ring-neutral-900/10 font-mono"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const text = promptInputText;
                    setPromptInputText('');
                    if (promptModal.validateValue && text !== promptModal.validateValue) {
                      showCustomAlert("Validation échouée", `Veuillez saisir exactement "${promptModal.validateValue}" pour valider.`);
                      return;
                    }
                    promptModal.onConfirm(text);
                  }
                }}
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setPromptModal(null);
                  setPromptInputText('');
                }}
                className="bg-white border border-neutral-200 px-3.5 py-1.5 hover:bg-neutral-100 rounded-lg text-xs font-semibold text-neutral-600 transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  const text = promptInputText;
                  setPromptInputText('');
                  if (promptModal.validateValue && text !== promptModal.validateValue) {
                    showCustomAlert("Validation échouée", `Veuillez saisir exactement "${promptModal.validateValue}" pour valider.`);
                    return;
                  }
                  promptModal.onConfirm(text);
                }}
                className="bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-1.5 rounded-lg text-xs font-semibold shadow transition-colors cursor-pointer"
              >
                Valider
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className={`w-full py-4 ${isAuthScreen ? 'bg-black/10 border-t border-white/10 text-white/80' : 'bg-white border-t border-neutral-200 text-neutral-500'} text-center text-xs print:hidden shrink-0 transition-colors duration-500 z-10`}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>🛡️ <strong className={isAuthScreen ? 'text-white font-bold' : 'text-neutral-850'}>MDP local crypté</strong> • Aucune donnée n'est collectée.</span>
          <span>Version 1.0.0 • copyright Fred</span>
        </div>
      </footer>
    </div>
  );
}
