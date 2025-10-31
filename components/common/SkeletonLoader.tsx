import React from 'react';

const SkeletonLoader: React.FC<{ type: 'kpi' | 'chart' | 'table' | 'text' }> = ({ type }) => {
    if (type === 'kpi') {
        return (
            <div className="bg-brand-gray border border-brand-light-gray rounded-lg p-5 flex items-center animate-pulse">
                <div className="p-3 rounded-full bg-brand-light-gray h-12 w-12"></div>
                <div className="ml-4 flex-1">
                    <div className="h-4 bg-brand-light-gray rounded w-3/4 mb-2"></div>
                    <div className="h-6 bg-brand-light-gray rounded w-1/2"></div>
                </div>
            </div>
        );
    }

    if (type === 'chart') {
        return (
            <div className="bg-brand-gray border border-brand-light-gray rounded-lg p-5 animate-pulse">
                <div className="h-6 bg-brand-light-gray rounded w-1/3 mb-4"></div>
                <div className="h-64 bg-brand-light-gray rounded"></div>
            </div>
        );
    }
    
    if (type === 'table') {
        return (
             <div className="space-y-2 animate-pulse">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 bg-brand-light-gray rounded w-full"></div>
                ))}
             </div>
        );
    }
    
    return <div className="h-10 bg-brand-light-gray rounded w-full animate-pulse"></div>;
};

export default SkeletonLoader;
