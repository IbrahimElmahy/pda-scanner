import { ShippingCompany, Shipment } from '../types';

const BASE_URL = 'https://zabda-al-tajamil.com/shipment_tracking/api';

// Helper to handle API responses and errors
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    try {
      const errorData = await response.json();
      throw new Error(errorData.message || `خطأ من الخادم: ${response.status}`);
    } catch (e) {
      throw new Error(`خطأ في الشبكة: ${response.status}`);
    }
  }
  return response.json();
}

export const fetchCompanies = async (activeOnly = false): Promise<ShippingCompany[]> => {
  const response = await fetch(`${BASE_URL}/getCompanies.php`);
  const data = await handleResponse<any[]>(response);
  
  let companies: ShippingCompany[] = data.map(c => ({
    id: Number(c.id),
    name: c.name,
    is_active: c.is_active === '1' || c.is_active === true,
  }));

  if (activeOnly) {
    return companies.filter(c => c.is_active);
  }
  return companies;
};

export const scanBarcode = async (barcode: string, company_id: number): Promise<Shipment> => {
  const formData = new FormData();
  formData.append('barcode', barcode);
  formData.append('company_id', String(company_id));

  const response = await fetch(`${BASE_URL}/addShipment.php`, {
    method: 'POST',
    body: formData,
  });

  const result = await handleResponse<any>(response);

  return {
    id: Number(result.id),
    barcode: result.barcode,
    company_id: Number(result.company_id),
    date: result.date,
    is_duplicate: result.is_duplicate === '1' || result.is_duplicate === true,
  };
};

export const fetchShipments = async (filters: { date?: string; companyId?: number; searchQuery?: string }): Promise<Shipment[]> => {
    const params = new URLSearchParams();
    if (filters.date) params.append('date', filters.date);
    if (filters.companyId) params.append('company_id', String(filters.companyId));
    if (filters.searchQuery) params.append('search', filters.searchQuery);
    
    const [shipmentsData, companies] = await Promise.all([
        fetch(`${BASE_URL}/getStats.php?${params.toString()}`).then(res => handleResponse<any[]>(res)),
        fetchCompanies() // Fetch all companies to map names
    ]);

    if (!Array.isArray(shipmentsData)) {
      console.error("Received non-array data for shipments:", shipmentsData);
      return [];
    }

    return shipmentsData.map(s => ({
        id: Number(s.id),
        barcode: s.barcode,
        company_id: Number(s.company_id),
        date: s.date,
        is_duplicate: s.is_duplicate === '1' || s.is_duplicate === true,
        company_name: companies.find(c => c.id === Number(s.company_id))?.name || 'غير معروف',
    }));
};

export const addCompany = async (name: string): Promise<ShippingCompany> => {
    const formData = new FormData();
    formData.append('name', name);

    const response = await fetch(`${BASE_URL}/addCompany.php`, {
        method: 'POST',
        body: formData,
    });
    
    const result = await handleResponse<any>(response);
    
    return {
        id: Number(result.id),
        name: result.name,
        is_active: result.is_active === '1' || result.is_active === true,
    };
};

// ملاحظة: لم يتم توفير رابط API لتحديث الشركة.
// تم افتراض وجود رابط `updateCompany.php` يقبل `id` و `is_active`.
export const updateCompany = async (id: number, updates: Partial<Pick<ShippingCompany, 'is_active'>>): Promise<ShippingCompany> => {
    const formData = new FormData();
    formData.append('id', String(id));
    
    if (updates.is_active !== undefined) {
      formData.append('is_active', updates.is_active ? '1' : '0');
    }

    const response = await fetch(`${BASE_URL}/updateCompany.php`, {
        method: 'POST',
        body: formData,
    });

    const result = await handleResponse<any>(response);

    return {
        id: Number(result.id),
        name: result.name,
        is_active: result.is_active === '1' || result.is_active === true,
    };
};
