import React from 'react';

interface SectionProps {
    title: string;
    icon: string;
    children: React.ReactNode;
    className?: string;
    action?: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, icon, children, className = "", action }) => (
    <div className={`bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6 section-card screen-only ${className}`}>
        <div className="flex justify-between items-center border-b pb-2 mb-4">
            <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                <i className={`fa-solid ${icon} text-blue-600`}></i> {title}
            </h3>
            {action && <div>{action}</div>}
        </div>
        {children}
    </div>
);

export default Section;
