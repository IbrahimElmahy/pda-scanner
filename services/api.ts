
import { ShippingCompany, Shipment } from '../types';

// --- Mock Database ---
let companies: ShippingCompany[] = [
  { id: 1, name: 'Aramex', is_active: true },
  { id: 2, name: 'SMSA', is_active: true },
  { id: 3, name: 'DHL', is_active: false },
  { id: 4, name: 'FedEx', is_active: true },
];

let shipments: Shipment[] = [
  { id: 101, barcode: '123456789012', company_id: 1, date: '2024-07-21', is_duplicate: false },
  { id: 102, barcode: '987654321098', company_id: 2, date: '2024-07-21', is_duplicate: false },
  { id: 103, barcode: '123456789012', company_id: 1, date: '2024-07-21', is_duplicate: true },
  { id: 104, barcode: '555555555555', company_id: 4, date: '2024-07-20', is_duplicate: false },
];

let nextCompanyId = 5;
let nextShipmentId = 105;

const getTodayDateString = () => new Date().toISOString().split('T')[0];

// --- Mock API Functions ---

// Simulate network delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const fetchCompanies = async (activeOnly = false): Promise<ShippingCompany[]> => {
  await delay(300);
  if (activeOnly) {
    return companies.filter(c => c.is_active);
  }
  return [...companies];
};

export const scanBarcode = async (barcode: string, company_id: number): Promise<Shipment> => {
  await delay(200);
  const today = getTodayDateString();
  const isDuplicate = shipments.some(s => s.barcode === barcode && s.date === today);

  const newShipment: Shipment = {
    id: nextShipmentId++,
    barcode,
    company_id,
    date: today,
    is_duplicate: isDuplicate,
  };
  shipments.push(newShipment);
  return newShipment;
};

export const fetchShipments = async (filters: { date?: string; companyId?: number; searchQuery?: string }): Promise<Shipment[]> => {
  await delay(500);
  let filteredShipments = [...shipments];

  if (filters.date) {
    filteredShipments = filteredShipments.filter(s => s.date === filters.date);
  }
  if (filters.companyId) {
    filteredShipments = filteredShipments.filter(s => s.company_id === filters.companyId);
  }
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filteredShipments = filteredShipments.filter(s => s.barcode.toLowerCase().includes(query));
  }
  
  // Join company name for display
  return filteredShipments.map(s => ({
      ...s,
      company_name: companies.find(c => c.id === s.company_id)?.name || 'Unknown',
  })).sort((a,b) => b.id - a.id);
};

export const addCompany = async (name: string): Promise<ShippingCompany> => {
    await delay(400);
    if (companies.some(c => c.name.toLowerCase() === name.toLowerCase())) {
        throw new Error("Company name already exists.");
    }
    const newCompany: ShippingCompany = {
        id: nextCompanyId++,
        name,
        is_active: true,
    };
    companies.push(newCompany);
    return newCompany;
};

export const updateCompany = async (id: number, updates: Partial<Pick<ShippingCompany, 'name' | 'is_active'>>): Promise<ShippingCompany> => {
    await delay(300);
    const companyIndex = companies.findIndex(c => c.id === id);
    if (companyIndex === -1) {
        throw new Error("Company not found.");
    }
    companies[companyIndex] = { ...companies[companyIndex], ...updates };
    return companies[companyIndex];
};
