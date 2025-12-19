import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FaTimes, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaHome, FaCity, FaAddressCard } from 'react-icons/fa';
import LocationPicker from '../common/LocationPicker';
import { coreApi } from '../../api/serviceApi';
import { toast } from 'react-toastify';

// List of Indian states for the dropdown (for simplicity)
const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
    "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
    "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
    "West Bengal",
    // Union Territories
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

const EditProfileModal = ({ isOpen, onClose, user, onUpdate }) => {
    const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm();
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [initialLocation, setInitialLocation] = useState(null);

    useEffect(() => {
        if (user) {
            reset({
                name: user.name,
                email: user.email,
                phone: user.phone || '',
                house_name: user.address?.house_name || '',
                street_address: user.address?.street_address || '',
                city_district: user.address?.city_district || '',
                state: user.address?.state || '',
                pincode: user.address?.pincode || ''
            });

            if (user.location && user.location.coordinates) {
                setInitialLocation({
                    lat: user.location.coordinates[1],
                    lng: user.location.coordinates[0],
                    address: user.location.formattedAddress
                });
            }
        }
    }, [user, reset]);

    const handleLocationChange = (locationData) => {
        setSelectedLocation(locationData);
        // Auto-fill address fields
        setValue('street_address', locationData.street || locationData.fullAddress || '');
        setValue('city_district', locationData.city || '');
        setValue('pincode', locationData.pincode || '');
        if (locationData.houseName) setValue('house_name', locationData.houseName);

        if (locationData.state) {
            const matchedState = INDIAN_STATES.find(s => s.toLowerCase() === locationData.state.toLowerCase());
            if (matchedState) {
                setValue('state', matchedState);
            }
        }
    };

    if (!isOpen) return null;

    const onSubmit = async (data) => {
        try {
            // 1. Update Basic Profile
            const profileData = {
                name: data.name,
                email: data.email,
                phone: data.phone
            };
            await coreApi.updateUserProfile(profileData);

            // 2. Update Address & Location
            const addressData = {
                house_name: data.house_name,
                street_address: data.street_address,
                city_district: data.city_district,
                state: data.state,
                pincode: data.pincode,
                location: selectedLocation ? {
                    coordinates: [selectedLocation.coordinates.lng, selectedLocation.coordinates.lat],
                    formattedAddress: selectedLocation.fullAddress
                } : undefined
            };
            await coreApi.updateUserProfileAddress(addressData);

            toast.success("Profile updated successfully!");
            onUpdate({ ...user, ...profileData, address: addressData, location: addressData.location ? addressData.location : user.location }); // Optimistic update / trigger refresh
            onClose();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to update profile");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl overflow-hidden relative animation-fade-in user-select-none my-8">

                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Edit Profile</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition">
                        <FaTimes />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaUser className="text-slate-400" />
                            </div>
                            <input
                                type="text"
                                className="pl-10 w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                {...register('name', { required: 'Name is required' })}
                            />
                        </div>
                        {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaEnvelope className="text-slate-400" />
                            </div>
                            <input
                                type="email"
                                className="pl-10 w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: "Invalid email" } })}
                            />
                        </div>
                        {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaPhone className="text-slate-400" />
                            </div>
                            <input
                                type="tel"
                                className="pl-10 w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                placeholder="e.g. 9876543210"
                                {...register('phone', { required: 'Phone is required', pattern: { value: /^[0-9+\s-]{10,}$/, message: "Invalid phone number" } })}
                            />
                        </div>
                        {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone.message}</p>}
                    </div>

                    <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                        <h4 className="text-md font-semibold text-slate-800 dark:text-white mb-3 flex items-center">
                            <FaMapMarkerAlt className="mr-2 text-teal-600" /> Address & Location
                        </h4>

                        <div className="mb-4">
                            <LocationPicker value={initialLocation} onChange={handleLocationChange} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* House Name */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">House Name / Flat No.</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaHome className="text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        className="pl-10 w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                        {...register('house_name', { required: 'House Name is required' })}
                                    />
                                </div>
                                {errors.house_name && <p className="text-xs text-red-600 mt-1">{errors.house_name.message}</p>}
                            </div>

                            {/* Street Address */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Street / Locality</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaAddressCard className="text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        className="pl-10 w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                        {...register('street_address', { required: 'Street Address is required' })}
                                    />
                                </div>
                                {errors.street_address && <p className="text-xs text-red-600 mt-1">{errors.street_address.message}</p>}
                            </div>

                            {/* City */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">City / District</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaCity className="text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        className="pl-10 w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                        {...register('city_district', { required: 'City is required' })}
                                    />
                                </div>
                                {errors.city_district && <p className="text-xs text-red-600 mt-1">{errors.city_district.message}</p>}
                            </div>

                            {/* State */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">State</label>
                                <select
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                    {...register('state', { required: 'State is required' })}
                                >
                                    <option value="">Select State</option>
                                    {INDIAN_STATES.map((state) => (
                                        <option key={state} value={state}>{state}</option>
                                    ))}
                                </select>
                                {errors.state && <p className="text-xs text-red-600 mt-1">{errors.state.message}</p>}
                            </div>

                            {/* Pincode */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pincode</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                    maxLength="6"
                                    {...register('pincode', { required: 'Pincode is required', pattern: { value: /^[0-9]{6}$/, message: "Must be 6 digits" } })}
                                />
                                {errors.pincode && <p className="text-xs text-red-600 mt-1">{errors.pincode.message}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-50 transition shadow-sm"
                        >
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProfileModal;
