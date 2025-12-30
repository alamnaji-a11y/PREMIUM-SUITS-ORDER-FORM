import React from 'react';
import { FormData } from '../types';

interface MeasurementRowProps {
    label: string;
    fieldKey: string;
    formData: FormData;
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    hasAdjustment?: boolean;
}

const MeasurementRow: React.FC<MeasurementRowProps> = ({ label, fieldKey, formData, handleChange, hasAdjustment = true }) => (
    <div className="grid grid-cols-12 gap-2 items-end mb-3">
        <div className="col-span-6 md:col-span-5">
            <label className="text-xs text-slate-500 block mb-1 truncate" title={label}>{label}</label>
            <input 
                type="text" 
                name={`${fieldKey}_finished`}
                value={formData[`${fieldKey}_finished` as keyof FormData] || ''}
                onChange={handleChange}
                className="w-full p-2 border border-slate-300 rounded focus:border-blue-500 outline-none bg-slate-50 font-medium text-slate-700"
                placeholder="Fin."
            />
        </div>
        {hasAdjustment ? (
            <div className="col-span-6 md:col-span-7">
                <label className="text-[10px] text-slate-400 block mb-1">Adjust (+/-)</label>
                <input 
                    type="text"
                    name={`${fieldKey}_adj`}
                    value={formData[`${fieldKey}_adj` as keyof FormData] || ''}
                    onChange={handleChange}
                    placeholder="0"
                    className="w-full p-2 border border-slate-300 rounded focus:border-blue-500 outline-none bg-white text-sm"
                />
            </div>
        ) : (
                <div className="col-span-6 md:col-span-7 flex items-end pb-2">
                    <span className="text-xs text-slate-400 italic pl-2">No adjustment</span>
                </div>
        )}
    </div>
);

export default MeasurementRow;
