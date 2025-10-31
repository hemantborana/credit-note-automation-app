
import React from 'react';

interface PdfPreviewModalProps {
  pdfData: string;
  onClose: () => void;
}

const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({ pdfData, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" aria-modal="true" role="dialog">
      <div className="bg-brand-gray p-4 rounded-lg shadow-2xl border-2 border-brand-gold w-[90vw] h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-brand-gold">PDF Preview</h3>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div className="flex-1">
          <iframe
            src={pdfData}
            title="Credit Note Preview"
            className="w-full h-full border-0 rounded"
          />
        </div>
      </div>
    </div>
  );
};

export default PdfPreviewModal;
