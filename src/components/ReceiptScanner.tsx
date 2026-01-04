import { useState, useRef } from 'react';
import { Camera, Loader2, AlertCircle } from 'lucide-react';
import { Sheet } from './ui/Sheet';
import { extractReceiptInfo, ReceiptExtraction } from '../lib/receiptScanner';
import Tesseract from 'tesseract.js';

interface ReceiptScannerProps {
  open: boolean;
  onClose: () => void;
  onExtracted: (extraction: ReceiptExtraction) => void;
}

export function ReceiptScanner({ open, onClose, onExtracted }: ReceiptScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image');
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setError(null);

    await processImage(file);
  };

  const processImage = async (file: File) => {
    try {
      setScanning(true);
      setProgress(0);
      setError(null);

      const result = await Tesseract.recognize(
        file,
        'fra+eng+deu',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 100));
            }
          },
          tessedit_pageseg_mode: Tesseract.PSM.AUTO,
          tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzàâäéèêëïîôùûüÿœæçÀÂÄÉÈÊËÏÎÔÙÛÜŸŒÆÇ.,-:/() ',
        }
      );

      const text = result.data.text;
      console.log('Texte OCR extrait:', text);

      if (!text || text.trim().length < 10) {
        setError('Impossible de lire le ticket. Veuillez réessayer avec une meilleure photo.');
        return;
      }

      const extraction = extractReceiptInfo(text);
      console.log('Extraction:', extraction);

      if (!extraction.amount && !extraction.merchantRaw) {
        setError('Aucune information extraite. Veuillez saisir manuellement.');
      }

      onExtracted(extraction);

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }

      onClose();
    } catch (err) {
      console.error('Erreur OCR:', err);
      setError('Erreur lors du scan. Veuillez réessayer.');
    } finally {
      setScanning(false);
      setProgress(0);
    }
  };

  const handleClose = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setError(null);
    setScanning(false);
    setProgress(0);
    onClose();
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Sheet open={open} onClose={handleClose} title="Scanner un ticket">
      <div className="space-y-6">
        <div className="bg-blue-900/30 border border-blue-700 rounded-xl p-4">
          <div className="flex gap-3">
            <AlertCircle className="text-blue-400 flex-shrink-0" size={20} />
            <div className="text-xs md:text-sm">
              <p className="text-blue-300 font-medium mb-1">Confidentialité</p>
              <p className="text-blue-200/80">
                Les images ne sont pas sauvegardées. Elles sont analysées localement puis supprimées immédiatement.
              </p>
            </div>
          </div>
        </div>

        {!previewUrl && !scanning && (
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />

            <button
              onClick={handleCameraClick}
              className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 px-6 py-4 rounded-xl transition-colors"
            >
              <Camera size={24} />
              <span className="text-lg font-medium">Prendre une photo</span>
            </button>

            <div className="text-center">
              <p className="text-slate-400 text-sm">ou</p>
            </div>

            <button
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.removeAttribute('capture');
                  fileInputRef.current.click();
                }
              }}
              className="w-full bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-xl transition-colors text-sm"
            >
              Choisir depuis la galerie
            </button>
          </div>
        )}

        {previewUrl && !scanning && (
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden bg-slate-800">
              <img
                src={previewUrl}
                alt="Aperçu"
                className="w-full h-auto max-h-96 object-contain"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCameraClick}
                className="flex-1 bg-slate-700 hover:bg-slate-600 px-4 py-3 rounded-xl transition-colors"
              >
                Reprendre
              </button>
            </div>
          </div>
        )}

        {scanning && (
          <div className="space-y-4">
            {previewUrl && (
              <div className="relative rounded-xl overflow-hidden bg-slate-800">
                <img
                  src={previewUrl}
                  alt="Analyse en cours"
                  className="w-full h-auto max-h-96 object-contain opacity-50"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                </div>
              </div>
            )}

            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <div className="flex items-center gap-3 mb-4">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                <p className="text-white font-medium">Analyse du ticket...</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Progression</span>
                  <span className="text-white font-medium">{progress}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <p className="text-slate-400 text-xs mt-4">
                Extraction du montant, de la date et du fournisseur...
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-red-400 flex-shrink-0" size={20} />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}
