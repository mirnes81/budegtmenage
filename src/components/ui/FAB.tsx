import { Plus } from 'lucide-react';

interface FABProps {
  onClick: () => void;
}

export function FAB({ onClick }: FABProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 md:bottom-8 right-6 w-16 h-16 bg-blue-600 hover:bg-blue-700 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all z-40 flex items-center justify-center"
      aria-label="Ajouter une transaction"
    >
      <Plus size={28} className="text-white" />
    </button>
  );
}
