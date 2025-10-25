import { ShippingCompany, Shipment, StatsData, User } from '../types';

// ✅ المسار الجديد النهائي
const API_BASE_URL = 'https://zabda-al-tajamil.com/api_working';

async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}/${endpoint}`;
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(url, config);
  const text = await response.text();
  
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
  }

  if (data.success === false) {
    throw new Error(data.error || 'API error occurred');
  }

  return data;
}

// MOCK AUTHENTICATION
export const login = async (username: string, password: string): Promise<User> => {
    console.log(`Attempting login for user: ${username}`);
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Simulate network delay
            if (username.toLowerCase() === 'admin' && password === '123456') {
                const user: User = { id: 1, username: 'admin' };
                console.log('Login successful');
                resolve(user);
            } else {
                console.log('Login failed: Invalid credentials');
                reject(new Error('اسم المستخدم أو كلمة المرور غير صحيحة'));
            }
        }, 1000); // 1 second delay
    });
};

export const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    console.log('Attempting to change password');
    return new Promise((resolve, reject) => {
        setTimeout(() => {
             // In a real app, you'd verify the currentPassword
            if (currentPassword === '123456') {
                console.log('Password change successful');
                resolve({ success: true, message: 'تم تغيير كلمة المرور بنجاح.' });
            } else {
                 console.log('Password change failed: Incorrect current password');
                reject(new Error('كلمة المرور الحالية غير صحيحة.'));
            }
        }, 1000);
    });
};

export const fetchCompanies = async (activeOnly = false): Promise<ShippingCompany[]> => {
  const response = await apiFetch('getCompanies.php');
  let companies: ShippingCompany[] = (response.companies || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      is_active: c.is_active == 1 || c.is_active === true,
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
    
    const shipmentData = response.shipment;
    
    return { 
        id: shipmentData.id,
        barcode: shipmentData.barcode,
        company_id: shipmentData.company_id,
        company_name: shipmentData.company_name,
        scan_date: shipmentData.scan_date,
        date: shipmentData.scan_date,
    };
};

export const fetchStats = async (filters: { startDate?: string; endDate?: string; companyId?: number }): Promise<StatsData> => {
    const params = new URLSearchParams();
    if (filters.startDate) {
        params.append('start_date', filters.startDate);
    }
    if (filters.endDate) {
        params.append('end_date', filters.endDate);
    }
    if (filters.companyId) {
        params.append('company_id', String(filters.companyId));
    }
    
    const response = await apiFetch(`getStats.php?${params.toString()}`);
    
    return {
        statistics: {
            totalUniqueShipments: response.statistics?.total_unique_shipments || 0,
            totalScans: response.statistics?.total_scans || 0,
            duplicateCount: response.statistics?.duplicate_count || 0,
        },
        shipments: (response.shipments || []).map((s: any) => ({
            barcode: s.barcode,
            company_name: s.company_name,
            scan_count: s.scan_count,
            first_scan: s.first_scan,
            last_scan: s.last_scan,
        })),
    };
};

export const addCompany = async (name: string): Promise<ShippingCompany> => {
    const response = await apiFetch('addCompany.php', {
        method: 'POST',
        body: JSON.stringify({ name }),
    });
    
    const companyData = response.company;
    
    return { 
        id: companyData.id,
        name: companyData.name,
        is_active: companyData.is_active == 1 || companyData.is_active === true,
    };
};

export const toggleCompanyStatus = async (company_id: number): Promise<any> => {
    const response = await apiFetch('toggleCompany.php', {
        method: 'POST',
        body: JSON.stringify({ company_id }),
    });
    
    return response;
};
