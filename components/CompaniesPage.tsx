import React, { useState, useEffect, useCallback } from 'react';
import { fetchCompanies, addCompany, toggleCompanyStatus } from '../services/api';
import { ShippingCompany } from '../types';

const CompaniesPage: React.FC = () => {
    const [companies, setCompanies] = useState<ShippingCompany[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [newCompanyName, setNewCompanyName] = useState<string>('');
    const [isAdding, setIsAdding] = useState<boolean>(false);
    const [togglingId, setTogglingId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    const loadCompanies = useCallback(async () => {
        setIsLoading(true);
        setError(null); // Clear errors on reload
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
        const trimmedName = newCompanyName.trim();
        if (!trimmedName) return;
        
        setIsAdding(true);
        setError(null);

        // Optimistic update with a temporary ID
        const tempId = -Date.now();
        const newTempCompany: ShippingCompany = { id: tempId, name: trimmedName, is_active: true };
        setCompanies(prev => [newTempCompany, ...prev]);
        setNewCompanyName('');

        try {
            const addedCompany = await addCompany(trimmedName);
            // On success, replace the temporary company with the real one from the API
            setCompanies(prev => prev.map(c => (c.id === tempId ? { ...addedCompany, is_active: !!addedCompany.is_active } : c)));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setError(`فشل الحفظ على السيرفر: ${errorMessage}. تم الحفظ محلياً.`);
        } finally {
            setIsAdding(false);
        }
    };
    
    const handleToggleStatus = async (company: ShippingCompany) => {
        setTogglingId(company.id);
        setError(null);
        
        // Optimistic update
        setCompanies(prev =>
            prev.map(c =>
                c.id === company.id ? { ...c, is_active: !c.is_active } : c
            )
        );

        try {
            await toggleCompanyStatus(company.id, !company.is_active);
        } catch(err) {
            setError("فشل تحديث حالة الشركة على السيرفر. تم التحديث محلياً.");
            // On failure, we don't revert the change to match the legacy app's behavior
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

export default CompaniesPage;