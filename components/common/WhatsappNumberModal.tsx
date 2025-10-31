import React, { useState } from 'react';

interface WhatsappNumberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (number: string) => void;
  partyName: string;
}

const WhatsappNumberModal: React.FC<WhatsappNumberModalProps> = ({ isOpen, onClose, onConfirm, partyName }) => {
  const [number, setNumber] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (number.trim().length > 9) { // Basic validation
      onConfirm(number);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" aria-modal="true" role="dialog">
      <div className="bg-brand-gray p-6 sm:p-8 rounded-lg shadow-2xl border-2 border-brand-gold max-w-md w-full m-4">
        <h3 className="text-xl font-bold text-brand-gold mb-4">Enter WhatsApp Number</h3>
        <p className="text-gray-300 mb-6">
            No WhatsApp number is saved for <span className="font-bold text-white">{partyName}</span>. 
            Please enter the number below to share the credit note.
        </p>
        <div>
            <label htmlFor="whatsappNumber" className="block text-sm font-medium text-gray-300">WhatsApp Number (with country code)</label>
            <input
                type="tel"
                id="whatsappNumber"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="e.g., 919876543210"
                className="mt-1 block w-full bg-brand-dark border border-brand-light-gray rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-brand-gold focus:border-brand-gold sm:text-sm"
            />
        </div>
        <div className="mt-8 flex justify-end space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 border border-gray-500 text-gray-300 rounded-md shadow-sm text-sm font-medium hover:bg-brand-light-gray focus:outline-none"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="py-2 px-4 border border-transparent bg-green-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-green-700 focus:outline-none"
          >
            Share
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhatsappNumberModal;
