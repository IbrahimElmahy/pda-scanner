// Fix: Add imports for React and ReactDOM, and remove dependency on global variables.
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom/client';

// ============================================================================
// TYPES
// ============================================================================
const Page = {
  SCAN: 'scan',
  STATS: 'stats',
  REPORTS: 'reports',
  COMPANIES: 'companies',
  PROFILE: 'profile',
};

// ============================================================================
// API Service
// ============================================================================
const API_BASE_URL = 'https://zabda-al-tajamil.com/api_working';

async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}/${endpoint}`;
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      // Fix: Cast options to 'any' to avoid type error on 'headers' property when options is an empty object.
      ...(options as any).headers,
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

let mockUserPassword = '123456';

const login = async (username, password) => {
    console.log(`Attempting login for user: ${username}`);
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (username.toLowerCase() === 'admin' && password === mockUserPassword) {
                const user = { id: 1, username: 'admin' };
                console.log('Login successful');
                resolve(user);
            } else {
                console.log('Login failed: Invalid credentials');
                reject(new Error('اسم المستخدم أو كلمة المرور غير صحيحة'));
            }
        }, 1000);
    });
};

const changePassword = async (currentPassword, newPassword) => {
    console.log('Attempting to change password');
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (currentPassword === mockUserPassword) {
                mockUserPassword = newPassword;
                console.log('Password change successful');
                resolve({ success: true, message: 'تم تغيير كلمة المرور بنجاح.' });
            } else {
                 console.log('Password change failed: Incorrect current password');
                reject(new Error('كلمة المرور الحالية غير صحيحة.'));
            }
        }, 1000);
    });
};

const fetchCompanies = async (activeOnly = false) => {
  const response = await apiFetch('getCompanies.php');
  let companies = (response.companies || []).map((c) => ({
      id: c.id,
      name: c.name,
      is_active: c.is_active == 1 || c.is_active === true,
  }));
  
  if (activeOnly) {
    return companies.filter(c => c.is_active);
  }
  return companies;
};

const addShipment = async (barcode, company_id) => {
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

const fetchStats = async (filters) => {
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
        shipments: (response.shipments || []).map((s) => ({
            barcode: s.barcode,
            company_name: s.company_name,
            scan_count: s.scan_count,
            first_scan: s.first_scan,
            last_scan: s.last_scan,
        })),
    };
};

const addCompany = async (name) => {
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

const toggleCompanyStatus = async (company_id) => {
    const response = await apiFetch('toggleCompany.php', {
        method: 'POST',
        body: JSON.stringify({ company_id }),
    });
    
    return response;
};

// ============================================================================
// COMPONENTS
// ============================================================================

const NavItem = ({ label, page, currentPage, navigate, icon }) => {
  const isActive = currentPage === page;
  return (
    <button
      onClick={() => navigate(page)}
      className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-200 ${
        isActive ? 'text-primary-600' : 'text-gray-500 hover:text-primary-600'
      }`}
    >
      {icon}
      <span className="text-xs mt-1">{label}</span>
    </button>
  );
};

const NavBar = ({ currentPage, navigate }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 grid grid-cols-5 bg-white shadow-[0_-2px_5px_rgba(0,0,0,0.1)] h-16 justify-around items-center z-50">
      <NavItem
        label="مسح"
        page={Page.SCAN}
        currentPage={currentPage}
        navigate={navigate}
        icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10m16-10v10M8 7v10m4-10v10m4-10v10M4 7h16" /></svg>}
      />
      <NavItem
        label="الإحصائيات"
        page={Page.STATS}
        currentPage={currentPage}
        navigate={navigate}
        icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
      />
      <NavItem
        label="تقارير"
        page={Page.REPORTS}
        currentPage={currentPage}
        navigate={navigate}
        icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
      />
      <NavItem
        label="الشركات"
        page={Page.COMPANIES}
        currentPage={currentPage}
        navigate={navigate}
        icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
      />
       <NavItem
        label="ملفي"
        page={Page.PROFILE}
        currentPage={currentPage}
        navigate={navigate}
        icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
      />
    </nav>
  );
};

