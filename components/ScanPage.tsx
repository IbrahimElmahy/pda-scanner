import React, { useState, useEffect, useRef, useCallback, FormEvent } from 'react';
import { fetchCompanies, addShipment } from '../services/api';
import { ShippingCompany, ScanResult, Page } from '../types';

const ScanFeedback: React.FC<{ result: ScanResult | null; error: string | null; onClear: () => void; isVisible: boolean }> = ({ result, error, onClear, isVisible }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClear, 1500); // Shortened duration for faster feedback
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClear]);

  const isDuplicate = result?.is_duplicate;
  const title = error ? 'خطأ!' : isDuplicate ? 'مسح مكرر' : 'نجاح!';
  const message = error || `تم مسح الباركود ${result?.barcode}.`;

  return (
    <div 
      className={`fixed bottom-20 left-4 right-4 p-4 border-r-4 rounded-md shadow-lg z-50 transform transition-all duration-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'} ${error ? 'bg-red-50 border-red-400 text-red-800' : isDuplicate ? 'bg-yellow-50 border-yellow-400 text-yellow-800' : 'bg-green-50 border-green-400 text-green-800'}`} 
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
  const audioContextRef = useRef<AudioContext | null>(null);
  const scanTimeoutRef = useRef<number | null>(null);

  const playBeep = useCallback((success: boolean) => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.error("Web Audio API is not supported in this browser.");
        return;
      }
    }
    const context = audioContextRef.current;
    if (!context) return;

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    gainNode.gain.value = 0.1; // Volume
    oscillator.type = 'sine';

    if (success) {
      oscillator.frequency.value = 880; // Success pitch
    } else {
      oscillator.frequency.value = 220; // Error pitch
    }

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
        setError('فشل تحميل شركات الشحن.');
        playBeep(false);
      }
    };
    loadCompanies();
  }, [playBeep]);

  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);
  
  useEffect(() => {
    // This effect ensures the barcode input is always focused when not loading.
    // This is crucial for continuous scanning without manual clicks.
    if (!isLoading) {
      const timer = setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 50); // A small delay ensures the DOM is ready for focus after a re-render.
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const submitBarcode = useCallback(async (scannedBarcode: string) => {
    if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
    }
    if (!scannedBarcode || !selectedCompany) {
        setError('يرجى اختيار شركة ومسح باركود.');
        playBeep(false);
        return;
    }

    if (isLoading) return;

    setIsLoading(true);
    setError(null);
    setBarcode(''); // Clear input immediately for next scan

    const scanTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const existingScanIndex = todaysScans.findIndex(scan => scan.barcode === scannedBarcode);

    if (existingScanIndex > -1) {
        playBeep(true);
        const updatedScans = [...todaysScans];
        const existingScan = updatedScans.splice(existingScanIndex, 1)[0];
        const updatedScanItem: ScanResult = {
            ...existingScan,
            scan_count: existingScan.scan_count + 1,
            scan_time: scanTime,
        };
        setLastResult({ ...updatedScanItem, is_duplicate: true });
        setTodaysScans([updatedScanItem, ...updatedScans]);
        
        // Log in background, then set loading to false to re-focus
        addShipment(scannedBarcode, Number(selectedCompany))
            .catch(err => console.error("Failed to log duplicate scan:", err))
            .finally(() => setIsLoading(false));

    } else {
        try {
            const result = await addShipment(scannedBarcode, Number(selectedCompany));
            playBeep(true);
            const companyName = result.company_name || companies.find(c => c.id === result.company_id)?.name || 'غير معروف';
            const newScanResult: ScanResult = { 
                ...result, 
                scan_time: scanTime, 
                company_name: companyName,
                scan_count: 1,
            };
            setLastResult({ ...newScanResult, is_duplicate: false });
            setTodaysScans(prevScans => [newScanResult, ...prevScans]);
        } catch (err) {
            playBeep(false);
            const errorMessage = err instanceof Error ? err.message : 'فشل تسجيل المسح. يرجى المحاولة مرة أخرى.';
            setError(errorMessage);
            setLastResult(null);
            // Don't put barcode back, let user rescan. The input is already cleared.
        } finally {
            setIsLoading(false);
        }
    }
}, [selectedCompany, todaysScans, companies, playBeep, isLoading]);


  const handleScanFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if(barcode.trim()){
      submitBarcode(barcode.trim());
    }
  };

  const handleBarcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const currentBarcode = e.target.value;
    setBarcode(currentBarcode);

    if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
    }

    if (currentBarcode.trim().length > 3) { 
        scanTimeoutRef.current = window.setTimeout(() => {
            submitBarcode(currentBarcode.trim());
        }, 300); 
    }
  };
  
  const clearFeedback = useCallback(() => {
    setLastResult(null);
    setError(null);
  }, []);

  const totalCartons = todaysScans.reduce((total, scan) => total + scan.scan_count, 0);

  return (
    <div className="space-y-6">
      <ScanFeedback result={lastResult} error={error} onClear={clearFeedback} isVisible={!!lastResult || !!error} />
      
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">مسح شحنة</h2>
        <form onSubmit={handleScanFormSubmit} className="space-y-4">
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
              الباركود (مسح تلقائي)
            </label>
            <input
              ref={barcodeInputRef}
              type="text"
              id="barcode"
              value={barcode}
              onChange={handleBarcodeChange}
              placeholder="جاهز للمسح..."
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 text-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              disabled={isLoading}
              autoComplete="off"
            />
          </div>
        </form>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-xl font-bold text-gray-800 mb-4">عمليات المسح اليوم ({totalCartons})</h3>
        <div className="space-y-3 max-h-[50vh] overflow-y-auto no-scrollbar">
          {todaysScans.length === 0 ? (
             <div className="flex items-center justify-center h-24">
                <p className="text-gray-500">لا توجد عمليات مسح لليوم بعد.</p>
            </div>
          ) : (
            todaysScans.map((scan) => (
              <div key={`${scan.id}-${scan.scan_count}`} className={`p-3 rounded-lg border-r-4 ${scan.scan_count > 1 ? 'bg-yellow-50 border-yellow-400' : 'bg-green-50 border-green-400'}`}>
                <div className="flex justify-between items-center">
                  <p className="text-md font-bold text-gray-900">{scan.barcode}</p>
                  <p className="text-sm text-gray-500">{scan.scan_time}</p>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-sm text-gray-600">{scan.company_name}</p>
                   {scan.scan_count > 1 ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        {scan.scan_count} كراتين
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