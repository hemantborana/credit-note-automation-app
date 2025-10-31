import React, { useState, useEffect } from 'react';
import { Party } from '../../types';

interface PartyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (partyData: Omit<Party, 'id'>) => void;
  party: Party | null;
}

const InputField: React.FC<{ label: string; name: keyof Omit<Party, 'id'>; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; required?: boolean, type?: string, rows?: number }> =
({ label, name, value, onChange, required = false, type = 'text', rows }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-300">{label}{required && ' *'}</label>
        {type === 'textarea' ? (
             <textarea
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                rows={rows}
                className="mt-1 block w-full bg-brand-dark border border-brand-light-gray rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-brand-gold focus:border-brand-gold sm:text-sm"
            />
        ) : (
            <input
                type={type}
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                className="mt-1 block w-full bg-brand-dark border border-brand-light-gray rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-brand-gold focus:border-brand-gold sm:text-sm"
            />
        )}
    </div>
);


const PartyFormModal: React.FC<PartyFormModalProps> = ({ isOpen, onClose, onSave, party }) => {
  const [formData, setFormData] = useState({
    name: '',
    address1: '',
    address2: '',
    address3: '',
    city: '',
    email: '',
    whatsappNumber: '',
    gstin: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (party) {
      setFormData({
        name: party.name,
        address1: party.address1,
        address2: party.address2,
        address3: party.address3 || '',
        city: party.city,
        email: party.email || '',
        whatsappNumber: party.whatsappNumber || '',
        gstin: party.gstin || '',
      });
    } else {
      setFormData({
        name: '',
        address1: '',
        address2: '',
        address3: '',
        city: '',
        email: '',
        whatsappNumber: '',
        gstin: '',
      });
    }
  }, [party, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSave(formData);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" aria-modal="true" role="dialog">
      <div className="bg-brand-gray p-6 sm:p-8 rounded-lg shadow-2xl border-2 border-brand-gold max-w-lg w-full m-4 overflow-y-auto max-h-[90vh]">
        <form onSubmit={handleSubmit}>
            <h3 className="text-xl font-bold text-brand-gold mb-6">{party ? 'Edit Party' : 'Add New Party'}</h3>
            <div className="space-y-4">
                <InputField label="Party Name" name="name" value={formData.name} onChange={handleChange} required />
                <InputField label="Address Line 1" name="address1" value={formData.address1} onChange={handleChange} required />
                <InputField label="Address Line 2" name="address2" value={formData.address2} onChange={handleChange} required />
                <InputField label="Address Line 3" name="address3" value={formData.address3} onChange={handleChange} />
                <InputField label="City" name="city" value={formData.city} onChange={handleChange} required />
                <InputField label="GSTIN" name="gstin" value={formData.gstin} onChange={handleChange} />
                <InputField label="Email Address" name="email" value={formData.email} onChange={handleChange} type="email" />
                <InputField label="WhatsApp Number (e.g., 919876543210)" name="whatsappNumber" value={formData.whatsappNumber} onChange={handleChange} type="tel" />
            </div>
            <div className="mt-8 flex justify-end space-x-4">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="py-2 px-4 border border-gray-500 text-gray-300 rounded-md shadow-sm text-sm font-medium hover:bg-brand-light-gray focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-gray focus:ring-gray-500 disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="py-2 px-4 border border-transparent bg-brand-gold text-brand-dark rounded-md shadow-sm text-sm font-medium hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-gray focus:ring-brand-gold disabled:opacity-50"
                >
                    {isSubmitting ? 'Saving...' : 'Save Party'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default PartyFormModal;