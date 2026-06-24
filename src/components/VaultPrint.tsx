import React, { useState } from 'react';
import { PasswordEntry } from '../types';
import { FileText, Eye, EyeOff, X, ArrowLeft, Shield, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

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

  const [printPasswords, setPrintPasswords] = useState<boolean>(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => activeCategories.map((c) => c.id));
  const [notesLimit, setNotesLimit] = useState<boolean>(true);
  const [includeBleedingLines, setIncludeBleedingLines] = useState<boolean>(true); // Blank spaces to write new accounts by hand!
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Filter based on print configuration
  const filteredEntries = entries.filter((e) => selectedCategories.includes(e.category));

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handlePrint = async () => {
    const element = document.getElementById('vault-print-sheet');
    if (!element) return;

    setIsGenerating(true);

    try {
      // Force viewport width rendering inside html2canvas to simulate desktop layout context on mobile devices
      const canvas = await html2canvas(element, {
        scale: 2, // Retains high resolutions for clear printed fonts
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 1200, // Forces the A4 page layout structure beautifully on narrow screens (like Android)
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      
      // Calculate layout positioning
      const imgWidth = pdfWidth;
      const imgHeight = (canvasHeight * pdfWidth) / canvasWidth;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }

      pdf.save('sauvegarde_codes.pdf');
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      // Fallback to standard window printing if dynamic generation throws an error
      window.print();
    } finally {
      setIsGenerating(false);
    }
  };

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
      {/* 1. Header & Controls - HIDDEN DURING PRINTING VIA MEDIA QUERY */}
      <div className="max-w-4xl mx-auto mb-8 bg-white border border-neutral-200/80 p-6 rounded-xl shadow-sm print:hidden">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-600 hover:text-neutral-900 transition-all cursor-pointer"
              title="Retour"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 className="text-xl font-bold font-sans tracking-tight text-neutral-900 flex items-center gap-2">
                <FileText className="text-neutral-700" size={20} /> Préparation de l'Export PDF
              </h2>
              <p className="text-xs text-neutral-500">
                Configurez la mise en page et les options de votre document PDF sécurisé.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 px-3 border border-neutral-200 text-xs rounded-lg text-neutral-600 hover:bg-neutral-50 cursor-pointer"
          >
            Fermer l'aperçu
          </button>
        </div>

        {/* Configurations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-neutral-150 pt-5">
          <div className="space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-500">Options d'Affichage</h4>
            
            {/* Password toggle */}
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={printPasswords}
                onChange={(e) => setPrintPasswords(e.target.checked)}
                className="rounded text-neutral-900 bg-neutral-50 border-neutral-250 focus:ring-neutral-900/10 w-4.5 h-4.5 cursor-pointer"
              />
              <div className="text-xs">
                <span className="block font-medium text-neutral-800">Rendre lisible les mots de passe</span>
                <span className="text-neutral-500 text-[11px]">Si décoché, des fiches avec lignes vides s'afficheront pour les remplir à la main.</span>
              </div>
            </label>

            {/* Empty ledger lines */}
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={includeBleedingLines}
                onChange={(e) => setIncludeBleedingLines(e.target.checked)}
                className="rounded text-neutral-900 bg-neutral-50 border-neutral-250 focus:ring-neutral-900/10 w-4.5 h-4.5 cursor-pointer"
              />
              <div className="text-xs">
                <span className="block font-medium text-neutral-800">Ajouter des lignes vierges à la fin</span>
                <span className="text-neutral-500 text-[11px]">Ajoute 3 cartes vierges pré-quadrillées pour écrire de futurs comptes au stylo.</span>
              </div>
            </label>

            {/* Notes truncation */}
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={notesLimit}
                onChange={(e) => setNotesLimit(e.target.checked)}
                className="rounded text-neutral-900 bg-neutral-50 border-neutral-250 focus:ring-neutral-900/10 w-4.5 h-4.5 cursor-pointer"
              />
              <div className="text-xs">
                <span className="block font-medium text-neutral-800">Raccourcir les notes descriptives</span>
                <span className="text-neutral-500 text-[11px]">Limite la taille des notes pour s'assurer que les fiches restent compactes sur la page.</span>
              </div>
            </label>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-500">Filtrer par Catégorie</h4>
            <div className="flex flex-wrap gap-2.5">
              {activeCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`px-5 py-2.5 text-sm sm:text-xs font-semibold rounded-xl border-2 transition-all cursor-pointer ${
                    selectedCategories.includes(cat.id)
                      ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                      : 'bg-white text-neutral-500 border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  {renderCategoryLabel(cat.id)}
                </button>
              ))}
            </div>

            <div className="bg-amber-50 border border-amber-200/60 p-3 rounded-lg flex gap-3 text-amber-900 text-xs">
              <Shield className="text-amber-700 shrink-0 mt-0.5" size={16} />
              <p>
                <strong>Sécurité impérative :</strong> Une fois exporté ou imprimé, ce document contient vos accès sensibles en clair (si l'option est cochée). Stockez-le de manière hautement sécurisée.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-neutral-150 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-neutral-500 text-[11px] max-w-md">
            Génère un fichier PDF officiel et optimisé de vos codes d'accès, prêt à être téléchargé directement.
          </p>
          <button
            onClick={handlePrint}
            disabled={isGenerating}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-400 text-white font-medium px-6 py-3 rounded-xl shadow transition-all cursor-pointer whitespace-nowrap disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Génération du PDF...
              </>
            ) : (
              <>
                <Download size={18} /> Télécharger le PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Actual Sheet for Print / Preview */}
      <div id="vault-print-sheet" className="max-w-6xl mx-auto bg-white text-neutral-900 p-6 md:p-10 rounded-xl shadow-2xl border border-neutral-200 print:shadow-none print:border-0 print:p-0">
        
        {/* Style block dedicated to printing overrides and PDF color fixes (no oklch) */}
        <style>{`
          /* Universal clean HEX colors mapping to bypass oklch parsing issues in html2canvas */
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
              <h1 className="text-2xl font-black tracking-tight uppercase header-main-title">SAUVEGARDE HORS-LIGNE</h1>
              <p className="text-xs uppercase font-serif tracking-widest text-neutral-600 mt-1 header-subtitle">Export PDF de sécurité / Coffre-fort numérique</p>
            </div>
            <div className="text-right text-[10px] uppercase font-mono text-neutral-600 header-meta">
              <p>Généré le : {new Date().toLocaleDateString('fr-FR')}</p>
              <p>Clé : AES-GCM local-only backup</p>
            </div>
          </div>
        </div>

        {/* Print list */}
        {filteredEntries.length === 0 ? (
          <div className="py-12 text-center text-neutral-400 border border-dashed border-neutral-300 rounded-lg my-6">
            Aucun identifiant disponible correspondant aux filtres sélectionnés.
          </div>
        ) : (
          <div className="print-grid grid grid-cols-1 sm:grid-cols-2 gap-6">
            {filteredEntries.map((e) => (
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
                    <div className="space-y-1.5 text-xs font-mono my-2.5 text-neutral-800 value-text">
                      <div className="flex flex-col border-b border-dotted border-neutral-200 pb-0.5 border-dotted-custom">
                        <span className="text-neutral-400 text-[9px] uppercase font-semibold leading-none label-text">Log :</span>
                        <span className="font-bold truncate mt-0.5" title={e.username || ''}>{e.username || 'Non renseigné'}</span>
                      </div>
                      <div className="flex flex-col border-b border-dotted border-neutral-200 pb-0.5 border-dotted-custom">
                        <span className="text-neutral-400 text-[9px] uppercase font-semibold leading-none label-text">Code :</span>
                        {printPasswords ? (
                          <span className="font-bold text-red-700 bg-yellow-50 px-1 break-all mt-0.5 password-text-highlight">{e.password}</span>
                        ) : (
                          <span className="font-bold text-neutral-350 tracking-wider mt-0.5 label-text">____________</span>
                        )}
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
                        {notesLimit && e.notes.length > 150 ? `${e.notes.slice(0, 150)}...` : e.notes}
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
            {includeBleedingLines &&
              [1, 2, 3, 4].map((num) => (
                <div
                  key={`blank-${num}`}
                  className="print-card border border-dashed border-neutral-450 rounded-xl p-5 bg-white flex flex-col justify-between min-h-[200px] print-card-blank"
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[10px] font-serif italic text-neutral-400 blank-title">Écrit à la main...</span>
                      <span className="text-[10px] font-mono text-neutral-400 border border-neutral-200 px-2 py-0.5 rounded leading-none blank-badge">
                        MANUEL {num}
                      </span>
                    </div>

                    <div className="space-y-3.5 text-xs font-mono my-2.5 text-neutral-850 value-text">
                      <div className="flex flex-col border-b border-dotted border-neutral-300 pb-0.5 border-dotted-custom">
                        <span className="text-neutral-400 text-[9px] leading-none blank-label">TITRE :</span>
                        <span className="h-4.5"></span>
                      </div>
                      <div className="flex flex-col border-b border-dotted border-neutral-300 pb-0.5 border-dotted-custom">
                        <span className="text-neutral-400 text-[9px] leading-none blank-label">LOG :</span>
                        <span className="h-4.5"></span>
                      </div>
                      <div className="flex flex-col border-b border-dotted border-neutral-300 pb-0.5 border-dotted-custom">
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
