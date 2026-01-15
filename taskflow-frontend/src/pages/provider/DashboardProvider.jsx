import React, { useState, useEffect } from 'react';
import useAuth from '../../hooks/useAuth';
import { coreApi } from '../../api/serviceApi';
import { toast } from 'react-toastify';
import { FaUserCheck, FaBolt, FaListAlt, FaCalendarCheck, FaChartLine, FaTrash, FaEdit, FaPlusCircle, FaCog, FaStar, FaMapMarkerAlt, FaSignOutAlt, FaBars, FaTimesCircle } from 'react-icons/fa';

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
  const [extendingBookingId, setExtendingBookingId] = useState(null);

  // Mobile Sidebar State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);


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

  const handleExtendBooking = async (bookingId) => {
    // Prevent multiple clicks for the same booking
    if (extendingBookingId === bookingId) return;

    setExtendingBookingId(bookingId);

    const extendAction = async () => {
      const token = localStorage.getItem('taskflow-token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/bookings/${bookingId}/extend`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to extend booking');
      return data;
    };

    const promise = extendAction();

    toast.promise(
      promise,
      {
        pending: 'Calculating schedule shifts...',
        success: {
          render({ data }) {
            fetchData();
            return data.message || "Booking extended by 30 mins.";
          }
        },
        error: {
          render({ data }) {
            return data.message || 'Failed to extend booking';
          }
        }
      }
    );

    try {
      await promise;
    } catch (error) {
      // Handled by toast
    } finally {
      setExtendingBookingId(null);
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
      onClick={() => {
        setView(id);
        setIsMobileMenuOpen(false); // Close sidebar on mobile
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

  if (!roleProfile) return <div className="p-20 text-center">Loading Profile...</div>;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-background relative">
      {/* MOBILE HEADER toggler */}
      <div className="md:hidden w-full bg-card border-b border-border p-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setIsMobileMenuOpen(true)}>
            <FaBars className="h-5 w-5" />
          </Button>
          <span className="font-bold text-foreground">Provider Portal</span>
        </div>
      </div>

      {/* MOBILE OVERLAY BACKDROP */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={cn(
        "border-r border-border bg-card flex-col h-[calc(100vh-4rem)] overflow-y-auto no-scrollbar transition-transform duration-300 ease-in-out z-50",
        // Mobile styles: fixed, full height, slide-in
        "fixed inset-y-0 left-0 w-64 md:relative md:translate-x-0 md:flex",
        isMobileMenuOpen ? "translate-x-0 top-0" : "-translate-x-full md:translate-x-0 md:top-16"
      )}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Provider Portal</h2>
            <p className="font-bold text-foreground mt-1 truncate">{roleProfile.businessName}</p>
          </div>
          {/* Close button for mobile inside sidebar */}
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-muted-foreground hover:text-foreground">
            <FaTimesCircle className="h-5 w-5" />
          </button>
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
      <main className="flex-1 bg-muted/10 p-3 md:p-8 pb-20 md:pb-8">

        {/* Verification Banner */}
        {!roleProfile.isVerified && (
          <div className="mb-6 p-4 bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 rounded-lg border border-orange-200 dark:border-orange-800 flex items-center gap-3">
            <FaUserCheck className="h-5 w-5" />
            <div>
              <p className="font-bold">Account Pending Approval</p>
              <p className="text-sm">You can create services, but they will require Admin Approval before going live. Once you are a <strong>Trusted Provider</strong> (Approved), your services will go live immediately.</p>
            </div>
          </div>
        )}

        {view === TABS.BOOKINGS && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h1 className="text-2xl font-bold tracking-tight">Booking Management</h1>
              <div className="w-full overflow-x-auto pb-2 no-scrollbar"> {/* Added no-scrollbar */}
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
                            <Button
                              size="sm"
                              variant="secondary"
                              className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={() => handleExtendBooking(booking._id)}
                              disabled={extendingBookingId === booking._id}
                            >
                              {extendingBookingId === booking._id ? 'Processing...' : 'Running Late (+30m)'}
                            </Button>
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
            <h1 className="text-2xl font-bold tracking-tight mb-6">Performance Dashboard</h1>

            {/* 1. KEY METRICS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-card border border-border rounded-xl shadow-sm">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Revenue</h3>
                <p className="text-3xl font-bold text-foreground mt-2">₹{(analyticsData.totalRevenue || 0).toLocaleString()}</p>
              </div>
              <div className="p-6 bg-card border border-border rounded-xl shadow-sm">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Completed Jobs</h3>
                <p className="text-3xl font-bold text-foreground mt-2">{analyticsData.completedBookings}</p>
              </div>
              <div className="p-6 bg-card border border-border rounded-xl shadow-sm">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Overall Rating</h3>
                <div className="flex items-center gap-2 mt-2">
                  <p className="text-3xl font-bold text-foreground">{analyticsData.averageRating.toFixed(1)}</p>
                  <FaStar className="text-yellow-400 h-6 w-6" />
                  <span className="text-sm text-muted-foreground">({analyticsData.totalReviews} reviews)</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 2. MONTHLY REVENUE CHART (Simple CSS Bar Chart) */}
              <div className="p-6 bg-card border border-border rounded-xl shadow-sm">
                <h3 className="font-bold text-lg mb-6">Revenue Trend (Last 6 Months)</h3>
                <div className="flex items-end justify-between h-48 gap-2">
                  {/* Chart Logic: Generate last 6 months list and fill data */}
                  {(() => {
                    const today = new Date();
                    const last6Months = Array.from({ length: 6 }, (_, i) => {
                      const d = new Date(today.getFullYear(), today.getMonth() - 5 + i, 1);
                      return {
                        monthIdx: d.getMonth() + 1,
                        label: d.toLocaleString('default', { month: 'short' })
                      };
                    });

                    // Map actual data to the 6 months skeleton
                    const chartData = last6Months.map(m => {
                      const found = (analyticsData.monthlyRevenue || []).find(r => r._id === m.monthIdx);
                      return { ...m, revenue: found ? found.revenue : 0 };
                    });

                    const maxRev = Math.max(...chartData.map(d => d.revenue)) || 1;

                    return chartData.map((m) => (
                      <div key={m.label} className="flex flex-col items-center flex-1 group relative">
                        {/* Tooltip */}
                        <div className="absolute -top-8 bg-popover text-popover-foreground text-xs font-bold px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          ₹{m.revenue.toLocaleString()}
                        </div>
                        <div
                          className="w-full mx-1 bg-primary/20 hover:bg-primary transition-all duration-300 rounded-t-sm"
                          style={{ height: `${Math.max((m.revenue / maxRev) * 100, 2)}%` }} // Min height 2% for visibility
                        ></div>
                        <div className="text-[10px] text-muted-foreground mt-2 uppercase">{m.label}</div>
                      </div>
                    ));
                  })()}
                  {(!analyticsData.monthlyRevenue || analyticsData.monthlyRevenue.length === 0) && (
                    <div className="w-full text-center text-muted-foreground self-center">No revenue data yet.</div>
                  )}
                </div>
              </div>

              {/* 3. TOP PERFORMING SERVICES */}
              <div className="p-6 bg-card border border-border rounded-xl shadow-sm">
                <h3 className="font-bold text-lg mb-6">Top Earnings Services</h3>
                <div className="space-y-4">
                  {(analyticsData.topServices || []).map((s, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium truncate max-w-[200px]">{s.title}</span>
                        <span className="font-bold text-green-600">₹{s.totalRevenue.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${(s.totalRevenue / ((analyticsData.topServices[0]?.totalRevenue) || 1)) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 text-right">{s.bookingsCount} bookings</p>
                    </div>
                  ))}
                  {(!analyticsData.topServices || analyticsData.topServices.length === 0) && (
                    <div className="text-center text-muted-foreground">No services data yet.</div>
                  )}
                </div>
              </div>
            </div>

            {/* 4. RECENT REVIEWS */}
            <div className="p-6 bg-card border border-border rounded-xl shadow-sm">
              <h3 className="font-bold text-lg mb-4">Recent Reviews</h3>
              <div className="space-y-4">
                {(analyticsData.recentReviews || []).length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No reviews yet.</p>
                ) : (
                  analyticsData.recentReviews.map((review) => (
                    <div key={review._id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center font-bold text-xs">
                            {review.userId?.name?.[0] || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-bold">{review.userId?.name || 'Deleted User'}</p>
                            <div className="flex text-yellow-500 text-xs">
                              {[...Array(5)].map((_, i) => (
                                <FaStar key={i} className={i < review.rating ? "" : "text-muted-foreground/30"} />
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-foreground mt-2 pl-10">{review.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 5. RECENT COMPLETED JOBS LIST */}
            <div className="p-6 bg-card border border-border rounded-xl shadow-sm">
              <h3 className="font-bold text-lg mb-4">Last 10 Completed Jobs</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Service</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(analyticsData.recentCompletedBookings || []).map((booking) => (
                      <tr key={booking._id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">{new Date(booking.scheduledAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">{booking.serviceId?.title || 'Unknown Service'}</td>
                        <td className="px-4 py-3">{booking.userId?.name || 'Deleted User'}</td>
                        <td className="px-4 py-3 font-bold text-green-600">₹{booking.totalPrice}</td>
                      </tr>
                    ))}
                    {(analyticsData.recentCompletedBookings || []).length === 0 && (
                      <tr>
                        <td colSpan="4" className="px-4 py-6 text-center text-muted-foreground">No completed jobs yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
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
                    Your account is under review. You can create services, but they will require manual approval. Once approved, you will become a "Trusted Provider".
                  </p>
                </div>
              </div>
            )}

            <ProviderSettings roleProfile={roleProfile} user={user} onUpdate={loadUser} />
          </div>
        )}

      </main>

      {/* OLD BOTTOM NAV REMOVED */}
    </div>


  );
};

export default DashboardProvider;