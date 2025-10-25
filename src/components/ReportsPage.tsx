import React, { useState, useEffect, useCallback } from 'react';
import { fetchStats, fetchCompanies } from '../services/api';
import { StatsData, ShippingCompany } from '../types';

const ReportsPage: React.FC = () => {
    const [reportData, setReportData] = useState<StatsData | null>(null);
    const [companies, setCompanies] = useState<ShippingCompany[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const today = new Date().toISOString().split('T')[0];
    const [filters, setFilters] = useState({
        startDate: today,
        endDate: today,
        companyId: 0, // 0 for all companies
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

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
            setReportData(null); // Clear data on error
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

        let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // Add BOM for Excel
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

export default ReportsPage;
