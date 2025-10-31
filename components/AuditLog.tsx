import React, { useState, useEffect, useMemo } from 'react';
import { AuditLogEntry } from '../types';
import { getAuditLogs } from '../services/firebaseService';
import SkeletonLoader from './common/SkeletonLoader';

const AuditLog: React.FC = () => {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState({ from: '', to: '' });

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                setLoading(true);
                setError(null);
                const fetchedLogs = await getAuditLogs();
                setLogs(fetchedLogs);
            } catch (err) {
                setError('Failed to fetch audit logs.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const logDate = new Date(log.timestamp);
            const fromDate = dateRange.from ? new Date(dateRange.from) : null;
            const toDate = dateRange.to ? new Date(dateRange.to) : null;
            if (fromDate) fromDate.setHours(0, 0, 0, 0);
            if (toDate) toDate.setHours(23, 59, 59, 999);
            
            return (!fromDate || logDate >= fromDate) && (!toDate || logDate <= toDate);
        });
    }, [logs, dateRange]);

    const formatTimestamp = (isoString: string) => {
        return new Date(isoString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            timeZone: 'UTC' // Use UTC to prevent off-by-one day errors from local timezone conversion
        });
    };

    const getActionBadgeColor = (action: string) => {
        if (action.includes('CREATE') || action.includes('ADD')) return 'bg-green-600/20 text-green-400';
        if (action.includes('UPDATE')) return 'bg-blue-600/20 text-blue-400';
        if (action.includes('DELETE')) return 'bg-red-600/20 text-red-400';
        if (action.includes('RESEND')) return 'bg-yellow-600/20 text-yellow-400';
        return 'bg-gray-600/20 text-gray-400';
    };

    if (loading) {
        return (
            <div className="container mx-auto">
                <h2 className="text-2xl font-bold text-brand-gold mb-6 border-b-2 border-brand-gold pb-2">Audit Log</h2>
                <div className="bg-brand-gray shadow-lg rounded-lg p-4 border-2 border-brand-light-gray">
                     <SkeletonLoader type="table" />
                </div>
            </div>
        );
    }

    if (error) {
        return <div className="text-center p-10 text-red-500">{error}</div>;
    }

    return (
        <div className="container mx-auto">
            <h2 className="text-2xl font-bold text-brand-gold mb-6 border-b-2 border-brand-gold pb-2">Audit Log</h2>
            
            <div className="bg-brand-gray p-4 rounded-lg shadow-lg border-2 border-brand-light-gray mb-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
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
                            onClick={() => setDateRange({ from: '', to: '' })}
                            className="w-full py-2 px-4 border border-gray-500 text-gray-300 rounded-md shadow-sm text-sm font-medium hover:bg-brand-light-gray focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-gray focus:ring-gray-500"
                        >
                            Reset Dates
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="bg-brand-gray shadow-lg rounded-lg overflow-hidden border-2 border-brand-light-gray">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-brand-light-gray">
                        <thead className="bg-brand-light-gray">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-gold uppercase tracking-wider">Timestamp</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-gold uppercase tracking-wider">Action</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-gold uppercase tracking-wider">Details</th>
                            </tr>
                        </thead>
                        <tbody className="bg-brand-gray divide-y divide-brand-light-gray">
                            {filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-4 text-center text-gray-400">No logs found for the selected criteria.</td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-brand-light-gray transition-colors duration-150">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{formatTimestamp(log.timestamp)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionBadgeColor(log.action)}`}>
                                                {log.action.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-200">{log.details}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AuditLog;