import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FaSave, FaMapMarkerAlt, FaCalendarAlt, FaUserEdit, FaTrashAlt, FaPlus } from 'react-icons/fa'; // FaInfoCircle is no longer needed
import { coreApi } from '../../api/serviceApi';
import { toast } from 'react-toastify';

const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const buildEmptyWeek = () =>
  DAYS.map((day) => ({
    dayOfWeek: day,
    isAvailable: false,
    slots: [], // each slot: { startTime: '09:00', endTime: '17:00' }
  }));

/**
 * @desc Redesigned component for Providers to update their profile (with Dark Mode).
 */
const ProviderSettings = ({ roleProfile, user, onUpdate }) => {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();
  const [categories, setCategories] = useState([]);
  const [availabilityDays, setAvailabilityDays] = useState(buildEmptyWeek());
  const [bufferTime, setBufferTime] = useState(0);
  const [loadingAvailability, setLoadingAvailability] = useState(true);
  
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

    // Load availability for the logged-in provider
    const fetchAvailability = async () => {
      try {
        const res = await coreApi.getMyAvailability();
        const { days = [], bufferTime: apiBuffer = 0 } = res.data.data || {};

        const byDay = new Map(days.map((d) => [d.dayOfWeek, d]));
        const normalized = DAYS.map((day) => {
          const existing = byDay.get(day);
          if (existing) {
            return {
              dayOfWeek: existing.dayOfWeek,
              isAvailable: !!existing.isAvailable,
              slots: Array.isArray(existing.slots) ? existing.slots : [],
            };
          }
          return {
            dayOfWeek: day,
            isAvailable: false,
            slots: [],
          };
        });

        setAvailabilityDays(normalized);
        setBufferTime(apiBuffer);
      } catch (error) {
        // If there's no availability yet or an error occurs, keep defaults silently
      } finally {
        setLoadingAvailability(false);
      }
    };

    if (user?.role === 'provider') {
      fetchAvailability();
    }
  }, [roleProfile, user, reset]);

  const handleToggleDay = (dayIndex) => {
    setAvailabilityDays((prev) =>
      prev.map((day, idx) =>
        idx === dayIndex ? { ...day, isAvailable: !day.isAvailable } : day
      )
    );
  };

  const handleAddSlot = (dayIndex) => {
    setAvailabilityDays((prev) =>
      prev.map((day, idx) =>
        idx === dayIndex
          ? {
              ...day,
              slots: [
                ...day.slots,
                { startTime: '09:00', endTime: '17:00' },
              ],
            }
          : day
      )
    );
  };

  const handleSlotChange = (dayIndex, slotIndex, field, value) => {
    setAvailabilityDays((prev) =>
      prev.map((day, idx) => {
        if (idx !== dayIndex) return day;
        const updatedSlots = day.slots.map((slot, sIdx) =>
          sIdx === slotIndex ? { ...slot, [field]: value } : slot
        );
        return { ...day, slots: updatedSlots };
      })
    );
  };

  const handleRemoveSlot = (dayIndex, slotIndex) => {
    setAvailabilityDays((prev) =>
      prev.map((day, idx) => {
        if (idx !== dayIndex) return day;
        const updatedSlots = day.slots.filter((_, sIdx) => sIdx !== slotIndex);
        return { ...day, slots: updatedSlots };
      })
    );
  };

  const handleBufferTimeChange = (e) => {
    const value = e.target.value;
    setBufferTime(value === '' ? 0 : Number(value));
  };

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
    };

    const availabilityPayload = {
      bufferTime,
      days: availabilityDays,
    };
    
    try {
      // 1. Update Provider Profile (includes businessName, address, categories)
      await coreApi.updateProviderProfile(roleProfile._id, updateData);
      // 2. Update Availability (provider self-service)
      await coreApi.updateMyAvailability(availabilityPayload);
      
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
        <div className="space-y-4">
          {/* Buffer Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div className="sm:col-span-1">
              <label className={labelClass} htmlFor="bufferTime">
                Buffer Time (Minutes)
              </label>
              <input
                id="bufferTime"
                type="number"
                min="0"
                value={bufferTime}
                onChange={handleBufferTimeChange}
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2 text-sm text-slate-500 dark:text-slate-400">
              Add a small gap between back-to-back bookings to avoid overlaps and give yourself breathing room.
            </div>
          </div>

          {loadingAvailability ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Loading your current availability...
            </p>
          ) : (
            <div className="space-y-3">
              {availabilityDays.map((day, dayIndex) => (
                <div
                  key={day.dayOfWeek}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/70 shadow-sm p-4 space-y-3"
                >
                  {/* Day header with toggle */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        {day.dayOfWeek}
                      </span>
                      {!day.isAvailable && (
                        <span className="text-xs rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-slate-500 dark:text-slate-400">
                          Not available
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleDay(dayIndex)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-50
                        ${day.isAvailable ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}
                      `}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200
                          ${day.isAvailable ? 'translate-x-5' : 'translate-x-0'}
                        `}
                      />
                    </button>
                  </div>

                  {/* Time slots */}
                  {day.isAvailable && (
                    <div className="space-y-3">
                      {day.slots.length === 0 && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          No time slots added yet. Use &quot;Add Slot&quot; to define your working hours for this day.
                        </p>
                      )}
                      {day.slots.map((slot, slotIndex) => (
                        <div
                          key={slotIndex}
                          className="flex flex-col sm:flex-row gap-3 sm:items-end"
                        >
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                              Start Time
                            </label>
                            <input
                              type="time"
                              value={slot.startTime || ''}
                              onChange={(e) =>
                                handleSlotChange(
                                  dayIndex,
                                  slotIndex,
                                  'startTime',
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                              End Time
                            </label>
                            <input
                              type="time"
                              value={slot.endTime || ''}
                              onChange={(e) =>
                                handleSlotChange(
                                  dayIndex,
                                  slotIndex,
                                  'endTime',
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                            />
                          </div>
                          <div className="flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => handleRemoveSlot(dayIndex, slotIndex)}
                              className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium shadow-sm transition-colors"
                            >
                              <FaTrashAlt className="mr-1" />
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => handleAddSlot(dayIndex)}
                        className="inline-flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                      >
                        <FaPlus className="mr-1" />
                        Add Slot
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
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