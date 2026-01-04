import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileDown, ArrowLeft } from 'lucide-react';
import CsvImport from '../components/CsvImport';

export default function ImportCsv() {
  const navigate = useNavigate();
  const [showImport, setShowImport] = useState(false);

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Import CSV</h1>
        <p className="text-slate-400 mt-1 text-sm md:text-base">
          Importez vos transactions bancaires
        </p>
      </div>

      <div className="bg-slate-800 rounded-xl p-8 border border-slate-700">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/20 rounded-full mb-4">
            <FileDown className="w-8 h-8 text-blue-400" />
          </div>

          <h2 className="text-xl font-bold mb-2">Importer un releve bancaire</h2>
          <p className="text-slate-400 mb-8">
            Importez vos transactions depuis le fichier CSV de votre banque
          </p>

          <button
            onClick={() => setShowImport(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
          >
            Commencer l'import
          </button>
        </div>

        <div className="mt-12 border-t border-slate-700 pt-8">
          <h3 className="font-semibold mb-4">Banques supportees</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-700/50 rounded-lg">
              <h4 className="font-medium">UBS</h4>
              <p className="text-sm text-slate-400">Mapping automatique</p>
            </div>
            <div className="p-4 bg-slate-700/50 rounded-lg">
              <h4 className="font-medium">PostFinance</h4>
              <p className="text-sm text-slate-400">Mapping automatique</p>
            </div>
            <div className="p-4 bg-slate-700/50 rounded-lg">
              <h4 className="font-medium">Raiffeisen</h4>
              <p className="text-sm text-slate-400">Mapping automatique</p>
            </div>
            <div className="p-4 bg-slate-700/50 rounded-lg">
              <h4 className="font-medium">BCV</h4>
              <p className="text-sm text-slate-400">Mapping automatique</p>
            </div>
            <div className="p-4 bg-slate-700/50 rounded-lg">
              <h4 className="font-medium">Autres banques</h4>
              <p className="text-sm text-slate-400">Mapping manuel</p>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-700 pt-8">
          <h3 className="font-semibold mb-4">Comment ca marche</h3>
          <ol className="space-y-3 text-slate-300">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center text-sm font-medium">
                1
              </span>
              <span>Telechargez votre fichier CSV et selectionnez le compte</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center text-sm font-medium">
                2
              </span>
              <span>Detection automatique du format de votre banque</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center text-sm font-medium">
                3
              </span>
              <span>Verifiez ou ajustez le mapping des colonnes</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center text-sm font-medium">
                4
              </span>
              <span>Import des transactions - les doublons sont detectes automatiquement</span>
            </li>
          </ol>
        </div>
      </div>

      {showImport && (
        <CsvImport
          onClose={() => setShowImport(false)}
          onSuccess={() => navigate('/transactions')}
        />
      )}
    </div>
  );
}
