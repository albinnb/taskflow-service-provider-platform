import React, { useState, useEffect } from 'react';
import useAuth from '../../hooks/useAuth';
import { coreApi } from '../../api/serviceApi';
import { toast } from 'react-toastify';
import { FaCalendarAlt, FaHistory, FaStar, FaTimesCircle, FaCreditCard, FaExclamationTriangle, FaUser, FaCog, FaSignOutAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import DisputeModal from '../../components/common/DisputeModal';
import EditProfileModal from '../../components/user/EditProfileModal';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/Button';

const DashboardCustomer = () => {
  const { user, logout } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings', 'profile'

  // Modals
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [selectedDisputeBookingId, setSelectedDisputeBookingId] = useState(null);
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    fetchBookings(filterStatus);
  }, [filterStatus]);

  const fetchBookings = async (status) => {
    setLoading(true);
    try {
      const params = status ? { status, sort: '-scheduledAt' } : { sort: '-scheduledAt' };
      const res = await coreApi.getBookings(params);
      setBookings(res.data.data);
    } catch (error) {
      toast.error('Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await coreApi.deleteBooking(bookingId);
      toast.success('Booking cancelled.');
      fetchBookings(filterStatus);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel booking.');
    }
  };

  const openDisputeModal = (bookingId) => {
    setSelectedDisputeBookingId(bookingId);
    setIsDisputeModalOpen(true);
  };

  const handleDisputeSubmit = async (data) => {
    if (!selectedDisputeBookingId) return;
    setIsSubmittingDispute(true);
    try {
      await coreApi.createDispute({ bookingId: selectedDisputeBookingId, reason: data.reason });
      toast.success('Issue reported.');
      setIsDisputeModalOpen(false);
      setSelectedDisputeBookingId(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to report.');
    } finally {
      setIsSubmittingDispute(false);
    }
  };

  const handleProfileUpdate = async (data) => {
    try {
      await coreApi.updateUserProfile(data);
      toast.success('Profile updated.');
      setIsProfileModalOpen(false);
    } catch (error) {
      toast.error('Failed to update profile.');
    }
  };

  const handlePayment = async (booking) => {
    // Payment Logic reused
    try {
      const orderRes = await coreApi.createPaymentOrder({ bookingId: booking._id });
      const { order } = orderRes.data;
      if (!window.Razorpay) { toast.error("Razorpay error"); return; }
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "TaskFlow",
        description: `Payment for ${booking.serviceId.title}`,
        order_id: order.id,
        handler: async function (response) {
          try {
            await coreApi.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: booking._id
            });
            toast.success('Payment successful!');
            fetchBookings(filterStatus);
          } catch (err) { toast.error('Payment verification failed.'); }
        },
        prefill: { email: user?.email, contact: user?.phone },
        theme: { color: "#007acc" }
      };
      const rzp1 = new window.Razorpay(options);
      rzp1.open();
    } catch (error) { toast.error('Payment init failed.'); }
  };

  const SidebarItem = ({ id, icon: Icon, label, danger = false }) => (
    <button
      onClick={() => id === 'logout' ? logout() : setActiveTab(id)}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-l-2",
        activeTab === id && id !== 'logout'
          ? "bg-secondary text-primary border-primary"
          : "text-muted-foreground border-transparent hover:bg-muted hover:text-foreground",
        danger && "text-destructive hover:text-destructive hover:bg-destructive/10"
      )}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
      {/* SIDEBAR - VS CODE STYLE */}
      <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Explorer</h2>
          <p className="font-bold text-foreground mt-1 truncate">{user?.name}</p>
        </div>

        <nav className="flex-1 py-4 space-y-1">
          <SidebarItem id="bookings" icon={FaHistory} label="My Bookings" />
          <SidebarItem id="profile" icon={FaUser} label="Profile" />
        </nav>

        <div className="p-4 border-t border-border">
          <SidebarItem id="logout" icon={FaSignOutAlt} label="Log Out" danger />
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto bg-muted/10 p-6 md:p-8">
        {activeTab === 'bookings' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Booking History</h1>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {loading ? (
              <div className="text-center py-20 text-muted-foreground">Loading workspace...</div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-border rounded-xl">
                <p className="text-muted-foreground">No bookings found.</p>
                <Link to="/services">
                  <Button variant="link" className="mt-2">Browse Services</Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {bookings.map((booking) => (
                  <div key={booking._id} className="group relative flex flex-col gap-4 rounded-lg border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
                    <div className="flex flex-col md:flex-row justify-between gap-4">

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide",
                            booking.status === 'confirmed' && "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
                            booking.status === 'pending' && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
                            booking.status === 'completed' && "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
                            booking.status === 'cancelled' && "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          )}>
                            {booking.status}
                          </span>
                          <span className="text-xs text-muted-foreground">{new Date(booking.scheduledAt).toLocaleDateString()}</span>
                        </div>
                        <h3 className="font-bold text-lg text-foreground">{booking.serviceId.title}</h3>
                        <p className="text-sm text-muted-foreground">Provider: {booking.providerId.businessName}</p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span className="text-xl font-bold text-foreground">₹{booking.totalPrice.toFixed(2)}</span>
                        <div className="flex gap-2">
                          {/* ACTIONS */}
                          {['confirmed', 'completed'].includes(booking.status) && booking.paymentStatus === 'unpaid' && (
                            <Button size="sm" onClick={() => handlePayment(booking)}>Pay Now</Button>
                          )}
                          {['pending', 'confirmed'].includes(booking.status) && (
                            <Button size="sm" variant="ghost" onClick={() => handleCancel(booking._id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">Cancel</Button>
                          )}
                          {booking.status === 'completed' && (
                            <>
                              <Link to={`/review/submit/${booking._id}`}>
                                <Button size="sm" variant="outline">Review</Button>
                              </Link>
                              <Button size="sm" variant="ghost" onClick={() => openDisputeModal(booking._id)}>Report</Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-card rounded-xl border border-border shadow-sm p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">Profile Settings</h2>
                <Button onClick={() => setIsProfileModalOpen(true)}>Edit Profile</Button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                  <p className="text-lg font-medium text-foreground">{user?.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-lg font-medium text-foreground">{user?.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <p className="text-lg font-medium text-foreground">{user?.phone || 'Not set'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Role</label>
                  <p className="text-lg font-medium text-foreground capitalize">{user?.role}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <DisputeModal
        isOpen={isDisputeModalOpen}
        onClose={() => setIsDisputeModalOpen(false)}
        onSubmit={handleDisputeSubmit}
        isSubmitting={isSubmittingDispute}
      />
      <EditProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        onUpdate={handleProfileUpdate}
      />
    </div>
  );
};

export default DashboardCustomer;