const LoginPage = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const user = await login(username, password);
      onLoginSuccess(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
            <svg className="w-12 h-12 mx-auto text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10m16-10v10M8 7v10m4-10v10m4-10v10M4 7h16" />
            </svg>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            تسجيل الدخول
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            مرحباً بك في ماسح الباركود
          </p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              اسم المستخدم
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 mt-1 placeholder-gray-500 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="password"className="block text-sm font-medium text-gray-700">
              كلمة المرور
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 placeholder-gray-500 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="relative flex justify-center w-full px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md group bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400"
            >
              {isLoading ? 'جاري التحقق...' : 'تسجيل الدخول'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ProfilePage = ({ user, onLogout }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'كلمتا المرور الجديدتان غير متطابقتين.' });
      return;
    }
    if (newPassword.length < 6) {
        setMessage({ type: 'error', text: 'يجب أن تكون كلمة المرور الجديدة 6 أحرف على الأقل.' });
        return;
    }

    setIsLoading(true);
    try {
      const response = await changePassword(currentPassword, newPassword);
      setMessage({ type: 'success', text: response.message });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      // FIX: Add type guard to safely handle the 'unknown' type of the error object in a catch block.
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'حدث خطأ غير متوقع' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">الملف الشخصي</h2>
      
      <div className="p-4 bg-white rounded-lg shadow-md">
        <p className="text-lg text-gray-600">
          مرحباً بك، <span className="font-bold">{user.username}</span>!
        </p>
      </div>

      <div className="p-4 bg-white rounded-lg shadow-md">
        <h3 className="mb-4 text-xl font-semibold">تغيير كلمة المرور</h3>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {message && (
            <div className={`p-3 text-sm rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message.text}
            </div>
          )}
          <div>
            <label htmlFor="currentPassword"className="block text-sm font-medium text-gray-700">كلمة المرور الحالية</label>
            <input
              id="currentPassword"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div>
            <label htmlFor="newPassword"className="block text-sm font-medium text-gray-700">كلمة المرور الجديدة</label>
            <input
              id="newPassword"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword"className="block text-sm font-medium text-gray-700">تأكيد كلمة المرور الجديدة</label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-3 text-lg font-medium text-white border border-transparent rounded-md shadow-sm bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400"
          >
            {isLoading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </form>
      </div>
      
      <div className="p-4 bg-white rounded-lg shadow-md">
        <button
          onClick={onLogout}
          className="w-full px-6 py-3 text-lg font-medium text-red-700 bg-red-100 border border-transparent rounded-md shadow-sm hover:bg-red-200"
        >
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
};


const CompaniesPage = () => {
    const [companies, setCompanies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newCompanyName, setNewCompanyName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [togglingId, setTogglingId] = useState(null);
    const [error, setError] = useState(null);

    const loadCompanies = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchCompanies();
            setCompanies(data);
        } catch (err) {
            setError("فشل تحميل الشركات.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCompanies();
    }, [loadCompanies]);

    const handleAddCompany = async (e) => {
        e.preventDefault();
        const trimmedName = newCompanyName.trim();
        if (!trimmedName) return;
        
        setIsAdding(true);
        setError(null);

        const tempId = -Date.now();
        const newTempCompany = { id: tempId, name: trimmedName, is_active: true };
        setCompanies(prev => [newTempCompany, ...prev]);
        setNewCompanyName('');

        try {
            const addedCompany = await addCompany(trimmedName);
            setCompanies(prev => prev.map(c => (c.id === tempId ? { ...addedCompany, is_active: !!addedCompany.is_active } : c)));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setError(`فشل الحفظ على السيرفر: ${errorMessage}. تم الحفظ محلياً.`);
        } finally {
            setIsAdding(false);
        }
    };
    
    const handleToggleStatus = async (company) => {
        setTogglingId(company.id);
        setError(null);
        
        setCompanies(prev =>
            prev.map(c =>
                c.id === company.id ? { ...c, is_active: !c.is_active } : c
            )
        );

        try {
            await toggleCompanyStatus(company.id);
        } catch(err) {
            setError("فشل تحديث حالة الشركة على السيرفر. تم التحديث محلياً.");
        } finally {
            setTogglingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">إدارة شركات الشحن</h2>

            {error && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
                    <p className="font-bold">تنبيه</p>
                    <p>{error}</p>
                </div>
            )}

            <div className="bg-white p-4 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4">إضافة شركة جديدة</h3>
                <form onSubmit={handleAddCompany} className="flex flex-col gap-4">
                    <div>
                        <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">اسم الشركة</label>
                        <input
                            id="companyName"
                            type="text"
                            value={newCompanyName}
                            onChange={(e) => setNewCompanyName(e.target.value)}
                            placeholder="أدخل اسم الشركة الجديدة"
                            className="mt-1 w-full p-3 text-lg form-input rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            disabled={isAdding}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isAdding || !newCompanyName.trim()}
                        className="w-full px-6 py-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400"
                    >
                        {isAdding ? 'جاري الإضافة...' : 'إضافة شركة'}
                    </button>
                </form>
            </div>

            <div className="space-y-3">
                 <h3 className="text-xl font-bold text-gray-800">قائمة الشركات</h3>
                {isLoading ? (
                    <p className="text-center py-8 text-gray-500">جاري تحميل الشركات...</p>
                ) : companies.map(company => (
                    <div key={company.id} className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center">
                        <div>
                            <p className="font-bold text-gray-900 text-lg">
                                {company.name}
                            </p>
                            {company.is_active ? (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">نشط</span>
                            ) : (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">غير نشط</span>
                            )}
                        </div>
                        <button 
                            onClick={() => handleToggleStatus(company)} 
                            className="px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50
                                       bg-gray-200 text-gray-800 hover:bg-gray-300"
                            disabled={togglingId === company.id}
                        >
                            {togglingId === company.id ? 'جاري...' : (company.is_active ? 'تعطيل' : 'تفعيل')}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const StatsCard = ({ title, value, icon }) => (
    <div className="bg-white p-4 rounded-lg shadow-md flex items-center">
        <div className="bg-primary-100 text-primary-600 p-3 rounded-full">
            {icon}
        </div>
        <div className="ms-4">
            <p className="text-md font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
    </div>
);


const StatsPage = () => {
    const [statsData, setStatsData] = useState(null);
    const [companies, setCompanies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({
        date: new Date().toISOString().split('T')[0],
        companyId: 0,
        searchQuery: '',
    });

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [fetchedStats, fetchedCompanies] = await Promise.all([
                fetchStats({
                    startDate: filters.date,
                    endDate: filters.date,
                    companyId: filters.companyId > 0 ? filters.companyId : undefined,
                }),
                fetchCompanies(),
            ]);
            setStatsData(fetchedStats);
            setCompanies(fetchedCompanies);
        } catch (error) {
            console.error("Failed to load statistics data", error);
            setStatsData(null);
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ 
            ...prev, 
            [name]: name === 'companyId' ? parseInt(value, 10) : value 
        }));
    };

    const filteredShipments = useMemo(() => {
        if (!statsData || !Array.isArray(statsData.shipments)) return [];
        if (!filters.searchQuery) return statsData.shipments;
        return statsData.shipments.filter(s =>
            s.barcode.toLowerCase().includes(filters.searchQuery.toLowerCase())
        );
    }, [statsData, filters.searchQuery]);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">إحصائيات الشحنات</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatsCard title="إجمالي المسح" value={statsData?.statistics.totalScans ?? 0} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>} />
                <StatsCard title="الشحنات الفريدة" value={statsData?.statistics.totalUniqueShipments ?? 0} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
                <StatsCard title="المسح المكرر" value={statsData?.statistics.duplicateCount ?? 0} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>} />
            </div>

            <div className="bg-white p-4 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4">الفلاتر</h3>
                <div className="flex flex-col gap-4">
                    <input type="date" name="date" value={filters.date} onChange={handleFilterChange} className="p-3 text-lg form-input rounded-md border-gray-300"/>
                    <select name="companyId" value={filters.companyId} onChange={handleFilterChange} className="p-3 text-lg form-select rounded-md border-gray-300">
                        <option value="0">كل الشركات</option>
                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <input type="search" name="searchQuery" value={filters.searchQuery} onChange={handleFilterChange} placeholder="ابحث بالباركود..." className="p-3 text-lg form-input rounded-md border-gray-300"/>
                </div>
            </div>

            <div className="space-y-3">
                <h3 className="text-xl font-bold text-gray-800">الشحنات ({filteredShipments.length})</h3>
                 {isLoading ? (
                    <p className="text-center py-8 text-gray-500">جاري تحميل البيانات...</p>
                ) : filteredShipments.length === 0 ? (
                    <p className="text-center py-8 text-gray-500">لم يتم العثور على شحنات.</p>
                ) : (
                    filteredShipments.map(shipment => (
                        <div key={shipment.barcode} className={`p-3 rounded-lg shadow-sm ${shipment.scan_count > 1 ? 'bg-yellow-50' : 'bg-white'}`}>
                            <div className="flex justify-between items-center">
                                <p className="font-bold text-gray-900">{shipment.barcode}</p>
                                <span className="text-sm font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-800">{shipment.scan_count} مسحات</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{shipment.company_name}</p>
                            <div className="flex justify-between text-xs text-gray-500 mt-2">
                                <span>أول مسح: {new Date(shipment.first_scan).toLocaleTimeString('ar-EG')}</span>
                                <span>آخر مسح: {new Date(shipment.last_scan).toLocaleTimeString('ar-EG')}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const ReportsPage = () => {
    const [reportData, setReportData] = useState(null);
    const [companies, setCompanies] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const today = new Date().toISOString().split('T')[0];
    const [filters, setFilters] = useState({
        startDate: today,
        endDate: today,
        companyId: 0,
    });
    const [searched, setSearched] = useState(false);

    useEffect(() => {
        const loadCompanies = async () => {
            try {
                const fetchedCompanies = await fetchCompanies();
                setCompanies(fetchedCompanies);
            } catch (error) {
                console.error("Failed to load companies", error);
            }
        };
        loadCompanies();
    }, []);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ 
            ...prev, 
            [name]: name === 'companyId' ? parseInt(value, 10) : value 
        }));
    };
    
    const handleFetchReport = useCallback(async () => {
        setIsLoading(true);
        setSearched(true);
        setReportData(null);
        try {
            const fetchedStats = await fetchStats({
                startDate: filters.startDate,
                endDate: filters.endDate,
                companyId: filters.companyId > 0 ? filters.companyId : undefined,
            });
            setReportData(fetchedStats);
        } catch (error) {
            console.error("Failed to load report data", error);
            setReportData(null);
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    const exportToCsv = () => {
        if (!reportData || !reportData.shipments || reportData.shipments.length === 0) {
            return;
        }

        const headers = ['الباركود', 'شركة الشحن', 'عدد المسحات', 'أول مسح', 'آخر مسح'];
        const rows = reportData.shipments.map(s => [
            s.barcode,
            s.company_name,
            s.scan_count,
            new Date(s.first_scan).toLocaleString('ar-EG'),
            new Date(s.last_scan).toLocaleString('ar-EG'),
        ]);

        let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
        csvContent += headers.join(',') + '\r\n';
        rows.forEach(rowArray => {
            let row = rowArray.map(item => `"${String(item).replace(/"/g, '""')}"`).join(',');
            csvContent += row + '\r\n';
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `report_${filters.startDate}_to_${filters.endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">استيراد البيانات والتقارير</h2>
            
            <div className="bg-white p-4 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4">تحديد المعايير</h3>
                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">من تاريخ</label>
                            <input id="startDate" type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="p-3 text-lg form-input rounded-md border-gray-300 w-full"/>
                        </div>
                        <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">إلى تاريخ</label>
                            <input id="endDate" type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="p-3 text-lg form-input rounded-md border-gray-300 w-full"/>
                        </div>
                    </div>

                    <div>
                      <label htmlFor="companyIdSelect" className="block text-sm font-medium text-gray-700 mb-1">شركة الشحن</label>
                      <select id="companyIdSelect" name="companyId" value={filters.companyId} onChange={handleFilterChange} className="p-3 text-lg form-select rounded-md border-gray-300 w-full">
                          <option value="0">كل الشركات</option>
                          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>

                     <button onClick={handleFetchReport} className="w-full px-6 py-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400" disabled={isLoading}>
                        {isLoading ? 'جاري البحث...' : 'بحث واستيراد'}
                    </button>
                </div>
            </div>

            {searched && (
                 <div className="bg-white p-4 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-800">نتائج التقرير</h3>
                        {reportData && reportData.shipments.length > 0 && (
                             <button onClick={exportToCsv} className="px-4 py-2 text-sm font-medium rounded-md transition-colors bg-green-600 text-white hover:bg-green-700">
                                تصدير CSV
                            </button>
                        )}
                    </div>

                    {isLoading ? (
                        <p className="text-center py-8 text-gray-500">جاري تحميل البيانات...</p>
                    ) : !reportData || reportData.shipments.length === 0 ? (
                        <p className="text-center py-8 text-gray-500">لم يتم العثور على شحنات للمعايير المحددة.</p>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="text-center p-2 rounded-lg bg-gray-100">
                                    <div className="text-sm text-gray-500">الشحنات الفريدة</div>
                                    <div className="text-2xl font-bold text-gray-800">{reportData.statistics.totalUniqueShipments}</div>
                                </div>
                                <div className="text-center p-2 rounded-lg bg-gray-100">
                                    <div className="text-sm text-gray-500">إجمالي المسح</div>
                                    <div className="text-2xl font-bold text-gray-800">{reportData.statistics.totalScans}</div>
                                </div>
                                 <div className="text-center p-2 rounded-lg bg-gray-100">
                                    <div className="text-sm text-gray-500">المسح المكرر</div>
                                    <div className="text-2xl font-bold text-gray-800">{reportData.statistics.duplicateCount}</div>
                                </div>
                            </div>
                            <div className="space-y-3 max-h-[45vh] overflow-y-auto no-scrollbar">
                                {reportData.shipments.map(shipment => (
                                    <div key={shipment.barcode} className={`p-3 rounded-lg shadow-sm ${shipment.scan_count > 1 ? 'bg-yellow-50' : 'bg-white'}`}>
                                        <div className="flex justify-between items-center">
                                            <p className="font-bold text-gray-900 font-mono">{shipment.barcode}</p>
                                            <span className="text-sm font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-800">{shipment.scan_count} مسحات</span>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">{shipment.company_name}</p>
                                        <div className="flex justify-between text-xs text-gray-500 mt-2">
                                            <span>أول مسح: {new Date(shipment.first_scan).toLocaleTimeString('ar-EG')}</span>
                                            <span>آخر مسح: {new Date(shipment.last_scan).toLocaleTimeString('ar-EG')}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                 </div>
            )}
        </div>
    );
};

const ScanPage = ({ navigate }) => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [barcode, setBarcode] = useState('');
  const [sessionState, setSessionState] = useState('ready');
  const [sessionScans, setSessionScans] = useState([]);
  const [summaryData, setSummaryData] = useState(null);

  const barcodeInputRef = useRef(null);
  const audioContextRef = useRef(null);
  const scanTimeoutRef = useRef(null);

  const playBeep = useCallback((success) => {
    const context = audioContextRef.current;
    if (!context) {
      console.warn(`Beep (${success ? 'success' : 'failure'}) suppressed: AudioContext not initialized.`);
      return;
    }
    
    if (context.state === 'suspended') {
      context.resume();
    }

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    gainNode.gain.value = 0.5;
    oscillator.type = 'sine';
    oscillator.frequency.value = success ? 880 : 220;
    const now = context.currentTime;
    oscillator.start(now);
    oscillator.stop(now + (success ? 0.15 : 0.3));
  }, []);

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const activeCompanies = await fetchCompanies(true);
        setCompanies(activeCompanies);
        if (activeCompanies.length > 0) {
          setSelectedCompany(String(activeCompanies[0].id));
        }
      } catch (err) {
        console.error('فشل تحميل شركات الشحن.', err);
        playBeep(false);
      }
    };
    loadCompanies();
  }, [playBeep]);

  useEffect(() => {
    if (sessionState === 'scanning') {
      barcodeInputRef.current?.focus();
    }
  }, [sessionState]);
  
  const submitBarcode = useCallback((scannedBarcode) => {
    if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
    if (!scannedBarcode || sessionState !== 'scanning') {
      playBeep(false);
      return;
    }
    
    setBarcode('');
    barcodeInputRef.current?.focus();
    playBeep(true);

    const scanTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const existingScanIndex = sessionScans.findIndex(scan => scan.barcode === scannedBarcode);

    if (existingScanIndex > -1) {
      const updatedScans = [...sessionScans];
      const existing = updatedScans.splice(existingScanIndex, 1)[0];
      setSessionScans([{ ...existing, scan_count: existing.scan_count + 1, scan_time: scanTime }, ...updatedScans]);
    } else {
      const company = companies.find(c => c.id === Number(selectedCompany));
      const newScan = {
        id: Date.now(),
        barcode: scannedBarcode,
        company_id: Number(selectedCompany),
        company_name: company?.name || 'غير معروف',
        scan_time: scanTime,
        scan_count: 1,
      };
      setSessionScans(prev => [newScan, ...prev]);
    }
  }, [sessionState, sessionScans, companies, selectedCompany, playBeep]);

  const handleBarcodeChange = (e) => {
    const currentBarcode = e.target.value;
    setBarcode(currentBarcode);
    if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
    if (currentBarcode.trim().length > 3) {
      scanTimeoutRef.current = window.setTimeout(() => {
        submitBarcode(currentBarcode.trim());
      }, 300);
    }
  };

  const handleStartSession = () => {
    if (!audioContextRef.current) {
        try {
            // Fix: Cast window to 'any' to access vendor-prefixed webkitAudioContext.
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            console.error("Web Audio API is not supported in this browser.");
        }
    }
    if (selectedCompany) setSessionState('scanning');
  };

  const handleReviewSession = () => {
    setSessionState('review');
  };

  const handleConfirmSave = async () => {
    setSessionState('saving');
    const promises = [];
    sessionScans.forEach(scan => {
        for (let i = 0; i < scan.scan_count; i++) {
            promises.push(addShipment(scan.barcode, scan.company_id));
        }
    });

    try {
        await Promise.all(promises);
        const totalUnique = sessionScans.length;
        const totalCartons = sessionScans.reduce((sum, s) => sum + s.scan_count, 0);
        const breakdown = sessionScans.reduce((acc, scan) => {
            const count = scan.scan_count;
            if (count > 1) {
                acc[count] = (acc[count] || 0) + 1;
            }
            return acc;
        }, {});

        setSummaryData({ totalUnique, totalCartons, breakdown, scans: sessionScans });
        setSessionState('summary');
        setSessionScans([]);
    } catch (err) {
        console.error("Failed to save session:", err);
        playBeep(false);
        setSessionState('review');
    }
  };

  const handleContinueScanning = () => {
    setSessionState('scanning');
  };

  const handleQuantityChange = (barcode, delta) => {
    setSessionScans(scans => scans.map(s => s.barcode === barcode ? { ...s, scan_count: Math.max(1, s.scan_count + delta) } : s));
  };

  const handleDeleteScan = (barcode) => {
    setSessionScans(scans => scans.filter(s => s.barcode !== barcode));
  };
  
  const handleStartNewSession = () => {
    setSummaryData(null);
    setSessionState('ready');
  };
  
  const totalCartonsInSession = sessionScans.reduce((total, scan) => total + scan.scan_count, 0);
  const currentCompany = companies.find(c => c.id === Number(selectedCompany));
  
  if (sessionState === 'summary' && summaryData) {
    return (
        <div className="space-y-6 bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-center text-gray-800">ملخص الجلسة</h2>
            <p className="text-center text-lg text-gray-600">شركة الشحن: <span className="font-semibold">{currentCompany?.name}</span></p>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="text-center p-2 rounded-lg bg-gray-100">
                    <div className="text-sm text-gray-500">الشحنات الفريدة</div>
                    <div className="text-2xl font-bold text-gray-800">{summaryData.totalUnique}</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-gray-100">
                    <div className="text-sm text-gray-500">إجمالي الكراتين</div>
                    <div className="text-2xl font-bold text-gray-800">{summaryData.totalCartons}</div>
                </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
                <h3 className="text-xl font-bold text-gray-800">فاتورة المسح</h3>
                <div className="space-y-2 max-h-[35vh] overflow-y-auto no-scrollbar">
                    {summaryData.scans.map(scan => (
                        <div key={scan.id} className="flex justify-between items-center text-md p-2 bg-gray-50 rounded">
                            <span className="font-mono text-gray-700">{scan.barcode}</span>
                            <span className="font-semibold text-primary-600">{scan.scan_count} كرتون</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <h3 className="text-xl font-bold text-gray-800">تفصيل الشحنات المكررة:</h3>
              {Object.keys(summaryData.breakdown).length > 0 ? (
                  Object.entries(summaryData.breakdown).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([count, numShipments]) => (
                      <div key={count} className="flex justify-between text-md">
                          <span>شحنات بـ <span className="font-semibold">{count}</span> كراتين:</span> 
                          {/* Fix: Convert numShipments to string to ensure it's a valid ReactNode. */}
                          <span>{String(numShipments)}</span>
                      </div>
                  ))
              ) : <p className="text-gray-500">لا توجد شحنات مكررة.</p>}
            </div>

            <button onClick={handleStartNewSession} className="w-full mt-6 px-6 py-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-primary-600 hover:bg-primary-700">
                بدء جلسة مسح جديدة
            </button>
        </div>
    );
  }

  const SessionList = () => (
     <div className="space-y-3 max-h-[45vh] overflow-y-auto no-scrollbar">
        {sessionScans.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            {sessionState === 'scanning' ? 'في انتظار أول عملية مسح...' : 'لا توجد شحنات للمراجعة.'}
          </p>
        ) : (
          sessionScans.map((scan) => (
            <div key={scan.id} className="p-3 rounded-lg border-r-4 bg-gray-50 border-primary-400 shadow-sm">
              <div className="flex justify-between items-center">
                <p className="text-md font-bold text-gray-900">{scan.barcode}</p>
                <button onClick={() => handleDeleteScan(scan.barcode)} className="text-red-500 hover:text-red-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                </button>
              </div>
              <div className="flex justify-between items-center mt-2">
                <p className="text-sm text-gray-500">{scan.scan_time}</p>
                <div className="flex items-center gap-3">
                  <button onClick={() => handleQuantityChange(scan.barcode, -1)} className="font-bold text-lg text-red-500">-</button>
                  <span className="px-3 py-1 text-sm font-semibold rounded-full bg-primary-100 text-primary-800">{scan.scan_count}</span>
                  <button onClick={() => handleQuantityChange(scan.barcode, 1)} className="font-bold text-lg text-green-500">+</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
            {sessionState === 'ready' && 'بدء جلسة مسح'}
            {sessionState === 'scanning' && `جلسة مسح لـ: ${currentCompany?.name}`}
            {sessionState === 'review' && `مراجعة جلسة: ${currentCompany?.name}`}
        </h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="company" className="block text-md font-medium text-gray-700 mb-1">شركة الشحن</label>
            <select id="company" value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)} disabled={sessionState !== 'ready'} className="mt-1 block w-full p-3 text-lg border-gray-300 rounded-md disabled:bg-gray-200">
              {companies.map((c) => ( <option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          </div>

          {sessionState === 'scanning' && (
            <div>
              <label htmlFor="barcode" className="block text-md font-medium text-gray-700 mb-1">الباركود (مسح تلقائي)</label>
              <input ref={barcodeInputRef} type="text" id="barcode" value={barcode} onChange={handleBarcodeChange} placeholder="جاهز للمسح..." className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 text-lg" autoComplete="off" />
            </div>
          )}

          {sessionState === 'ready' && (
            <button onClick={handleStartSession} className="w-full px-6 py-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400" disabled={!selectedCompany}>
              بدء المسح
            </button>
          )}

          {sessionState === 'scanning' && (
             <button onClick={handleReviewSession} className="w-full px-6 py-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400" disabled={sessionScans.length === 0}>
                إنهاء ومراجعة
             </button>
          )}
          
           {sessionState === 'review' && (
             <div className="grid grid-cols-2 gap-4">
                <button onClick={handleContinueScanning} className="w-full px-6 py-4 border border-gray-300 rounded-md shadow-sm text-lg font-medium text-gray-700 bg-white hover:bg-gray-50">
                    العودة للمسح
                </button>
                <button onClick={handleConfirmSave} className="w-full px-6 py-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400" disabled={sessionScans.length === 0}>
                    تأكيد وحفظ
                </button>
             </div>
          )}

           {sessionState === 'saving' && (
             <div className="text-center p-4 text-lg font-semibold text-primary-600">جاري حفظ البيانات...</div>
           )}
        </div>
      </div>

      {['scanning', 'review'].includes(sessionState) && (
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            {sessionState === 'scanning' ? `شحنات الجلسة الحالية` : `مراجعة الشحنات`} ({totalCartonsInSession})
          </h3>
          <SessionList />
        </div>
      )}
    </div>
  );
};


// ============================================================================
// Main App Component
// ============================================================================
const App = () => {
  const [user, setUser] = useState(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [currentPage, setCurrentPage] = useState(Page.SCAN);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('barcode-scanner-user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('barcode-scanner-user');
    }
    setIsLoadingSession(false);
  }, []);

  const handleLoginSuccess = useCallback((loggedInUser) => {
    setUser(loggedInUser);
    localStorage.setItem('barcode-scanner-user', JSON.stringify(loggedInUser));
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('barcode-scanner-user');
    setCurrentPage(Page.SCAN);
  }, []);

  const navigate = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const renderPage = () => {
    if (!user) return null;

    switch (currentPage) {
      case Page.SCAN:
        return <ScanPage navigate={navigate} />;
      case Page.STATS:
        return <StatsPage />;
      case Page.REPORTS:
        return <ReportsPage />;
      case Page.COMPANIES:
        return <CompaniesPage />;
      case Page.PROFILE:
        return <ProfilePage user={user} onLogout={handleLogout} />;
      default:
        return <ScanPage navigate={navigate} />;
    }
  };
  
  if (isLoadingSession) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="text-xl font-semibold text-gray-700">جاري تحميل التطبيق...</div>
        </div>
      );
  }

  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <main className="p-4 pb-20">
        {renderPage()}
      </main>
      <NavBar currentPage={currentPage} navigate={navigate} />
    </div>
  );
};


// ============================================================================
// Entry Point
// ============================================================================
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);