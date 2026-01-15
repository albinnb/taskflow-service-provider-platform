import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import { coreApi } from '../../api/serviceApi';
import { toast } from 'react-toastify';
import { FaUserShield, FaCheckCircle, FaTimesCircle, FaTrash, FaUser, FaBuilding, FaClipboardList, FaGavel, FaBan, FaUnlock, FaSignOutAlt, FaTags, FaMoneyBillWave } from 'react-icons/fa';


import useAuth from '../../hooks/useAuth';
import DisputeDetailsModal from '../../components/admin/DisputeDetailsModal';
import CategoryManagement from '../../components/admin/CategoryManagement'; // Import new component
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import axiosClient from '../../api/axiosClient'; // Direct axios for admin stats

const TABS = {
    USERS: 'users',
    PROVIDERS: 'providers',
    ALL_SERVICES: 'all_services',
    ALL_BOOKINGS: 'all_bookings',
    REVENUE: 'revenue',
    DISPUTES: 'disputes',
    CATEGORIES: 'categories',
    LOGS: 'activity_logs',
};

const DashboardAdmin = () => {
    const { logout } = useAuth();
    const [view, setView] = useState(TABS.USERS);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all'); // Local filter for bookings

    // Revenue Details Modal State
    const [showRevenueModal, setShowRevenueModal] = useState(false);
    const [providerRevenueDetails, setProviderRevenueDetails] = useState([]);
    const [selectedProviderName, setSelectedProviderName] = useState('');

    const [selectedDispute, setSelectedDispute] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    // Mobile Sidebar State removed



    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && Object.values(TABS).includes(tab)) {
            setView(tab);
        }
    }, [searchParams]);

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
            } else if (currentView === TABS.ALL_SERVICES) {
                // Global Services
                const res = await axiosClient.get('/admin/services');
                setData(res.data.data);
            } else if (currentView === TABS.ALL_BOOKINGS) {
                // Global Bookings
                const res = await axiosClient.get('/admin/bookings');
                setData(res.data.data);
            } else if (currentView === TABS.REVENUE) {
                // Revenue Overview
                const res = await axiosClient.get('/admin/revenue');
                setData(res.data.data);

            } else if (currentView === TABS.DISPUTES) {
                const res = await coreApi.getDisputes();
                setData(res.data.data);
            } else if (currentView === TABS.LOGS) {
                const res = await axiosClient.get('/admin/logs');
                setData(res.data.data);
            }
            // Categories handled by component itself
        } catch (error) {
            console.error(error);
            // toast.error('Failed to load admin data.');
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    // Actions
    const handleDeleteUser = async (userId) => {
        if (!window.confirm(`Delete user ${userId}?`)) return;
        try {
            await coreApi.deleteUser(userId);
            toast.success('User deleted.');
            fetchData(TABS.USERS);
        } catch (error) { toast.error('Failed to delete user.'); }
    }

    const handleToggleBan = async (userId, isBanned) => {
        try {
            await coreApi.updateUser(userId, { isBanned: !isBanned });
            toast.success(`User ${!isBanned ? 'banned' : 'unbanned'}.`);
            fetchData(TABS.USERS);
        } catch (error) { toast.error('Failed to update ban status.'); }
    };

    const handleToggleVerification = async (providerId, isVerified) => {
        try {
            await coreApi.updateProviderProfile(providerId, { isVerified: !isVerified });
            toast.success(`Provider ${!isVerified ? 'APPROVED' : 'UNAPPROVED'}.`);
            fetchData(TABS.PROVIDERS);
        } catch (error) { toast.error('Failed to update status.'); }
    };

    const handleServiceStatus = async (serviceId, status) => {
        if (!window.confirm(`${status} this service?`)) return;
        try {
            await coreApi.updateServiceStatus(serviceId, status);
            toast.success(`Service ${status}.`);
            fetchData(TABS.ALL_SERVICES);
        } catch (error) { toast.error('Failed to update status.'); }
    };

    const handleViewRevenueDetails = async (providerId, providerName) => {
        try {
            const res = await axiosClient.get(`/admin/bookings?providerId=${providerId}&status=completed`);
            setProviderRevenueDetails(res.data.data);
            setSelectedProviderName(providerName);
            setShowRevenueModal(true);
        } catch (error) {
            toast.error('Failed to fetch provider details.');
        }
    };

    const handleAdminDeleteService = async (serviceId) => {
        if (!window.confirm('PERMANENTLY DELETE this service? This cannot be undone.')) return;
        try {
            // Using direct axios for the admin route we created
            await axiosClient.delete(`/admin/services/${serviceId}`);
            toast.success('Service deleted by Admin.');
            fetchData(TABS.ALL_SERVICES);
        } catch (error) { toast.error('Failed to delete service.'); }
    };



    const openDisputeDetails = (dispute) => {
        setSelectedDispute(dispute);
        setIsDetailsModalOpen(true);
    };

    const handleResolveDispute = async (disputeId, status, adminNotes = '') => {
        try {
            await coreApi.resolveDispute(disputeId, { status, adminNotes });
            toast.success(`Dispute ${status}.`);
            setIsDetailsModalOpen(false);
            setSelectedDispute(null);
            fetchData(TABS.DISPUTES);
        } catch (error) { toast.error('Failed to update dispute.'); }
    };

    const SidebarItem = ({ id, icon: Icon, label }) => (
        <button
            onClick={() => {
                setView(id);
                setSearchParams({ tab: id });
            }}
            className={cn(


                "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-l-2",
                view === id
                    ? "bg-secondary text-primary border-primary"
                    : "text-muted-foreground border-transparent hover:bg-muted hover:text-foreground"
            )}
        >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
        </button>
    );



    const renderContent = () => {



        if (view === TABS.CATEGORIES) {
            return <CategoryManagement />;
        }

        if (loading) return <div className="p-20 text-center text-muted-foreground">Loading...</div>;
        if (!data || data.length === 0) return <div className="p-20 text-center border-2 border-dashed border-border rounded-xl text-muted-foreground">No data found.</div>;

        if (view === TABS.USERS) {
            return (
                <div className="grid gap-4">
                    {data.map(u => (
                        <div key={u._id} className={cn("p-4 border rounded-xl flex items-center justify-between shadow-sm", u.isBanned ? "bg-destructive/10 border-destructive/20" : "bg-card border-border")}>
                            <div>
                                <p className="font-bold text-foreground flex items-center gap-2">
                                    {u.name}
                                    <span className="text-xs font-normal text-muted-foreground uppercase bg-secondary px-2 py-0.5 rounded">{u.role}</span>
                                    {u.isBanned && <span className="text-xs font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded">BANNED</span>}
                                </p>
                                <p className="text-sm text-muted-foreground">{u.email}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {u.role !== 'admin' && (
                                    <Button
                                        size="sm"
                                        variant={u.isBanned ? "default" : "secondary"}
                                        onClick={() => handleToggleBan(u._id, u.isBanned)}
                                        className={u.isBanned ? "bg-green-600 hover:bg-green-700" : "text-orange-600 bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400"}
                                    >
                                        {u.isBanned ? <><FaUnlock className="mr-1" /> Unban</> : <><FaBan className="mr-1" /> Ban</>}
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteUser(u._id)}
                                    disabled={u.role === 'admin'}
                                    className="text-destructive hover:bg-destructive/10"
                                >
                                    <FaTrash />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            );
        } else if (view === TABS.PROVIDERS) {
            return (
                <div className="grid gap-4">
                    {data.map(p => (
                        <div key={p._id} className="p-4 border border-border rounded-xl bg-card shadow-sm flex items-center justify-between">
                            <div>
                                <p className="font-bold text-foreground">{p.businessName || 'Unknown Business'}</p>
                                <p className="text-sm text-muted-foreground">Rating: {(p.ratingAvg || 0).toFixed(1)} ({p.reviewCount || 0} reviews)</p>
                            </div>
                            <Button
                                size="sm"
                                onClick={() => handleToggleVerification(p._id, p.isVerified)}
                                className={p.isVerified ? "bg-destructive hover:bg-destructive/90" : "bg-green-600 hover:bg-green-700"}
                            >
                                {p.isVerified ? <><FaTimesCircle className='mr-1.5' /> Unapprove</> : <><FaCheckCircle className='mr-1.5' /> Approve</>}
                            </Button>
                        </div>
                    ))}
                </div>
            );

        } else if (view === TABS.ALL_SERVICES) {
            return (
                <div className="grid gap-4">
                    {data.map(s => (
                        <div key={s._id} className="p-4 border border-border rounded-xl bg-card shadow-sm flex justify-between items-center group">
                            <div>
                                <h3 className="font-bold text-foreground">{s.title}</h3>
                                <p className="text-sm text-muted-foreground">Provider: {s.providerId?.businessName || 'Unknown'} ({s.providerId?.phone})</p>
                                <div className="flex gap-2 text-xs mt-1">
                                    <span className="bg-secondary px-2 py-0.5 rounded">₹{s.price}</span>
                                    <span className="bg-secondary px-2 py-0.5 rounded">{s.durationMinutes} min</span>
                                    <span className={cn("px-2 py-0.5 rounded uppercase", s.approvalStatus === 'approved' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700')}>{s.approvalStatus}</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {s.approvalStatus === 'approved' ? (
                                    <Button variant="secondary" size="sm" onClick={() => handleServiceStatus(s._id, 'pending')} className="text-orange-600 bg-orange-100 hover:bg-orange-200">
                                        <FaBan className="mr-1" /> Unapprove
                                    </Button>
                                ) : (
                                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleServiceStatus(s._id, 'approved')}>
                                        <FaCheckCircle className="mr-1" /> Approve
                                    </Button>
                                )}
                                <Button variant="destructive" size="sm" onClick={() => handleAdminDeleteService(s._id)}>
                                    <FaTrash className="mr-2" /> Delete
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            );
        } else if (view === TABS.ALL_BOOKINGS) {
            const filteredBookings = data.filter(b => {
                if (filterStatus === 'all') return true;
                return b.status === filterStatus;
            });

            return (
                <div className="space-y-4">
                    {/* Filters */}
                    <div className="flex flex-wrap gap-2 pb-2">
                        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={cn(
                                    "px-4 py-1.5 text-sm font-medium rounded-full border transition-all capitalize",
                                    filterStatus === status
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-card text-muted-foreground border-border hover:border-primary/50"
                                )}
                            >
                                {status}
                            </button>
                        ))}
                    </div>

                    {/* Data Table */}
                    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Booking ID</th>
                                        <th className="px-4 py-3 font-medium">Date</th>
                                        <th className="px-4 py-3 font-medium">Customer</th>
                                        <th className="px-4 py-3 font-medium">Provider</th>
                                        <th className="px-4 py-3 font-medium">Service</th>
                                        <th className="px-4 py-3 font-medium">Amount</th>
                                        <th className="px-4 py-3 font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredBookings.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="px-4 py-8 text-center text-muted-foreground">
                                                No {filterStatus !== 'all' ? filterStatus : ''} bookings found.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredBookings.map(b => (
                                            <tr key={b._id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">#{b._id.slice(-6).toUpperCase()}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{new Date(b.scheduledAt).toLocaleDateString()}</span>
                                                        <span className="text-xs text-muted-foreground">{new Date(b.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-foreground">{b.userId?.name || 'Unknown'}</div>
                                                    <div className="text-xs text-muted-foreground">{b.userId?.mobile || b.userId?.email}</div>
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">{b.providerId?.businessName || 'Unknown'}</td>
                                                <td className="px-4 py-3 font-medium text-foreground">{b.serviceId?.title || 'Deleted'}</td>
                                                <td className="px-4 py-3 font-bold">₹{(b.totalPrice || 0).toFixed(2)}</td>
                                                <td className="px-4 py-3">
                                                    <span className={cn("inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize",
                                                        b.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                            b.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                                b.status === 'confirmed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                    )}>
                                                        {b.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            );
        } else if (view === TABS.REVENUE) {
            // Calculate Metrics
            const totalRevenue = data.reduce((sum, r) => sum + (r.totalRevenue || 0), 0);
            const totalJobs = data.reduce((sum, r) => sum + (r.completedBookings || 0), 0);
            const topPerformers = [...data].sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0)).slice(0, 5);
            const maxRevenue = topPerformers[0]?.totalRevenue || 1; // Avoid division by zero

            return (
                <div className="space-y-8">
                    {/* Executive Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-6 bg-card border border-border rounded-xl shadow-sm">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Transaction Volume</h3>
                            <p className="text-3xl font-bold text-foreground mt-2">₹{totalRevenue.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground mt-1">Gross value of all completed bookings</p>
                        </div>
                        <div className="p-6 bg-card border border-border rounded-xl shadow-sm">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Completed Jobs</h3>
                            <p className="text-3xl font-bold text-foreground mt-2">{totalJobs}</p>
                            <p className="text-xs text-muted-foreground mt-1">Across all providers</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Top Performers Chart */}
                        <div className="lg:col-span-1 p-6 bg-card border border-border rounded-xl shadow-sm">
                            <h3 className="font-bold text-lg mb-4">Top Performers</h3>
                            <div className="space-y-4">
                                {topPerformers.map((p, i) => (
                                    <div key={p._id}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium truncate max-w-[150px]">{p.providerName}</span>
                                            <span className="font-bold text-green-600">₹{(p.totalRevenue || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="w-full bg-secondary rounded-full h-2">
                                            <div
                                                className="bg-primary h-2 rounded-full"
                                                style={{ width: `${((p.totalRevenue || 0) / maxRevenue) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Detailed Table */}
                        <div className="lg:col-span-2 rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                            <div className="p-4 border-b border-border bg-muted/20">
                                <h3 className="font-bold">Provider Revenue Breakdown</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                                        <tr>
                                            <th className="px-6 py-3">Provider</th>
                                            <th className="px-6 py-3">Email</th>
                                            <th className="px-6 py-3">Completed Jobs</th>
                                            <th className="px-6 py-3 text-right">Total Revenue</th>
                                            <th className="px-6 py-3 text-right">History</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {data.map((r) => (
                                            <tr key={r._id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-6 py-4 font-medium text-foreground">{r.providerName}</td>
                                                <td className="px-6 py-4 text-muted-foreground">{r.providerEmail}</td>
                                                <td className="px-6 py-4">{r.completedBookings}</td>
                                                <td className="px-6 py-4 text-right font-bold text-green-600">₹{r.totalRevenue}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button size="sm" variant="outline" onClick={() => handleViewRevenueDetails(r._id, r.providerName)}>
                                                        View Jobs
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            );
        } else if (view === TABS.DISPUTES) {
            return (
                <div className="grid gap-4">
                    {data.map(d => (
                        <div key={d._id} className="p-4 border border-border rounded-xl bg-card shadow-sm flex justify-between items-center">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={cn("px-2 py-0.5 text-xs font-bold rounded uppercase",
                                        d.status === 'open' ? 'bg-destructive/10 text-destructive' :
                                            d.status === 'resolved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                d.status === 'refunded' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                    'bg-secondary text-secondary-foreground'
                                    )}>
                                        {d.status}
                                    </span>
                                    <span className="text-xs text-muted-foreground">ID: {d.bookingId?.shortId || d._id.slice(-6)}</span>
                                </div>
                                <p className="font-bold text-foreground">{d.reason}</p>
                                <p className="text-sm text-muted-foreground">Raised by: {d.raisedBy?.name || 'Unknown'}</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => openDisputeDetails(d)}>View Details</Button>
                        </div>
                    ))
                    }
                </div >
            );
        } else if (view === TABS.LOGS) {
            return (
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                                <tr>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Admin</th>
                                    <th className="px-6 py-3">Action</th>
                                    <th className="px-6 py-3">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {data.map((log) => (
                                    <tr key={log._id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4 font-medium">{new Date(log.createdAt).toLocaleString()}</td>
                                        <td className="px-6 py-4">{log.adminId?.name || 'Unknown'}</td>
                                        <td className="px-6 py-4">
                                            <span className={cn("px-2 py-0.5 text-xs font-bold rounded uppercase",
                                                (log.action || '').includes('DELETED') ? 'bg-destructive/10 text-destructive' :
                                                    (log.action || '').includes('APPROVED') || (log.action || '').includes('VERIFIED') ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                        'bg-secondary text-secondary-foreground'
                                            )}>
                                                {(log.action || 'UNKNOWN_ACTION').replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">{log.details}</td>
                                    </tr>
                                ))}
                                {data.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-8 text-center text-muted-foreground">
                                            No activity logs found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-4rem)] bg-background relative">
            {/* SIDEBAR */}
            <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto no-scrollbar">
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <div>
                        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Admin Console</h2>
                        <p className="font-bold text-foreground mt-1">Administrator</p>
                    </div>
                </div>

                <nav className="flex-1 py-4 space-y-1">


                    <SidebarItem id={TABS.USERS} icon={FaUser} label="Users" />
                    <SidebarItem id={TABS.PROVIDERS} icon={FaBuilding} label="Taskers" />
                    <div className="my-2 border-t border-border mx-4"></div>
                    <SidebarItem id={TABS.ALL_SERVICES} icon={FaClipboardList} label="All Services" />
                    <SidebarItem id={TABS.ALL_BOOKINGS} icon={FaCheckCircle} label="All Bookings" />

                    <SidebarItem id={TABS.REVENUE} icon={FaMoneyBillWave} label="Revenue" />
                    <SidebarItem id={TABS.LOGS} icon={FaClipboardList} label="Activity Logs" />
                    <div className="my-2 border-t border-border mx-4"></div>
                    <SidebarItem id={TABS.CATEGORIES} icon={FaTags} label="Categories" />

                    <SidebarItem id={TABS.DISPUTES} icon={FaGavel} label="Disputes" />
                </nav>
                <div className="p-4 border-t border-border">
                    <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors">
                        <FaSignOutAlt className="h-5 w-5" />
                        <span>Log Out</span>
                    </button>
                </div>
            </aside>

            <main className="flex-1 bg-muted/10 p-3 md:p-8 pb-20 md:pb-8">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4 md:mb-6 capitalize flex items-center gap-3">

                        {view === TABS.USERS && <FaUser className="text-primary" />}
                        {view === TABS.PROVIDERS && <FaBuilding className="text-primary" />}
                        {view === TABS.CATEGORIES && <FaTags className="text-primary" />}

                        {view === TABS.DISPUTES && <FaGavel className="text-primary" />}
                        {view.replace('_', ' ')} Management
                    </h1>
                    {renderContent()}
                </div>
            </main>

            <DisputeDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                dispute={selectedDispute}
                onUpdateStatus={handleResolveDispute}
            />

            {/* Revenue Details Modal */}
            {showRevenueModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-card w-full max-w-2xl rounded-xl shadow-lg border border-border max-h-[80vh] flex flex-col">
                        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
                            <h2 className="font-bold text-lg">Completed Jobs: {selectedProviderName}</h2>
                            <button onClick={() => setShowRevenueModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
                        </div>
                        <div className="p-0 overflow-y-auto flex-1">
                            {providerRevenueDetails.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">No completed jobs found history.</div>
                            ) : (
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-3">Date</th>
                                            <th className="px-4 py-3">Customer</th>
                                            <th className="px-4 py-3">Service</th>
                                            <th className="px-4 py-3 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {providerRevenueDetails.map(job => (
                                            <tr key={job._id}>
                                                <td className="px-4 py-3">{new Date(job.scheduledAt).toLocaleDateString()}</td>
                                                <td className="px-4 py-3">{job.userId?.name || 'Unknown'}</td>
                                                <td className="px-4 py-3">{job.serviceId?.title || 'Deleted'}</td>
                                                <td className="px-4 py-3 text-right font-bold">₹{(job.totalPrice || 0).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        <div className="p-4 border-t border-border bg-muted/10 text-right">
                            <Button onClick={() => setShowRevenueModal(false)}>Close</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* OLD BOTTOM NAVIGATION REMOVED */}
        </div>
    );

};

export default DashboardAdmin;