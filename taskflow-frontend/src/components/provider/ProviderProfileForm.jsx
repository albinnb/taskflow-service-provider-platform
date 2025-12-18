import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import AddressForm from './AddressForm';
import AvailabilityAndScheduleForm from './AvailabilityAndScheduleForm';
import ServicesSetupForm from './ServicesSetupForm';

const STEPS = {
    ADDRESS: 1,
    AVAILABILITY: 2,
    SERVICES: 3,
};

/**
 * @desc ProviderProfileForm Component - Multi-step Provider Onboarding Container
 * Orchestrates the three-step onboarding flow for providers
 * @access Private/Provider
 */
const ProviderProfileForm = () => {
    const navigate = useNavigate();
    const { user, roleProfile, isAuthenticated } = useContext(AuthContext);
    const [currentStep, setCurrentStep] = useState(STEPS.ADDRESS);

    // Redirect if not authenticated or not a provider
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        } else if (user && user.role !== 'provider') {
            navigate('/');
        }
    }, [isAuthenticated, user, navigate]);

    // Handle Step 1 Completion
    const handleAddressSuccess = () => {
        setCurrentStep(STEPS.AVAILABILITY);
        window.scrollTo(0, 0);
    };

    // Handle Step 2 Completion
    const handleAvailabilitySuccess = () => {
        setCurrentStep(STEPS.SERVICES);
        window.scrollTo(0, 0);
    };

    // Handle Step 3 Completion
    const handleServicesSuccess = () => {
        // Redirect to provider dashboard
        navigate('/provider/dashboard');
    };

    // Show loading state while checking authentication
    if (!isAuthenticated || !user) {
        return <div className="p-10 text-center">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
                        Provider Profile Setup
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Complete your profile to start providing services
                    </p>
                </div>

                {/* Progress Indicator */}
                <div className="mb-8">
                    <div className="flex justify-between items-center">
                        {[STEPS.ADDRESS, STEPS.AVAILABILITY, STEPS.SERVICES].map((step, index) => (
                            <div key={step} className="flex items-center flex-1">
                                <div
                                    className={`flex items-center justify-center h-10 w-10 rounded-full font-semibold transition-all ${
                                        step <= currentStep
                                            ? 'bg-teal-600 text-white'
                                            : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                                    }`}
                                >
                                    {step}
                                </div>
                                {index < 2 && (
                                    <div
                                        className={`flex-1 h-1 mx-2 rounded transition-all ${
                                            step < currentStep
                                                ? 'bg-teal-600'
                                                : 'bg-slate-200 dark:bg-slate-700'
                                        }`}
                                    ></div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-3 text-sm">
                        <span className={`font-medium ${currentStep === STEPS.ADDRESS ? 'text-teal-600' : 'text-slate-600'}`}>
                            Address
                        </span>
                        <span className={`font-medium ${currentStep === STEPS.AVAILABILITY ? 'text-teal-600' : 'text-slate-600'}`}>
                            Availability
                        </span>
                        <span className={`font-medium ${currentStep === STEPS.SERVICES ? 'text-teal-600' : 'text-slate-600'}`}>
                            Complete
                        </span>
                    </div>
                </div>

                {/* Form Container */}
                <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl p-8 border border-slate-200 dark:border-slate-700">
                    {currentStep === STEPS.ADDRESS && (
                        <AddressForm onSuccess={handleAddressSuccess} />
                    )}

                    {currentStep === STEPS.AVAILABILITY && (
                        <AvailabilityAndScheduleForm
                            providerId={roleProfile?._id || user._id}
                            onSuccess={handleAvailabilitySuccess}
                        />
                    )}

                    {currentStep === STEPS.SERVICES && (
                        <ServicesSetupForm onSuccess={handleServicesSuccess} />
                    )}
                </div>

                {/* Back Button */}
                {currentStep > STEPS.ADDRESS && (
                    <div className="mt-6 text-center">
                        <button
                            onClick={() => setCurrentStep(currentStep - 1)}
                            className="text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-500 font-medium transition-colors"
                        >
                            ← Back to Previous Step
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProviderProfileForm;
