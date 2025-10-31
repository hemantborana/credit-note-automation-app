import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Party, CreditNoteData, CompanySettings, Template } from '../types';
import { getParties, getCnCounter, updatePartyEmail, incrementCnCounter, getSettings, getTemplates, addTemplate, addAuditLog } from '../services/firebaseService';
import { generatePdf } from '../services/pdfGeneratorService';
import { processCreditNote } from '../services/googleScriptService';
import { useToast } from './common/Toast';
import PdfPreviewModal from './common/PdfPreviewModal';
import SkeletonLoader from './common/SkeletonLoader';

const InputField: React.FC<{ label: string; value: string | number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string; disabled?: boolean, required?: boolean }> = 
({ label, value, onChange, type = 'text', disabled = false, required = true }) => (
    <div>
        <label className="block text-sm font-medium text-gray-300">{label}</label>
        <input
            type={type}
            value={value}
            onChange={onChange}
            disabled={disabled}
            required={required}
            className="mt-1 block w-full bg-brand-gray border border-brand-light-gray rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-brand-gold focus:border-brand-gold sm:text-sm disabled:opacity-50 disabled:bg-brand-dark"
        />
    </div>
);

const formatDate = (date: Date): string => {
    // This function now correctly handles timezones by working with UTC dates.
    // It prevents the common issue where local timezones can shift the date by a day.
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};


const getFinancialQuarterDetails = (date: Date) => {
    const month = date.getMonth(); // 0-11
    const year = date.getFullYear();
    let quarter: 1 | 2 | 3 | 4;
    let startYear: number;
    let endYear: number;

    if (month >= 0 && month <= 2) { // Jan-Mar
        quarter = 4;
        startYear = year - 1;
        endYear = year;
    } else if (month >= 3 && month <= 5) { // Apr-Jun
        quarter = 1;
        startYear = year;
        endYear = year + 1;
    } else if (month >= 6 && month <= 8) { // Jul-Sep
        quarter = 2;
        startYear = year;
        endYear = year + 1;
    } else { // Oct-Dec
        quarter = 3;
        startYear = year;
        endYear = year + 1;
    }
    return { quarter, startYear, endYear };
};

const getPreviousQuarterDateRange = () => {
    const today = new Date();
    const { quarter, startYear } = getFinancialQuarterDetails(today);

    let fromDate: Date, toDate: Date;
    let prevQuarter: 1 | 2 | 3 | 4;
    let prevStartYear: number;
    let prevEndYear: number;

    if (quarter === 1) { // Current is Q1 (Apr-Jun), prev is Q4
        prevQuarter = 4;
        prevStartYear = startYear - 1;
        prevEndYear = startYear;
        fromDate = new Date(Date.UTC(prevStartYear, 0, 1)); // Jan 1
        toDate = new Date(Date.UTC(prevStartYear, 2, 31));   // Mar 31
    } else if (quarter === 2) { // Current is Q2 (Jul-Sep), prev is Q1
        prevQuarter = 1;
        prevStartYear = startYear;
        prevEndYear = startYear + 1;
        fromDate = new Date(Date.UTC(prevStartYear, 3, 1)); // Apr 1
        toDate = new Date(Date.UTC(prevStartYear, 5, 30));   // Jun 30
    } else if (quarter === 3) { // Current is Q3 (Oct-Dec), prev is Q2
        prevQuarter = 2;
        prevStartYear = startYear;
        prevEndYear = startYear + 1;
        fromDate = new Date(Date.UTC(prevStartYear, 6, 1)); // Jul 1
        toDate = new Date(Date.UTC(prevStartYear, 8, 30));   // Sep 30
    } else { // Current is Q4 (Jan-Mar), prev is Q3
        prevQuarter = 3;
        prevStartYear = startYear;
        prevEndYear = startYear + 1;
        fromDate = new Date(Date.UTC(prevStartYear, 9, 1)); // Oct 1
        toDate = new Date(Date.UTC(prevStartYear, 11, 31));  // Dec 31
    }

    const monthLabel = `Q${prevQuarter} ${prevStartYear}-${String(prevEndYear).slice(2)}`;
    
    return {
        period_from: formatDate(fromDate),
        period_to: formatDate(toDate),
        month: monthLabel
    };
};

