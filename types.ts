
export interface ShippingCompany {
  id: number;
  name: string;
  is_active: boolean;
}

export interface Shipment {
  id: number;
  barcode: string;
  company_id: number;
  company_name?: string; // Optional, to be joined for display
  date: string; // YYYY-MM-DD
  is_duplicate: boolean;
}

export interface ScanResult extends Shipment {
  scan_time: string; // HH:mm:ss
}

export enum Page {
  SCAN = 'scan',
  STATS = 'stats',
  COMPANIES = 'companies',
}
