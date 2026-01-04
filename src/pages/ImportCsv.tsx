import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileDown, ArrowLeft } from 'lucide-react';
import CsvImport from '../components/CsvImport';

export default function ImportCsv() {
  const navigate = useNavigate();
  const [showImport, setShowImport] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/transactions')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Transactions
        </button>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <FileDown className="w-8 h-8 text-blue-600" />
            </div>

            <h1 className="text-2xl font-bold mb-2">Import Bank Statement</h1>
            <p className="text-gray-600 mb-8">
              Import transactions from your bank's CSV export file
            </p>

            <button
              onClick={() => setShowImport(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
            >
              Start Import
            </button>
          </div>

          <div className="mt-12 border-t pt-8">
            <h2 className="font-semibold mb-4">Supported Banks</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium">UBS</h3>
                <p className="text-sm text-gray-600">Automatic mapping</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium">PostFinance</h3>
                <p className="text-sm text-gray-600">Automatic mapping</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium">Raiffeisen</h3>
                <p className="text-sm text-gray-600">Automatic mapping</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium">BCV</h3>
                <p className="text-sm text-gray-600">Automatic mapping</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium">Other Banks</h3>
                <p className="text-sm text-gray-600">Manual mapping</p>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t pt-8">
            <h2 className="font-semibold mb-4">How it works</h2>
            <ol className="space-y-3 text-gray-700">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  1
                </span>
                <span>Upload your bank's CSV file and select the account</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </span>
                <span>We automatically detect your bank format and preview the data</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </span>
                <span>Verify or adjust the column mapping</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  4
                </span>
                <span>Import transactions - duplicates are automatically detected and skipped</span>
              </li>
            </ol>
          </div>
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