const getPreviousMonthDateRange = () => {
    const today = new Date();
    const fromDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1));
    const toDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 0)); // Day 0 of current month is last day of previous
    
    const monthLabel = fromDate.toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'UTC' });

    return {
        period_from: formatDate(fromDate),
        period_to: formatDate(toDate),
        month: monthLabel
    };
};


const CreateCN: React.FC = () => {
    const [parties, setParties] = useState<Party[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedParty, setSelectedParty] = useState<Party | null>(null);
    const [cnCounter, setCnCounter] = useState<number>(0);
    const [settings, setSettings] = useState<CompanySettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [partyEmail, setPartyEmail] = useState('');
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [pdfDataUri, setPdfDataUri] = useState('');
    const [partySearch, setPartySearch] = useState('');
    const [suggestionsVisible, setSuggestionsVisible] = useState(false);
    const [isTemplateModalOpen, setTemplateModalOpen] = useState(false);
    const [isSaveTemplateModalOpen, setSaveTemplateModalOpen] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');
    const [dateMode, setDateMode] = useState<'quarter' | 'month' | 'custom'>('quarter');
    const partyInputContainerRef = useRef<HTMLDivElement>(null);
    const { showToast } = useToast();
    
    const initialDates = useMemo(() => getPreviousQuarterDateRange(), []);
    
    const [formState, setFormState] = useState({
        date: new Date().toISOString().split('T')[0],
        period_from: initialDates.period_from,
        period_to: initialDates.period_to,
        month: initialDates.month,
        purpose: 'Volume Based Commercial Settlement - Net Sales Based Incentive',
        net_sales: 0,
        cn_percentage: 0,
    });

    const cnNumber = useMemo(() => `KA-EN-CN${cnCounter}`, [cnCounter]);

    const { credit_amount, round_off, final_amount } = useMemo(() => {
        const credit = (formState.net_sales * formState.cn_percentage) / 100;
        const final = Math.round(credit);
        const round = final - credit;
        return {
            credit_amount: credit,
            round_off: round,
            final_amount: final
        };
    }, [formState.net_sales, formState.cn_percentage]);

    const filteredParties = useMemo(() => {
        if (!partySearch || selectedParty) return [];
        return parties.filter(p => p.name.toLowerCase().includes(partySearch.toLowerCase()));
    }, [parties, partySearch, selectedParty]);


    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [fetchedParties, fetchedCounter, fetchedSettings, fetchedTemplates] = await Promise.all([getParties(), getCnCounter(), getSettings(), getTemplates()]);
                setParties(fetchedParties);
                setCnCounter(fetchedCounter + 1);
                setSettings(fetchedSettings);
                setTemplates(fetchedTemplates);
            } catch (error) {
                console.error("Failed to fetch initial data:", error);
                showToast("Failed to load data. Please check console for errors.", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [showToast]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (partyInputContainerRef.current && !partyInputContainerRef.current.contains(event.target as Node)) {
                setSuggestionsVisible(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [partyInputContainerRef]);

    useEffect(() => {
        if (dateMode === 'quarter') {
            const { period_from, period_to, month } = getPreviousQuarterDateRange();
            setFormState(prev => ({ ...prev, period_from, period_to, month }));
        } else if (dateMode === 'month') {
            const { period_from, period_to, month } = getPreviousMonthDateRange();
            setFormState(prev => ({ ...prev, period_from, period_to, month }));
        }
        // For 'custom', we don't change anything, preserving user input.
    }, [dateMode]);
    
    const handlePartySelect = (party: Party) => {
        setSelectedParty(party);
        setPartySearch(party.name);
        setPartyEmail(party.email || '');
        setSuggestionsVisible(false);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setPartySearch(value);
        setSuggestionsVisible(true);
    };

    const clearSelectedParty = () => {
        setSelectedParty(null);
        setPartySearch('');
        setPartyEmail('');
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;
        setFormState(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value,
        }));
    };
    
    const handlePreview = async () => {
        if (!selectedParty) {
            showToast('Please select a party.', 'error');
            return;
        }
        if (!settings) {
            showToast('Company settings not loaded. Cannot generate PDF.', 'error');
            return;
        }
        
        const cnData: CreditNoteData = {
            cn_number: cnNumber,
            date: formState.date,
            party_name: selectedParty.name,
            party_address1: selectedParty.address1,
            party_address2: selectedParty.address2,
            party_city: selectedParty.city,
            period_from: formState.period_from,
            period_to: formState.period_to,
            month: formState.month,
            purpose: formState.purpose,
            net_sales: formState.net_sales,
            cn_percentage: formState.cn_percentage,
            credit_amount: credit_amount,
            round_off: round_off,
            final_amount: final_amount,
        };

        const pdfBase64 = await generatePdf(cnData, settings, false);
        setPdfDataUri(`data:application/pdf;base64,${pdfBase64}`);
        setPreviewModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedParty) {
            showToast('Please select a party.', 'error');
            return;
        }
        if (formState.net_sales <= 0 || formState.cn_percentage <= 0) {
            showToast('Net Sales and CN % must be greater than zero.', 'error');
            return;
        }
        setEmailModalOpen(true);
    };
    
    const confirmAndSend = async () => {
        if (!selectedParty || !settings) return;
        setSubmitting(true);
        setEmailModalOpen(false);
        try {
            if(partyEmail && partyEmail !== selectedParty.email) {
                await updatePartyEmail(selectedParty.id, partyEmail);
            }

            const cnData: CreditNoteData = {
                cn_number: cnNumber,
                date: formState.date,
                party_name: selectedParty.name,
                party_address1: selectedParty.address1,
                party_address2: selectedParty.address2,
                party_city: selectedParty.city,
                period_from: formState.period_from,
                period_to: formState.period_to,
                month: formState.month,
                purpose: formState.purpose,
                net_sales: formState.net_sales,
                cn_percentage: formState.cn_percentage,
                credit_amount: credit_amount,
                round_off: round_off,
                final_amount: final_amount,
                party_email: partyEmail,
                party_whatsapp: selectedParty.whatsappNumber,
            };

            const partyPdfBase64 = await generatePdf(cnData, settings, false);
            const printerPdfBase64 = await generatePdf(cnData, settings, true);
            
            await processCreditNote({cnData, partyPdfBase64, printerPdfBase64});
            await incrementCnCounter();
            
            // Use the CN date for the audit log timestamp
            const timestampForLog = `${cnData.date}T00:00:00.000Z`;
            await addAuditLog(
                'CREATE_CN', 
                `Credit Note ${cnNumber} created for ${selectedParty.name} with amount ₹${final_amount.toLocaleString('en-IN')}.`,
                timestampForLog
            );

            showToast(`Credit Note ${cnNumber} processed successfully!`, 'success');
            // Reset form
            setSelectedParty(null);
            setPartySearch('');
            setCnCounter(prev => prev + 1);
            
            // Reset date mode to default (quarter) and recalculate dates for the next entry
            setDateMode('quarter');
            const newQuarterDates = getPreviousQuarterDateRange();
            setFormState({
                date: new Date().toISOString().split('T')[0],
                period_from: newQuarterDates.period_from,
                period_to: newQuarterDates.period_to,
                month: newQuarterDates.month,
                purpose: 'Volume Based Commercial Settlement - Net Sales Based Incentive',
                net_sales: 0,
                cn_percentage: 0,
            });

        } catch(error: any) {
            console.error("Submission failed:", error);
            showToast(`Submission failed: ${error.message}`, 'error');
        } finally {
            setSubmitting(false);
        }
    };
    
    const handleLoadTemplate = (template: Template) => {
        const partyToSelect = parties.find(p => p.id === template.partyId);
        if (partyToSelect) {
            handlePartySelect(partyToSelect);
            setFormState(prev => ({
                ...prev,
                purpose: template.purpose,
                cn_percentage: template.cnPercentage,
            }));
            showToast(`Template '${template.name}' loaded.`, 'success');
            setTemplateModalOpen(false);
        } else {
            showToast(`Could not find party associated with this template.`, 'error');
        }
    };
    
    const handleSaveTemplate = async () => {
        if (!selectedParty || !newTemplateName) {
            showToast('Please select a party and provide a template name.', 'error');
            return;
        }
        
        const templateData: Omit<Template, 'id'> = {
            name: newTemplateName,
            partyId: selectedParty.id,
            partyName: selectedParty.name,
            purpose: formState.purpose,
            cnPercentage: formState.cn_percentage,
        };
        
        try {
            await addTemplate(templateData);
            const updatedTemplates = await getTemplates();
            setTemplates(updatedTemplates);
            showToast('Template saved successfully!', 'success');
            setSaveTemplateModalOpen(false);
            setNewTemplateName('');
        } catch (error: any) {
            showToast(`Failed to save template: ${error.message}`, 'error');
        }
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto bg-brand-gray p-6 rounded-lg shadow-lg border-2 border-brand-light-gray animate-pulse">
                <div className="h-8 bg-brand-light-gray rounded w-1/3 mb-6"></div>
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SkeletonLoader type="table" />
                        <SkeletonLoader type="table" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <SkeletonLoader type="table" />
                        <SkeletonLoader type="table" />
                        <SkeletonLoader type="table" />
                    </div>
                    <SkeletonLoader type="table" />
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SkeletonLoader type="table" />
                        <SkeletonLoader type="table" />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto bg-brand-gray p-6 rounded-lg shadow-lg border-2 border-brand-light-gray">
            <div className="flex justify-between items-center mb-6 border-b-2 border-brand-gold pb-2">
                 <h2 className="text-2xl font-bold text-brand-gold">Create New Credit Note</h2>
                 <button onClick={() => setTemplateModalOpen(true)} className="py-2 px-4 border border-brand-gold text-brand-gold rounded-md shadow-sm text-sm font-medium hover:bg-brand-gold hover:text-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-gray focus:ring-brand-gold disabled:opacity-50">
                    Load Template
                </button>
            </div>
           
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Party Selection */}
                    <div ref={partyInputContainerRef} className="relative">
                        <label htmlFor="party-search" className="block text-sm font-medium text-gray-300">Party</label>
                        <div className="relative">
                             <input
                                id="party-search"
                                type="text"
                                placeholder="Search for a party..."
                                value={partySearch}
                                onChange={handleSearchChange}
                                onFocus={() => setSuggestionsVisible(true)}
                                disabled={!!selectedParty}
                                required
                                autoComplete="off"
                                className="mt-1 block w-full bg-brand-dark border border-brand-light-gray rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-brand-gold focus:border-brand-gold sm:text-sm disabled:bg-brand-gray disabled:opacity-70"
                            />
                            {selectedParty && (
                                <button type="button" onClick={clearSelectedParty} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white">
                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                        
                        {suggestionsVisible && filteredParties.length > 0 && (
                            <ul className="absolute z-10 w-full bg-brand-gray border border-brand-light-gray rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
                                {filteredParties.map(party => (
                                    <li key={party.id} onClick={() => handlePartySelect(party)} className="cursor-pointer select-none relative p-3 text-white hover:bg-brand-light-gray">
                                        <p className="font-medium block truncate">{party.name}</p>
                                        <p className="text-xs text-gray-400">{party.city}</p>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {selectedParty && (
                             <div className="mt-2 text-xs text-gray-400 p-2 border border-dashed border-brand-light-gray rounded">
                                <p>{selectedParty.address1}</p>
                                <p>{selectedParty.address2}</p>
                                <p>{selectedParty.city}</p>
                             </div>
                        )}
                    </div>
                     <InputField label="CN Number" value={cnNumber} onChange={()=>{}} disabled={true} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                    <InputField 
                        label="CN Date" 
                        type="date" 
                        value={formState.date} 
                        onChange={(e) => setFormState(p => ({...p, date: e.target.value}))} 
                    />
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Scheme Period Type</label>
                        <div className="flex space-x-2 rounded-md bg-brand-light-gray p-1">
                            {(['quarter', 'month', 'custom'] as const).map(mode => (
                                <button
                                    key={mode}
                                    type="button"
                                    onClick={() => setDateMode(mode)}
                                    className={`w-full px-3 py-1.5 text-sm font-medium rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 focus-visible:ring-offset-brand-light-gray ${
                                        dateMode === mode ? 'bg-brand-gold text-brand-dark shadow' : 'text-gray-300 hover:bg-brand-gray'
                                    }`}
                                >
                                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <InputField 
                        label="Scheme From" 
                        type="date" 
                        value={formState.period_from} 
                        onChange={(e) => setFormState(p => ({...p, period_from: e.target.value}))}
                        disabled={dateMode !== 'custom'}
                    />
                    <InputField 
                        label="Scheme To" 
                        type="date" 
                        value={formState.period_to} 
                        onChange={(e) => setFormState(p => ({...p, period_to: e.target.value}))}
                        disabled={dateMode !== 'custom'}
                    />
                    <InputField 
                        label="Month / Period Label" 
                        type="text" 
                        value={formState.month} 
                        onChange={(e) => setFormState(p => ({...p, month: e.target.value}))}
                        disabled={dateMode !== 'custom'}
                    />
                </div>

                 <div>
                    <label className="block text-sm font-medium text-gray-300">Purpose / Narration</label>
                    <textarea name="purpose" value={formState.purpose} onChange={handleInputChange} rows={3}
                        className="mt-1 block w-full bg-brand-gray border border-brand-light-gray rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-brand-gold focus:border-brand-gold sm:text-sm"
                    />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <InputField label="Net Sales Amount (Excl. GST)" type="number" value={formState.net_sales} onChange={(e) => setFormState(p => ({...p, net_sales: parseFloat(e.target.value) || 0}))} />
                     <InputField label="Credit Note %" type="number" value={formState.cn_percentage} onChange={(e) => setFormState(p => ({...p, cn_percentage: parseFloat(e.target.value) || 0}))} />
                </div>
                
                <div className="p-4 bg-brand-dark border-2 border-brand-light-gray rounded-lg space-y-2 text-gray-300">
                    <h3 className="text-lg font-semibold text-brand-gold">Calculation Summary</h3>
                    <div className="flex justify-between"><p>Credit Amount:</p> <p>{credit_amount.toFixed(2)}</p></div>
                    <div className="flex justify-between"><p>Round Off:</p> <p>{round_off.toFixed(2)}</p></div>
                    <div className="flex justify-between font-bold text-white"><p>Final CN Amount:</p> <p>{final_amount.toFixed(2)}</p></div>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                    <button 
                        type="button" 
                        onClick={() => setSaveTemplateModalOpen(true)}
                        disabled={!selectedParty || formState.cn_percentage <= 0}
                        className="py-2 px-4 border border-brand-gold text-brand-gold rounded-md shadow-sm text-sm font-medium hover:bg-brand-gold hover:text-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-gray focus:ring-brand-gold disabled:opacity-50"
                    >
                        Save as Template
                    </button>
                    <button 
                        type="button" 
                        onClick={handlePreview} 
                        disabled={!selectedParty || !settings}
                        className="py-2 px-4 border border-brand-gold text-brand-gold rounded-md shadow-sm text-sm font-medium hover:bg-brand-gold hover:text-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-gray focus:ring-brand-gold disabled:opacity-50"
                    >
                        Preview CN
                    </button>
                    <button 
                        type="submit" 
                        disabled={submitting || !selectedParty}
                        className="py-2 px-4 border border-transparent bg-brand-gold text-brand-dark rounded-md shadow-sm text-sm font-medium hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-gray focus:ring-brand-gold disabled:opacity-50"
                    >
                        {submitting ? 'Processing...' : 'Generate & Send CN'}
                    </button>
                </div>
            </form>

            {previewModalOpen && (
                <PdfPreviewModal pdfData={pdfDataUri} onClose={() => setPreviewModalOpen(false)} />
            )}

            {isTemplateModalOpen && (
                 <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-brand-gray p-6 rounded-lg shadow-2xl border-2 border-brand-gold w-full max-w-2xl max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-brand-gold">Load from Template</h3>
                            <button onClick={() => setTemplateModalOpen(false)} className="text-gray-300 hover:text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg></button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                           {templates.length > 0 ? (
                                <ul className="divide-y divide-brand-light-gray">
                                    {templates.map(template => (
                                        <li key={template.id} onClick={() => handleLoadTemplate(template)} className="p-3 cursor-pointer hover:bg-brand-light-gray rounded-md">
                                            <p className="font-semibold text-white">{template.name}</p>
                                            <p className="text-sm text-gray-400">{template.partyName}</p>
                                        </li>
                                    ))}
                                </ul>
                           ): (
                               <p className="text-center text-gray-400 py-8">No templates saved yet.</p>
                           )}
                        </div>
                    </div>
                 </div>
            )}
            
            {isSaveTemplateModalOpen && (
                 <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-brand-gray p-8 rounded-lg shadow-2xl border-2 border-brand-gold max-w-lg w-full">
                        <h3 className="text-xl font-bold text-brand-gold mb-4">Save as Template</h3>
                        <p className="text-gray-300 mb-4">
                           Enter a name for this template. The party, purpose, and CN% will be saved.
                        </p>
                        <InputField 
                            label="Template Name" 
                            type="text" 
                            value={newTemplateName} 
                            onChange={(e) => setNewTemplateName(e.target.value)}
                        />
                        <div className="mt-6 flex justify-end space-x-4">
                           <button type="button" onClick={() => setSaveTemplateModalOpen(false)} className="py-2 px-4 border border-gray-500 text-gray-300 rounded-md">Cancel</button>
                           <button type="button" onClick={handleSaveTemplate} className="py-2 px-4 bg-brand-gold text-brand-dark rounded-md">Save Template</button>
                        </div>
                    </div>
                </div>
            )}

            {emailModalOpen && selectedParty && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-brand-gray p-8 rounded-lg shadow-2xl border-2 border-brand-gold max-w-lg w-full">
                        <h3 className="text-xl font-bold text-brand-gold mb-4">Confirm Email Address</h3>
                        <p className="text-gray-300 mb-4">
                            A credit note will be sent to the following email address for <span className="font-bold text-white">{selectedParty.name}</span>.
                            You can update it below if needed.
                        </p>
                        <InputField 
                            label="Party Email" 
                            type="email" 
                            value={partyEmail} 
                            onChange={(e) => setPartyEmail(e.target.value)}
                            required={false}
                        />
                        <p className="text-xs text-gray-400 mt-1">If no email is provided, the CN will still be generated and saved, but not sent to the party.</p>
                        <div className="mt-6 flex justify-end space-x-4">
                            <button 
                                type="button" 
                                onClick={() => setEmailModalOpen(false)}
                                className="py-2 px-4 border border-gray-500 text-gray-300 rounded-md shadow-sm text-sm font-medium hover:bg-brand-light-gray focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-gray focus:ring-gray-500"
                            >
                                Cancel
                            </button>
                            <button 
                                type="button" 
                                onClick={confirmAndSend}
                                className="py-2 px-4 border border-transparent bg-brand-gold text-brand-dark rounded-md shadow-sm text-sm font-medium hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-gray focus:ring-brand-gold"
                            >
                                {submitting ? 'Processing...' : 'Confirm & Send'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateCN;