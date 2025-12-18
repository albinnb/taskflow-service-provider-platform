import React from 'react';
import { FaStar, FaMapMarkerAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';

/**
 * @desc Redesigned card component (with Dark Mode).
 */
const ServiceCard = ({ service }) => {
  if (!service || !service.providerId) return null;

  const provider = service.providerId;
  const providerName = provider.businessName || 'N/A';
  const rating = provider.ratingAvg ? provider.ratingAvg.toFixed(1) : 'New';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row">
      
      {/* Image Placeholder */}
      <div className="md:w-1/3 h-48 md:h-auto bg-slate-200 flex-shrink-0">
        <img
          src={service.images[0]?.url || 'https://images.unsplash.com/photo-1517646287270-a5a90701800c?q=80&w=800&auto=format&fit=crop'}
          alt={service.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="p-5 md:p-6 flex flex-col justify-between md:w-2/3">
        <div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
            <Link to={`/service/${service._id}`} className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors duration-300">
              {service.title}
            </Link>
          </h3>
          
          <p className="text-base text-slate-500 dark:text-slate-300 mb-3 line-clamp-2">
            {service.description}
          </p>

          <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-300 mb-4">
            <p className="flex items-center">
              <FaMapMarkerAlt className="w-4 h-4 mr-1.5 text-teal-600 dark:text-teal-400" />
              {provider.address?.city || 'Location Unknown'}
            </p>
            <p className="flex items-center">
              <FaStar className="w-4 h-4 mr-1.5 text-yellow-500" />
              {rating} Rating ({provider.reviewCount || 0} reviews)
            </p>
          </div>

          <p className="text-sm text-slate-500 dark:text-slate-400">
             Tasker: 
             <Link to={`/provider/${provider._id}`} className='font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 hover:underline ml-1'>
               {providerName}
             </Link>
          </p>
        </div>

        {/* Price and Booking Button */}
        <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-700 flex justify-between items-end">
          <p className="text-2xl font-extrabold text-slate-800 dark:text-white">
            ${service.price.toFixed(2)}
            <span className="text-sm text-slate-500 dark:text-slate-400 font-normal ml-1">
              (for {service.durationMinutes} min)
            </span>
          </p>
          <Link
            to={`/service/${service._id}`}
            className="px-5 py-2.5 bg-teal-600 text-white font-semibold rounded-lg shadow-sm hover:bg-teal-700 transition-all duration-300 text-sm"
          >
            Book Now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;