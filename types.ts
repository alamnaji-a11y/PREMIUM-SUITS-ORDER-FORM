
export interface FormData {
    [key: string]: string | undefined;
    // Header
    groupName: string;
    storeName: string;
    storeMobile: string;
    productType: string;
    orderDate: string;
    deliveryDate: string;
    rushFee: string;
    customerName: string;
    customerRef: string;
    height: string;
    weight: string;
    orderNumber: string;
    shipToAddress: string;

    // Fabric & General
    fabricCode: string;
    lining: string;
    satinColor: string;
    buttonCode: string;
    fabricPatternImage?: string; // AI Generated Pattern
    
    // Try Ons
    jacketSize: string;
    trouserSize: string;
    
    // Measurements (Finished & Adj)
    neck_finished: string; neck_adj: string;
    back_shoulder_finished: string; back_shoulder_adj: string;
    sleeve_finished: string; sleeve_adj: string;
    wrist_finished: string; wrist_adj: string;
    length_j_finished: string; length_j_adj: string;
    chest_finished: string; chest_adj: string;
    stomach_finished: string; stomach_adj: string;
    waist_j_finished: string; waist_j_adj: string;
    jacket_hip_finished: string; jacket_hip_adj: string;
    bicep_finished: string; bicep_adj: string;

    waist_t_finished: string; waist_t_adj: string;
    trouser_hip_finished: string; trouser_hip_adj: string;
    thigh_finished: string; thigh_adj: string;
    rise_finished: string; rise_adj: string;
    outseam_finished: string; outseam_adj: string;
    knee_finished: string; knee_adj: string;
    bottom_finished: string; bottom_adj: string;

    chest_v_finished: string; 
    waist_v_finished: string; 
    length_v_front_finished: string; 
    length_v_back_finished: string;

    // Jacket Design
    jacketFrontStyle: string;
    jacketLapelStyle: string;
    jacketLapelWidth: string;
    jacketLapelSatin: string;
    jacketButtons: string;
    jacketInsideButton: string;
    jacketPocket: string;
    jacketTicketPocket: string;
    jacketBreastPocket: string;
    jacketShoulderShape: string;
    jacketCanvas: string;
    jacketVent: string;
    jacketLiningStyle: string;
    jacketLapelHole: string;
    jacketPickstitch: string;
    jacketSleeveSlit: string;
    jacketSleeveButtonQty: string;
    jacketShoulderPad: string;
    
    // Embroidery
    embroideryName: string;
    embroideryFont: string;
    embroideryThread: string;

    // Trouser Design
    pantFront: string;
    pantBottom: string;
    pantWaistband: string;
    pantInsideWaistband: string;
    pantInsidePiping: string;
    pantInsideLining: string;
    pantFrontPocket: string;
    pantKeyPocket: string;
    pantSideSatinPos: string;
    pantSideSatinFab: string;
    pantPickstitch: string;
    pantBackPocket: string;
    
    // Vest Design
    vestBackFabric: string;
    vestInnerLining: string;
    vestFrontStyle: string;
    vestNeck: string;
    vestLapel: string;
    vestButtons: string;
    vestBottom: string;
    vestCollar: string;
    vestPocket: string;

    notes: string;
}

export interface JacketSizeSpec {
    neck: number;
    length: number;
    shoulder: number;
    chest: number;
    stomach: number;
    hip: number;
    sleeve: number;
    bicep: number;
    wrist: number;
}

export interface TrouserSizeSpec {
    waist: number;
    hip: number;
    thigh: number;
    rise: number;
    knee: number;
    bottom: number;
}
