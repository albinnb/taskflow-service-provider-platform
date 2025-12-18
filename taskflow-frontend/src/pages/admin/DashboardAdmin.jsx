import React, { useState, useEffect } from 'react';
import { coreApi } from '../../api/serviceApi';
import { toast } from 'react-toastify';
import { FaUserShield, FaCheckCircle, FaTimesCircle, FaTrash, FaUser, FaBuilding } from 'react-icons/fa';

const TABS = {
    USERS: 'users',
    PROVIDERS: 'providers',
};

/**
 * @desc Redesigned Admin Dashboard (with Dark Mode)
 * @access Private/Admin
 */
const DashboardAdmin = () => {
    const [view, setView] = useState(TABS.USERS);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData(view);
    }, [view]);

    const fetchData = async (currentView) => {
        setLoading(true);
        setData([]); // This fix prevents the tab-switching crash
        
        try {
            if (currentView === TABS.USERS) {
                const res = await coreApi.getUsers({ sort: 'role' });
                setData(res.data.data);
            } else if (currentView === TABS.PROVIDERS) {
                const res = await coreApi.getProviders({ limit: 100 }); 
                setData(res.data.data);
            }
        } catch (error) {
            toast.error('Failed to load admin data.');
            console.error(error);
            setData([]); 
        } finally {
            setLoading(false);
        }
    };
    
    // --- User Actions (Admin only) ---
    const handleDeleteUser = async (userId) => {
         if (!window.confirm(`WARNING: Are you sure you want to delete user ${userId}? This will delete all associated data.`)) return;
         try {
             await coreApi.deleteUser(userId);
             toast.success('User deleted.');
             fetchData(TABS.USERS);
         } catch (error) {
             toast.error(error.response?.data?.message || 'Failed to delete user.');
         }
    }
    
    // --- Provider Actions (Admin only) ---
    const handleToggleVerification = async (providerId, isVerified) => {
         try {
             await coreApi.updateProviderProfile(providerId, { isVerified: !isVerified });
             toast.success(`Provider verification status toggled to ${!isVerified ? 'VERIFIED' : 'UNVERIFIED'}.`);
             fetchData(TABS.PROVIDERS);
         } catch (error) {
             toast.error(error.response?.data?.message || 'Failed to update verification status.');
         }
    };

    const renderContent = () => {
        if (loading) return <p className="p-10 text-center text-teal-600 dark:text-teal-400 font-semibold">Loading administrative data...</p>;
        if (!data || data.length === 0) return <p className="p-10 text-center text-slate-500 dark:text-slate-400">No data found.</p>;

        if (view === TABS.USERS) {
            return (
                <div className="space-y-4">
                    {data.map(u => (
                        <div key={u._id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                            <div>
                                <p className="font-bold text-slate-800 dark:text-white">{u.name} ({(u.role || 'unknown').toUpperCase()})</p>
                                <p className="text-sm text-slate-600 dark:text-slate-300">{u.email}</p>
                            </div>
                            <div className="flex items-center space-x-3 mt-3 sm:mt-0">
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full uppercase ${
                                    u.role === 'admin' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' : 
                                    u.role === 'provider' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : 
                                    'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                                }`}>
                                    {u.role || 'unknown'}
                                </span>
                                <button 
                                  onClick={() => handleDeleteUser(u._id)} 
                                  className='text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 font-medium transition-colors duration-300 disabled:opacity-50' 
                                  disabled={u.role === 'admin'}
                                >
                                    <FaTrash className='inline mr-1'/> Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            );
        } else if (view === TABS.PROVIDERS) {
             return (
                <div className="space-y-4">
                    {data.map(p => (
                        <div key={p._id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                            <div>
                                <p className="font-bold text-slate-800 dark:text-white">{p.businessName || 'Unknown Business'}</p>
                                <p className="text-sm text-slate-600 dark:text-slate-300">Avg Rating: {(p.ratingAvg || 0).toFixed(1)} ({p.reviewCount || 0} reviews)</p>
                            </div>
                            <div className="mt-3 sm:mt-0">
                                <button 
                                    onClick={() => handleToggleVerification(p._id, p.isVerified)} 
                                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 flex items-center ${
                                        p.isVerified 
                                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                                        : 'bg-green-600 hover:bg-green-700 text-white'
                                    }`}
                                >
                                    {p.isVerified 
                                        ? (<><FaTimesCircle className='mr-1.5'/> Unverify</>) 
                                        : (<><FaCheckCircle className='mr-1.5'/> Verify</>)
                                    }
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
             );
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-4xl font-extrabold text-slate-800 dark:text-white mb-8">
                <FaUserShield className='inline mr-3 text-red-600' />
                Admin Control Panel
            </h1>
            
            <div className='mb-6 border-b border-slate-200 dark:border-slate-700'>
                <nav className='-mb-px flex space-x-8'>
                    <button onClick={() => setView(TABS.USERS)} className={`tab-button ${view === TABS.USERS ? 'active' : ''}`}><FaUser className='mr-2'/> Manage Users</button>
                    <button onClick={() => setView(TABS.PROVIDERS)} className={`tab-button ${view === TABS.PROVIDERS ? 'active' : ''}`}><FaBuilding className='mr-2'/> Manage Taskers</button>
                </nav>
            </div>
            
            <div className='bg-white dark:bg-slate-800 shadow-lg rounded-xl p-6 border border-slate-200 dark:border-slate-700'>
                {renderContent()}
            </div>
            
            <style jsx="true">{`
              .tab-button {
                padding: 0.75rem 0.25rem;
                font-weight: 600;
                color: #475569; /* Slate-600 */
                border-bottom: 3px solid transparent;
                white-space: nowrap;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                font-size: 1rem;
              }
              .tab-button:hover {
                color: #0d9488; /* Teal-600 */
                border-color: #94a3b8; /* Slate-400 */
              }
              .tab-button.active {
                color: #0d9488; /* Teal-600 */
                border-color: #0d9488; /* Teal-600 */
              }
              /* Dark Mode Tab Styles */
              .dark .tab-button {
                color: #94a3b8; /* Slate-400 */
              }
              .dark .tab-button:hover {
                color: #2dd4bf; /* Teal-400 */
                border-color: #475569; /* Slate-600 */
              }
              .dark .tab-button.active {
                color: #2dd4bf; /* Teal-400 */
                border-color: #2dd4bf; /* Teal-400 */
              }
            `}</style>
        </div>
    );
};

export default DashboardAdmin;