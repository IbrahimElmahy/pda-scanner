import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fetchCompanies, addShipment } from '../services/api';
import { ShippingCompany, ScanResult, Page } from '../types';

type SessionState = 'ready' | 'scanning' | 'review' | 'saving' | 'summary';

interface SummaryData {
  totalUnique: number;
  totalCartons: number;
  breakdown: Record<number, number>;
  scans: ScanResult[];
}

const ScanPage: React.FC<{ navigate: (page: Page) => void }> = ({ navigate }) => {
  const [companies, setCompanies] = useState<ShippingCompany[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [barcode, setBarcode] = useState<string>('');
  const [sessionState, setSessionState] = useState<SessionState>('ready');
  const [sessionScans, setSessionScans] = useState<ScanResult[]>([]);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scanTimeoutRef = useRef<number | null>(null);

  const playBeep = useCallback((success: boolean) => {
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
  
  const submitBarcode = useCallback((scannedBarcode: string) => {
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
      const newScan: ScanResult = {
        id: Date.now(), // Temporary unique ID for key prop
        barcode: scannedBarcode,
        company_id: Number(selectedCompany),
        company_name: company?.name || 'غير معروف',
        scan_time: scanTime,
        scan_count: 1,
      };
      setSessionScans(prev => [newScan, ...prev]);
    }
  }, [sessionState, sessionScans, companies, selectedCompany, playBeep]);

  const handleBarcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    const promises: Promise<any>[] = [];
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
        }, {} as Record<number, number>);

        setSummaryData({ totalUnique, totalCartons, breakdown, scans: sessionScans });
        setSessionState('summary');
        setSessionScans([]);
    } catch (err) {
        console.error("Failed to save session:", err);
        playBeep(false);
        setSessionState('review'); // Go back to review on error
    }
  };

  const handleContinueScanning = () => {
    setSessionState('scanning');
  };

  const handleQuantityChange = (barcode: string, delta: number) => {
    setSessionScans(scans => scans.map(s => s.barcode === barcode ? { ...s, scan_count: Math.max(1, s.scan_count + delta) } : s));
  };

  const handleDeleteScan = (barcode: string) => {
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
                          <span>{numShipments}</span>
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

export default ScanPage;
