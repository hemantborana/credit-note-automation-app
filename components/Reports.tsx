import React, { useState, useEffect, useMemo } from 'react';
import { SheetRowData } from '../types';
import { getCreditNotes } from '../services/googleScriptService';
import SkeletonLoader from './common/SkeletonLoader';

const ChartContainer: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
    <div className={`bg-brand-gray border border-brand-light-gray rounded-lg p-5 ${className}`}>
        <h3 className="text-lg font-bold text-brand-gold mb-4">{title}</h3>
        <div>{children}</div>
    </div>
);

const Reports: React.FC = () => {
    const [creditNotes, setCreditNotes] = useState<SheetRowData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAnimated, setIsAnimated] = useState(false);

    useEffect(() => {
        const fetchNotes = async () => {
            try {
                setLoading(true);
                setError(null);
                const notes = await getCreditNotes();
                setCreditNotes(notes);
            } catch (err) {
                setError('Failed to fetch credit notes data for reports.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchNotes();
        const timer = setTimeout(() => setIsAnimated(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const analytics = useMemo(() => {
        const monthlyTotals: { [key: string]: { count: number; amount: number } } = {};
        const lastTwelveMonths = Array.from({ length: 12 }, (_, i) => {
            const d = new Date();
            d.setDate(1); 
            d.setMonth(d.getMonth() - i);
            return { month: d.toLocaleString('default', { month: 'short' }), year: d.getFullYear() };
        }).reverse();

        lastTwelveMonths.forEach(m => {
            monthlyTotals[`${m.month} ${m.year}`] = { count: 0, amount: 0 };
        });
        
        creditNotes.forEach(note => {
            const noteDate = new Date(note.date);
            const monthKey = `${noteDate.toLocaleString('default', { month: 'short' })} ${noteDate.getFullYear()}`;
            if (monthlyTotals.hasOwnProperty(monthKey)) {
                monthlyTotals[monthKey].amount += Number(note.final_amount);
                monthlyTotals[monthKey].count += 1;
            }
        });

        const partyTotals: { [key: string]: number } = {};
        creditNotes.forEach(note => {
            partyTotals[note.party_name] = (partyTotals[note.party_name] || 0) + Number(note.final_amount);
        });

        const topTenParties = Object.entries(partyTotals)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([name, amount]) => ({ name, amount }));

        return {
            monthlyAmountData: Object.entries(monthlyTotals).map(([label, value]) => ({ label, value: value.amount })),
            monthlyCountData: Object.entries(monthlyTotals).map(([label, value]) => ({ label, value: value.count })),
            topTenParties,
        };
    }, [creditNotes]);

    if (loading) {
        return (
            <div className="container mx-auto animate-pulse">
                <div className="h-8 bg-brand-light-gray rounded w-1/3 mb-6"></div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <SkeletonLoader type="chart" />
                    <SkeletonLoader type="chart" />
                    <div className="lg:col-span-2"><SkeletonLoader type="chart" /></div>
                </div>
            </div>
        );
    }
    
    if (error) {
        return <div className="text-center p-10 text-red-500">{error}</div>;
    }

    return (
        <div className="container mx-auto">
            <h2 className="text-2xl font-bold text-brand-gold mb-6 border-b-2 border-brand-gold pb-2">Reports & Analytics</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ChartContainer title="Credit Amount Issued (Last 12 Months)">
                    <div className="flex justify-around items-end h-72 pt-4 space-x-1">
                        {analytics.monthlyAmountData.map(({label, value}, i) => {
                            const maxVal = Math.max(...analytics.monthlyAmountData.map(v => v.value), 1);
                            const height = Math.max((value / maxVal) * 100, 1);
                            return (
                                <div key={i} className="flex flex-col items-center flex-1 h-full justify-end">
                                <div className="text-xs text-white mb-1" title={`₹${value.toLocaleString('en-IN')}`}>{`₹${(value/1000).toFixed(0)}k`}</div>
                                <div className="w-full bg-brand-light-gray rounded-t-md" style={{ height: `100%` }}>
                                    <div className="bg-brand-gold rounded-t-md w-full h-full transition-all duration-1000 ease-out" style={{height: isAnimated ? `${height}%` : '1%'}}></div>
                                </div>
                                    <div className="text-xs text-gray-400 mt-2 text-center">{label.replace(' 202', "'")}</div>
                                </div>
                            )
                        })}
                    </div>
                </ChartContainer>

                <ChartContainer title="Number of CNs Issued (Last 12 Months)">
                     <div className="flex justify-around items-end h-72 pt-4 space-x-1">
                        {analytics.monthlyCountData.map(({label, value}, i) => {
                            const maxVal = Math.max(...analytics.monthlyCountData.map(v => v.value), 1);
                            const height = Math.max((value / maxVal) * 100, 1);
                            return (
                                <div key={i} className="flex flex-col items-center flex-1 h-full justify-end">
                                <div className="text-xs text-white mb-1">{value}</div>
                                <div className="w-full bg-brand-light-gray rounded-t-md" style={{ height: `100%` }}>
                                    <div className="bg-brand-gold rounded-t-md w-full h-full transition-all duration-1000 ease-out" style={{height: isAnimated ? `${height}%` : '1%'}}></div>
                                </div>
                                    <div className="text-xs text-gray-400 mt-2 text-center">{label.replace(' 202', "'")}</div>
                                </div>
                            )
                        })}
                    </div>
                </ChartContainer>

                <ChartContainer title="Top 10 Parties by Total Credit Amount" className="lg:col-span-2">
                    <div className="space-y-3 pt-2">
                        {analytics.topTenParties.map(({name, amount}, i) => {
                            const maxAmount = Math.max(...analytics.topTenParties.map(p => p.amount), 1);
                            const width = (amount / maxAmount) * 100;
                            return (
                                <div key={i} className="w-full">
                                    <div className="flex justify-between items-center text-sm mb-1">
                                        <span className="text-gray-300 truncate pr-2" title={name}>{i+1}. {name}</span>
                                        <span className="text-white font-bold">{`₹${amount.toLocaleString('en-IN')}`}</span>
                                    </div>
                                    <div className="h-2.5 w-full bg-brand-light-gray rounded">
                                        <div className="h-2.5 bg-brand-gold rounded transition-all duration-1000 ease-out" style={{width: isAnimated ? `${width}%` : '0%'}}></div>
                                    </div>
                                </div>
                            )
                        })}
                        {analytics.topTenParties.length === 0 && <p className="text-gray-400 text-center pt-10">No data available.</p>}
                    </div>
                </ChartContainer>
            </div>
        </div>
    );
};

export default Reports;