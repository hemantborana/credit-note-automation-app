import React, { useState, useEffect, useMemo } from 'react';
import { SheetRowData } from '../types';
import { getCreditNotes, resendCreditNote } from '../services/googleScriptService';
import { addAuditLog } from '../services/firebaseService';
import { useToast } from './common/Toast';
import WhatsappNumberModal from './common/WhatsappNumberModal';
import SkeletonLoader from './common/SkeletonLoader';

const KpiCard: React.FC<{ title: string; value: string; icon: React.ReactElement }> = ({ title, value, icon }) => (
    <div className="bg-brand-gray border border-brand-light-gray rounded-lg p-5 flex items-center">
        <div className="p-3 rounded-full bg-brand-gold bg-opacity-20 text-brand-gold">
            {icon}
        </div>
        <div className="ml-4">
            <p className="text-sm text-gray-400 font-medium uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    </div>
);

const ChartContainer: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-brand-gray border border-brand-light-gray rounded-lg p-5">
        <h3 className="text-lg font-bold text-brand-gold mb-4">{title}</h3>
        <div>{children}</div>
    </div>
);

const Dashboard: React.FC = () => {
    const [creditNotes, setCreditNotes] = useState<SheetRowData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
    const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
    const [selectedNoteForShare, setSelectedNoteForShare] = useState<SheetRowData | null>(null);
    const [isAnimated, setIsAnimated] = useState(false);
    const { showToast } = useToast();
    
    // Filters State
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState({ from: '', to: '' });

    useEffect(() => {
        const fetchNotes = async () => {
            try {
                setLoading(true);
                setError(null);
                const notes = await getCreditNotes();
                setCreditNotes(notes);
            } catch (err) {
                setError('Failed to fetch credit notes. Please ensure your Google Apps Script URL is correctly configured and deployed.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchNotes();
        const timer = setTimeout(() => setIsAnimated(true), 100);
        return () => clearTimeout(timer);
    }, []);
    
    const filteredCreditNotes = useMemo(() => {
        return creditNotes.filter(note => {
            const searchTermLower = searchTerm.toLowerCase();
            // Search term filter
            const matchesSearch = searchTermLower === '' ||
                note.cn_number.toLowerCase().includes(searchTermLower) ||
                note.party_name.toLowerCase().includes(searchTermLower) ||
                note.purpose.toLowerCase().includes(searchTermLower);

            // Date range filter
            const noteDate = new Date(note.date);
            const fromDate = dateRange.from ? new Date(dateRange.from) : null;
            const toDate = dateRange.to ? new Date(dateRange.to) : null;
            if(fromDate) fromDate.setHours(0,0,0,0);
            if(toDate) toDate.setHours(23,59,59,999);
            
            const matchesDate = 
                (!fromDate || noteDate >= fromDate) &&
                (!toDate || noteDate <= toDate);

            return matchesSearch && matchesDate;
        });
    }, [creditNotes, searchTerm, dateRange]);

    const resetFilters = () => {
        setSearchTerm('');
        setDateRange({ from: '', to: '' });
    };

    const handleAction = async (cnNumber: string, action: () => Promise<any>, successMessage: string, auditAction?: string, auditDetails?: string) => {
        setActionLoading(prev => ({ ...prev, [cnNumber]: true }));
        try {
            await action();
            showToast(successMessage, 'success');
            if (auditAction && auditDetails) {
                await addAuditLog(auditAction, auditDetails);
            }
        } catch (error: any) {
            showToast(`Action failed: ${error.message}`, 'error');
        } finally {
            setActionLoading(prev => ({ ...prev, [cnNumber]: false }));
        }
    };

    const handleResend = (note: SheetRowData, recipient: 'party' | 'ho') => {
        const auditAction = recipient === 'party' ? 'RESEND_CN_PARTY' : 'RESEND_CN_HO';
        const auditDetails = `Credit Note ${note.cn_number} re-sent to ${recipient === 'party' ? `party (${note.party_name})` : 'Head Office'}.`;
        handleAction(
            note.cn_number,
            () => resendCreditNote(note, recipient),
            `Credit note resent to ${recipient === 'party' ? note.party_name : 'Head Office'}.`,
            auditAction,
            auditDetails
        );
    };

    const handleShareWhatsApp = (note: SheetRowData) => {
        if (note.party_whatsapp) {
            shareToWhatsApp(note, note.party_whatsapp);
        } else {
            setSelectedNoteForShare(note);
            setWhatsappModalOpen(true);
        }
    };
    
    const shareToWhatsApp = (note: SheetRowData, number: string) => {
        const cleanNumber = number.replace(/[^0-9]/g, '');
        const message = `*Credit Note Notification*\n\nDear ${note.party_name},\n\nThis is to inform you that a credit note has been processed for your account.\n\n• *CN Number:* *${note.cn_number}*\n• *Date:* ${note.date}\n• *Amount:* *₹${Number(note.final_amount).toLocaleString('en-IN')}*\n• *Purpose:* ${note.purpose}\n\nPlease access the official PDF document for your records using the secure link below:\n${note.pdf_link}\n\nThank you,\nKambeshwar Agencies`;
        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/${cleanNumber}?text=${encodedMessage}`, '_blank');
        setWhatsappModalOpen(false);
    };

    const analytics = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const notesThisMonth = creditNotes.filter(note => {
            const noteDate = new Date(note.date);
            return noteDate.getMonth() === currentMonth && noteDate.getFullYear() === currentYear;
        });

        const totalAmountThisMonth = notesThisMonth.reduce((sum, note) => sum + Number(note.final_amount), 0);
        
        const monthlyTotals: { [key: string]: number } = {};
        const lastSixMonths = Array.from({ length: 6 }, (_, i) => {
            const d = new Date();
            d.setDate(1); 
            d.setMonth(d.getMonth() - i);
            return { month: d.toLocaleString('default', { month: 'short' }), year: d.getFullYear() };
        }).reverse();

        lastSixMonths.forEach(m => {
            monthlyTotals[`${m.month} ${m.year}`] = 0;
        });

        creditNotes.forEach(note => {
            const noteDate = new Date(note.date);
            const monthKey = `${noteDate.toLocaleString('default', { month: 'short' })} ${noteDate.getFullYear()}`;
            if (monthlyTotals.hasOwnProperty(monthKey)) {
                monthlyTotals[monthKey] += Number(note.final_amount);
            }
        });

        const partyTotals: { [key: string]: number } = {};
        creditNotes.forEach(note => {
            partyTotals[note.party_name] = (partyTotals[note.party_name] || 0) + Number(note.final_amount);
        });

        const topParties = Object.entries(partyTotals)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, amount]) => ({ name, amount }));

        return {
            totalCNsThisMonth: notesThisMonth.length,
            totalAmountThisMonth: totalAmountThisMonth,
            avgAmountThisMonth: notesThisMonth.length > 0 ? totalAmountThisMonth / notesThisMonth.length : 0,
            monthlyTotals: Object.entries(monthlyTotals).map(([label, value]) => ({ label, value })),
            topParties
        };
    }, [creditNotes]);
    
    const toggleRow = (cnNumber: string) => {
      setExpandedRow(prev => (prev === cnNumber ? null : cnNumber));
    };

    if (loading) {
        return (
            <div className="container mx-auto">
                <h2 className="text-2xl font-bold text-brand-gold mb-6 border-b-2 border-brand-gold pb-2">Dashboard</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <SkeletonLoader type="kpi" />
                    <SkeletonLoader type="kpi" />
                    <SkeletonLoader type="kpi" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-8">
                    <div className="lg:col-span-3"><SkeletonLoader type="chart" /></div>
                    <div className="lg:col-span-2"><SkeletonLoader type="chart" /></div>
                </div>
                 <div className="bg-brand-gray shadow-lg rounded-lg p-4 border-2 border-brand-light-gray">
                     <SkeletonLoader type="table" />
                 </div>
            </div>
        );
    }

    if (error) {
        return <div className="text-center p-10 text-red-500">{error}</div>;
    }

    const CN_ACTIONS = ({note}: {note: SheetRowData}) => (
        <div className="flex items-center justify-end space-x-3">
             <a href={note.pdf_link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-gray-400 hover:text-brand-gold" title="View PDF">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
            </a>
            <button onClick={(e) => { e.stopPropagation(); handleResend(note, 'party'); }} disabled={actionLoading[note.cn_number] || !note.party_email} className="text-gray-400 hover:text-brand-gold disabled:opacity-50 disabled:cursor-not-allowed" title="Resend to Party">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleResend(note, 'ho'); }} disabled={actionLoading[note.cn_number]} className="text-gray-400 hover:text-brand-gold disabled:opacity-50" title="Send to H.O.">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleShareWhatsApp(note); }} disabled={actionLoading[note.cn_number]} className="text-gray-400 hover:text-green-500 disabled:opacity-50" title="Share via WhatsApp">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.487 5.235 3.487 8.413 0 6.557-5.338 11.892-11.894 11.892-1.99 0-3.903-.52-5.586-1.457l-6.354 1.654zm6.838-9.972c.033-.057.227-.084.463-.084.229 0 .427.009.67.243.27.26.86.855.976 1.008.116.152.187.25.253.385.065.134.033.228-.028.327-.061.101-.228.168-.48.283-.251.114-.528.17-.828.17-.301 0-.74-.104-1.205-.304-.464-.2-1.104-.634-1.896-1.453-.761-.787-1.303-1.666-1.464-1.958-.16-.291-.009-.464.134-.635.13-.16.291-.2.384-.2.102 0 .228-.009.327.058.099.066.243.514.265.57.023.058.033.101.009.168-.023.065-.084.184-.134.238-.05.053-.102.083-.152.083-.05 0-.116-.009-.168-.042a.573.573 0 01-.133-.099c-.043-.043-.105-.114-.158-.192-.053-.078-.105-.17-.158-.278-.052-.108-.084-.228-.084-.347s.009-.244.042-.333c.033-.089.099-.217.184-.333.085-.117.184-.228.283-.313.1-.084.209-.168.327-.228.117-.061.244-.104.363-.104.118 0 .276.01.41.042.135.032.254.09.354.192.1.101.168.227.228.363.06.135.09.284.09.432 0 .149-.01.298-.042.433-.032.135-.105.284-.209.422z"></path></svg>
            </button>
        </div>
    );
    
    const EXPANDED_CONTENT = ({note}: {note: SheetRowData}) => (
        <div className="text-gray-300 space-y-2 p-4 pt-0">
            <p><strong className="text-brand-gold font-medium">Purpose:</strong> {note.purpose}</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm pt-2">
                <p><strong className="text-gray-400">Net Sales:</strong> {`₹${Number(note.net_sales).toLocaleString('en-IN')}`}</p>
                <p><strong className="text-gray-400">CN %:</strong> {`${note.cn_percentage}%`}</p>
                <p><strong className="text-gray-400">Credit Amt:</strong> {`₹${Number(note.credit_amount).toLocaleString('en-IN')}`}</p>
                <p><strong className="text-gray-400">Round Off:</strong> {`${Number(note.round_off).toFixed(2)}`}</p>
            </div>
             <div className="md:hidden mt-4 pt-4 border-t border-brand-light-gray flex justify-end">
                <CN_ACTIONS note={note} />
             </div>
        </div>
    );
    
    const noResults = creditNotes.length > 0 && filteredCreditNotes.length === 0;

    return (
        <div className="container mx-auto">
            <h2 className="text-2xl font-bold text-brand-gold mb-6 border-b-2 border-brand-gold pb-2">Dashboard</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <KpiCard title="Total CNs (This Month)" value={analytics.totalCNsThisMonth.toString()} icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>} />
                <KpiCard title="Total Amount (This Month)" value={`₹${analytics.totalAmountThisMonth.toLocaleString('en-IN')}`} icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01"></path></svg>} />
                <KpiCard title="Average Amount (This Month)" value={`₹${analytics.avgAmountThisMonth.toLocaleString('en-IN', {maximumFractionDigits: 0})}`} icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6L14.6 7.2A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z"></path></svg>} />
            </div>

            <div className="bg-brand-gray p-4 rounded-lg shadow-lg border-2 border-brand-light-gray mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <div className="lg:col-span-2">
                        <label htmlFor="search" className="block text-sm font-medium text-gray-300">Search CNs</label>
                        <input
                            id="search"
                            type="text"
                            placeholder="By CN number, party name, purpose..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="mt-1 block w-full bg-brand-dark border border-brand-light-gray rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-brand-gold focus:border-brand-gold sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="from-date" className="block text-sm font-medium text-gray-300">From Date</label>
                        <input
                            id="from-date"
                            type="date"
                            value={dateRange.from}
                            onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                            className="mt-1 block w-full bg-brand-dark border border-brand-light-gray rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-brand-gold focus:border-brand-gold sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="to-date" className="block text-sm font-medium text-gray-300">To Date</label>
                        <input
                            id="to-date"
                            type="date"
                            value={dateRange.to}
                            onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                             className="mt-1 block w-full bg-brand-dark border border-brand-light-gray rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-brand-gold focus:border-brand-gold sm:text-sm"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={resetFilters}
                            className="w-full py-2 px-4 border border-gray-500 text-gray-300 rounded-md shadow-sm text-sm font-medium hover:bg-brand-light-gray focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-gray focus:ring-gray-500"
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </div>

             {/* Table for larger screens */}
            <div className="hidden md:block bg-brand-gray shadow-lg rounded-lg overflow-hidden border-2 border-brand-light-gray">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-brand-light-gray">
                        <thead className="bg-brand-light-gray">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-gold uppercase tracking-wider">CN Number</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-gold uppercase tracking-wider">Party Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-gold uppercase tracking-wider">Date</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-gold uppercase tracking-wider">Amount</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-brand-gold uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-brand-gray divide-y divide-brand-light-gray">
                            {filteredCreditNotes.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-gray-400">
                                        {noResults ? 'No credit notes match the current filters.' : 'No credit notes found.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredCreditNotes.map((note) => (
                                    <React.Fragment key={note.cn_number}>
                                        <tr onClick={() => toggleRow(note.cn_number)} className="hover:bg-brand-light-gray transition-colors duration-150 cursor-pointer">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{note.cn_number}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{note.party_name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{note.date}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                {`Rs. ${Number(note.final_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <CN_ACTIONS note={note} />
                                            </td>
                                        </tr>
                                        {expandedRow === note.cn_number && (
                                            <tr className="bg-brand-dark">
                                                <td colSpan={5} className="px-6 py-4">
                                                    <EXPANDED_CONTENT note={note} />
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* Cards for smaller screens */}
            <div className="md:hidden space-y-4">
                 {filteredCreditNotes.length === 0 ? (
                    <div className="px-6 py-4 text-center text-gray-400 bg-brand-gray rounded-lg">
                        {noResults ? 'No credit notes match the current filters.' : 'No credit notes found.'}
                    </div>
                ) : (
                    filteredCreditNotes.map(note => (
                        <div key={note.cn_number} onClick={() => toggleRow(note.cn_number)} className="bg-brand-gray border border-brand-light-gray rounded-lg p-4 cursor-pointer">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-white">{note.party_name}</p>
                                    <p className="text-sm text-gray-400">{note.cn_number}</p>
                                </div>
                                <p className="text-lg font-semibold text-brand-gold">{`₹${Number(note.final_amount).toLocaleString('en-IN')}`}</p>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{note.date}</p>
                            {expandedRow === note.cn_number && (
                               <div className="mt-4 pt-4 border-t border-brand-light-gray">
                                 <EXPANDED_CONTENT note={note} />
                               </div>
                            )}
                        </div>
                    ))
                )}
            </div>
            {whatsappModalOpen && selectedNoteForShare && (
                <WhatsappNumberModal
                    isOpen={whatsappModalOpen}
                    onClose={() => setWhatsappModalOpen(false)}
                    onConfirm={(number) => shareToWhatsApp(selectedNoteForShare, number)}
                    partyName={selectedNoteForShare.party_name}
                />
            )}
        </div>
    );
};

export default Dashboard;
