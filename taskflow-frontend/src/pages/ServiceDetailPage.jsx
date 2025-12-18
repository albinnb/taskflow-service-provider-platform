import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { coreApi } from '../api/serviceApi'; // Assuming path from pages folder
import BookingModal from '../components/booking/BookingModal'; // Assuming path from pages folder
import { FaStar, FaMapMarkerAlt, FaClock, FaRegCalendarCheck } from 'react-icons/fa';
import { toast } from 'react-toastify';

/**
 * @desc Redesigned page for service details, reviews, and booking (with Dark Mode).
 */
const ServiceDetailPage = () => {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchServiceAndReviews = async () => {
      setLoading(true);
      try {
        // Fetch service details (which includes populated provider)
        const serviceRes = await coreApi.getServiceDetails(id);
        const fetchedService = serviceRes.data.data;
        setService(fetchedService);
        
        // Fetch reviews separately
        const providerId = fetchedService.providerId._id;
        const reviewRes = await coreApi.getProviderReviews(providerId);
        setReviews(reviewRes.data.data);
        
      } catch (error) {
        toast.error('Service details or reviews could not be loaded.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchServiceAndReviews();
  }, [id]);

  if (loading) return <div className="p-12 text-center text-teal-600 dark:text-teal-400 font-semibold text-lg">Loading service details...</div>;
  if (!service) return <div className="p-12 text-center text-red-600 font-semibold text-lg">Service not found.</div>;
  
  const provider = service.providerId;

  const renderRatingStars = (rating) => {
    return Array(5).fill(0).map((_, i) => (
      <FaStar 
        key={i} 
        className={`w-5 h-5 ${i < Math.floor(rating) ? 'text-yellow-400' : 'text-slate-300 dark:text-slate-600'}`} 
      />
    ));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3">
          
          {/* Left Side: Details & Reviews */}
          <div className="lg:col-span-2 p-6 md:p-10">
            {/* Service Header */}
            <div className="mb-6">
              <h1 className="text-4xl font-extrabold text-slate-800 dark:text-white mb-2">{service.title}</h1>
              <Link to={`/provider/${provider._id}`} className="text-xl font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition duration-300">
                {provider.businessName}
              </Link>
            </div>
            
            {/* Info Bar */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-slate-600 dark:text-slate-300 mb-8 pb-8 border-b border-slate-200 dark:border-slate-700">
                <p className="flex items-center text-lg">
                  <FaStar className="w-5 h-5 mr-1.5 text-yellow-400" />
                  <span className='font-bold text-slate-700 dark:text-slate-100'>{provider.ratingAvg.toFixed(1)}</span> 
                  ({provider.reviewCount} reviews)
                </p>
                <p className="flex items-center text-lg">
                  <FaClock className="w-5 h-5 mr-1.5 text-teal-600 dark:text-teal-400" />
                  Minimum {service.durationMinutes} minutes
                </p>
                <p className="flex items-center text-lg">
                  <FaMapMarkerAlt className="w-5 h-5 mr-1.5 text-teal-600 dark:text-teal-400" />
                  {provider.address?.city_district || 'Location Unknown'}
                </p>
            </div>

            {/* Description */}
            <section>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">Description</h2>
              <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {service.description}
              </p>
            </section>
            
            {/* Reviews Section */}
            <section className="mt-12">
              <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
                Customer Reviews ({reviews.length})
              </h2>
              
              {reviews.length === 0 ? (
                  <p className='text-slate-500 dark:text-slate-400 italic'>No reviews yet. Be the first to book and rate this Tasker!</p>
              ) : (
                  <div className="space-y-6">
                      {reviews.map(review => (
                          <div key={review._id} className="p-5 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                              <div className="flex items-center mb-2">
                                  {/* Default icon for user */}
                                  <svg className='w-6 h-6 mr-3 text-slate-400 dark:text-slate-300' fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.98 5.98 0 0110 16a5.98 5.98 0 014.546-2.084A5 5 0 0010 11z" clipRule="evenodd"></path></svg>
                                  <p className="font-semibold text-slate-800 dark:text-white">{review.userId.name}</p>
                              </div>
                              <div className="flex items-center mb-3">
                                  {renderRatingStars(review.rating)}
                                  <span className='ml-3 text-sm text-slate-500 dark:text-slate-400'>{new Date(review.createdAt).toLocaleDateString()}</span>
                              </div>
                              <p className="text-slate-600 dark:text-slate-300 italic">"{review.comment}"</p>
                          </div>
                      ))}
                  </div>
              )}
            </section>
          </div>

          {/* Right Side: Booking Card */}
          <div className="lg:col-span-1 p-6 md:p-8 bg-slate-50 dark:bg-slate-800 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-700">
            <div className="sticky top-24">
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Book This Service</h3>
              
              {/* Price Display: Hourly Rate (₹) */}
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4">
                ₹{service.price.toFixed(2)} / hr
              </p>

              <p className='text-base text-slate-600 dark:text-slate-300 mb-6'>
                Select your preferred date and time to check your Tasker's availability.
              </p>

              <button
                  onClick={() => setIsModalOpen(true)}
                  className="w-full py-3 px-6 bg-teal-600 text-white text-lg font-bold rounded-lg shadow-md hover:bg-teal-700 transition-all duration-300 flex items-center justify-center"
              >
                  <FaRegCalendarCheck className="mr-2" />
                  Check Availability & Book
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Booking Modal */}
      {isModalOpen && (
        <BookingModal
          service={service}
          provider={provider}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ServiceDetailPage;