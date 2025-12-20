import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FaTimes, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaHome, FaCity, FaAddressCard } from 'react-icons/fa';
import LocationPicker from '../common/LocationPicker';
import { coreApi } from '../../api/serviceApi';
import { toast } from 'react-toastify';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

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
    const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm();
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [initialLocation, setInitialLocation] = useState(null);

    // Semantic classes
    const labelClass = "block text-sm font-semibold text-foreground mb-2";
    const inputClass = "w-full border border-input bg-background text-foreground rounded-lg shadow-sm text-sm p-2.5 focus:ring-2 focus:ring-primary focus:border-primary";
    const errorClass = "mt-1 text-sm text-destructive";

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
            onUpdate({ ...user, ...profileData, address: addressData, location: addressData.location ? addressData.location : user.location });
            onClose();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to update profile");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden relative animation-fade-in my-8">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-border bg-muted/20">
                    <h3 className="text-xl font-bold text-foreground">Edit Profile</h3>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6 overflow-y-auto">

                    {/* Name */}
                    <div>
                        <label className={labelClass}>Full Name</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaUser className="text-muted-foreground" />
                            </div>
                            <input
                                type="text"
                                className={`pl-10 ${inputClass}`}
                                {...register('name', { required: 'Name is required' })}
                            />
                        </div>
                        {errors.name && <p className={errorClass}>{errors.name.message}</p>}
                    </div>

                    {/* Email */}
                    <div>
                        <label className={labelClass}>Email Address</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaEnvelope className="text-muted-foreground" />
                            </div>
                            <input
                                type="email"
                                className={`pl-10 ${inputClass}`}
                                {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: "Invalid email" } })}
                            />
                        </div>
                        {errors.email && <p className={errorClass}>{errors.email.message}</p>}
                    </div>

                    {/* Phone */}
                    <div>
                        <label className={labelClass}>Phone Number</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaPhone className="text-muted-foreground" />
                            </div>
                            <input
                                type="tel"
                                className={`pl-10 ${inputClass}`}
                                placeholder="e.g. +91 9876543210"
                                {...register('phone', { required: 'Phone is required', pattern: { value: /^[0-9+\s-]{10,}$/, message: "Invalid phone number" } })}
                            />
                        </div>
                        {errors.phone && <p className={errorClass}>{errors.phone.message}</p>}
                    </div>

                    <div className="border-t border-border pt-6">
                        <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                            <FaMapMarkerAlt className="mr-2 text-primary" /> Address & Location
                        </h4>

                        <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-border">
                            <p className="text-sm text-muted-foreground mb-2">Search and select your location on the map to auto-fill details.</p>
                            <LocationPicker value={initialLocation} onChange={handleLocationChange} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* House Name */}
                            <div>
                                <label className={labelClass}>House Name / Flat No.</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaHome className="text-muted-foreground" />
                                    </div>
                                    <input
                                        type="text"
                                        className={`pl-10 ${inputClass}`}
                                        {...register('house_name', { required: 'House Name is required' })}
                                    />
                                </div>
                                {errors.house_name && <p className={errorClass}>{errors.house_name.message}</p>}
                            </div>

                            {/* Street Address */}
                            <div>
                                <label className={labelClass}>Street / Locality</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaAddressCard className="text-muted-foreground" />
                                    </div>
                                    <input
                                        type="text"
                                        className={`pl-10 ${inputClass}`}
                                        {...register('street_address', { required: 'Street Address is required' })}
                                    />
                                </div>
                                {errors.street_address && <p className={errorClass}>{errors.street_address.message}</p>}
                            </div>

                            {/* City */}
                            <div>
                                <label className={labelClass}>City / District</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaCity className="text-muted-foreground" />
                                    </div>
                                    <input
                                        type="text"
                                        className={`pl-10 ${inputClass}`}
                                        {...register('city_district', { required: 'City is required' })}
                                    />
                                </div>
                                {errors.city_district && <p className={errorClass}>{errors.city_district.message}</p>}
                            </div>

                            {/* State */}
                            <div>
                                <label className={labelClass}>State</label>
                                <select
                                    className={inputClass}
                                    {...register('state', { required: 'State is required' })}
                                >
                                    <option value="">Select State</option>
                                    {INDIAN_STATES.map((state) => (
                                        <option key={state} value={state}>{state}</option>
                                    ))}
                                </select>
                                {errors.state && <p className={errorClass}>{errors.state.message}</p>}
                            </div>

                            {/* Pincode */}
                            <div>
                                <label className={labelClass}>Pincode</label>
                                <input
                                    type="text"
                                    className={inputClass}
                                    maxLength="6"
                                    {...register('pincode', { required: 'Pincode is required', pattern: { value: /^[0-9]{6}$/, message: "Must be 6 digits" } })}
                                />
                                {errors.pincode && <p className={errorClass}>{errors.pincode.message}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-border">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProfileModal;
