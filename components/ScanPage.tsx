import React, { useState, useEffect, useRef, useCallback, FormEvent } from 'react';
import { fetchCompanies, addShipment } from '../services/api';
import { ShippingCompany, ScanResult, Page } from '../types';

const ScanFeedback: React.FC<{ result: ScanResult | null; error: string | null; onClear: () => void; isVisible: boolean }> = ({ result, error, onClear, isVisible }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClear, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClear]);

  const isDuplicate = result?.is_duplicate;
  const bgColor = error ? 'bg-red-100' : isDuplicate ? 'bg-yellow-100' : 'bg-green-100';
  const borderColor = error ? 'border-red-500' : isDuplicate ? 'border-yellow-500' : 'border-green-500';
  const textColor = error ? 'text-red-800' : isDuplicate ? 'text-yellow-800' : 'text-green-800';
  const title = error ? 'خطأ!' : isDuplicate ? 'مسح مكرر' : 'نجاح!';
  const message = error || `تم مسح الباركود ${result?.barcode}.`;

  return (
    <div 
      className={`fixed bottom-20 left-4 right-4 p-4 border-r-4 rounded-md shadow-lg z-50 transform transition-all duration-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} 
      role="alert"
      style={{ pointerEvents: isVisible ? 'auto' : 'none' }}
    >
      <p className="font-bold">{title}</p>
      <p>{message}</p>
    </div>
  );
};


const ScanPage: React.FC<{ navigate: (page: Page) => void }> = ({ navigate }) => {
  const [companies, setCompanies] = useState<ShippingCompany[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [barcode, setBarcode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [todaysScans, setTodaysScans] = useState<ScanResult[]>([]);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const activeCompanies = await fetchCompanies(true);
        setCompanies(activeCompanies);
        if (activeCompanies.length > 0) {
          setSelectedCompany(String(activeCompanies[0].id));
        }
      } catch (err) {
        setError('فشل تحميل شركات الشحن.');
      }
    };
    loadCompanies();
  }, []);

  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  const handleScan = async (e: FormEvent) => {
    e.preventDefault();
    if (!barcode.trim() || !selectedCompany) {
      setError('يرجى اختيار شركة ومسح باركود.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await addShipment(barcode, Number(selectedCompany));
      const scanTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const companyName = result.company_name || companies.find(c => c.id === result.company_id)?.name || 'غير معروف';
      
      const scanResult: ScanResult = { ...result, scan_time: scanTime, company_name: companyName };
      
      setTodaysScans(prevScans => [scanResult, ...prevScans]);
      setLastResult(scanResult);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('فشل تسجيل المسح. يرجى المحاولة مرة أخرى.');
      }
      setLastResult(null);
    } finally {
      setBarcode('');
      setIsLoading(false);
      barcodeInputRef.current?.focus();
    }
  };
  
  const clearFeedback = useCallback(() => {
    setLastResult(null);
    setError(null);
  }, []);

  return (
    <div className="space-y-6">
      <ScanFeedback result={lastResult} error={error} onClear={clearFeedback} isVisible={!!lastResult || !!error} />
      
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">مسح شحنة</h2>
        <form onSubmit={handleScan} className="space-y-4">
          <div>
            <label htmlFor="company" className="block text-md font-medium text-gray-700 mb-1">
              شركة الشحن
            </label>
            <select
              id="company"
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="mt-1 block w-full p-3 text-lg border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 rounded-md"
            >
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="barcode" className="block text-md font-medium text-gray-700 mb-1">
              الباركود
            </label>
            <input
              ref={barcodeInputRef}
              type="text"
              id="barcode"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="امسح الباركود هنا..."
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 text-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !barcode}
            className="w-full flex justify-center py-4 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400"
          >
            {isLoading ? 'جاري المسح...' : 'إرسال يدوي'}
          </button>
        </form>
         <button
            onClick={() => navigate(Page.STATS)}
            className="mt-4 w-full flex justify-center py-4 px-4 border border-gray-300 rounded-md shadow-sm text-lg font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            إنهاء اليوم وعرض الإحصائيات
          </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-xl font-bold text-gray-800 mb-4">عمليات المسح اليوم ({todaysScans.length})</h3>
        <div className="space-y-3 max-h-[50vh] overflow-y-auto no-scrollbar">
          {todaysScans.length === 0 ? (
             <div className="flex items-center justify-center h-24">
                <p className="text-gray-500">لا توجد عمليات مسح لليوم بعد.</p>
            </div>
          ) : (
            todaysScans.map((scan, index) => (
              <div key={`${scan.id}-${index}`} className={`p-3 rounded-lg border-r-4 ${scan.is_duplicate ? 'bg-yellow-50 border-yellow-400' : 'bg-green-50 border-green-400'}`}>
                <div className="flex justify-between items-center">
                  <p className="text-md font-bold text-gray-900">{scan.barcode}</p>
                  <p className="text-sm text-gray-500">{scan.scan_time}</p>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-sm text-gray-600">{scan.company_name}</p>
                   {scan.is_duplicate ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        مكرر
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        ناجح
                      </span>
                    )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ScanPage;
