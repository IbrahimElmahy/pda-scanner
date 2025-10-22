import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchStats, fetchCompanies } from '../services/api';
import { ShipmentStat, ShippingCompany, StatsData } from '../types';

const StatsCard: React.FC<{ title: string; value: number | string; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white p-6 rounded-lg shadow-lg flex items-center">
        <div className="bg-primary-100 text-primary-600 p-3 rounded-full">
            {icon}
        </div>
        <div className="ms-4">
            <p className="text-sm font-medium text-gray-500">{title}</p>
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
                    ...filters,
                    companyId: filters.companyId || undefined,
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
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const filteredShipments = useMemo(() => {
        if (!statsData) return [];
        if (!filters.searchQuery) return statsData.shipments;
        return statsData.shipments.filter(s =>
            s.barcode.toLowerCase().includes(filters.searchQuery.toLowerCase())
        );
    }, [statsData, filters.searchQuery]);

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">إحصائيات الشحنات</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatsCard title="إجمالي المسح" value={statsData?.statistics.total_scans ?? 0} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>} />
                <StatsCard title="المسح المكرر" value={statsData?.statistics.duplicate_count ?? 0} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>} />
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold mb-4">الفلاتر</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input type="date" name="date" value={filters.date} onChange={handleFilterChange} className="form-input rounded-md border-gray-300"/>
                    <select name="companyId" value={filters.companyId} onChange={handleFilterChange} className="form-select rounded-md border-gray-300">
                        <option value="0">كل الشركات</option>
                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <input type="search" name="searchQuery" value={filters.searchQuery} onChange={handleFilterChange} placeholder="ابحث بالباركود..." className="form-input rounded-md border-gray-300"/>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الباركود</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الشركة</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">عدد المسحات</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">أول مسح</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">آخر مسح</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr><td colSpan={5} className="text-center py-8 text-gray-500">جاري تحميل البيانات...</td></tr>
                            ) : filteredShipments.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-8 text-gray-500">لم يتم العثور على شحنات للفلاتر المحددة.</td></tr>
                            ) : (
                                filteredShipments.map(shipment => (
                                    <tr key={shipment.barcode} className={shipment.scan_count > 1 ? 'bg-yellow-50' : ''}>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{shipment.barcode}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">{shipment.company_name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">{shipment.scan_count}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">{new Date(shipment.first_scan).toLocaleTimeString('ar-EG')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">{new Date(shipment.last_scan).toLocaleTimeString('ar-EG')}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StatsPage;
