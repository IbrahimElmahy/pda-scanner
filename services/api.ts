import { ShippingCompany, Shipment, StatsData } from '../types';

const API_BASE_URL = 'https://zabda-al-tajamil.com/shipment_tracking/api';

// A helper function to handle API requests
async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}/${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Network response was not ok: ${response.statusText} - ${errorText}`);
  }
  
  // Force UTF-8 decoding to fix issues with Arabic characters
  const buffer = await response.arrayBuffer();
  const decoder = new TextDecoder('utf-8');
  const text = decoder.decode(buffer);
  const data = JSON.parse(text);

  if (data.success === false) {
      throw new Error(data.message || 'An API error occurred');
  }

  return data;
}


export const fetchCompanies = async (activeOnly = false): Promise<ShippingCompany[]> => {
  const data = await apiFetch('getCompanies.php');
  let companies: ShippingCompany[] = data.companies.map((c: any) => ({
      ...c,
      is_active: c.is_active == 1,
  }));
  if (activeOnly) {
    return companies.filter(c => c.is_active);
  }
  return companies;
};

export const addShipment = async (barcode: string, company_id: number): Promise<Shipment> => {
    const today = new Date().toISOString().split('T')[0];
    const response = await apiFetch('addShipment.php', {
        method: 'POST',
        body: JSON.stringify({
            barcode,
            company_id,
            scan_date: today,
        }),
    });
    // The component expects `is_duplicate`. The API docs for addShipment don't provide it.
    // We pass the raw shipment object; the component should handle a potentially missing `is_duplicate`.
    return { ...response.shipment, date: response.shipment.scan_date };
};

export const fetchStats = async (filters: { date?: string; companyId?: number }): Promise<StatsData> => {
    const params = new URLSearchParams();
    if (filters.date) {
        params.append('date', filters.date);
    }
    if (filters.companyId) {
        params.append('company_id', String(filters.companyId));
    }
    const data = await apiFetch(`getStats.php?${params.toString()}`);
    return {
        statistics: data.statistics,
        shipments: data.shipments,
    };
};

export const addCompany = async (name: string): Promise<ShippingCompany> => {
    const response = await apiFetch('addCompany.php', {
        method: 'POST',
        body: JSON.stringify({ name }),
    });
    return { ...response.company, is_active: response.company.is_active == 1 };
};

export const toggleCompanyStatus = async (company_id: number, is_active: boolean): Promise<any> => {
    return apiFetch('toggleCompany.php', {
        method: 'POST',
        body: JSON.stringify({ company_id, is_active }),
    });
};