import React, { useState, useEffect, useMemo } from 'react';
import { Party, SheetRowData } from '../../types';
import { getCreditNotes } from '../../services/googleScriptService';
import SkeletonLoader from './SkeletonLoader';

interface PartyLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  party: Party;
}

const PartyLedgerModal: React.FC<PartyLedgerModalProps> = ({ isOpen, onClose, party }) => {
  const [creditNotes, setCreditNotes] = useState<SheetRowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchNotes = async () => {
        try {
          setLoading(true);
          setError(null);
          const allNotes = await getCreditNotes();
          const partyNotes = allNotes.filter(note => note.party_name === party.name);
          setCreditNotes(partyNotes);
        } catch (err) {
          setError('Failed to fetch credit note history.');
        } finally {
          setLoading(false);
        }
      };
      fetchNotes();
    }
  }, [isOpen, party.name]);

  const totalCreditAmount = useMemo(() => {
    return creditNotes.reduce((total, note) => total + Number(note.final_amount), 0);
  }, [creditNotes]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
      <div className="bg-brand-gray p-6 rounded-lg shadow-2xl border-2 border-brand-gold w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-brand-light-gray">
          <div>
            <h3 className="text-xl font-bold text-brand-gold">Credit Note Ledger</h3>
            <p className="text-white">{party.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-white" aria-label="Close modal">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <SkeletonLoader type="table" />
          ) : error ? (
            <p className="text-red-500 text-center">{error}</p>
          ) : creditNotes.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No credit notes found for this party.</p>
          ) : (
            <table className="min-w-full divide-y divide-brand-light-gray">
              <thead className="bg-brand-light-gray sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-brand-gold uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-brand-gold uppercase tracking-wider">CN Number</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-brand-gold uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-brand-gold uppercase tracking-wider">View</th>
                </tr>
              </thead>
              <tbody className="bg-brand-gray divide-y divide-brand-light-gray">
                {creditNotes.map(note => (
                  <tr key={note.cn_number}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{note.date}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-white font-medium">{note.cn_number}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300 text-right">{`₹${Number(note.final_amount).toLocaleString('en-IN')}`}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                        <a href={note.pdf_link} target="_blank" rel="noopener noreferrer" className="text-brand-gold hover:text-yellow-300">PDF</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        <div className="mt-4 pt-4 border-t border-brand-light-gray flex justify-end items-center">
            <span className="text-gray-300 mr-4">Total Credit Issued:</span>
            <span className="text-xl font-bold text-brand-gold">
                {`₹${totalCreditAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
            </span>
        </div>
      </div>
    </div>
  );
};

export default PartyLedgerModal;
