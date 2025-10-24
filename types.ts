export interface ShippingCompany {
  id: number;
  name: string;
  is_active: boolean | number; // API might return 1/0
}

// Represents the object returned when a new shipment is added
export interface Shipment {
  id: number;
  barcode: string;
  company_id: number;
  company_name?: string;
  scan_date?: string; // API returns this as `date`
  date?: string; // To match existing usage
  is_duplicate?: boolean; // This might not be returned from addShipment, handle gracefully
}

// Represents an item in the local list of scans on the ScanPage
export interface ScanResult extends Shipment {
  scan_time: string; // HH:mm:ss
  scan_count: number;
}

// Represents a shipment row in the statistics table
export interface ShipmentStat {
    barcode: string;
    company_name: string;
    scan_count: number;
    first_scan: string;
    last_scan: string;
}

// Represents the full data structure from getStats.php
export interface StatsData {
    statistics: {
        totalUniqueShipments: number;
        totalScans: number;
        duplicateCount: number;
    };
    shipments: ShipmentStat[];
}


export enum Page {
  SCAN = 'scan',
  STATS = 'stats',
  COMPANIES = 'companies',
}
