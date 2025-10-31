import React, { useState, useEffect } from 'react';
import { CompanySettings } from '../types';
import { getSettings, updateSettings } from '../services/firebaseService';
import { useToast } from './common/Toast';
import SkeletonLoader from './common/SkeletonLoader';

const InputField: React.FC<{ label: string; name: keyof CompanySettings; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; required?: boolean }> =
({ label, name, value, onChange, required = false }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-300">{label}{required && ' *'}</label>
        <input
            type="text"
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            className="mt-1 block w-full bg-brand-dark border border-brand-light-gray rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-brand-gold focus:border-brand-gold sm:text-sm"
        />
    </div>
);

const Settings: React.FC = () => {
    const [settings, setSettings] = useState<CompanySettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                setLoading(true);
                const fetchedSettings = await getSettings();
                setSettings(fetchedSettings);
            } catch (error) {
                showToast('Failed to load settings.', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [showToast]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => prev ? { ...prev, [name]: value } : null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!settings) return;

        setIsSaving(true);
        try {
            await updateSettings(settings);
            showToast('Settings updated successfully!', 'success');
        } catch (error) {
            showToast('Failed to save settings.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
             <div className="max-w-3xl mx-auto animate-pulse">
                <div className="h-8 bg-brand-light-gray rounded w-1/3 mb-6"></div>
                <div className="space-y-4">
                    {[...Array(7)].map((_, i) => <SkeletonLoader key={i} type="table" />)}
                </div>
            </div>
        );
    }
    
    if (!settings) {
         return <div className="text-center p-10 text-red-500">Could not load settings.</div>;
    }

    return (
        <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-brand-gold mb-6 border-b-2 border-brand-gold pb-2">Application Settings</h2>
            <form onSubmit={handleSubmit} className="bg-brand-gray p-6 rounded-lg shadow-lg border-2 border-brand-light-gray space-y-6">
                 <p className="text-sm text-gray-400">These details will be used in all generated PDF documents and official communications.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label="Company Name" name="name" value={settings.name} onChange={handleChange} required />
                    <InputField label="Contact Info" name="contactInfo" value={settings.contactInfo} onChange={handleChange} required />
                    <InputField label="Address Line 1" name="addressLine1" value={settings.addressLine1} onChange={handleChange} required />
                    <InputField label="Address Line 2" name="addressLine2" value={settings.addressLine2} onChange={handleChange} required />
                    <InputField label="GSTIN" name="gstin" value={settings.gstin} onChange={handleChange} required />
                    <InputField label="UDYAM" name="udyam" value={settings.udyam} onChange={handleChange} required />
                    <InputField label="State Code" name="stateCode" value={settings.stateCode} onChange={handleChange} required />
                </div>
                 <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="py-2 px-6 border border-transparent bg-brand-gold text-brand-dark rounded-md shadow-sm text-sm font-medium hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-gray focus:ring-brand-gold disabled:opacity-50"
                    >
                        {isSaving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Settings;
