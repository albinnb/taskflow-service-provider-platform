import React, { useState, useEffect } from 'react';
import { coreApi } from '../../api/serviceApi';
import { toast } from 'react-toastify';
import { FaUserShield, FaCheckCircle, FaTimesCircle, FaTrash, FaUser, FaBuilding, FaClipboardList, FaGavel, FaBan, FaUnlock, FaSignOutAlt } from 'react-icons/fa';
import useAuth from '../../hooks/useAuth';
import DisputeDetailsModal from '../../components/admin/DisputeDetailsModal';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/Button';

const TABS = {
    USERS: 'users',
    PROVIDERS: 'providers',
    SERVICE_APPROVALS: 'service_approvals',
    DISPUTES: 'disputes',
};

const DashboardAdmin = () => {
    const { logout } = useAuth();
    const [view, setView] = useState(TABS.USERS);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedDispute, setSelectedDispute] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

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
            toast.success(`Provider ${!isVerified ? 'VERIFIED' : 'UNVERIFIED'}.`);
            fetchData(TABS.PROVIDERS);
        } catch (error) { toast.error('Failed to update status.'); }
    };

    const handleServiceStatus = async (serviceId, status) => {
        if (!window.confirm(`${status} this service?`)) return;
        try {
            await coreApi.updateServiceStatus(serviceId, status);
            toast.success(`Service ${status}.`);
            fetchData(TABS.SERVICE_APPROVALS);
        } catch (error) { toast.error('Failed to update status.'); }
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
            onClick={() => setView(id)}
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
                                {p.isVerified ? <><FaTimesCircle className='mr-1.5' /> Unverify</> : <><FaCheckCircle className='mr-1.5' /> Verify</>}
                            </Button>
                        </div>
                    ))}
                </div>
            );
        } else if (view === TABS.SERVICE_APPROVALS) {
            return (
                <div className="grid gap-4">
                    {data.map(s => (
                        <div key={s._id} className="p-6 border border-border rounded-xl bg-card shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-bold text-foreground">{s.title}</h3>
                                    <p className="text-sm text-muted-foreground">by {s.providerId?.businessName}</p>
                                    <p className="mt-2 text-foreground">{s.description}</p>
                                    <div className="mt-2 text-sm font-bold text-primary">₹{s.price} | {s.durationMinutes} min</div>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleServiceStatus(s._id, 'approved')}>Approve</Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleServiceStatus(s._id, 'rejected')}>Reject</Button>
                                </div>
                            </div>
                        </div>
                    ))}
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
        }
    };

    return (
        <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
            <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col">
                <div className="p-4 border-b border-border">
                    <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Admin Console</h2>
                    <p className="font-bold text-foreground mt-1">Administrator</p>
                </div>
                <nav className="flex-1 py-4 space-y-1">
                    <SidebarItem id={TABS.USERS} icon={FaUser} label="Users" />
                    <SidebarItem id={TABS.PROVIDERS} icon={FaBuilding} label="Taskers" />
                    <SidebarItem id={TABS.SERVICE_APPROVALS} icon={FaClipboardList} label="Approvals" />
                    <SidebarItem id={TABS.DISPUTES} icon={FaGavel} label="Disputes" />
                </nav>
                <div className="p-4 border-t border-border">
                    <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors">
                        <FaSignOutAlt className="h-5 w-5" />
                        <span>Log Out</span>
                    </button>
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto bg-muted/10 p-3 md:p-8 pb-20 md:pb-8">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4 md:mb-6 capitalize flex items-center gap-3">
                        {view === TABS.USERS && <FaUser className="text-primary" />}
                        {view === TABS.PROVIDERS && <FaBuilding className="text-primary" />}
                        {view === TABS.SERVICE_APPROVALS && <FaClipboardList className="text-primary" />}
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

            {/* MOBILE BOTTOM NAVIGATION */}
            <div className="md:hidden fixed bottom-0 z-40 w-full bg-card border-t border-border flex justify-around items-center p-2 safe-area-pb">
                <button
                    onClick={() => setView(TABS.USERS)}
                    className={cn("flex flex-col items-center justify-center w-full py-1", view === TABS.USERS ? "text-primary" : "text-muted-foreground")}
                >
                    <FaUser className="h-5 w-5 mb-1" />
                    <span className="text-[10px] font-medium">Users</span>
                </button>
                <button
                    onClick={() => setView(TABS.PROVIDERS)}
                    className={cn("flex flex-col items-center justify-center w-full py-1", view === TABS.PROVIDERS ? "text-primary" : "text-muted-foreground")}
                >
                    <FaBuilding className="h-5 w-5 mb-1" />
                    <span className="text-[10px] font-medium">Taskers</span>
                </button>
                <button
                    onClick={() => setView(TABS.SERVICE_APPROVALS)}
                    className={cn("flex flex-col items-center justify-center w-full py-1", view === TABS.SERVICE_APPROVALS ? "text-primary" : "text-muted-foreground")}
                >
                    <FaClipboardList className="h-5 w-5 mb-1" />
                    <span className="text-[10px] font-medium">Approvals</span>
                </button>
                <button
                    onClick={() => setView(TABS.DISPUTES)}
                    className={cn("flex flex-col items-center justify-center w-full py-1", view === TABS.DISPUTES ? "text-primary" : "text-muted-foreground")}
                >
                    <FaGavel className="h-5 w-5 mb-1" />
                    <span className="text-[10px] font-medium">Disputes</span>
                </button>
            </div>
        </div>
    );
};

export default DashboardAdmin;