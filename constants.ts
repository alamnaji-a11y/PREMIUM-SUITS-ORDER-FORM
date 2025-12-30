import { JacketSizeSpec, TrouserSizeSpec } from "./types";

export const PRODUCT_TYPES = ["Suit", "Jacket Only", "Trouser Only", "Vest Only", "Tuxedo", "Overcoat"];
export const SHOULDER_SHAPES = ["Natural", "Roped", "Soft", "Structured"];
export const CANVAS_STYLES = ["Half Canvas", "Full Canvas", "Fused"];
export const BACK_VENTS = ["Side Vents", "Center Vent", "No Vent"];
export const BREAST_POCKETS = ["Boat Shape", "Straight", "Patch", "None"];
export const SHOULDER_PADS = ["Thin", "Medium", "Thick", "None"];
export const LINING_STYLES = ["Full", "Half", "Quarter/Butterfly", "Unlined"];
export const PICKSTITCH_OPTS = ["None", "Standard Pickstitch", "Double Pickstitch", "Hand Pickstitch"];
export const SLEEVE_SLITS = ["Normal Button Fastening", "Functional Buttons", "Closed"];
export const POCKET_STYLES = ["Straight with Flap", "Straight No Flap", "Slanted with Flap", "Slanted No Flap", "Patch Pocket", "None"];
export const PANT_WAISTBANDS = ["With Silicone Tabs", "Standard", "Pleated Curtain"];
export const PANT_POCKETS_FRONT = ["Side Seam", "Slanted", "Western"];
export const PANT_POCKETS_BACK = ["Welt with Button", "Welt No Button", "Patch", "None"];

// CSS String for Email Body
export const TICKET_CSS_STRING = `
    .job-ticket { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-family: sans-serif; font-size: 11px; color: black; }
    .job-ticket th, .job-ticket td { border: 1px solid #000; padding: 4px 8px; text-align: left; }
    .job-ticket th { background-color: #e2e8f0; font-weight: bold; width: 40%; }
    .job-ticket td { width: 60%; font-weight: 500; }
    .section-header { background-color: #000; color: #fff !important; font-weight: bold; text-transform: uppercase; padding: 6px; text-align: center; }
    .print-layout-cols { column-count: 2; column-gap: 20px; }
    .print-break { break-inside: avoid; margin-bottom: 10px; }
`;

export const JACKET_SIZES: Record<string, JacketSizeSpec> = {
    "36": { neck: 14.50, length: 28.75, shoulder: 17.25, chest: 38.00, stomach: 35.00, hip: 38.00, sleeve: 24.75, bicep: 15.00, wrist: 10.25 },
    "38": { neck: 15.00, length: 29.00, shoulder: 17.75, chest: 40.00, stomach: 37.00, hip: 40.00, sleeve: 25.00, bicep: 15.50, wrist: 10.50 },
    "40": { neck: 15.50, length: 29.25, shoulder: 18.25, chest: 42.00, stomach: 39.00, hip: 42.00, sleeve: 25.25, bicep: 16.00, wrist: 10.75 },
    "42": { neck: 16.00, length: 29.50, shoulder: 18.75, chest: 44.00, stomach: 41.00, hip: 44.00, sleeve: 25.50, bicep: 16.50, wrist: 11.00 },
    "44": { neck: 16.50, length: 29.75, shoulder: 19.25, chest: 46.00, stomach: 43.00, hip: 46.00, sleeve: 25.75, bicep: 17.00, wrist: 11.33 },
    "46": { neck: 17.00, length: 30.00, shoulder: 19.75, chest: 48.00, stomach: 45.00, hip: 48.00, sleeve: 26.00, bicep: 17.50, wrist: 11.66 },
    "48": { neck: 17.50, length: 30.25, shoulder: 20.25, chest: 50.00, stomach: 47.00, hip: 50.00, sleeve: 26.25, bicep: 18.00, wrist: 11.99 },
    "50": { neck: 18.00, length: 30.50, shoulder: 20.75, chest: 52.00, stomach: 49.00, hip: 52.00, sleeve: 26.50, bicep: 18.50, wrist: 12.32 },
    "52": { neck: 18.50, length: 30.75, shoulder: 21.25, chest: 54.00, stomach: 51.00, hip: 54.00, sleeve: 26.75, bicep: 19.00, wrist: 12.65 },
    "54": { neck: 19.00, length: 31.00, shoulder: 21.80, chest: 56.00, stomach: 53.00, hip: 56.00, sleeve: 27.00, bicep: 19.50, wrist: 13.00 }
};

export const TROUSER_SIZES: Record<string, TrouserSizeSpec> = {
    "30": { waist: 31.0, hip: 37.0, thigh: 25.0, rise: 24.75, knee: 19.0, bottom: 14.5 },
    "32": { waist: 33.0, hip: 39.0, thigh: 25.0, rise: 25.25, knee: 19.0, bottom: 14.5 },
    "34": { waist: 35.0, hip: 41.0, thigh: 26.0, rise: 25.75, knee: 19.5, bottom: 15.0 },
    "36": { waist: 37.0, hip: 43.0, thigh: 27.0, rise: 26.25, knee: 19.5, bottom: 15.0 },
    "38": { waist: 39.0, hip: 45.0, thigh: 28.0, rise: 27.00, knee: 20.0, bottom: 15.5 },
    "40": { waist: 41.0, hip: 47.0, thigh: 29.0, rise: 27.75, knee: 20.0, bottom: 15.5 },
    "42": { waist: 43.0, hip: 49.0, thigh: 30.0, rise: 28.50, knee: 20.0, bottom: 15.5 },
    "44": { waist: 45.0, hip: 51.0, thigh: 31.0, rise: 29.25, knee: 21.0, bottom: 16.0 },
    "46": { waist: 47.0, hip: 53.0, thigh: 32.0, rise: 30.00, knee: 21.0, bottom: 16.0 },
    "48": { waist: 49.0, hip: 55.0, thigh: 33.0, rise: 30.80, knee: 21.0, bottom: 16.0 }
};
