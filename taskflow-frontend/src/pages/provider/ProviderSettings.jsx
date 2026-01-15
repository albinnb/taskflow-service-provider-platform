import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FaSave, FaMapMarkerAlt, FaCalendarAlt, FaUserEdit, FaTrashAlt, FaPlus, FaExclamationTriangle } from 'react-icons/fa';
import { coreApi, authApi } from '../../api/serviceApi';
import useAuth from '../../hooks/useAuth';
import { toast } from 'react-toastify';
import LocationPicker from '../../components/common/LocationPicker';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/Button';

const DAYS = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];

const buildEmptyWeek = () =>
  DAYS.map((day) => ({
    dayOfWeek: day,
    isAvailable: false,
    slots: [],
  }));

const ProviderSettings = ({ roleProfile, user, onUpdate }) => {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();
  const { logout } = useAuth();

  const [availabilityDays, setAvailabilityDays] = useState(buildEmptyWeek());
  const [bufferTime, setBufferTime] = useState(0);
  const [loadingAvailability, setLoadingAvailability] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);

  // Semantic classes
  const labelClass = "block text-sm font-semibold text-foreground mb-2";
  const inputClass = "w-full border border-input bg-background text-foreground rounded-lg shadow-sm text-sm p-2.5 focus:ring-2 focus:ring-primary focus:border-primary";
  const errorClass = "mt-1 text-sm text-destructive";
  const sectionTitleClass = "text-2xl font-bold text-foreground border-b border-border pb-2 mb-4 flex items-center";

  useEffect(() => {


    if (roleProfile) {
      reset({
        businessName: roleProfile.businessName,
        description: roleProfile.description,


      });

      if (roleProfile.location && roleProfile.location.coordinates) {
        setCurrentLocation({
          lat: roleProfile.location.coordinates[1],
          lng: roleProfile.location.coordinates[0],
          address: roleProfile.location.formattedAddress
        });
      }
    }

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
          return { dayOfWeek: day, isAvailable: false, slots: [] };
        });
        setAvailabilityDays(normalized);
        setBufferTime(apiBuffer);
      } catch (error) {
        // Silent fail
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
          ? { ...day, slots: [...day.slots, { startTime: '09:00', endTime: '17:00' }] }
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

  const onSubmit = async (data) => {
    const updateData = {
      businessName: data.businessName,
      description: data.description,
      phone: data.phone,

      location: (currentLocation?.coordinates || (currentLocation?.lat && currentLocation?.lng)) ? {
        type: 'Point',
        coordinates: currentLocation.coordinates
          ? [currentLocation.coordinates.lng, currentLocation.coordinates.lat]
          : [currentLocation.lng, currentLocation.lat],
        formattedAddress: currentLocation.fullAddress || currentLocation.address
      } : undefined,
      address: {
        city_district: currentLocation?.city || '',
        street_address: currentLocation?.fullAddress || ''
      },
    };

    const availabilityPayload = {
      bufferTime,
      days: availabilityDays,
    };

    try {
      await coreApi.updateProviderProfile(roleProfile._id, updateData);
      await coreApi.updateMyAvailability(availabilityPayload);
      toast.success('Profile updated successfully!');
      onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile.');
    }
  };

  if (!roleProfile) return <div className="p-10 text-center text-muted-foreground">Loading profile...</div>;

  return (
    <div className='max-w-4xl'>
      <h2 className={sectionTitleClass}>
        <FaUserEdit className='mr-3 text-primary' /> Profile Settings
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
          <input id="phone" type="tel" className={inputClass} placeholder="e.g. +91 9876543210" {...register('phone')} />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className={labelClass}>Public Description (Max 500 chars)</label>
          <textarea id="description" rows="4" className={inputClass} {...register('description', { required: 'Description is required', maxLength: 500 })} />
          {errors.description && <p className={errorClass}>{errors.description.message}</p>}
        </div>



        {/* Location Picker */}
        <h3 className={`${sectionTitleClass} pt-4`}>
          <FaMapMarkerAlt className='mr-3 text-primary' /> Business Location
        </h3>
        <div className="bg-card p-4 rounded-xl border border-border">
          <LocationPicker
            value={currentLocation}
            onChange={(loc) => setCurrentLocation(loc)}
          />
        </div>

        {/* Availability */}
        <h3 className={`${sectionTitleClass} pt-4`}>
          <FaCalendarAlt className='mr-3 text-primary' /> Availability & Schedule
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div className="sm:col-span-1">
              <label className={labelClass} htmlFor="bufferTime">Buffer Time (Minutes)</label>
              <input
                id="bufferTime"
                type="number"
                min="0"
                value={bufferTime}
                onChange={(e) => setBufferTime(Number(e.target.value))}
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2 text-sm text-muted-foreground">
              Gap between bookings to avoid overlap.
            </div>
          </div>

          {loadingAvailability ? (
            <p className="text-sm text-muted-foreground">Loading availability...</p>
          ) : (
            <div className="space-y-3">
              {availabilityDays.map((day, dayIndex) => (
                <div key={day.dayOfWeek} className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{day.dayOfWeek}</span>
                      {!day.isAvailable && (
                        <span className="text-xs rounded-full bg-muted px-2 py-0.5 text-muted-foreground">Not available</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleDay(dayIndex)}
                      className={cn(
                        "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                        day.isAvailable ? 'bg-primary' : 'bg-muted'
                      )}
                    >
                      <span className={cn(
                        "inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200",
                        day.isAvailable ? 'translate-x-5' : 'translate-x-0'
                      )} />
                    </button>
                  </div>

                  {day.isAvailable && (
                    <div className="space-y-3 pl-2 sm:pl-0">
                      {day.slots.length === 0 && (
                        <p className="text-xs text-muted-foreground">No time slots added.</p>
                      )}
                      {day.slots.map((slot, slotIndex) => (
                        <div key={slotIndex} className="flex flex-col sm:flex-row gap-3 sm:items-end">
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-muted-foreground mb-1">Start</label>
                            <input
                              type="time"
                              value={slot.startTime}
                              onChange={(e) => handleSlotChange(dayIndex, slotIndex, 'startTime', e.target.value)}
                              className={inputClass}
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-muted-foreground mb-1">End</label>
                            <input
                              type="time"
                              value={slot.endTime}
                              onChange={(e) => handleSlotChange(dayIndex, slotIndex, 'endTime', e.target.value)}
                              className={inputClass}
                            />
                          </div>
                          <div className="flex-shrink-0 pb-1">
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemoveSlot(dayIndex, slotIndex)}
                            >
                              <FaTrashAlt className="mr-1" /> Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary/80 hover:bg-primary/10 pl-0"
                        onClick={() => handleAddSlot(dayIndex)}
                      >
                        <FaPlus className="mr-1" /> Add Slot
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full text-lg font-bold py-6 text-primary-foreground"
          >
            {isSubmitting ? 'Saving...' : <><FaSave className='mr-2' /> Save Profile Changes</>}
          </Button>
        </div>
      </form>


      <div className="mt-10 pt-10 border-t border-destructive/20">
        <h3 className="text-xl font-bold text-destructive mb-4 flex items-center">
          <FaExclamationTriangle className="mr-2" /> Danger Zone
        </h3>
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-destructive">Delete Provider Account</p>
            <p className="text-sm text-muted-foreground mt-1">
              Once you delete your account, there is no going back. All your services, profile data, reviews, and messages will be permanently removed.
            </p>
          </div>
          <Button
            variant="destructive"
            onClick={async () => {
              if (window.confirm('Are you absolutely sure you want to delete your account? This action cannot be undone.')) {
                try {
                  await authApi.deleteAccount();
                  toast.success('Account deleted successfully.');
                  logout();
                } catch (error) {
                  toast.error(error.response?.data?.message || 'Failed to delete account.');
                }
              }
            }}
          >
            Delete Account
          </Button>
        </div>
      </div>
    </div >
  );
};

export default ProviderSettings;