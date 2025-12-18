import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { coreApi } from '../../api/serviceApi';

const DAYS_OF_WEEK = [
    { id: 0, name: 'Monday' },
    { id: 1, name: 'Tuesday' },
    { id: 2, name: 'Wednesday' },
    { id: 3, name: 'Thursday' },
    { id: 4, name: 'Friday' },
    { id: 5, name: 'Saturday' },
    { id: 6, name: 'Sunday' },
];

/**
 * @desc AvailabilityAndScheduleForm Component - Step 2 of Provider Onboarding
 * Allows providers to set their working hours and availability
 * @param {string} providerId - The provider ID to update
 * @param {Function} onSuccess - Callback function when availability is saved
 */
const AvailabilityAndScheduleForm = ({ providerId, onSuccess }) => {
    const [availability, setAvailability] = useState([
        { dayOfWeek: 0, slots: [{ from: '09:00', to: '17:00' }] },
        { dayOfWeek: 1, slots: [{ from: '09:00', to: '17:00' }] },
        { dayOfWeek: 2, slots: [{ from: '09:00', to: '17:00' }] },
        { dayOfWeek: 3, slots: [{ from: '09:00', to: '17:00' }] },
        { dayOfWeek: 4, slots: [{ from: '09:00', to: '17:00' }] },
        { dayOfWeek: 5, slots: [{ from: '10:00', to: '14:00' }] },
        { dayOfWeek: 6, slots: [{ from: '10:00', to: '14:00' }] },
    ]);
    const [loading, setLoading] = useState(false);

    const handleSlotChange = (dayIndex, slotIndex, field, value) => {
        const newAvailability = [...availability];
        newAvailability[dayIndex].slots[slotIndex][field] = value;
        setAvailability(newAvailability);
    };

    const addSlot = (dayIndex) => {
        const newAvailability = [...availability];
        newAvailability[dayIndex].slots.push({ from: '09:00', to: '17:00' });
        setAvailability(newAvailability);
    };

    const removeSlot = (dayIndex, slotIndex) => {
        const newAvailability = [...availability];
        if (newAvailability[dayIndex].slots.length > 1) {
            newAvailability[dayIndex].slots.splice(slotIndex, 1);
            setAvailability(newAvailability);
        } else {
            toast.warning('Each day must have at least one time slot.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await coreApi.updateProviderProfile(providerId, { availability });
            
            toast.success('Availability saved successfully!');
            
            if (onSuccess) {
                onSuccess(res.data);
            }

        } catch (error) {
            const msg = error.response?.data?.message || 'Failed to save availability.';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                    Step 2: Availability & Working Hours
                </h2>
                <p className="text-slate-600 dark:text-slate-300">
                    Set your working hours for each day of the week.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {availability.map((day, dayIndex) => (
                    <div key={day.dayOfWeek} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-3">
                            {DAYS_OF_WEEK[dayIndex].name}
                        </h3>

                        <div className="space-y-3">
                            {day.slots.map((slot, slotIndex) => (
                                <div key={slotIndex} className="flex gap-3 items-end">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                                            From
                                        </label>
                                        <input
                                            type="time"
                                            value={slot.from}
                                            onChange={(e) => handleSlotChange(dayIndex, slotIndex, 'from', e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                                        />
                                    </div>

                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                                            To
                                        </label>
                                        <input
                                            type="time"
                                            value={slot.to}
                                            onChange={(e) => handleSlotChange(dayIndex, slotIndex, 'to', e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                                        />
                                    </div>

                                    {day.slots.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeSlot(dayIndex, slotIndex)}
                                            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={() => addSlot(dayIndex)}
                            className="mt-3 text-sm text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-500 font-medium"
                        >
                            + Add Another Slot
                        </button>
                    </div>
                ))}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Saving Availability...' : 'Continue to Step 3'}
                </button>
            </form>
        </div>
    );
};

export default AvailabilityAndScheduleForm;
