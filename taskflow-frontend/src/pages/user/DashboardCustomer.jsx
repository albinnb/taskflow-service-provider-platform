import React, { useState, useEffect } from 'react';
import useAuth from '../../hooks/useAuth';
import { coreApi } from '../../api/serviceApi';
import { toast } from 'react-toastify';
import { FaCalendarAlt, FaHistory, FaStar, FaTimesCircle, FaCreditCard, FaExclamationTriangle } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import DisputeModal from '../../components/common/DisputeModal';

/**
 * @desc Redesigned Customer Dashboard (with Dark Mode)
 */
const DashboardCustomer = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  // Dispute Modal State
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [selectedDisputeBookingId, setSelectedDisputeBookingId] = useState(null);
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);

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
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      await coreApi.deleteBooking(bookingId);
      toast.success('Booking successfully cancelled.');
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
      toast.success('Issue reported. Support will contact you shortly.');
      setIsDisputeModalOpen(false);
      setSelectedDisputeBookingId(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to report issue.');
    } finally {
      setIsSubmittingDispute(false);
    }
  };

  const handlePayment = async (booking) => {
    try {
      // 1. Create Razorpay Order
      const orderRes = await coreApi.createPaymentOrder({
        bookingId: booking._id,
      });
      const { order, totalPrice } = orderRes.data;

      // 2. Open Razorpay Checkout
      if (!window.Razorpay) {
        toast.error("Razorpay SDK failed to load. Please check internet connection.");
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_RhuzoD45nn8cUr", // Use Vite env variable
        amount: order.amount,
        currency: order.currency,
        name: "TaskFlow",
        description: `Payment for ${booking.serviceId.title}`,
        order_id: order.id,
        handler: async function (response) {
          // 3. Payment Success! Verify it on backend
          try {
            const verifyData = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: booking._id
            };

            await coreApi.verifyPayment(verifyData);

            toast.success('Payment successful! Booking confirmed.');
            fetchBookings(filterStatus); // Refresh list
          } catch (err) {
            toast.error('Payment verification failed. Please contact support.');
            console.error(err);
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.phone || ""
        },
        theme: {
          color: "#0d9488" // Teal-600
        }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response) {
        toast.error(`Payment failed: ${response.error.description}`);
      });

      rzp1.open();

    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to initiate payment.');
    }
  };

  // ... (getStatusClass function is the same) ...
  const getStatusClass = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'completed': return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      case 'cancelled': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      default: return 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200';
    }
  };

  return (
    // Use the global light/dark background
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-extrabold text-slate-800 dark:text-white">
          Welcome, {user?.name}!
        </h1>
      </div>

      {/* Main dashboard content */}
      <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl border border-slate-200 dark:border-slate-700">

        <div className='flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700'>
          <h2 className='text-2xl font-bold text-slate-800 dark:text-white flex items-center'>
            <FaHistory className='inline mr-3 text-teal-600 dark:text-teal-400' />
            My Bookings
          </h2>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className='w-full max-w-xs border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg shadow-sm text-sm p-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500'
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="p-6">
          {loading ? (
            <p className="p-10 text-center text-teal-600 dark:text-teal-400 font-semibold">Loading your bookings...</p>
          ) : bookings.length === 0 ? (
            <p className="p-10 text-center text-slate-500 dark:text-slate-400">No bookings found for the selected status.</p>
          ) : (
            <div className="space-y-4">
              {bookings.map(booking => (
                <div key={booking._id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 flex flex-col md:flex-row justify-between items-start md:items-center">

                  {/* Booking Details */}
                  <div className='flex-grow'>
                    <Link to={`/service/${booking.serviceId._id}`} className='text-lg font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 hover:underline transition duration-300'>
                      {booking.serviceId.title}
                    </Link>
                    <p className='text-sm text-slate-600 dark:text-slate-300'>
                      Tasker: {booking.providerId.businessName}
                    </p>
                    <p className='text-sm text-slate-500 dark:text-slate-400 flex items-center mt-1'>
                      <FaCalendarAlt className='mr-2' />
                      {new Date(booking.scheduledAt).toLocaleString()}
                    </p>
                    {booking.paymentStatus === 'paid' && (
                      <span className='inline-block px-2 py-0.5 mt-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full'>
                        Paid
                      </span>
                    )}
                  </div>

                  {/* Status & Actions */}
                  <div className='mt-3 md:mt-0 flex items-center space-x-4'>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full uppercase ${getStatusClass(booking.status)}`}>
                      {booking.status}
                    </span>
                    <span className="text-lg font-bold text-slate-800 dark:text-white">
                      ₹{booking.totalPrice.toFixed(2)}
                    </span>

                    {/* Action Buttons */}
                    {['confirmed', 'completed'].includes(booking.status) && booking.paymentStatus === 'unpaid' && (
                      <button
                        onClick={() => handlePayment(booking)}
                        className="text-white bg-teal-600 hover:bg-teal-700 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors duration-300 flex items-center"
                      >
                        <FaCreditCard className='mr-1.5' /> Pay Now
                      </button>
                    )}

                    {['pending', 'confirmed'].includes(booking.status) && (
                      <button
                        onClick={() => handleCancel(booking._id)}
                        className="text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 text-sm font-medium transition-colors duration-300 flex items-center"
                      >
                        <FaTimesCircle className='mr-1' /> Cancel
                      </button>
                    )}

                    {booking.status === 'completed' && (
                      <div className="flex space-x-3">
                        <Link
                          to={`/review/submit/${booking._id}`}
                          className="text-yellow-600 hover:text-yellow-700 dark:text-yellow-500 dark:hover:text-yellow-400 text-sm font-medium flex items-center transition-colors duration-300"
                        >
                          <FaStar className='mr-1' /> Review
                        </Link>
                        <button
                          onClick={() => openDisputeModal(booking._id)}
                          className="text-orange-600 hover:text-orange-700 dark:text-orange-500 dark:hover:text-orange-400 text-sm font-medium flex items-center transition-colors duration-300"
                        >
                          <FaExclamationTriangle className='mr-1' /> Report Issue
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dispute Modal */}
      <DisputeModal
        isOpen={isDisputeModalOpen}
        onClose={() => setIsDisputeModalOpen(false)}
        onSubmit={handleDisputeSubmit}
        isSubmitting={isSubmittingDispute}
      />
    </div>
  );
};

export default DashboardCustomer;