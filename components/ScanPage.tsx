import React, { useState, useEffect, useRef, useCallback, FormEvent } from 'react';
import { fetchCompanies, addShipment } from '../services/api';
import { ShippingCompany, ScanResult, Page } from '../types';

const ScanFeedback: React.FC<{ result: ScanResult | null; error: string | null; onClear: () => void }> = ({ result, error, onClear }) => {
  useEffect(() => {
    if (result || error) {
      const timer = setTimeout(onClear, 3000);
      return () => clearTimeout(timer);
    }
  }, [result, error, onClear]);

  if (!result && !error) return null;

  const isDuplicate = result?.is_duplicate;
  const bgColor = error ? 'bg-red-100' : isDuplicate ? 'bg-yellow-100' : 'bg-green-100';
  const borderColor = error ? 'border-red-500' : isDuplicate ? 'border-yellow-500' : 'border-green-500';
  const textColor = error ? 'text-red-800' : isDuplicate ? 'text-yellow-800' : 'text-green-800';
  const title = error ? 'خطأ!' : isDuplicate ? 'مسح مكرر' : 'نجاح!';
  const message = error || `تم مسح الباركود ${result?.barcode}.`;

  return (
    <div className={`fixed top-5 left-5 p-4 border-r-4 rounded-md shadow-lg ${bgColor} ${borderColor} ${textColor}`} role="alert">
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
      const scanTime = new Date().toLocaleTimeString('ar-EG');
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <ScanFeedback result={lastResult} error={error} onClear={clearFeedback} />
      <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">مسح شحنة</h2>
        <form onSubmit={handleScan} className="space-y-6">
          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-700">
              شركة الشحن
            </label>
            <select
              id="company"
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            >
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="barcode" className="block text-sm font-medium text-gray-700">
              الباركود
            </label>
            <input
              ref={barcodeInputRef}
              type="text"
              id="barcode"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="امسح الباركود هنا..."
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !barcode}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400"
          >
            {isLoading ? 'جاري المسح...' : 'إرسال يدوي'}
          </button>
        </form>
         <button
            onClick={() => navigate(Page.STATS)}
            className="mt-4 w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            إنهاء اليوم وعرض الإحصائيات
          </button>
      </div>

      <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-4">عمليات المسح اليوم ({todaysScans.length})</h3>
        <div className="overflow-y-auto h-96 border rounded-lg no-scrollbar">
          {todaysScans.length === 0 ? (
             <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">لا توجد عمليات مسح لليوم بعد.</p>
            </div>
          ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الوقت</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الباركود</th>
                <th scope="col"className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الشركة</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {todaysScans.map((scan, index) => (
                <tr key={`${scan.id}-${index}`} className={scan.is_duplicate ? 'bg-yellow-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{scan.scan_time}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{scan.barcode}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{scan.company_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {scan.is_duplicate ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        مكرر
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        ناجح
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScanPage;
