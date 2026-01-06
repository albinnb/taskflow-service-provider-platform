import React, { useState, useEffect } from 'react';
import useAuth from '../../hooks/useAuth';
import { coreApi } from '../../api/serviceApi';
import { toast } from 'react-toastify';
import { FaUserCheck, FaBolt, FaListAlt, FaCalendarCheck, FaChartLine, FaTrash, FaEdit, FaPlusCircle, FaCog, FaStar, FaMapMarkerAlt, FaSignOutAlt } from 'react-icons/fa';
import ServiceForm from '../../components/provider/ServiceForm';
import ProviderSettings from './ProviderSettings';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/Button';

const TABS = {
  BOOKINGS: 'bookings',
  SERVICES: 'services',
  ANALYTICS: 'analytics',
  SETTINGS: 'settings',
};

// Helper to calculate distance
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371;
  var dLat = deg2rad(lat2 - lat1);
  var dLon = deg2rad(lon2 - lon1);
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
function deg2rad(deg) { return deg * (Math.PI / 180); }

const DashboardProvider = () => {
  const { user, roleProfile, loadUser, isAuthenticated, logout } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  // Default to SETTINGS if profile is not complete (e.g. location missing)
  const [view, setView] = useState(() => {
    if (roleProfile && (!roleProfile.address || !roleProfile.location)) return TABS.SETTINGS;
    return TABS.BOOKINGS;
  });
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [editingService, setEditingService] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);

  useEffect(() => {
    if (roleProfile && isAuthenticated) {
      // Force redirect to settings if profile is incomplete
      if (!roleProfile.address || !roleProfile.location) {
        setView(TABS.SETTINGS);
      }
      fetchData();
    }
  }, [roleProfile, selectedStatus, view, isAuthenticated]);

  const fetchData = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    if (view === TABS.SERVICES) setServices([]);
    if (view === TABS.BOOKINGS) setBookings([]);

    try {
      if (view === TABS.SERVICES) {
        const res = await coreApi.searchServices({ providerId: roleProfile._id, limit: 50 });
        setServices(res.data.data);
      }
      if (view === TABS.BOOKINGS) {
        const res = await coreApi.getBookings({ status: selectedStatus, sort: 'scheduledAt' });
        setBookings(res.data.data);
      }
      if (view === TABS.ANALYTICS) {
        const res = await coreApi.getProviderAnalytics(roleProfile._id);
        setAnalyticsData(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (bookingId, newStatus) => {
    try {
      await coreApi.updateBookingStatus(bookingId, { status: newStatus });
      toast.success(`Booking ${newStatus}.`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update status.');
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Delete this service?')) return;
    try {
      await coreApi.deleteService(serviceId);
      toast.success('Service deleted.');
      fetchData();
    } catch (error) { toast.error('Failed to delete service.'); }
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

  if (!roleProfile) return <div className="p-20 text-center">Loading Profile...</div>;

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Provider Portal</h2>
          <p className="font-bold text-foreground mt-1 truncate">{roleProfile.businessName}</p>
        </div>

        <nav className="flex-1 py-4 space-y-1">
          <SidebarItem id={TABS.BOOKINGS} icon={FaCalendarCheck} label="Bookings" />
          <SidebarItem id={TABS.SERVICES} icon={FaListAlt} label="My Services" />
          <SidebarItem id={TABS.ANALYTICS} icon={FaChartLine} label="Analytics" />
          <SidebarItem id={TABS.SETTINGS} icon={FaCog} label="Settings" />
        </nav>

        <div className="p-4 border-t border-border">
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors">
            <FaSignOutAlt className="h-5 w-5" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto bg-muted/10 p-3 md:p-8 pb-20 md:pb-8">

        {/* Verification Banner */}
        {!roleProfile.isVerified && (
          <div className="mb-6 p-4 bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 rounded-lg border border-orange-200 dark:border-orange-800 flex items-center gap-3">
            <FaUserCheck className="h-5 w-5" />
            <div>
              <p className="font-bold">Pending Verification</p>
              <p className="text-sm">Your account is under review. You can manage services but cannot accept bookings yet.</p>
            </div>
          </div>
        )}

        {view === TABS.BOOKINGS && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h1 className="text-2xl font-bold tracking-tight">Booking Management</h1>
              <div className="w-full overflow-x-auto pb-2">
                <div className="flex bg-card border border-border rounded-lg p-1 min-w-max">
                  {['pending', 'confirmed', 'completed', 'cancelled'].map(status => (
                    <button
                      key={status}
                      onClick={() => setSelectedStatus(status)}
                      className={cn(
                        "px-4 py-1.5 text-sm font-medium rounded-md transition-all capitalize whitespace-nowrap",
                        selectedStatus === status ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {loading ? <div className="text-center py-20 text-muted-foreground">Loading...</div> : bookings.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-border rounded-xl">
                <p className="text-muted-foreground">No {selectedStatus} bookings.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {bookings.map(booking => (
                  <div key={booking._id} className="p-4 md:p-6 bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-all">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-lg text-foreground">{booking.serviceId?.title || <span className='italic text-muted-foreground'>Unknown Service</span>}</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-secondary text-secondary-foreground border border-border">
                            ₹{booking.totalPrice.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">Customer: {booking.userId?.name || <span className='italic text-muted-foreground'>Deleted User</span>}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                          <FaCalendarCheck /> {new Date(booking.scheduledAt).toLocaleString()}
                        </p>
                        {booking.paymentStatus === 'paid' && (
                          <span className="inline-block mt-2 text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">Paid</span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-0">
                        {booking.status === 'pending' && (
                          <>
                            <Button size="sm" onClick={() => handleUpdateStatus(booking._id, 'confirmed')} className="bg-green-600 hover:bg-green-700">Accept</Button>
                            <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(booking._id, 'cancelled')} className="text-destructive border-destructive/50 hover:bg-destructive/10">Decline</Button>
                          </>
                        )}
                        {booking.status === 'confirmed' && (
                          <>
                            <Button size="sm" onClick={() => handleUpdateStatus(booking._id, 'completed')}>Complete</Button>
                            <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(booking._id, 'cancelled')}>Cancel</Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === TABS.SERVICES && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight">My Services</h1>
              <Button onClick={() => setEditingService('new')}><FaPlusCircle className="mr-2" /> Add Service</Button>
            </div>

            {loading ? <div className="py-20 text-center text-muted-foreground">Loading...</div> : services.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-border rounded-xl">
                <p className="text-muted-foreground">No services listed.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {services.map(service => (
                  <div key={service._id} className="flex items-center justify-between p-4 bg-card border border-border rounded-lg shadow-sm">
                    <div>
                      <h3 className="font-bold text-foreground">{service.title}</h3>
                      <p className="text-sm text-muted-foreground">₹{service.price} • {service.durationMinutes} min</p>
                      <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", service.isActive ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground")}>
                        {service.isActive ? 'Active' : 'Hidden'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditingService(service._id)}><FaEdit className="mr-2" /> Edit</Button>
                      <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteService(service._id)}><FaTrash /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {editingService && (
              <ServiceForm
                serviceId={editingService === 'new' ? null : editingService}
                providerId={roleProfile._id}
                onClose={() => setEditingService(null)}
                onSuccess={() => { setEditingService(null); fetchData(); }}
              />
            )}
          </div>
        )}

        {view === TABS.ANALYTICS && analyticsData && (
          <div className="max-w-5xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold tracking-tight">Performance</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-card border border-border rounded-xl shadow-sm">
                <h3 className="text-sm font-medium text-muted-foreground">Total Revenue</h3>
                <p className="text-3xl font-bold text-foreground mt-2">₹{analyticsData.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="p-6 bg-card border border-border rounded-xl shadow-sm">
                <h3 className="text-sm font-medium text-muted-foreground">Completed Jobs</h3>
                <p className="text-3xl font-bold text-foreground mt-2">{analyticsData.completedBookings}</p>
              </div>
              <div className="p-6 bg-card border border-border rounded-xl shadow-sm">
                <h3 className="text-sm font-medium text-muted-foreground">Rating</h3>
                <div className="flex items-center gap-2 mt-2">
                  <p className="text-3xl font-bold text-foreground">{analyticsData.averageRating.toFixed(1)}</p>
                  <FaStar className="text-yellow-400 h-6 w-6" />
                </div>
              </div>
            </div>
          </div>
        )}

        {view === TABS.SETTINGS && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* INSTRUCTIONS for New Providers */}
            {roleProfile && (!roleProfile.address || !roleProfile.location) && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg flex gap-3">
                <FaBolt className="text-yellow-600 dark:text-yellow-400 mt-1 shrink-0" />
                <div>
                  <h3 className="font-bold text-yellow-800 dark:text-yellow-300">Action Required: Complete Your Profile</h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                    To start creating services and receiving bookings, you must complete your profile settings below.
                    <strong> Please fill in your Address, Location, and Bio.</strong>
                  </p>
                </div>
              </div>
            )}

            {!roleProfile?.isVerified && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg flex gap-3">
                <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-full h-fit">
                  <FaUserCheck className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-blue-800 dark:text-blue-300">Account Pending Approval</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                    Your account is currently waiting for admin approval. You can complete your profile setup while you wait.
                  </p>
                </div>
              </div>
            )}

            <ProviderSettings roleProfile={roleProfile} user={user} onUpdate={loadUser} />
          </div>
        )}

      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="md:hidden fixed bottom-0 z-40 w-full bg-card border-t border-border flex justify-around items-center p-2 safe-area-pb">
        <button
          onClick={() => setView(TABS.BOOKINGS)}
          className={cn("flex flex-col items-center justify-center w-full py-1", view === TABS.BOOKINGS ? "text-primary" : "text-muted-foreground")}
        >
          <FaCalendarCheck className="h-5 w-5 mb-1" />
          <span className="text-[10px] font-medium">Bookings</span>
        </button>
        <button
          onClick={() => setView(TABS.SERVICES)}
          className={cn("flex flex-col items-center justify-center w-full py-1", view === TABS.SERVICES ? "text-primary" : "text-muted-foreground")}
        >
          <FaListAlt className="h-5 w-5 mb-1" />
          <span className="text-[10px] font-medium">Services</span>
        </button>
        <button
          onClick={() => setView(TABS.ANALYTICS)}
          className={cn("flex flex-col items-center justify-center w-full py-1", view === TABS.ANALYTICS ? "text-primary" : "text-muted-foreground")}
        >
          <FaChartLine className="h-5 w-5 mb-1" />
          <span className="text-[10px] font-medium">Stats</span>
        </button>
        <button
          onClick={() => setView(TABS.SETTINGS)}
          className={cn("flex flex-col items-center justify-center w-full py-1", view === TABS.SETTINGS ? "text-primary" : "text-muted-foreground")}
        >
          <FaCog className="h-5 w-5 mb-1" />
          <span className="text-[10px] font-medium">Settings</span>
        </button>
      </div>
    </div>
  );
};

export default DashboardProvider;