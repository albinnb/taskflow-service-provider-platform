import React from 'react';
import { FaCheckCircle } from 'react-icons/fa';

/**
 * @desc ServicesSetupForm Component - Step 3 of Provider Onboarding
 * Final step - confirmation and completion
 * @param {Function} onSuccess - Callback function when user confirms completion
 */
const ServicesSetupForm = ({ onSuccess }) => {
    const handleComplete = () => {
        if (onSuccess) {
            onSuccess();
        }
    };

    return (
        <div className="w-full">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                    Step 3: Setup Complete
                </h2>
                <p className="text-slate-600 dark:text-slate-300">
                    Your basic profile setup is complete!
                </p>
            </div>

            <div className="space-y-6">
                {/* Success Message */}
                <div className="p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-start gap-3">
                        <FaCheckCircle className="text-green-600 dark:text-green-400 text-2xl mt-1" />
                        <div>
                            <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                                Great! You're all set up.
                            </h3>
                            <p className="text-green-700 dark:text-green-300">
                                You can now access your provider dashboard and start managing your services, availability, and bookings.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Next Steps */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-slate-800 dark:text-white">
                        What's Next?
                    </h3>
                    <ul className="space-y-3 text-slate-700 dark:text-slate-300">
                        <li className="flex gap-3">
                            <span className="text-teal-600 dark:text-teal-400 font-bold">1.</span>
                            <span>Add your services in the provider dashboard</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="text-teal-600 dark:text-teal-400 font-bold">2.</span>
                            <span>Set competitive pricing for your services</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="text-teal-600 dark:text-teal-400 font-bold">3.</span>
                            <span>Get verified by our admin team</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="text-teal-600 dark:text-teal-400 font-bold">4.</span>
                            <span>Start accepting bookings from customers</span>
                        </li>
                    </ul>
                </div>

                {/* Action Button */}
                <button
                    onClick={handleComplete}
                    className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors duration-300"
                >
                    Go to Provider Dashboard
                </button>
            </div>
        </div>
    );
};

export default ServicesSetupForm;
