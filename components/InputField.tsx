import React from 'react';

interface InputFieldProps {
    label: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    type?: string;
    placeholder?: string;
    options?: string[] | null;
    className?: string;
    min?: string;
    readOnly?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({ 
    label, 
    name, 
    value, 
    onChange, 
    type = "text", 
    placeholder = "", 
    options = null, 
    className = "", 
    min = "", 
    readOnly = false 
}) => {
    return (
        <div className={`flex flex-col ${className}`}>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</label>
            {options ? (
                <select 
                    name={name} 
                    value={value} 
                    onChange={onChange}
                    disabled={readOnly}
                    className="p-2 border border-slate-300 rounded hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors bg-white disabled:bg-slate-100 disabled:text-slate-500"
                >
                    <option value="">Select...</option>
                    {options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            ) : (
                <input 
                    type={type} 
                    name={name} 
                    value={value} 
                    onChange={onChange}
                    placeholder={placeholder}
                    min={min}
                    readOnly={readOnly}
                    className={`p-2 border border-slate-300 rounded outline-none transition-colors ${
                        readOnly 
                        ? 'bg-slate-100 text-slate-500 cursor-not-allowed' 
                        : 'bg-white hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                    }`}
                />
            )}
        </div>
    );
};

export default InputField;
