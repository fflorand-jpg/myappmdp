import React, { useEffect } from 'react';
import { PasswordEntry } from '../types';
import { ArrowLeft, Loader2, Printer, ShieldAlert } from 'lucide-react';

interface VaultPrintProps {
  entries: PasswordEntry[];
  onClose: () => void;
  categories?: { id: string; label: string; icon: string; color: string }[];
}

export default function VaultPrint({ entries, onClose, categories }: VaultPrintProps) {
  const activeCategories = categories || [
    { id: 'web', label: 'E-mail / Site Web', icon: '', color: 'blue' },
    { id: 'bank', label: 'Banque / Carte', icon: '', color: 'emerald' },
    { id: 'social', label: 'Réseau Social', icon: '', color: 'pink' },
    { id: 'wifi', label: 'Réseau Wi-Fi', icon: '', color: 'amber' },
    { id: 'work', label: 'Pro / Travail', icon: '', color: 'violet' },
    { id: 'other', label: 'Autre Secrète', icon: '', color: 'slate' }
  ];

  // Print automatically on load and go back to vault on complete/cancel
  useEffect(() => {
    // Let the DOM fully paint before printing to ensure CSS/fonts are ready
    const printTimeout = setTimeout(() => {
      window.print();
      onClose();
    }, 600);

    const handleAfterPrint = () => {
      onClose();
    };

    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      clearTimeout(printTimeout);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [onClose]);

  const renderCategoryLabel = (category: string) => {
    const found = activeCategories.find((c) => c.id === category);
    if (found) {
      return found.label;
    }
    switch (category) {
      case 'web':
        return 'Site Web';
      case 'bank':
        return 'Crédit / Banque';
      case 'social':
        return 'Réseau Social';
      case 'wifi':
        return 'Code Wi-Fi';
      case 'work':
        return 'Pro / Travail';
      case 'secure_note':
        return 'Note Sécurisée';
      default:
        return 'Autre Compte';
    }
  };

  return (
    <div className="bg-neutral-50/50 min-h-screen text-neutral-800 p-4 md:p-8 selection:bg-neutral-200">
      
      {/* 1. Print Status Overlay - Hidden during print */}
      <div className="max-w-xl mx-auto mb-8 bg-white border border-neutral-200/85 p-6 rounded-2xl shadow-lg print:hidden text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-indigo-50 border border-indigo-150 text-indigo-650 rounded-2xl flex items-center justify-center animate-bounce">
            <Printer size={24} />
          </div>
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-extrabold text-neutral-900 flex items-center justify-center gap-2">
            <Loader2 className="animate-spin text-indigo-600" size={16} />
            Impression Système en cours...
          </h3>
          <p className="text-xs text-neutral-500 leading-relaxed max-w-sm mx-auto">
            L'assistant d'impression natif de votre téléphone va s'ouvrir. Choisissez l'imprimante ou sélectionnez <strong>"Enregistrer au format PDF"</strong> pour sauvegarder le fichier localement.
          </p>
        </div>
        
        <div className="bg-amber-50 border border-amber-200/60 p-3 rounded-xl flex gap-2.5 text-amber-950 text-left text-[11px] max-w-sm mx-auto">
          <ShieldAlert className="text-amber-700 shrink-0 mt-0.5" size={15} />
          <p>
            <strong>Note de sécurité :</strong> Ce document va afficher vos identifiants et codes en clair. Conservez-le précieusement dans un endroit sûr ou supprimez-le après usage.
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-neutral-300 text-xs font-semibold rounded-xl text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-all cursor-pointer shadow-3xs"
          >
            <ArrowLeft size={13} />
            Retourner au coffre-fort
          </button>
        </div>
      </div>

      {/* 2. Actual Sheet for Print / Preview */}
      <div id="vault-print-sheet" className="max-w-6xl mx-auto bg-white text-neutral-900 p-6 md:p-10 rounded-xl shadow-xl border border-neutral-200 print:shadow-none print:border-0 print:p-0">
        
        {/* Style block dedicated to printing overrides and PDF color fixes (no oklch) */}
        <style>{`
          /* Universal clean HEX colors mapping to bypass oklch parsing issues */
          #vault-print-sheet {
            background-color: #ffffff !important;
            color: #171717 !important;
            border-color: #e5e5e5 !important;
          }
          #vault-print-sheet .print-card {
            background-color: #f9f9f9 !important;
            border-color: #d4d4d4 !important;
          }
          #vault-print-sheet .badge-cat {
            background-color: #e5e5e5 !important;
            color: #737373 !important;
          }
          #vault-print-sheet .title-text {
            color: #171717 !important;
            border-color: #d4d4d4 !important;
          }
          #vault-print-sheet .border-dotted-custom {
            border-color: #e5e5e5 !important;
          }
          #vault-print-sheet .label-text {
            color: #8a8a8a !important;
          }
          #vault-print-sheet .value-text {
            color: #171717 !important;
          }
          #vault-print-sheet .password-text-highlight {
            color: #b91c1c !important;
            background-color: #fef9c3 !important;
          }
          #vault-print-sheet .notes-container {
            background-color: #ffffff !important;
            border-color: #e5e5e5 !important;
            color: #404040 !important;
          }
          #vault-print-sheet .notes-title {
            color: #a3a3a3 !important;
          }
          #vault-print-sheet .card-footer {
            color: #a3a3a3 !important;
            border-color: #f5f5f5 !important;
          }
          #vault-print-sheet .print-card-blank {
            background-color: #ffffff !important;
            border-color: #a3a3a3 !important;
          }
          #vault-print-sheet .blank-title {
            color: #a3a3a3 !important;
          }
          #vault-print-sheet .blank-badge {
            color: #a3a3a3 !important;
            border-color: #e5e5e5 !important;
          }
          #vault-print-sheet .blank-label {
            color: #a3a3a3 !important;
          }
          #vault-print-sheet .blank-underline {
            border-color: #bcbcbc !important;
          }
          #vault-print-sheet .header-main-title {
            color: #000000 !important;
          }
          #vault-print-sheet .header-subtitle {
            color: #525252 !important;
          }
          #vault-print-sheet .header-meta {
            color: #525252 !important;
          }
          #vault-print-sheet .header-top-border {
            border-color: #171717 !important;
          }

          @media print {
            @page {
              size: A4 portrait;
              margin: 8mm 6mm;
            }
            body { 
              background: white !important; 
              color: black !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            .print\\:hidden {
              display: none !important;
            }
            /* Clean page breaks */
            .print-card {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            /* Force exactly 2 columns on print with slight staggered offset for beautiful vertical rhythm */
            .print-grid {
              display: grid !important;
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
              gap: 24px 20px !important;
              width: 100% !important;
              padding-bottom: 30px !important;
            }
            .print-grid > *:nth-child(2n) {
              margin-top: 20px !important;
            }
          }

          /* Apply the staggered offset on screen as well for sm viewports and above */
          @media (min-width: 640px) {
            .print-grid > *:nth-child(2n) {
              margin-top: 20px !important;
            }
            .print-grid {
              padding-bottom: 30px !important;
            }
          }
        `}</style>

        {/* Paper Header */}
        <div className="border-b-2 border-neutral-900 pb-4 mb-6 header-top-border">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-black tracking-tight uppercase header-main-title">SAUVEGARDE DE MES CODES</h1>
              <p className="text-xs uppercase font-serif tracking-widest text-neutral-600 mt-1 header-subtitle">Export PDF de sécurité / Coffre-fort numérique personnel</p>
            </div>
            <div className="text-right text-[10px] uppercase font-mono text-neutral-600 header-meta">
              <p>Généré le : {new Date().toLocaleDateString('fr-FR')}</p>
              <p>Format : AES-GCM local PDF export</p>
            </div>
          </div>
        </div>

        {/* Print list */}
        {entries.length === 0 ? (
          <div className="py-12 text-center text-neutral-400 border border-dashed border-neutral-300 rounded-lg my-6">
            Aucun identifiant disponible dans votre coffre-fort.
          </div>
        ) : (
          <div className="print-grid grid grid-cols-1 sm:grid-cols-2 gap-6">
            {entries.map((e) => (
              <div
                key={e.id}
                className="print-card border border-neutral-300 rounded-xl p-5 bg-neutral-50 flex flex-col justify-between min-h-[200px]"
              >
                <div>
                  <div className="flex flex-col gap-1 items-start mb-3">
                    <span className="text-[10px] uppercase font-mono text-neutral-500 bg-neutral-200 px-2 py-0.5 rounded leading-none badge-cat">
                      {renderCategoryLabel(e.category)}
                    </span>
                    <h3 className="font-bold text-sm tracking-tight capitalize border-b border-neutral-300 pb-1 pr-1 w-full truncate title-text">
                      {e.title}
                    </h3>
                  </div>

                  {e.category !== 'secure_note' && (
                    <div className="space-y-1.5 text-xs font-mono my-2.5 text-neutral-850 value-text">
                      <div className="flex flex-col border-b border-dotted border-neutral-200 pb-0.5 border-dotted-custom">
                        <span className="text-neutral-400 text-[9px] uppercase font-semibold leading-none label-text">Log :</span>
                        <span className="font-bold truncate mt-0.5" title={e.username || ''}>{e.username || 'Non renseigné'}</span>
                      </div>
                      <div className="flex flex-col border-b border-dotted border-neutral-200 pb-0.5 border-dotted-custom">
                        <span className="text-neutral-400 text-[9px] uppercase font-semibold leading-none label-text">Code :</span>
                        <span className="font-bold text-red-700 bg-yellow-50 px-1 break-all mt-0.5 password-text-highlight">{e.password}</span>
                      </div>
                    </div>
                  )}

                  {e.url && (
                    <div className="text-[10px] text-neutral-500 font-mono flex flex-col gap-0.5 truncate mb-1.5 value-text">
                      <span className="font-semibold text-neutral-400 text-[9px] uppercase leading-none label-text">Accès :</span>
                      <span className="truncate mt-0.5" title={e.url}>{e.url}</span>
                    </div>
                  )}

                  {e.notes && (
                    <div className="text-[10px] text-neutral-600 bg-white p-2 rounded border border-neutral-200 mt-2 italic font-serif notes-container">
                      <span className="font-bold font-mono not-italic text-[9px] text-neutral-400 block uppercase leading-none mb-0.5 notes-title">Notes :</span>
                      <span className="line-clamp-4 leading-relaxed block">
                        {e.notes}
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-[9px] text-neutral-400 font-mono text-right mt-4 pt-1.5 border-t border-neutral-105 card-footer">
                  Le : {new Date(e.updatedAt).toLocaleDateString('fr-FR')}
                </div>
              </div>
            ))}

            {/* Bleeding Lines - Blank entries to write down additions */}
            {[1, 2, 3].map((num) => (
              <div
                key={`blank-${num}`}
                className="print-card border border-dashed border-neutral-350 rounded-xl p-5 bg-white flex flex-col justify-between min-h-[200px] print-card-blank"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-serif italic text-neutral-400 blank-title">Écrit à la main...</span>
                    <span className="text-[10px] font-mono text-neutral-400 border border-neutral-200 px-2 py-0.5 rounded leading-none blank-badge">
                      MANUEL {num}
                    </span>
                  </div>

                  <div className="space-y-3.5 text-xs font-mono my-2.5 text-neutral-850 value-text">
                    <div className="flex flex-col border-b border-dotted border-neutral-350 pb-0.5 border-dotted-custom">
                      <span className="text-neutral-400 text-[9px] leading-none blank-label">TITRE :</span>
                      <span className="h-4.5"></span>
                    </div>
                    <div className="flex flex-col border-b border-dotted border-neutral-350 pb-0.5 border-dotted-custom">
                      <span className="text-neutral-400 text-[9px] leading-none blank-label">LOG :</span>
                      <span className="h-4.5"></span>
                    </div>
                    <div className="flex flex-col border-b border-dotted border-neutral-350 pb-0.5 border-dotted-custom">
                      <span className="text-neutral-400 text-[9px] leading-none blank-label">CODE :</span>
                      <span className="h-4.5"></span>
                    </div>
                  </div>
                </div>
                <div className="text-[8px] text-neutral-450 font-mono text-right mt-2 blank-label">
                  Ajout manuscrit
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
