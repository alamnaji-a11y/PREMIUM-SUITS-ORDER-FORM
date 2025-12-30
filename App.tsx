
// JWS Order System - Production v1.1
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Section from './components/Section';
import InputField from './components/InputField';
import MeasurementRow from './components/MeasurementRow';
import ProductionSheet from './components/ProductionSheet';
import Dashboard from './components/Dashboard';
import AIDesignStudio from './components/AIDesignStudio';
import { FormData } from './types';
import { GoogleGenAI } from "@google/genai";
import { 
    PRODUCT_TYPES, SHOULDER_SHAPES, CANVAS_STYLES, BACK_VENTS, BREAST_POCKETS, 
    SHOULDER_PADS, LINING_STYLES, PICKSTITCH_OPTS, POCKET_STYLES, 
    PANT_WAISTBANDS, PANT_POCKETS_FRONT, PANT_POCKETS_BACK, 
    JACKET_SIZES, TROUSER_SIZES 
} from './constants';

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Helper to get Env Variables cross-platform (Vite vs CRA vs Node)
const getEnv = (key: string) => {
    // Check Vite standard (import.meta.env)
    const meta = import.meta as any;
    if (typeof meta !== 'undefined' && meta.env && meta.env[`VITE_${key}`]) {
        return meta.env[`VITE_${key}`];
    }
    // Check standard process.env (React Scripts / Next.js)
    if (typeof process !== 'undefined' && process.env) {
        return process.env[`REACT_APP_${key}`] || process.env[key];
    }
    return '';
};

const App: React.FC = () => {
    const getInitialFormState = (nextSeq: number): FormData => ({
        groupName: '', storeName: '', storeMobile: '', productType: 'Suit',
        orderDate: new Date().toISOString().split('T')[0], deliveryDate: '', rushFee: '',
        customerName: '', customerRef: '', height: '', weight: '',
        orderNumber: `JWS ${nextSeq}`, shipToAddress: '',
        fabricCode: '', lining: '', satinColor: '', buttonCode: '', 
        jacketSize: '', trouserSize: '',
        neck_finished: '', neck_adj: '', back_shoulder_finished: '', back_shoulder_adj: '',
        sleeve_finished: '', sleeve_adj: '', wrist_finished: '', wrist_adj: '', 
        length_j_finished: '', length_j_adj: '', chest_finished: '', chest_adj: '',
        stomach_finished: '', stomach_adj: '', waist_j_finished: '', waist_j_adj: '', 
        jacket_hip_finished: '', jacket_hip_adj: '', bicep_finished: '', bicep_adj: '',
        waist_t_finished: '', waist_t_adj: '', trouser_hip_finished: '', trouser_hip_adj: '',
        thigh_finished: '', thigh_adj: '', rise_finished: '', rise_adj: '',
        outseam_finished: '', outseam_adj: '', knee_finished: '', knee_adj: '',
        bottom_finished: '', bottom_adj: '',
        chest_v_finished: '', waist_v_finished: '', 
        length_v_front_finished: '', length_v_back_finished: '',
        jacketFrontStyle: 'Single Breasted', jacketLapelStyle: 'Notch', jacketLapelWidth: '3.25 Inch',
        jacketLapelSatin: 'No', jacketButtons: '2 Buttons', jacketInsideButton: 'No',
        jacketPocket: 'Straight with Flap', jacketTicketPocket: 'No',
        jacketBreastPocket: 'Boat Shape', jacketShoulderShape: 'Natural', 
        jacketCanvas: 'Half Canvas', jacketVent: 'Side Vents', 
        jacketLiningStyle: 'Full', jacketLapelHole: 'Normal', 
        jacketPickstitch: 'Standard Pickstitch', jacketSleeveSlit: 'Normal Button Fastening', 
        jacketSleeveButtonQty: '4', jacketShoulderPad: 'Thin', 
        embroideryName: '', embroideryFont: 'Script', embroideryThread: 'Gold',
        pantFront: 'Flat Front', pantBottom: 'Normal', pantWaistband: 'Belt Loop', 
        pantInsideWaistband: 'Standard', pantInsidePiping: 'No', 
        pantInsideLining: 'No', pantFrontPocket: 'Side Seam', 
        pantKeyPocket: 'No', pantSideSatinPos: 'No', 
        pantSideSatinFab: 'No', pantPickstitch: 'No', 
        pantBackPocket: 'Welt with Button', 
        vestBackFabric: 'Lining', vestInnerLining: 'Match',
        vestFrontStyle: 'Single Breasted', vestNeck: 'V Neck', vestLapel: 'None', 
        vestButtons: '5', vestBottom: 'V Notch',
        vestCollar: 'No', vestPocket: 'Welt',
        notes: ''
    });

    const [formData, setFormData] = useState<FormData>(() => {
        const savedSeq = localStorage.getItem('jws_order_seq');
        const startSeq = savedSeq ? parseInt(savedSeq, 10) : 100;
        return getInitialFormState(startSeq);
    });

    const [settings, setSettings] = useState(() => {
        // Priority: 1. Environment Variable (Vite/Production) 2. Local Storage (Dev override) 3. Hardcoded Default
        const envUrl = getEnv('GOOGLE_SCRIPT_URL');
        const savedUrl = localStorage.getItem('jws_script_url');
        const defaultUrl = "https://script.google.com/macros/s/AKfycby7jUstvU54Q1wSFwfmv2L4iGO5wzUv6e7wBDGJC9XhK49ms3195aey-7qmy84jqd55/exec";
        return { scriptUrl: envUrl || savedUrl || defaultUrl };
    });
    
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [status, setStatus] = useState({ type: 'idle', msg: '' });
    const [previewMode, setPreviewMode] = useState(false);
    const [view, setView] = useState<'form' | 'dashboard' | 'ai'>('form');

    const [isRecording, setIsRecording] = useState(false);
    const [isProcessingVoice, setIsProcessingVoice] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        console.log("JWS Production System Loaded. Script URL:", settings.scriptUrl ? "Configured" : "Missing");
    }, []);

    // Calculate minimum delivery date (Order Date + 31 Days)
    const minDeliveryDate = useMemo(() => {
        if (!formData.orderDate) return '';
        const date = new Date(formData.orderDate);
        date.setDate(date.getDate() + 31);
        return date.toISOString().split('T')[0];
    }, [formData.orderDate]);

    useEffect(() => {
        if (!formData.orderDate || !formData.deliveryDate) return;
        const start = new Date(formData.orderDate);
        const end = new Date(formData.deliveryDate);
        const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)); 
        
        let fee = 'Standard';
        // Rush Fee Logic:
        // 31-35 days: $100
        // 36-40 days: $50
        // > 40 days: Standard
        if (diffDays > 30 && diffDays <= 35) fee = 'RUSH: $100.00';
        else if (diffDays >= 36 && diffDays <= 40) fee = 'RUSH: $50.00';
        
        if (formData.rushFee !== fee) setFormData(prev => ({...prev, rushFee: fee}));
    }, [formData.orderDate, formData.deliveryDate]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const applySize = (type: 'jacket' | 'trouser', size: string) => {
        if (type === 'jacket') {
            const s = JACKET_SIZES[size];
            if (!s) return;
            setFormData(p => ({...p, jacketSize: size, neck_finished: String(s.neck), length_j_finished: String(s.length), back_shoulder_finished: String(s.shoulder), chest_finished: String(s.chest), stomach_finished: String(s.stomach), jacket_hip_finished: String(s.hip), sleeve_finished: String(s.sleeve), bicep_finished: String(s.bicep), wrist_finished: String(s.wrist)}));
        } else {
            const s = TROUSER_SIZES[size];
            if (!s) return;
            setFormData(p => ({...p, trouserSize: size, waist_t_finished: String(s.waist), trouser_hip_finished: String(s.hip), thigh_finished: String(s.thigh), knee_finished: String(s.knee), bottom_finished: String(s.bottom), rise_finished: String(s.rise)}));
        }
    };

    const handleFinalSend = async () => {
        if (!userEmail) return;
        if (!settings.scriptUrl) { alert("Server URL not configured. Check settings or environment variables."); setIsSettingsOpen(true); return; }
        setShowEmailModal(false);
        setStatus({ type: 'loading', msg: 'Syncing to Vertical Ledger...' });
        try {
            await fetch(settings.scriptUrl, { 
                method: 'POST', 
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({...formData, userEmail}) 
            });
            const currentNum = parseInt(formData.orderNumber.replace(/\D/g,'')) || 100;
            const nextSeq = currentNum + 1;
            localStorage.setItem('jws_order_seq', nextSeq.toString());
            setFormData(getInitialFormState(nextSeq));
            setPreviewMode(false);
            setStatus({ type: 'success', msg: `Order ${formData.orderNumber} Logged. Form Reset.` });
            setTimeout(() => setStatus({type:'idle', msg:''}), 5000);
        } catch (e) {
            setStatus({ type: 'error', msg: 'Sync blocked or failed. Check console.' });
        }
    };

    const toggleDictation = async () => {
        if (isRecording) { mediaRecorderRef.current?.stop(); setIsRecording(false); return; }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            audioChunksRef.current = [];
            mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setIsProcessingVoice(true);
                try {
                    if (!(await (window as any).aistudio.hasSelectedApiKey())) await (window as any).aistudio.openSelectKey();
                    // Use process.env.API_KEY as per guidelines
                    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: { parts: [{ inlineData: { data: await blobToBase64(audioBlob), mimeType: 'audio/webm' } }, { text: "Transcribe tailor notes." }] }});
                    const text = response.text;
                    if (text) setFormData(p => ({...p, notes: p.notes ? `${p.notes}\n${text.trim()}` : text.trim()}));
                } catch (err) { console.error(err); } finally { setIsProcessingVoice(false); }
            };
            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) { alert("Mic required."); }
    };

    const isJ = ['Suit', 'Jacket Only', 'Tuxedo', 'Overcoat'].includes(formData.productType);
    const isT = ['Suit', 'Trouser Only', 'Tuxedo'].includes(formData.productType);
    const isV = ['Suit', 'Vest Only', 'Tuxedo'].includes(formData.productType);

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8">
            <ProductionSheet data={formData} isPreview={previewMode} />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b pb-6 screen-only gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 leading-none">JWS <span className="text-blue-600">PRODUCTION</span></h1>
                    <p className="text-slate-500 font-bold text-xs uppercase mt-2">Vertical Column Sync Engine Active</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => setView('form')} className={`px-4 py-2 rounded-xl font-bold ${view === 'form' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>Form</button>
                    <button onClick={() => setView('dashboard')} className={`px-4 py-2 rounded-xl font-bold ${view === 'dashboard' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>Ledger</button>
                    <button onClick={() => setView('ai')} className={`px-4 py-2 rounded-xl font-bold ${view === 'ai' ? 'bg-purple-600 text-white' : 'bg-white border'}`}>AI</button>
                    
                    {view === 'form' && (
                        <>
                            <button onClick={() => setIsSettingsOpen(true)} className="w-10 h-10 flex items-center justify-center bg-white border rounded-xl"><i className="fa-solid fa-gear"></i></button>
                            <button onClick={() => setPreviewMode(!previewMode)} className="px-4 py-2 bg-white border rounded-xl font-bold text-sm">
                                <i className={`fa-solid ${previewMode ? 'fa-edit' : 'fa-eye'} mr-1`}></i> {previewMode ? 'Edit' : 'Ticket'}
                            </button>
                            <button onClick={() => setShowEmailModal(true)} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-black shadow-xl hover:bg-blue-700 uppercase tracking-wider">
                                SYNC & CLEAR
                            </button>
                        </>
                    )}
                </div>
            </div>

            {status.msg && <div className={`mb-6 p-4 rounded-xl border font-bold screen-only ${status.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{status.msg}</div>}

            {view === 'dashboard' ? (
                <Dashboard scriptUrl={settings.scriptUrl} onLoadOrder={(d) => {setFormData(d); setView('form');}} />
            ) : view === 'ai' ? (
                <AIDesignStudio 
                    onApplyPattern={(url) => {
                        setFormData(prev => ({...prev, fabricPatternImage: url}));
                        setStatus({ type: 'success', msg: 'Fabric pattern applied to current order.' });
                        setTimeout(() => setStatus({type:'idle', msg:''}), 3000);
                    }}
                    onTranscriptionComplete={(text) => {
                        if (text) {
                            setFormData(prev => ({ ...prev, notes: prev.notes ? `${prev.notes}\n${text.trim()}` : text.trim() }));
                            setStatus({ type: 'success', msg: 'AI Transcription appended to order notes.' });
                            setTimeout(() => setStatus({type:'idle', msg:''}), 3000);
                        }
                    }}
                />
            ) : (
                <form className="space-y-6 screen-only" onSubmit={e => e.preventDefault()}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Section title="Order Details" icon="fa-file-invoice">
                            <div className="grid grid-cols-2 gap-4">
                                <InputField label="Order ID" name="orderNumber" value={formData.orderNumber} readOnly onChange={handleInputChange} />
                                <InputField label="Product Type" name="productType" value={formData.productType} options={PRODUCT_TYPES} onChange={handleInputChange} />
                                <InputField label="Customer" name="customerName" value={formData.customerName} onChange={handleInputChange} className="col-span-2" />
                                <InputField label="Date" name="orderDate" type="date" value={formData.orderDate} onChange={handleInputChange} />
                                <InputField label="Delivery" name="deliveryDate" type="date" value={formData.deliveryDate} onChange={handleInputChange} min={minDeliveryDate} />
                                <InputField label="Fabric Code" name="fabricCode" value={formData.fabricCode} onChange={handleInputChange} />
                                <InputField label="Rush Fee" name="rushFee" value={formData.rushFee} readOnly onChange={handleInputChange} />
                            </div>
                        </Section>

                        <Section title="Client Profile" icon="fa-user-tag">
                            <div className="grid grid-cols-2 gap-4">
                                <InputField label="Store" name="storeName" value={formData.storeName} onChange={handleInputChange} />
                                <InputField label="Mobile" name="storeMobile" value={formData.storeMobile} onChange={handleInputChange} />
                                <InputField label="Height" name="height" value={formData.height} onChange={handleInputChange} />
                                <InputField label="Weight" name="weight" value={formData.weight} onChange={handleInputChange} />
                                <div className="col-span-2 flex gap-2 border-t pt-4 mt-2">
                                    {isJ && <select onChange={(e) => applySize('jacket', e.target.value)} className="flex-1 p-2 border rounded text-xs font-bold"><option value="">Try Jacket Size...</option>{Object.keys(JACKET_SIZES).map(s => <option key={s} value={s}>{s}</option>)}</select>}
                                    {isT && <select onChange={(e) => applySize('trouser', e.target.value)} className="flex-1 p-2 border rounded text-xs font-bold"><option value="">Try Trouser Size...</option>{Object.keys(TROUSER_SIZES).map(s => <option key={s} value={s}>{s}</option>)}</select>}
                                </div>
                            </div>
                        </Section>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {isJ && (
                            <Section title="Jacket Measurements" icon="fa-ruler-combined">
                                <MeasurementRow label="Neck" fieldKey="neck" formData={formData} handleChange={handleInputChange} />
                                <MeasurementRow label="Shoulder" fieldKey="back_shoulder" formData={formData} handleChange={handleInputChange} />
                                <MeasurementRow label="Chest" fieldKey="chest" formData={formData} handleChange={handleInputChange} />
                                <MeasurementRow label="Stomach" fieldKey="stomach" formData={formData} handleChange={handleInputChange} />
                                <MeasurementRow label="Sleeve" fieldKey="sleeve" formData={formData} handleChange={handleInputChange} />
                                <MeasurementRow label="Length" fieldKey="length_j" formData={formData} handleChange={handleInputChange} />
                                <MeasurementRow label="Hip" fieldKey="jacket_hip" formData={formData} handleChange={handleInputChange} />
                                <MeasurementRow label="Bicep" fieldKey="bicep" formData={formData} handleChange={handleInputChange} />
                                <MeasurementRow label="Wrist" fieldKey="wrist" formData={formData} handleChange={handleInputChange} />
                            </Section>
                        )}
                        {isT && (
                            <Section title="Trouser Measurements" icon="fa-ruler-vertical">
                                <MeasurementRow label="Waist" fieldKey="waist_t" formData={formData} handleChange={handleInputChange} />
                                <MeasurementRow label="Hips" fieldKey="trouser_hip" formData={formData} handleChange={handleInputChange} />
                                <MeasurementRow label="Thigh" fieldKey="thigh" formData={formData} handleChange={handleInputChange} />
                                <MeasurementRow label="U-Rise" fieldKey="rise" formData={formData} handleChange={handleInputChange} />
                                <MeasurementRow label="Outseam" fieldKey="outseam" formData={formData} handleChange={handleInputChange} />
                                <MeasurementRow label="Knee" fieldKey="knee" formData={formData} handleChange={handleInputChange} />
                                <MeasurementRow label="Bottom" fieldKey="bottom" formData={formData} handleChange={handleInputChange} />
                            </Section>
                        )}
                    </div>

                    {isJ && (
                        <Section title="Jacket Styling" icon="fa-pencil-ruler">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <InputField label="Front" name="jacketFrontStyle" value={formData.jacketFrontStyle} options={['Single Breasted', 'Double Breasted']} onChange={handleInputChange} />
                                <InputField label="Lapel" name="jacketLapelStyle" value={formData.jacketLapelStyle} options={['Notch', 'Peak', 'Shawl']} onChange={handleInputChange} />
                                <InputField label="Width" name="jacketLapelWidth" value={formData.jacketLapelWidth} onChange={handleInputChange} />
                                <InputField label="Lapel Satin" name="jacketLapelSatin" value={formData.jacketLapelSatin} options={['No', 'Yes']} onChange={handleInputChange} />
                                <InputField label="Buttons" name="jacketButtons" value={formData.jacketButtons} options={['1 Button', '2 Buttons', '3 Buttons', '4 on 2', '6 on 2']} onChange={handleInputChange} />
                                <InputField label="Inside Button (DB)" name="jacketInsideButton" value={formData.jacketInsideButton} options={['No', 'Yes']} onChange={handleInputChange} />
                                <InputField label="Lower Pockets" name="jacketPocket" value={formData.jacketPocket} options={POCKET_STYLES} onChange={handleInputChange} />
                                <InputField label="Ticket Pocket" name="jacketTicketPocket" value={formData.jacketTicketPocket} options={['No', 'Yes']} onChange={handleInputChange} />
                                <InputField label="Breast Pocket" name="jacketBreastPocket" value={formData.jacketBreastPocket} options={BREAST_POCKETS} onChange={handleInputChange} />
                                <InputField label="Shoulder" name="jacketShoulderShape" value={formData.jacketShoulderShape} options={SHOULDER_SHAPES} onChange={handleInputChange} />
                                <InputField label="Canvas" name="jacketCanvas" value={formData.jacketCanvas} options={CANVAS_STYLES} onChange={handleInputChange} />
                                <InputField label="Vent" name="jacketVent" value={formData.jacketVent} options={BACK_VENTS} onChange={handleInputChange} />
                                <InputField label="Lining Style" name="jacketLiningStyle" value={formData.jacketLiningStyle} options={LINING_STYLES} onChange={handleInputChange} />
                                <InputField label="Lapel Hole" name="jacketLapelHole" value={formData.jacketLapelHole} options={['Normal', 'Contrast', 'No Hole']} onChange={handleInputChange} />
                                <InputField label="Pickstitch" name="jacketPickstitch" value={formData.jacketPickstitch} options={PICKSTITCH_OPTS} onChange={handleInputChange} />
                                <InputField label="Sleeve Slit" name="jacketSleeveSlit" value={formData.jacketSleeveSlit} options={['Normal Button Fastening', 'Functional Buttons', 'Closed']} onChange={handleInputChange} />
                                <InputField label="Sleeve Qty" name="jacketSleeveButtonQty" value={formData.jacketSleeveButtonQty} onChange={handleInputChange} />
                                <InputField label="Shoulder Pad" name="jacketShoulderPad" value={formData.jacketShoulderPad} options={SHOULDER_PADS} onChange={handleInputChange} />
                                <InputField label="Embroidery Name" name="embroideryName" value={formData.embroideryName} onChange={handleInputChange} />
                                <InputField label="Embroidery Font" name="embroideryFont" value={formData.embroideryFont} options={['Script', 'Block']} onChange={handleInputChange} />
                                <InputField label="Embroidery Thread" name="embroideryThread" value={formData.embroideryThread} onChange={handleInputChange} />
                            </div>
                        </Section>
                    )}

                    {isT && (
                        <Section title="Trouser Styling" icon="fa-scissors">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <InputField label="Front" name="pantFront" value={formData.pantFront} options={['Flat Front', '1 Pleat', '2 Pleats']} onChange={handleInputChange} />
                                <InputField label="Bottom" name="pantBottom" value={formData.pantBottom} options={['Normal', 'Cuff 1.5"', 'Cuff 1.75"', 'Cuff 2.0"']} onChange={handleInputChange} />
                                <InputField label="Waistband" name="pantWaistband" value={formData.pantWaistband} options={PANT_WAISTBANDS} onChange={handleInputChange} />
                                <InputField label="Inside WB" name="pantInsideWaistband" value={formData.pantInsideWaistband} options={['Standard', 'Pleated Curtain']} onChange={handleInputChange} />
                                <InputField label="Inside Piping" name="pantInsidePiping" value={formData.pantInsidePiping} options={['No', 'Yes']} onChange={handleInputChange} />
                                <InputField label="Inside Lining" name="pantInsideLining" value={formData.pantInsideLining} options={['No', 'Yes']} onChange={handleInputChange} />
                                <InputField label="Front Pocket" name="pantFrontPocket" value={formData.pantFrontPocket} options={['Side Seam', 'Slanted', 'Western']} onChange={handleInputChange} />
                                <InputField label="Key Pocket" name="pantKeyPocket" value={formData.pantKeyPocket} options={['No', 'Yes']} onChange={handleInputChange} />
                                <InputField label="Back Pocket" name="pantBackPocket" value={formData.pantBackPocket} options={PANT_POCKETS_BACK} onChange={handleInputChange} />
                                <InputField label="Side Satin Pos" name="pantSideSatinPos" value={formData.pantSideSatinPos} options={['No', 'Yes']} onChange={handleInputChange} />
                                <InputField label="Side Satin Fab" name="pantSideSatinFab" value={formData.pantSideSatinFab} options={['No', 'Yes']} onChange={handleInputChange} />
                                <InputField label="Pickstitch" name="pantPickstitch" value={formData.pantPickstitch} options={['No', 'Yes']} onChange={handleInputChange} />
                            </div>
                        </Section>
                    )}

                    {isV && (
                        <Section title="Vest Styling" icon="fa-vest">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <InputField label="Front Style" name="vestFrontStyle" value={formData.vestFrontStyle} options={['Single Breasted', 'Double Breasted']} onChange={handleInputChange} />
                                <InputField label="Neckline" name="vestNeck" value={formData.vestNeck} options={['V Neck', 'U Neck']} onChange={handleInputChange} />
                                <InputField label="Lapel" name="vestLapel" value={formData.vestLapel} options={['None', 'Notch', 'Peak', 'Shawl']} onChange={handleInputChange} />
                                <InputField label="Buttons" name="vestButtons" value={formData.vestButtons} onChange={handleInputChange} />
                                <InputField label="Bottom Style" name="vestBottom" value={formData.vestBottom} options={['V Notch', 'Straight']} onChange={handleInputChange} />
                                <InputField label="Back Fabric" name="vestBackFabric" value={formData.vestBackFabric} options={['Lining', 'Self Fabric']} onChange={handleInputChange} />
                                <InputField label="Inner Lining" name="vestInnerLining" value={formData.vestInnerLining} onChange={handleInputChange} />
                                <InputField label="Collar" name="vestCollar" value={formData.vestCollar} options={['No', 'Yes']} onChange={handleInputChange} />
                                <InputField label="Pocket Style" name="vestPocket" value={formData.vestPocket} options={['Welt', 'Patch', 'No Pocket']} onChange={handleInputChange} />
                            </div>
                        </Section>
                    )}

                    <Section title="Production Notes" icon="fa-microphone">
                        <div className="flex gap-4 items-start">
                            <div className="flex-1 relative">
                                <textarea 
                                    name="notes" 
                                    value={formData.notes} 
                                    onChange={handleInputChange} 
                                    rows={4} 
                                    placeholder="Type notes or dictate using the microphone..."
                                    className={`w-full p-6 border rounded-2xl outline-none resize-none transition-all ${isRecording ? 'bg-red-50 border-red-500' : 'bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}`} 
                                />
                                {isRecording && (
                                    <div className="absolute top-4 right-4 flex items-center gap-2">
                                        <span className="relative flex h-3 w-3">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                        </span>
                                        <span className="text-xs font-bold text-red-500 uppercase tracking-wider">Recording</span>
                                    </div>
                                )}
                            </div>
                            <button 
                                type="button" 
                                onClick={toggleDictation} 
                                disabled={isProcessingVoice}
                                className={`w-16 h-16 rounded-2xl flex-shrink-0 flex items-center justify-center text-white shadow-lg transition-all active:scale-95 ${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'} ${isProcessingVoice ? 'opacity-70 cursor-wait' : ''}`}
                                title="Dictate Notes"
                            >
                                {isProcessingVoice ? (
                                    <i className="fa-solid fa-circle-notch fa-spin text-xl"></i>
                                ) : (
                                    <i className={`fa-solid ${isRecording ? 'fa-stop' : 'fa-microphone'} text-2xl`}></i>
                                )}
                            </button>
                        </div>
                        {isProcessingVoice && <p className="text-xs font-bold text-indigo-600 mt-2 flex items-center gap-2"><i className="fa-solid fa-wand-magic-sparkles"></i> Transcribing audio with Gemini AI...</p>}
                    </Section>
                </form>
            )}

            {isSettingsOpen && (
                <div className="fixed inset-0 bg-slate-900/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-8 max-w-2xl w-full">
                        <h2 className="text-2xl font-black mb-6">Vertical Ledger Setup</h2>
                        <input value={settings.scriptUrl} onChange={e => {setSettings({scriptUrl:e.target.value}); localStorage.setItem('jws_script_url', e.target.value);}} className="w-full p-4 border rounded-xl mb-6 bg-slate-50" placeholder="Paste Apps Script Web App URL here..." />
                        <button onClick={() => setIsSettingsOpen(false)} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase">Connect Ledger</button>
                    </div>
                </div>
            )}
            
            {showEmailModal && (
                <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center">
                        <h3 className="text-2xl font-black mb-2 uppercase">Sync to Column Ledger</h3>
                        <input type="email" placeholder="Operator Email" value={userEmail} onChange={e => setUserEmail(e.target.value)} className="w-full p-4 border rounded-xl mb-6 text-center outline-none font-bold" />
                        <div className="flex gap-4">
                            <button onClick={() => setShowEmailModal(false)} className="flex-1 py-3 bg-slate-100 font-bold rounded-xl">Cancel</button>
                            <button onClick={handleFinalSend} className="flex-1 py-3 bg-blue-600 text-white font-black rounded-xl shadow-lg uppercase">SUBMIT & CLEAR</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
