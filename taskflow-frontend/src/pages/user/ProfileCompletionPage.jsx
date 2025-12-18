import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from '../../context/AuthContext';
import { coreApi } from '../../api/serviceApi'; // Use the coreApi to update the profile

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

const ProfileCompletionPage = () => {
    const { user, isAuthenticated, isProfileComplete, setIsProfileComplete } = useContext(AuthContext);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        house_name: '',
        street_address: '',
        city_district: '',
        state: '',
        pincode: '',
    });
    const [loading, setLoading] = useState(false);

    // Redirect already completed users or unauthenticated users
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        } else if (isProfileComplete && user) {
            // Redirect to appropriate dashboard if profile is complete
            if (user.role === 'customer') {
                navigate('/dashboard/customer');
            } else if (user.role === 'provider') {
                navigate('/dashboard/provider');
            } else {
                navigate('/');
            }
        }
    }, [isAuthenticated, isProfileComplete, user, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await coreApi.updateUserProfileAddress(formData);
            
            // 1. Update Context State
            setIsProfileComplete(res.data.isProfileComplete); // Should be true
            toast.success('Profile complete! Welcome to TaskFlow.');

            // 2. Redirect based on user role
            if (user.role === 'customer') {
                navigate('/dashboard/customer');
            } else if (user.role === 'provider') {
                // Providers may need extra steps later, but for now, dashboard
                navigate('/dashboard/provider');
            } else {
                navigate('/');
            }

        } catch (error) {
            const msg = error.response?.data?.message || 'Failed to save address.';
            toast.error(msg);
            setLoading(false);
        }
    };

    // If the user's profile is already complete, we show nothing while redirecting
    if (!user || loading || isProfileComplete) {
        return <div className="p-4 text-center">Loading or Redirecting...</div>;
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
            <div className="w-full max-w-lg bg-white p-8 rounded-xl shadow-2xl">
                <h2 className="text-3xl font-bold text-center text-indigo-700 mb-2">
                    Complete Your Profile
                </h2>
                <p className="text-center text-gray-500 mb-8">
                    Please provide your service address details to start booking and providing services in your area.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* House Name / Flat No */}
                    <div>
                        <label htmlFor="house_name" className="block text-sm font-medium text-gray-700">
                            House Name / Flat No.
                        </label>
                        <input
                            type="text"
                            name="house_name"
                            id="house_name"
                            value={formData.house_name}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    {/* Street Address / Locality */}
                    <div>
                        <label htmlFor="street_address" className="block text-sm font-medium text-gray-700">
                            Street Address / Locality
                        </label>
                        <input
                            type="text"
                            name="street_address"
                            id="street_address"
                            value={formData.street_address}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    {/* City/District */}
                    <div>
                        <label htmlFor="city_district" className="block text-sm font-medium text-gray-700">
                            City / District
                        </label>
                        <input
                            type="text"
                            name="city_district"
                            id="city_district"
                            value={formData.city_district}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    {/* State */}
                    <div>
                        <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                            State
                        </label>
                        <select
                            name="state"
                            id="state"
                            value={formData.state}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full border border-gray-300 bg-white rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="">Select State</option>
                            {INDIAN_STATES.map((state) => (
                                <option key={state} value={state}>{state}</option>
                            ))}
                        </select>
                    </div>

                    {/* Pincode */}
                    <div>
                        <label htmlFor="pincode" className="block text-sm font-medium text-gray-700">
                            Pincode (6 digits)
                        </label>
                        <input
                            type="text"
                            name="pincode"
                            id="pincode"
                            value={formData.pincode}
                            onChange={handleChange}
                            required
                            maxLength="6"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save Address & Continue'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProfileCompletionPage;