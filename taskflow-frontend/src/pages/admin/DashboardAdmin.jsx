import React, { useState, useEffect } from 'react';
import { coreApi } from '../../api/serviceApi';
import { toast } from 'react-toastify';
import { FaUserShield, FaCheckCircle, FaTimesCircle, FaTrash, FaUser, FaBuilding, FaClipboardList, FaGavel, FaBan, FaUnlock } from 'react-icons/fa';

const TABS = {
    USERS: 'users',
    PROVIDERS: 'providers',
    SERVICE_APPROVALS: 'service_approvals',
    DISPUTES: 'disputes',
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
        setData([]);

        try {
            if (currentView === TABS.USERS) {
                const res = await coreApi.getUsers({ sort: 'role' });
                setData(res.data.data);
            } else if (currentView === TABS.PROVIDERS) {
                const res = await coreApi.getProviders({ limit: 100 });
                setData(res.data.data);
            } else if (currentView === TABS.SERVICE_APPROVALS) {
                const res = await coreApi.getPendingServices();
                setData(res.data.data);
            } else if (currentView === TABS.DISPUTES) {
                const res = await coreApi.getDisputes();
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

    // --- User Actions ---
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

    const handleToggleBan = async (userId, isBanned) => {
        try {
            await coreApi.updateUser(userId, { isBanned: !isBanned });
            toast.success(`User ${!isBanned ? 'banned' : 'unbanned'} successfully.`);
            fetchData(TABS.USERS);
        } catch (error) {
            toast.error('Failed to update ban status.');
        }
    };

    // --- Provider Actions ---
    const handleToggleVerification = async (providerId, isVerified) => {
        try {
            await coreApi.updateProviderProfile(providerId, { isVerified: !isVerified });
            toast.success(`Provider verification status toggled to ${!isVerified ? 'VERIFIED' : 'UNVERIFIED'}.`);
            fetchData(TABS.PROVIDERS);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update verification status.');
        }
    };

    // --- Service Approval Actions ---
    const handleServiceStatus = async (serviceId, status) => {
        if (!window.confirm(`Are you sure you want to ${status} this service?`)) return;
        try {
            await coreApi.updateServiceStatus(serviceId, status);
            toast.success(`Service ${status} successfully.`);
            fetchData(TABS.SERVICE_APPROVALS);
        } catch (error) {
            toast.error('Failed to update service status.');
        }
    };

    // --- Dispute Actions ---
    const handleResolveDispute = async (disputeId, status) => {
        try {
            await coreApi.resolveDispute(disputeId, { status });
            toast.success(`Dispute marked as ${status}.`);
            fetchData(TABS.DISPUTES); // Refresh list
        } catch (error) {
            toast.error('Failed to resolve dispute.');
        }
    };

    const renderContent = () => {
        if (loading) return <p className="p-10 text-center text-teal-600 dark:text-teal-400 font-semibold">Loading administrative data...</p>;
        if (!data || data.length === 0) return <p className="p-10 text-center text-slate-500 dark:text-slate-400">No data found.</p>;

        if (view === TABS.USERS) {
            return (
                <div className="space-y-4">
                    {data.map(u => (
                        <div key={u._id} className={`p-4 border rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center ${u.isBanned ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : 'bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-700'}`}>
                            <div>
                                <p className="font-bold text-slate-800 dark:text-white">
                                    {u.name} ({(u.role || 'unknown').toUpperCase()})
                                    {u.isBanned && <span className="ml-2 text-xs bg-red-600 text-white px-2 py-0.5 rounded">BANNED</span>}
                                </p>
                                <p className="text-sm text-slate-600 dark:text-slate-300">{u.email}</p>
                            </div>
                            <div className="flex items-center space-x-3 mt-3 sm:mt-0">
                                {u.role !== 'admin' && (
                                    <button
                                        onClick={() => handleToggleBan(u._id, u.isBanned)}
                                        className={`px-3 py-1 text-sm font-semibold rounded-md flex items-center ${u.isBanned ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'}`}
                                    >
                                        {u.isBanned ? <><FaUnlock className="mr-1" /> Unban</> : <><FaBan className="mr-1" /> Ban</>}
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDeleteUser(u._id)}
                                    className='text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 font-medium transition-colors duration-300 disabled:opacity-50'
                                    disabled={u.role === 'admin'}
                                >
                                    <FaTrash className='inline mr-1' /> Delete
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
                                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 flex items-center ${p.isVerified
                                        ? 'bg-red-600 hover:bg-red-700 text-white'
                                        : 'bg-green-600 hover:bg-green-700 text-white'
                                        }`}
                                >
                                    {p.isVerified
                                        ? (<><FaTimesCircle className='mr-1.5' /> Unverify</>)
                                        : (<><FaCheckCircle className='mr-1.5' /> Verify</>)
                                    }
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            );
        } else if (view === TABS.SERVICE_APPROVALS) {
            return (
                <div className="space-y-4">
                    {data.map(s => (
                        <div key={s._id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">{s.title}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">by {s.providerId?.businessName}</p>
                                    <p className="mt-2 text-slate-700 dark:text-slate-300">{s.description}</p>
                                    <div className="mt-2 text-sm font-semibold text-teal-600">₹{s.price} | {s.durationMinutes} min</div>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleServiceStatus(s._id, 'approved')}
                                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleServiceStatus(s._id, 'rejected')}
                                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            );
        } else if (view === TABS.DISPUTES) {
            return (
                <div className="space-y-4">
                    {data.map(d => (
                        <div key={d._id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center space-x-2 mb-2">
                                        <span className={`px-2 py-0.5 text-xs font-bold rounded uppercase ${d.status === 'open' ? 'bg-red-100 text-red-800' :
                                                d.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                                    d.status === 'refunded' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-slate-100 text-slate-800'
                                            }`}>{d.status}</span>
                                        <span className="text-sm text-slate-500">Booking ID: {d.bookingId?._id || 'N/A'}</span>
                                    </div>
                                    <p className="font-semibold text-slate-800 dark:text-white">Issue: {d.reason}</p>
                                    <p className="text-sm text-slate-600 mt-1">Raised by: {d.raisedBy?.name || 'Unknown User'}</p>
                                    <p className="text-sm text-slate-600">Provider: {d.providerId?.businessName || 'Unknown Provider'}</p>
                                </div>
                                <div className="flex flex-col space-y-2">
                                    {d.status === 'open' && (
                                        <>
                                            <button
                                                onClick={() => handleResolveDispute(d._id, 'resolved')}
                                                className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                                            >
                                                Mark Resolved
                                            </button>
                                            <button
                                                onClick={() => handleResolveDispute(d._id, 'refunded')}
                                                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                            >
                                                Issue Refund
                                            </button>
                                            <button
                                                onClick={() => handleResolveDispute(d._id, 'rejected')}
                                                className="px-3 py-1.5 bg-slate-600 text-white text-sm rounded hover:bg-slate-700"
                                            >
                                                Reject/Close
                                            </button>
                                        </>
                                    )}
                                </div>
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

            <div className='mb-6 border-b border-slate-200 dark:border-slate-700 overflow-x-auto'>
                <nav className='-mb-px flex space-x-8'>
                    <button onClick={() => setView(TABS.USERS)} className={`tab-button ${view === TABS.USERS ? 'active' : ''}`}><FaUser className='mr-2' /> Users</button>
                    <button onClick={() => setView(TABS.PROVIDERS)} className={`tab-button ${view === TABS.PROVIDERS ? 'active' : ''}`}><FaBuilding className='mr-2' /> Taskers</button>
                    <button onClick={() => setView(TABS.SERVICE_APPROVALS)} className={`tab-button ${view === TABS.SERVICE_APPROVALS ? 'active' : ''}`}><FaClipboardList className='mr-2' /> Approvals</button>
                    <button onClick={() => setView(TABS.DISPUTES)} className={`tab-button ${view === TABS.DISPUTES ? 'active' : ''}`}><FaGavel className='mr-2' /> Disputes</button>
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