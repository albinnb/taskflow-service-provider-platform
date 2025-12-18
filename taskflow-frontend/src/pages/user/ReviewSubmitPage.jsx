import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { coreApi } from '../../api/serviceApi';
import { toast } from 'react-toastify';
import { FaStar, FaCheckCircle } from 'react-icons/fa';

/**
 * @desc Redesigned page for submitting a review (with Dark Mode).
 */
const ReviewSubmitPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { rating: 5, comment: '' }
  });
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const selectedRating = watch('rating');

  // Define reusable Tailwind classes
  const labelClass = "block text-lg font-semibold text-slate-700 dark:text-slate-200 mb-3";
  const inputClass = "w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg shadow-sm p-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500";
  const errorClass = "mt-1 text-sm text-red-600";

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const res = await coreApi.getBookingById(bookingId);
        const fetchedBooking = res.data.data;
        
        if (fetchedBooking.status !== 'completed') {
            toast.error('Only completed bookings can be reviewed.');
            navigate('/customer/dashboard');
            return;
        }
        setBooking(fetchedBooking);
      } catch (error) {
        toast.error('Failed to load booking details.');
        navigate('/customer/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId, navigate]);

  const onSubmit = async (data) => {
    if (!booking) return;

    try {
      const reviewData = {
        bookingId: booking._id,
        providerId: booking.providerId._id,
        rating: parseInt(data.rating),
        comment: data.comment,
      };

      await coreApi.createReview(reviewData);
      toast.success('Thank you! Your review has been submitted.');
      navigate('/customer/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit review. Already reviewed?');
    }
  };

  if (loading) return <div className="p-12 text-center text-teal-600 dark:text-teal-400 font-semibold text-lg">Loading booking details...</div>;
  if (!booking) return null; // Redirects via useEffect

  return (
    // Use the global light/dark background
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white dark:bg-slate-800 shadow-lg rounded-xl p-8 border border-slate-200 dark:border-slate-700 border-t-4 border-t-teal-600 dark:border-t-teal-500">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Review Your Service</h1>
        <p className="text-lg text-slate-600 dark:text-slate-300 mb-6">
          <strong>{booking.serviceId.title}</strong> by {booking.providerId.businessName}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Rating Input */}
          <div>
            <label className={labelClass}>
              Your Rating (1-5)
            </label>
            <div className="flex space-x-2 text-4xl">
              {[1, 2, 3, 4, 5].map((value) => (
                <FaStar
                  key={value}
                  onClick={() => setValue('rating', value)}
                  className={`cursor-pointer transition-colors ${
                    value <= selectedRating ? 'text-yellow-400' : 'text-slate-300 dark:text-slate-600 hover:text-yellow-300'
                  }`}
                />
              ))}
            </div>
            <input 
                type="hidden" 
                {...register('rating', { required: 'Rating is required', min: 1, max: 5 })} 
                value={selectedRating}
            />
            {errors.rating && <p className={errorClass}>{errors.rating.message}</p>}
          </div>

          {/* Comment Input */}
          <div>
            <label htmlFor="comment" className={labelClass}>
              Comment
            </label>
            <textarea
              id="comment"
              rows="4"
              className={inputClass}
              placeholder="Tell us about your experience..."
              {...register('comment', { maxLength: { value: 500, message: 'Comment cannot exceed 500 characters' } })}
            ></textarea>
            {errors.comment && <p className={errorClass}>{errors.comment.message}</p>}
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting || !selectedRating}
              className="w-full py-3 px-4 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 disabled:opacity-50 transition duration-150 flex justify-center items-center text-base"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
              <FaCheckCircle className='ml-2' />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewSubmitPage;