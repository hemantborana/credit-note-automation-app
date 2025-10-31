import React, { useState, useEffect } from 'react';
import { Template, Party } from '../../types';

interface TemplateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (templateData: Omit<Template, 'id'>) => void;
  template: Template | null;
  parties: Party[];
}

const TemplateFormModal: React.FC<TemplateFormModalProps> = ({ isOpen, onClose, onSave, template, parties }) => {
  const [formData, setFormData] = useState({
    name: '',
    partyId: '',
    purpose: '',
    cnPercentage: 0,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        partyId: template.partyId,
        purpose: template.purpose,
        cnPercentage: template.cnPercentage,
      });
    } else {
      setFormData({
        name: '',
        partyId: '',
        purpose: 'Volume Based Commercial Settlement - Net Sales Based Incentive',
        cnPercentage: 0,
      });
    }
  }, [template, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const isNumber = e.target.getAttribute('type') === 'number';
    setFormData(prev => ({ ...prev, [name]: isNumber ? parseFloat(value) || 0 : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedParty = parties.find(p => p.id === formData.partyId);
    if (!selectedParty) {
        // This should not happen with a select dropdown, but as a safeguard.
        alert('Please select a valid party.');
        return;
    }
    setIsSubmitting(true);
    await onSave({
        ...formData,
        partyName: selectedParty.name,
    });
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-gray p-6 sm:p-8 rounded-lg shadow-2xl border-2 border-brand-gold max-w-lg w-full m-4 overflow-y-auto max-h-[90vh]">
        <form onSubmit={handleSubmit}>
            <h3 className="text-xl font-bold text-brand-gold mb-6">{template ? 'Edit Template' : 'Add New Template'}</h3>
            <div className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-300">Template Name *</label>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full bg-brand-dark border border-brand-light-gray rounded-md shadow-sm py-2 px-3 text-white" />
                </div>
                <div>
                    <label htmlFor="partyId" className="block text-sm font-medium text-gray-300">Party *</label>
                    <select id="partyId" name="partyId" value={formData.partyId} onChange={handleChange} required className="mt-1 block w-full bg-brand-dark border border-brand-light-gray rounded-md shadow-sm py-2 px-3 text-white">
                        <option value="" disabled>Select a party</option>
                        {parties.map(party => (
                            <option key={party.id} value={party.id}>{party.name}</option>
                        ))}
                    </select>
                </div>
                 <div>
                    <label htmlFor="purpose" className="block text-sm font-medium text-gray-300">Purpose / Narration</label>
                    <textarea id="purpose" name="purpose" value={formData.purpose} onChange={handleChange} rows={3} className="mt-1 block w-full bg-brand-dark border border-brand-light-gray rounded-md shadow-sm py-2 px-3 text-white" />
                </div>
                 <div>
                    <label htmlFor="cnPercentage" className="block text-sm font-medium text-gray-300">Credit Note % *</label>
                    <input type="number" id="cnPercentage" name="cnPercentage" value={formData.cnPercentage} onChange={handleChange} required className="mt-1 block w-full bg-brand-dark border border-brand-light-gray rounded-md shadow-sm py-2 px-3 text-white" />
                </div>
            </div>
            <div className="mt-8 flex justify-end space-x-4">
                <button type="button" onClick={onClose} disabled={isSubmitting} className="py-2 px-4 border border-gray-500 text-gray-300 rounded-md">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="py-2 px-4 bg-brand-gold text-brand-dark rounded-md">{isSubmitting ? 'Saving...' : 'Save Template'}</button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default TemplateFormModal;
