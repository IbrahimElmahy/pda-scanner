import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchStats, fetchCompanies } from '../services/api';
import { ShipmentStat, ShippingCompany, StatsData } from '../types';

const StatsCard: React.FC<{ title: string; value: number | string; icon: React.ReactNode }> = ({ title, value, icon }) => (
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


const StatsPage: React.FC = () => {
    const [statsData, setStatsData] = useState<StatsData | null>(null);
    const [companies, setCompanies] = useState<ShippingCompany[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [filters, setFilters] = useState({
        date: new Date().toISOString().split('T')[0],
        companyId: 0, // 0 for all companies
        searchQuery: '',
    });

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [fetchedStats, fetchedCompanies] = await Promise.all([
                fetchStats({
                    date: filters.date,
                    companyId: filters.companyId > 0 ? filters.companyId : undefined,
                }),
                fetchCompanies(),
            ]);
            setStatsData(fetchedStats);
            setCompanies(fetchedCompanies);
        } catch (error) {
            console.error("Failed to load statistics data", error);
            setStatsData(null); // Clear data on error
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

export default StatsPage;
