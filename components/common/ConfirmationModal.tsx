import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" aria-modal="true" role="dialog">
      <div className="bg-brand-gray p-6 sm:p-8 rounded-lg shadow-2xl border-2 border-brand-gold max-w-md w-full m-4">
        <h3 className="text-xl font-bold text-brand-gold mb-4">{title}</h3>
        <p className="text-gray-300 mb-6">{message}</p>
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 border border-gray-500 text-gray-300 rounded-md shadow-sm text-sm font-medium hover:bg-brand-light-gray focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-gray focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="py-2 px-4 border border-transparent bg-red-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-gray focus:ring-red-500"
          >
            Confirm Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;