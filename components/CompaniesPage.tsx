import React, { useState, useEffect, useCallback } from 'react';
import { fetchCompanies, addCompany, toggleCompanyStatus } from '../services/api';
import { ShippingCompany } from '../types';

const CompaniesPage: React.FC = () => {
    const [companies, setCompanies] = useState<ShippingCompany[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [newCompanyName, setNewCompanyName] = useState<string>('');
    const [isAdding, setIsAdding] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const loadCompanies = useCallback(async () => {
        setIsLoading(true);
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

    const handleAddCompany = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCompanyName.trim()) return;
        
        setIsAdding(true);
        setError(null);
        try {
            await addCompany(newCompanyName);
            setNewCompanyName('');
            await loadCompanies(); // Refresh the list
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message || "حدث خطأ أثناء إضافة الشركة.");
            } else {
                setError("حدث خطأ غير معروف أثناء إضافة الشركة.");
            }
        } finally {
            setIsAdding(false);
        }
    };
    
    const handleToggleStatus = async (company: ShippingCompany) => {
        try {
            await toggleCompanyStatus(company.id, !company.is_active);
            await loadCompanies(); // Refresh list
        } catch(err) {
            setError("فشل تحديث حالة الشركة.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-800">إدارة شركات الشحن</h2>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold mb-4">إضافة شركة جديدة</h3>
                <form onSubmit={handleAddCompany} className="flex flex-col sm:flex-row items-start sm:space-x-4 space-y-4 sm:space-y-0">
                    <div className="flex-grow w-full">
                        <input
                            type="text"
                            value={newCompanyName}
                            onChange={(e) => {
                                setNewCompanyName(e.target.value);
                                setError(null); // Clear error on new input
                            }}
                            placeholder="أدخل اسم الشركة الجديدة"
                            className="w-full form-input rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            disabled={isAdding}
                        />
                         {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                    </div>
                    <button
                        type="submit"
                        disabled={isAdding || !newCompanyName.trim()}
                        className="w-full sm:w-auto px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400"
                    >
                        {isAdding ? 'جاري الإضافة...' : 'إضافة شركة'}
                    </button>
                </form>
            </div>

            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">اسم الشركة</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr><td colSpan={3} className="text-center py-8 text-gray-500">جاري تحميل الشركات...</td></tr>
                            ) : companies.map(company => (
                                <tr key={company.id}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{company.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {company.is_active ? (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">نشط</span>
                                        ) : (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">غير نشط</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                                        <button onClick={() => handleToggleStatus(company)} className="text-primary-600 hover:text-primary-900">
                                            {company.is_active ? 'تعطيل' : 'تفعيل'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CompaniesPage;
