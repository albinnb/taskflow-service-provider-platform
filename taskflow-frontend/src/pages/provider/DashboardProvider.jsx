import React, { useState, useEffect } from 'react';
import useAuth from '../../hooks/useAuth';
import { coreApi } from '../../api/serviceApi';
import { toast } from 'react-toastify';
import { FaUserCheck, FaBolt, FaListAlt, FaCalendarCheck, FaChartLine, FaTrash, FaEdit, FaPlusCircle, FaCog, FaStar } from 'react-icons/fa';
import ServiceForm from '../../components/provider/ServiceForm';
// *** THIS IS THE FIX ***
// The file is in the same folder, so it should be './'
import ProviderSettings from './ProviderSettings';
import { Link } from 'react-router-dom';

const TABS = {
  BOOKINGS: 'bookings',
  SERVICES: 'services',
  ANALYTICS: 'analytics',
  SETTINGS: 'settings',
};

/**
 * @desc Redesigned Provider Dashboard (with Dark Mode)
 */
const DashboardProvider = () => {
  const { user, roleProfile, loadUser, isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState(TABS.BOOKINGS);
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [editingService, setEditingService] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null); // Correctly placed state

  useEffect(() => {
    if (roleProfile && isAuthenticated) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleProfile, selectedStatus, view, isAuthenticated]);

  const fetchData = async () => {
    // If user is not authenticated (e.g., during logout redirect), skip fetching
    if (!isAuthenticated) {
      return;
    }

    setLoading(true);
    // Clear data based on which tab is active
    if (view === TABS.SERVICES) setServices([]);
    if (view === TABS.BOOKINGS) setBookings([]);

    try {
      if (view === TABS.SERVICES) {
        const allServicesRes = await coreApi.searchServices({
          providerId: roleProfile._id,
          limit: 50,
        });
        setServices(allServicesRes.data.data);
      }

      if (view === TABS.BOOKINGS) {
        const bookingsRes = await coreApi.getBookings({ status: selectedStatus, sort: 'scheduledAt' });
        setBookings(bookingsRes.data.data);
      }

      if (view === TABS.ANALYTICS) {
        const analyticsRes = await coreApi.getProviderAnalytics(roleProfile._id);
        setAnalyticsData(analyticsRes.data.data);
      }

    } catch (error) {
      if (error.response?.status === 401) {
        // Token is invalid/expired or user logged out; let global auth flow handle redirect
        console.warn('Unauthorized when loading provider dashboard data:', error);
      } else {
        toast.error('Failed to load dashboard data.');
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  };

  // This is a helper function for the tab content crash
  const setData = (data) => {
    if (view === TABS.SERVICES) setServices(data);
    else if (view === TABS.BOOKINGS) setBookings(data);
  };

  const handleUpdateStatus = async (bookingId, newStatus) => {
    try {
      await coreApi.updateBookingStatus(bookingId, { status: newStatus });
      toast.success(`Booking successfully marked as ${newStatus}.`);
      fetchData(); // Refresh list
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update booking status.');
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service? This action is irreversible.')) return;
    try {
      await coreApi.deleteService(serviceId);
      toast.success('Service deleted successfully.');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete service.');
    }
  };

  // --- RENDER FUNCTIONS ---

  const renderBookings = () => (
    <div>
      <div className='flex flex-wrap gap-2 mb-4'>
        {['pending', 'confirmed', 'completed', 'cancelled'].map(status => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`px-4 py-2 text-sm font-semibold rounded-full capitalize transition-all duration-300 ${selectedStatus === status
              ? 'bg-teal-600 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
          >
            {status}
          </button>
        ))}
      </div>

      <h3 className='text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4'>
        {selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)} Bookings
      </h3>

      {loading ? <p className="p-10 text-center text-teal-600 dark:text-teal-400">Loading bookings...</p> : bookings.length === 0 ? (
        <p className="p-10 text-center text-slate-500 dark:text-slate-400">No {selectedStatus} bookings found.</p>
      ) : (
        <div className="space-y-4">
          {bookings.map(booking => (
            <div key={booking._id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div>
                <p className='text-lg font-bold text-slate-800 dark:text-white'>{booking.serviceId.title} - ${booking.totalPrice.toFixed(2)}</p>
                <p className='text-sm text-slate-600 dark:text-slate-300'>Customer: {booking.userId.name}</p>
                <p className='text-sm text-slate-500 dark:text-slate-400 flex items-center mt-1'>
                  <FaCalendarCheck className='mr-2 text-teal-600 dark:text-teal-400' /> {new Date(booking.scheduledAt).toLocaleString()}
                </p>
                <div className="mt-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${booking.paymentStatus === 'paid'
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-orange-100 text-orange-800 border border-orange-200'
                    }`}>
                    {booking.paymentStatus === 'paid' ? 'Payment Verified' : 'Payment Pending'}
                  </span>
                </div>
              </div>
              <div className='mt-3 sm:mt-0 flex-shrink-0 flex items-center space-x-2'>
                {booking.status === 'pending' && (
                  <button
                    onClick={() => handleUpdateStatus(booking._id, 'confirmed')}
                    className='px-3 py-1.5 text-sm font-semibold bg-green-500 text-white rounded-md hover:bg-green-600 transition-all duration-300'
                  >
                    Accept
                  </button>
                )}
                {['pending', 'confirmed'].includes(booking.status) && (
                  <button
                    onClick={() => handleUpdateStatus(booking._id, 'cancelled')}
                    className='px-3 py-1.5 text-sm font-semibold bg-red-500 text-white rounded-md hover:bg-red-600 transition-all duration-300'
                  >
                    Decline
                  </button>
                )}
                {booking.status === 'confirmed' && (
                  <button
                    onClick={() => handleUpdateStatus(booking._id, 'completed')}
                    className='px-3 py-1.5 text-sm font-semibold bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-all duration-300'
                  >
                    Complete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderServices = () => (
    <div className='space-y-6'>
      <button
        onClick={() => setEditingService('new')}
        className='flex items-center px-5 py-2.5 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 shadow-sm transition-all duration-300'>
        <FaPlusCircle className='mr-2' /> Add New Service
      </button>

      <div className='space-y-4'>
        {loading ? <p className="p-10 text-center text-teal-600 dark:text-teal-400">Loading services...</p> : services.length === 0 ? (
          <p className="p-10 text-center text-slate-500 dark:text-slate-400 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg">You haven't listed any services yet.</p>
        ) : (
          services.map(service => (
            <div key={service._id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 flex justify-between items-center">
              <div>
                <p className='text-lg font-bold text-slate-800 dark:text-white'>{service.title}</p>
                <p className='text-sm text-slate-600 dark:text-slate-300'>${service.price.toFixed(2)} for {service.durationMinutes} min</p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${service.isActive
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-600 dark:text-slate-300'
                  }`}>
                  {service.isActive ? 'Active' : 'Hidden'}
                </span>
              </div>
              <div className='space-x-4'>
                <button onClick={() => setEditingService(service._id)} className='text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors duration-300'>
                  <FaEdit className='inline mr-1' /> Edit
                </button>
                <button onClick={() => handleDeleteService(service._id)} className='text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-red-400 font-medium transition-colors duration-300'>
                  <FaTrash className='inline mr-1' /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Service Modal/Form */}
      {editingService && (
        <ServiceForm
          serviceId={editingService === 'new' ? null : editingService}
          providerId={roleProfile._id}
          onClose={() => setEditingService(null)}
          onSuccess={() => { setEditingService(null); fetchData(); }}
        />
      )}
    </div>
  );

  const renderAnalytics = () => {
    if (!analyticsData) return <p className="p-10 text-center text-teal-600 dark:text-teal-400">Loading analytics...</p>;

    return (
      <div className='p-4'>
        <h3 className='text-2xl font-semibold text-slate-800 dark:text-white mb-3'>Business Analytics</h3>
        <p className='text-slate-500 dark:text-slate-400 mb-6'>Key performance indicators based on completed bookings.</p>
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8'>
          <div className='p-6 bg-blue-50 dark:bg-slate-900 rounded-lg shadow-sm border border-blue-200 dark:border-blue-700'>
            <p className='text-3xl font-bold text-blue-800 dark:text-blue-200'>{analyticsData.completedBookings} <span className="text-lg text-blue-500">/ {analyticsData.totalBookings}</span></p>
            <p className='text-sm font-medium text-blue-600 dark:text-blue-300'>Completed / Total Bookings</p>
          </div>
          <div className='p-6 bg-green-50 dark:bg-slate-900 rounded-lg shadow-sm border border-green-200 dark:border-green-700'>
            <p className='text-3xl font-bold text-green-800 dark:text-green-200'>₹{analyticsData.totalRevenue.toLocaleString()}</p>
            <p className='text-sm font-medium text-green-600 dark:text-green-300'>Total Revenue (Paid)</p>
          </div>
          <div className='p-6 bg-yellow-50 dark:bg-slate-900 rounded-lg shadow-sm border border-yellow-200 dark:border-yellow-700'>
            <p className='text-3xl font-bold text-yellow-800 dark:text-yellow-200'>{analyticsData.averageRating.toFixed(1)} <FaStar className='inline w-6 h-6' /></p>
            <p className='text-sm font-medium text-yellow-600 dark:text-yellow-300'>Average Rating ({analyticsData.totalReviews})</p>
          </div>
        </div>

        <h3 className='text-xl font-semibold text-slate-800 dark:text-white mb-4'>Recent Reviews</h3>
        {analyticsData.recentReviews && analyticsData.recentReviews.length > 0 ? (
          <div className="space-y-4">
            {analyticsData.recentReviews.map(review => (
              <div key={review._id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-white">{review.userId.name}</p>
                    <div className="flex items-center text-yellow-500 text-sm mt-1">
                      {[...Array(5)].map((_, i) => (
                        <FaStar key={i} className={i < review.rating ? "text-yellow-400" : "text-slate-300"} />
                      ))}
                      <span className="ml-2 text-slate-500 dark:text-slate-400 text-xs">{new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <p className="text-slate-600 dark:text-slate-300 mt-2 text-sm italic">"{review.comment}"</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 dark:text-slate-400 italic">No reviews yet.</p>
        )}
      </div>
    );
  };

  const renderSettings = () => (
    <div className='p-4'>
      <ProviderSettings roleProfile={roleProfile} user={user} onUpdate={loadUser} />
    </div>
  )

  // Main render logic
  if (!roleProfile) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center">
      <h2 className="text-2xl font-semibold text-slate-700 dark:text-white">Finalizing your account...</h2>
      <p className="text-slate-500 dark:text-slate-400 mt-2">Please complete your Tasker profile to manage your services.</p>
      <div className="mt-8 max-w-2xl mx-auto">
        <ProviderSettings roleProfile={roleProfile} user={user} onUpdate={loadUser} />
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-4xl font-extrabold text-slate-800 dark:text-white mb-6">
        {roleProfile.businessName} Dashboard
      </h1>

      {/* Profile/Status Summary */}
      <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl p-6 mb-8 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-4">
          <FaUserCheck className={`w-10 h-10 ${roleProfile.isVerified ? 'text-teal-500' : 'text-orange-500'}`} />
          <div>
            <h3 className='text-lg font-semibold text-slate-800 dark:text-white'>Verification Status</h3>
            <p className={`text-sm font-bold ${roleProfile.isVerified ? 'text-teal-600 dark:text-teal-400' : 'text-orange-600 dark:text-orange-400'}`}>
              {roleProfile.isVerified ? 'Verified Tasker' : 'Pending Verification'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className='mb-6 border-b border-slate-200 dark:border-slate-700'>
        <nav className='-mb-px flex space-x-8 overflow-x-auto'>
          <button onClick={() => setView(TABS.BOOKINGS)} className={`tab-button ${view === TABS.BOOKINGS ? 'active' : ''}`}><FaCalendarCheck className='mr-2' /> Bookings</button>
          <button onClick={() => setView(TABS.SERVICES)} className={`tab-button ${view === TABS.SERVICES ? 'active' : ''}`}><FaBolt className='mr-2' /> Services</button>
          <button onClick={() => setView(TABS.ANALYTICS)} className={`tab-button ${view === TABS.ANALYTICS ? 'active' : ''}`}><FaChartLine className='mr-2' /> Analytics</button>
          <button onClick={() => setView(TABS.SETTINGS)} className={`tab-button ${view === TABS.SETTINGS ? 'active' : ''}`}><FaCog className='mr-2' /> Settings</button>
        </nav>
      </div>

      {/* Content Area */}
      <div className='bg-white dark:bg-slate-800 shadow-lg rounded-xl p-6 border border-slate-200 dark:border-slate-700'>
        <>
          {view === TABS.BOOKINGS && renderBookings()}
          {view === TABS.SERVICES && renderServices()}
          {view === TABS.ANALYTICS && renderAnalytics()}
          {view === TABS.SETTINGS && renderSettings()}
        </>
      </div>

      {/* Tailwind Style Helper */}
      <style jsx="true">{`
          .tab-button {
            padding: 0.75rem 0.25rem; /* Tighter padding */
            font-weight: 600; /* Semibold */
            color: #475569; /* Slate-600 */
            border-bottom: 3px solid transparent;
            white-space: nowrap;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            font-size: 1rem; /* Base size */
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
            border-color: transparent;
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

export default DashboardProvider;