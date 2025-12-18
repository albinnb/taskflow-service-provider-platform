import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FaTimes, FaSave } from 'react-icons/fa';
import { coreApi } from '../../api/serviceApi';
import { toast } from 'react-toastify';

/**
 * @desc Redesigned Modal/Form component for creating or updating a Service (with Dark Mode).
 * Uses the TaskRabbit model: Price is Hourly Rate (₹), Duration is Provider Minimum.
 */
const ServiceForm = ({ serviceId, providerId, onClose, onSuccess }) => {
  const isEditing = !!serviceId;
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      isActive: true, // Default new services to active
    }
  });
  const [categories, setCategories] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Define reusable Tailwind classes
  const labelClass = "block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2";
  const inputClass = "w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg shadow-sm text-sm p-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500";
  const errorClass = "mt-1 text-sm text-red-600";

  // Fetch categories and (if editing) service data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingInitial(true);
        
        // 1. Fetch Categories from the API
        const categoryRes = await coreApi.getCategories();
        setCategories(categoryRes.data.data);

        // 2. If editing, fetch the service data
        if (isEditing) {
          const res = await coreApi.getServiceDetails(serviceId);
          const service = res.data.data;
          
          // Populate the form with current service data
          reset({
            title: service.title,
            description: service.description,
            category: service.category._id || service.category,
            price: service.price,
            durationMinutes: service.durationMinutes,
            isActive: service.isActive,
          });
        }
      } catch (error) {
        toast.error('Failed to load form data.');
        onClose();
      } finally {
        setLoadingInitial(false);
      }
    };
    loadData();
  }, [serviceId, isEditing, onClose, reset]);

  const onSubmit = async (data) => {
    // Inject providerId before sending
    const serviceData = { ...data, providerId }; 
    
    try {
      if (isEditing) {
        await coreApi.updateService(serviceId, serviceData);
        toast.success('Service updated successfully!');
      } else {
        await coreApi.createService(serviceData);
        toast.success('New service created successfully!');
      }
      onSuccess(); // This will close the modal and refresh the list
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} service.`);
    }
  };

  // Loading state for the modal itself
  if (loadingInitial) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-75 flex items-center justify-center">
         <p className='text-white text-xl'>Loading form...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-75 flex items-center justify-center p-4">
      {/* Modal Container */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full transform transition-all border border-slate-200 dark:border-slate-700">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            {isEditing ? 'Edit Service' : 'Create New Service'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-300">
            <FaTimes className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Modal Body */}
          <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            
            {/* Title */}
            <div>
              <label htmlFor="title" className={labelClass}>Service Title</label>
              <input
                id="title"
                type="text"
                className={inputClass}
                placeholder="e.g., Emergency Drain Unclogging"
                {...register('title', { required: 'Title is required' })}
              />
              {errors.title && <p className={errorClass}>{errors.title.message}</p>}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className={labelClass}>Description</label>
              <textarea
                id="description"
                rows="3"
                className={inputClass}
                placeholder="Detailed description of the service..."
                {...register('description', { required: 'Description is required' })}
              ></textarea>
              {errors.description && <p className={errorClass}>{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Category */}
              <div>
                <label htmlFor="category" className={labelClass}>Category</label>
                <select
                  id="category"
                  className={inputClass}
                  {...register('category', { required: 'Category is required' })}
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
                {errors.category && <p className={errorClass}>{errors.category.message}</p>}
              </div>

              {/* Price (Hourly Rate) */}
              <div>
                <label htmlFor="price" className={labelClass}>Hourly Rate (₹)</label>
                <input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  className={inputClass}
                  placeholder="e.g., 500.00"
                  {...register('price', { required: 'Hourly Rate is required', valueAsNumber: true })}
                />
                {errors.price && <p className={errorClass}>{errors.price.message}</p>}
              </div>

              {/* Duration (Minimum Minutes) */}
              <div>
                <label htmlFor="durationMinutes" className={labelClass}>Minimum Duration (Minutes)</label>
                <input
                  id="durationMinutes"
                  type="number"
                  min="30" // Minimum duration should align with your booking interval
                  step="1"
                  className={inputClass}
                  placeholder="e.g., 60 (Minimum one hour)"
                  {...register('durationMinutes', { 
                        required: 'Duration is required', 
                        valueAsNumber: true,
                        min: { value: 30, message: "Minimum duration must be 30 minutes."}
                    })}
                />
                <p className='mt-1 text-xs text-slate-500 dark:text-slate-400'>
                    This sets the minimum time customers must book this service for.
                </p>
                {errors.durationMinutes && <p className={errorClass}>{errors.durationMinutes.message}</p>}
              </div>
            </div>
            
            {/* Active Status */}
             <div className="flex items-center pt-2">
                <input
                    id="isActive"
                    type="checkbox"
                    className="h-4 w-4 text-teal-600 border-slate-300 dark:border-slate-600 rounded focus:ring-teal-500"
                    {...register('isActive')}
                />
                <label htmlFor="isActive" className="ml-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Service is Active (Visible to customers)
                </label>
            </div>
            
          </div>

          {/* Modal Footer */}
          <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 disabled:opacity-50 transition duration-150 flex items-center"
            >
              {isSubmitting ? 'Saving...' : <><FaSave className='mr-2' /> {isEditing ? 'Save Changes' : 'Create Service'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceForm;