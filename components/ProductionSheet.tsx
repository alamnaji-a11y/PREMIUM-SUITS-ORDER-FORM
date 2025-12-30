
import React from 'react';
import { FormData } from '../types';

interface ProductionSheetProps {
    data: FormData;
    isPreview?: boolean;
}

const ProductionSheet: React.FC<ProductionSheetProps> = ({ data, isPreview = false }) => {
    const Row = ({ label, val }: { label: string, val: string | undefined }) => {
        if (!val) return null;
        return (
            <tr>
                <th>{label}</th>
                <td>{val}</td>
            </tr>
        );
    };

    const HeaderRow = ({ label }: { label: string }) => (
        <tr>
            <td colSpan={2} className="section-header">{label}</td>
        </tr>
    );

    const calc = (key: string) => {
        const base = data[`${key}_finished` as keyof FormData] || "";
        const adj = data[`${key}_adj` as keyof FormData] || "";
        return adj ? `${base} (${adj})` : base;
    };

    const containerClass = isPreview 
        ? "preview-container bg-white p-8 max-w-4xl mx-auto shadow-xl my-8 border" 
        : "print-only";

    return (
        <div className={containerClass}>
            {isPreview && (
                <div className="text-center mb-6 border-b pb-4 no-print">
                    <h2 className="text-2xl font-bold mb-2">Job Ticket Preview</h2>
                    <p className="text-sm text-slate-500 mb-4">This is how the document will print and be emailed.</p>
                    <button 
                        onClick={() => window.print()}
                        type="button"
                        className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700"
                    >
                        <i className="fa-solid fa-print mr-2"></i> Print Now
                    </button>
                </div>
            )}
            
            <div className="print-layout-cols">
                <div className="print-break">
                    <table className="job-ticket">
                        <tbody>
                            <HeaderRow label="Order Information" />
                            <Row label="SUBMISSION DATE" val={data.orderDate} />
                            <Row label="TARGET SHIP DATE" val={data.deliveryDate} />
                            <Row label="SHIP TO ADDRESS" val={data.shipToAddress} />
                            <Row label="ORDER NUMBER" val={data.orderNumber} />
                            <Row label="CUSTOMER NAME" val={data.customerName} />
                            <Row label="PRODUCT" val={data.productType} />
                            <Row label="RUSH STATUS" val={data.rushFee} />
                            
                            <HeaderRow label="General Codes" />
                            <Row label="FABRIC CODE" val={data.fabricCode} />
                            <Row label="LINING CODE" val={data.lining} />
                            <Row label="BUTTON CODE" val={data.buttonCode} />
                            <Row label="SATIN FABRIC CODE" val={data.satinColor} />
                            {data.fabricPatternImage && (
                                <tr>
                                    <th>AI FABRIC PATTERN</th>
                                    <td>
                                        <img src={data.fabricPatternImage} alt="Fabric Pattern" className="w-24 h-24 mt-2 border border-black object-cover" />
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* JACKET SECTION */}
                    {(['Suit', 'Jacket Only', 'Tuxedo', 'Overcoat'].includes(data.productType)) && (
                        <table className="job-ticket">
                            <tbody>
                                <HeaderRow label="Jacket Details" />
                                <Row label="LAPEL STYLE" val={data.jacketLapelStyle} />
                                <Row label="LAPEL WIDTH" val={data.jacketLapelWidth} />
                                <Row label="SATIN STYLE ON LAPEL" val={data.jacketLapelSatin} />
                                <Row label="FRONT BUTTONS" val={data.jacketButtons} />
                                <Row label="INSIDE BUTTON (DB)" val={data.jacketInsideButton} />
                                <Row label="BREAST POCKET" val={data.jacketBreastPocket} />
                                <Row label="SHOULDER SHAPE" val={data.jacketShoulderShape} />
                                <Row label="CANVAS STYLE" val={data.jacketCanvas} />
                                <Row label="BACK VENT" val={data.jacketVent} />
                                <Row label="LOWER POCKET STYLE" val={data.jacketPocket} />
                                <Row label="TICKET POCKET" val={data.jacketTicketPocket} />
                                <Row label="LINING STYLE" val={data.jacketLiningStyle} />
                                <Row label="INITIAL NAME" val={data.embroideryName} />
                                <Row label="FONT" val={data.embroideryFont} />
                                <Row label="THREAD COLOR" val={data.embroideryThread} />
                                <Row label="LAPEL BUTTON HOLE" val={data.jacketLapelHole} />
                                <Row label="OUTSIDE PICKSTITCH" val={data.jacketPickstitch} />
                                <Row label="SLEEVES SLIT STYLE" val={data.jacketSleeveSlit} />
                                <Row label="SLEEVES BUTTON QTY" val={data.jacketSleeveButtonQty} />
                                <Row label="SHOULDER PAD" val={data.jacketShoulderPad} />
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="print-break">
                    {/* PANT SECTION */}
                    {(['Suit', 'Trouser Only', 'Tuxedo'].includes(data.productType)) && (
                        <table className="job-ticket">
                            <tbody>
                                <HeaderRow label="Pant Details" />
                                <Row label="FRONT STYLE" val={data.pantFront} />
                                <Row label="INSIDE WAISTBAND" val={data.pantInsideWaistband} />
                                <Row label="INSIDE PIPING" val={data.pantInsidePiping} />
                                <Row label="INSIDE LINING" val={data.pantInsideLining} />
                                <Row label="FRONT POCKET" val={data.pantFrontPocket} />
                                <Row label="KEY POCKET" val={data.pantKeyPocket} />
                                <Row label="BOTTOM STYLE" val={data.pantBottom} />
                                <Row label="SIDE SATIN POSITION" val={data.pantSideSatinPos} />
                                <Row label="SIDE SATIN FABRIC" val={data.pantSideSatinFab} />
                                <Row label="PICK STITCH" val={data.pantPickstitch} />
                                <Row label="BACK POCKET" val={data.pantBackPocket} />
                                <Row label="WAIST BAND" val={data.pantWaistband} />
                            </tbody>
                        </table>
                    )}

                        {/* VEST SECTION */}
                        {(['Suit', 'Vest Only', 'Tuxedo'].includes(data.productType)) && (
                        <table className="job-ticket">
                            <tbody>
                                <HeaderRow label="Vest Details" />
                                <Row label="BACK FABRIC CODE" val={data.vestBackFabric} />
                                <Row label="INNER LINING CODE" val={data.vestInnerLining} />
                                <Row label="FRONT STYLE" val={data.vestFrontStyle} />
                                <Row label="COLLAR STYLE" val={data.vestCollar} />
                                <Row label="BOTTOM STYLE" val={data.vestBottom} />
                                <Row label="LOWER POCKET" val={data.vestPocket} />
                            </tbody>
                        </table>
                    )}

                    {/* MEASUREMENTS */}
                    <table className="job-ticket">
                        <tbody>
                            <HeaderRow label="Finished Measurements" />
                            {/* Jacket Meas */}
                            {data.neck_finished && <Row label="Neck" val={calc('neck')} />}
                            {data.length_j_finished && <Row label="Back Jacket Length" val={calc('length_j')} />}
                            {data.back_shoulder_finished && <Row label="Shoulder" val={calc('back_shoulder')} />}
                            {data.chest_finished && <Row label="Chest" val={calc('chest')} />}
                            {data.stomach_finished && <Row label="Stomach" val={calc('stomach')} />}
                            {data.jacket_hip_finished && <Row label="Jacket Hip" val={calc('jacket_hip')} />}
                            {data.sleeve_finished && <Row label="Sleeve Length" val={calc('sleeve')} />}
                            {data.bicep_finished && <Row label="Bicep" val={calc('bicep')} />}
                            {data.wrist_finished && <Row label="Cuff/Wrist" val={calc('wrist')} />}
                            
                            {/* Pant Meas */}
                            {data.waist_t_finished && <Row label="Trouser Waist" val={calc('waist_t')} />}
                            {data.trouser_hip_finished && <Row label="Trouser Hips" val={calc('trouser_hip')} />}
                            {data.thigh_finished && <Row label="Thigh" val={calc('thigh')} />}
                            {data.knee_finished && <Row label="Knee" val={calc('knee')} />}
                            {data.bottom_finished && <Row label="Bottom" val={calc('bottom')} />}
                            {data.rise_finished && <Row label="U-Rise" val={calc('rise')} />}
                            {data.outseam_finished && <Row label="Outseam" val={calc('outseam')} />}
                        </tbody>
                    </table>

                    {data.notes && (
                        <table className="job-ticket">
                            <tbody>
                                <HeaderRow label="Special Notes" />
                                <tr><td colSpan={2} style={{height:'60px'}}>{data.notes}</td></tr>
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductionSheet;
