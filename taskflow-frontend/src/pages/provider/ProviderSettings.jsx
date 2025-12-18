import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FaSave, FaMapMarkerAlt, FaCalendarAlt, FaUserEdit } from 'react-icons/fa'; // FaInfoCircle is no longer needed
import { coreApi } from '../../api/serviceApi';
import { toast } from 'react-toastify';

/**
 * @desc Redesigned component for Providers to update their profile (with Dark Mode).
 */
const ProviderSettings = ({ roleProfile, user, onUpdate }) => {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();
  const [categories, setCategories] = useState([]);
  
  // Define reusable Tailwind classes
  const labelClass = "block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2";
  const inputClass = "w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg shadow-sm text-sm p-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500";
  const errorClass = "mt-1 text-sm text-red-600";
  const sectionTitleClass = "text-2xl font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2 mb-4 flex items-center";

  useEffect(() => {
    // Load categories from API
    const fetchCategories = async () => {
      try {
        const res = await coreApi.getCategories();
        setCategories(res.data.data);
      } catch (error) {
        toast.error('Could not load categories for selection.');
      }
    };
    fetchCategories();

    // Load default form values from current profile
    if (roleProfile) {
      reset({
          businessName: roleProfile.businessName,
          description: roleProfile.description,
          phone: user.phone || '', // Get phone from base user
          addressLine: roleProfile.address?.line || '',
          addressCity: roleProfile.address?.city_district || '', // Adjusted field name for consistency
          addressState: roleProfile.address?.state || '',
          addressPincode: roleProfile.address?.pincode || '',
          // GEO-SEARCH REMOVAL: Removed lng and lat default values
          categories: roleProfile.categories.map(cat => cat._id), // Set default categories
      });
    }
  }, [roleProfile, user, reset]);

  const onSubmit = async (data) => {
    const updateData = {
        businessName: data.businessName,
        description: data.description,
        // NOTE: phone is updated on the User model below
        categories: data.categories,
        address: {
            house_name: data.addressLine, // Mapping old addressLine to new house_name
            street_address: data.addressCity, // Mapping old addressCity to new street_address (needs manual check)
            city_district: data.addressCity, 
            state: data.addressState,
            pincode: data.addressPincode,
        },
        // GEO-SEARCH REMOVAL: Removed the entire 'location' field update
        // TODO: Add availability update logic here
    };
    
    try {
      // 1. Update Provider Profile (includes businessName, address, categories)
      await coreApi.updateProviderProfile(roleProfile._id, updateData);
      // 2. Update Base User (for phone)
      await coreApi.updateUser(user._id, { phone: data.phone });
      
      toast.success('Profile updated successfully!');
      onUpdate(); // Trigger context update to refresh roleProfile
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile.');
    }
  };

  // Fallback loading state for stability
  if (!roleProfile) {
    return (
        <div className="p-10 text-center text-teal-600 dark:text-teal-400">
            Loading business profile settings...
        </div>
    );
  }


  return (
    <div className='max-w-4xl'>
      <h2 className={sectionTitleClass}>
          <FaUserEdit className='mr-3 text-teal-600 dark:text-teal-400' /> Profile Settings
      </h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Business Name */}
        <div>
            <label htmlFor="businessName" className={labelClass}>Business Name</label>
            <input id="businessName" type="text" className={inputClass} {...register('businessName', { required: 'Business name is required' })} />
            {errors.businessName && <p className={errorClass}>{errors.businessName.message}</p>}
        </div>
        
        {/* Phone */}
        <div>
            <label htmlFor="phone" className={labelClass}>Public Phone Number</label>
            <input id="phone" type="tel" className={inputClass} {...register('phone')} />
        </div>

        {/* Description */}
        <div>
            <label htmlFor="description" className={labelClass}>Public Description (Max 500 chars)</label>
            <textarea id="description" rows="4" className={inputClass} {...register('description', { required: 'Description is required', maxLength: 500 })} />
            {errors.description && <p className={errorClass}>{errors.description.message}</p>}
        </div>

        {/* Categories */}
        <div>
          <label className={labelClass}>Categories You Serve (select all that apply)</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 border border-slate-300 dark:border-slate-600 rounded-lg max-h-40 overflow-y-auto">
            {categories.map(cat => (
              <label key={cat._id} className="flex items-center space-x-2 text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  value={cat._id}
                  {...register('categories')}
                  className="h-4 w-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                />
                <span>{cat.name}</span>
              </label>
            ))}
          </div>
        </div>
        
        <h3 className={`${sectionTitleClass} pt-4`}>
          <FaMapMarkerAlt className='mr-3 text-teal-600 dark:text-teal-400'/> Business Address
        </h3>

        {/* Address Fields */}
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
                <label htmlFor="addressLine" className={labelClass}>House Name/Street Address (Mapped to addressLine)</label>
                <input id="addressLine" type="text" className={inputClass} {...register('addressLine', { required: 'Address Line is required' })} />
                {errors.addressLine && <p className={errorClass}>{errors.addressLine.message}</p>}
            </div>
             <div>
                <label htmlFor="addressCity" className={labelClass}>City/District (Mapped to addressCity)</label>
                <input id="addressCity" type="text" className={inputClass} {...register('addressCity', { required: 'City is required' })} />
                {errors.addressCity && <p className={errorClass}>{errors.addressCity.message}</p>}
            </div>
        </div>
        <div className='grid grid-cols-2 gap-4'>
            <div>
                <label htmlFor="addressState" className={labelClass}>State/Province</label>
                <input id="addressState" type="text" className={inputClass} {...register('addressState')} />
            </div>
            <div>
                <label htmlFor="addressPincode" className={labelClass}>Pincode/Zip</label>
                <input id="addressPincode" type="text" className={inputClass} {...register('addressPincode')} />
            </div>
        </div>
        
        {/* GEO-COORDINATES REMOVAL: Entire section removed */}

        <h3 className={`${sectionTitleClass} pt-4`}>
          <FaCalendarAlt className='mr-3 text-teal-600 dark:text-teal-400'/> Availability & Schedule
        </h3>
        <p className='text-sm text-slate-500 dark:text-slate-400'>[This is a placeholder. Full availability editing will be added in a future update.]</p>
        
        {/* Submit Button */}
        <div className="pt-4">
            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 disabled:opacity-50 transition duration-150 flex justify-center items-center text-base"
            >
                {isSubmitting ? 'Saving...' : <><FaSave className='mr-2' /> Save Profile Changes</>}
            </button>
        </div>
      </form>
    </div>
  );
};

export default ProviderSettings;