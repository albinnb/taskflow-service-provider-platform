import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { coreApi } from '../../api/serviceApi';

// List of Indian states for the dropdown
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

/**
 * @desc AddressForm Component - Step 1 of Provider Onboarding
 * Handles address input and updates user profile via API
 * @param {Function} onSuccess - Callback function when address is saved
 */
const AddressForm = ({ onSuccess }) => {
    const [formData, setFormData] = useState({
        house_name: '',
        street_address: '',
        city_district: '',
        state: '',
        pincode: '',
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await coreApi.updateUserProfileAddress(formData);
            
            toast.success('Address saved successfully!');
            
            // Call the onSuccess callback instead of navigating
            if (onSuccess) {
                onSuccess(res.data);
            }

        } catch (error) {
            const msg = error.response?.data?.message || 'Failed to save address.';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                    Step 1: Service Address
                </h2>
                <p className="text-slate-600 dark:text-slate-300">
                    Please provide your service address details.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* House Name / Flat No */}
                <div>
                    <label htmlFor="house_name" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                        House Name / Flat No. *
                    </label>
                    <input
                        type="text"
                        name="house_name"
                        id="house_name"
                        value={formData.house_name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        placeholder="e.g., 123 Main St, Apt 4B"
                    />
                </div>

                {/* Street Address / Locality */}
                <div>
                    <label htmlFor="street_address" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                        Street Address / Locality *
                    </label>
                    <input
                        type="text"
                        name="street_address"
                        id="street_address"
                        value={formData.street_address}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        placeholder="e.g., Market Road, Downtown"
                    />
                </div>

                {/* City/District */}
                <div>
                    <label htmlFor="city_district" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                        City / District *
                    </label>
                    <input
                        type="text"
                        name="city_district"
                        id="city_district"
                        value={formData.city_district}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        placeholder="e.g., Mumbai, Bangalore"
                    />
                </div>

                {/* State */}
                <div>
                    <label htmlFor="state" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                        State *
                    </label>
                    <select
                        name="state"
                        id="state"
                        value={formData.state}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                        <option value="">Select State</option>
                        {INDIAN_STATES.map((state) => (
                            <option key={state} value={state}>{state}</option>
                        ))}
                    </select>
                </div>

                {/* Pincode */}
                <div>
                    <label htmlFor="pincode" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                        Pincode (6 digits) *
                    </label>
                    <input
                        type="text"
                        name="pincode"
                        id="pincode"
                        value={formData.pincode}
                        onChange={handleChange}
                        required
                        maxLength="6"
                        pattern="[0-9]{6}"
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        placeholder="e.g., 400001"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Saving Address...' : 'Continue to Step 2'}
                </button>
            </form>
        </div>
    );
};

export default AddressForm;
