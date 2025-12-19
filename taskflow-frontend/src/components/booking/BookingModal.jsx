import React, { useState, forwardRef, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FaCalendarAlt, FaClock, FaDollarSign, FaTimes, FaCreditCard, FaPencilAlt, FaCheckCircle } from 'react-icons/fa';
import { useForm } from 'react-hook-form';
import useAuth from '../../hooks/useAuth';
import { coreApi } from '../../api/serviceApi';
import { toast } from 'react-toastify';

/**
 * @desc Custom styled input for DatePicker
 */
const CustomDatePickerInput = forwardRef(({ value, onClick, placeholder }, ref) => (
    <button
        type="button"
        className="w-full text-left input-field p-2.5 dark:bg-slate-700 dark:border-slate-600 dark:text-white rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 border border-slate-300"
        onClick={onClick}
        ref={ref}
    >
        {value || <span className="text-slate-400">{placeholder}</span>}
    </button>
));

// Define allowed duration options (start from service minimum, in 30-min increments)
const generateDurationOptions = (minDuration) => {
    const options = [];
    let current = Math.ceil(minDuration / 30) * 30; // Round up to nearest 30 min interval

    // Generate up to 5 hours (300 minutes) in 30-minute steps
    while (current <= 300) {
        const hours = Math.floor(current / 60);
        const minutes = current % 60;
        const display = `${hours > 0 ? `${hours} hr` : ''} ${minutes > 0 ? `${minutes} min` : ''}`.trim();
        options.push({ value: current, label: display });
        current += 30;
    }
    return options;
};

/**
 * @desc Redesigned Modal for booking with TaskRabbit logic and Razorpay Payment.
 */
const BookingModal = ({ service, provider, onClose }) => {
    const { isAuthenticated, user } = useAuth();
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedStartTime, setSelectedStartTime] = useState(null); // specific time string
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    // --- NEW: Duration State ---
    const [selectedDuration, setSelectedDuration] = useState(service.durationMinutes);

    const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm({
        defaultValues: {
            notes: '', // Task details
            durationMinutes: service.durationMinutes, // Default duration set to service minimum
        }
    });

    // Watch the duration field from the form
    const watchedDuration = watch('durationMinutes');

    // Calculate Total Price dynamically
    const totalPrice = useMemo(() => {
        const duration = watchedDuration || service.durationMinutes;
        const hours = duration / 60;
        // Price is the Hourly Rate
        return (service.price * hours).toFixed(2);
    }, [watchedDuration, service.price, service.durationMinutes]);

    // Generate options based on service's minimum duration
    const durationOptions = useMemo(() => generateDurationOptions(service.durationMinutes), [service.durationMinutes]);


    const checkAvailability = async (date) => {
        setSelectedDate(date);
        setSelectedStartTime(null);
        setAvailableSlots([]);

        // Recalculate slots if duration is changed and a date is already selected
        if (!watchedDuration) return;

        setLoadingSlots(true);

        try {
            // Format date manually to avoid timezone shifts (toISOString converts to UTC, potentially changing the day)
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const dateString = `${year}-${month}-${day}`;

            // --- FIX: Send Service ID and Duration ---
            const res = await coreApi.getProviderAvailability(provider._id, {
                date: dateString,
                serviceId: service._id,
                durationMinutes: watchedDuration,
            });
            setAvailableSlots(res.data.data);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to get availability. Check provider settings.');
        } finally {
            setLoadingSlots(false);
        }
    };

    // Rerun availability check if duration changes AND a date is already selected
    React.useEffect(() => {
        if (selectedDate && watchedDuration) {
            checkAvailability(selectedDate);
        }
    }, [watchedDuration]);


    const handleBookingRequest = async (formData) => {
        const finalDuration = formData.durationMinutes;

        if (!isAuthenticated) {
            toast.error('You must be logged in to create a booking.');
            return;
        }
        if (!selectedDate || !selectedStartTime) {
            toast.error('Please select a date and specific time slot.');
            return;
        }
        if (finalDuration < service.durationMinutes) {
            toast.error(`Duration must be at least ${service.durationMinutes} minutes.`);
            return;
        }

        // Combine date and time string to create final ISO timestamp
        const scheduledTime = new Date(selectedStartTime.scheduledAt);

        const bookingData = {
            serviceId: service._id,
            scheduledAt: scheduledTime.toISOString(),
            durationMinutes: finalDuration, // Customer's selected duration
            totalPrice: totalPrice, // Final calculated price
            notes: formData.notes, // Customer's task description
        };

        try {
            // New Flow: Create Booking (Pending) -> Provider Accepts -> Payment
            await coreApi.createBooking(bookingData);

            toast.success('Booking requested! Waiting for provider approval.');
            onClose();

        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to initiate booking.');
        }
    };

    const labelClass = "block text-base font-semibold text-slate-700 dark:text-slate-200 mb-2";

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-75 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-lg w-full transform transition-all border border-slate-200 dark:border-slate-700">

                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Request to Book {service.title}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-300">
                        <FaTimes className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(handleBookingRequest)}> {/* Now uses React-Hook-Form's handleSubmit */}
                    <div className="p-6 space-y-6">

                        {/* Display Hourly Rate */}
                        <div className="text-center bg-slate-100 dark:bg-slate-900 p-3 rounded-lg">
                            <p className='text-lg font-bold text-slate-800 dark:text-white'>
                                Hourly Rate: <span className='text-teal-600'>₹{service.price.toFixed(2)}</span>
                            </p>
                            <p className='text-sm text-slate-500 dark:text-slate-400'>Minimum booking: {service.durationMinutes} minutes</p>
                        </div>

                        {/* 1. Task Details/Notes (TaskRabbit Feature) */}
                        <div>
                            <label htmlFor="notes" className={labelClass}>
                                <FaPencilAlt className="inline mr-2 text-teal-600 dark:text-teal-400" />
                                Tell us about your task
                            </label>
                            <textarea
                                id="notes"
                                rows="3"
                                className="w-full input-field p-2.5 dark:bg-slate-700 dark:border-slate-600 dark:text-white rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 border border-slate-300"
                                placeholder="E.g., The pipe burst in the kitchen sink. Need emergency service."
                                {...register('notes', { required: 'Please describe your task.' })}
                            ></textarea>
                            {errors.notes && <p className='mt-1 text-sm text-red-600'>{errors.notes.message}</p>}
                        </div>

                        {/* 2. Duration Selector */}
                        <div>
                            <label htmlFor="durationMinutes" className={labelClass}>
                                <FaClock className="inline mr-2 text-teal-600 dark:text-teal-400" />
                                Estimated Duration
                            </label>
                            <select
                                id="durationMinutes"
                                className="w-full input-field p-2.5 dark:bg-slate-700 dark:border-slate-600 dark:text-white rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 border border-slate-300"
                                {...register('durationMinutes', {
                                    required: 'Duration is required.',
                                    valueAsNumber: true,
                                    onChange: (e) => setSelectedDuration(Number(e.target.value))
                                })}
                            >
                                {durationOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            {errors.durationMinutes && <p className='mt-1 text-sm text-red-600'>{errors.durationMinutes.message}</p>}
                        </div>

                        {/* 3. Date Picker */}
                        <div>
                            <label className={labelClass}>
                                <FaCalendarAlt className="inline mr-2 text-teal-600 dark:text-teal-400" /> Select Date
                            </label>
                            <DatePicker
                                selected={selectedDate}
                                // When date changes, run availability check
                                onChange={checkAvailability}
                                dateFormat="MMMM d, yyyy"
                                minDate={new Date()}
                                placeholderText="Click to select a date"
                                customInput={<CustomDatePickerInput />}
                                withPortal
                            />
                        </div>

                        {/* 4. Dynamic Time Slot Selection */}
                        {selectedDate && (
                            <div>
                                <label className={labelClass}>
                                    <FaClock className="inline mr-2 text-teal-600 dark:text-teal-400" /> Select Start Time
                                </label>
                                <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-2 border border-slate-200 dark:border-slate-700 rounded-lg">
                                    {loadingSlots ? (
                                        <p className='col-span-4 text-center text-sm text-slate-500 dark:text-slate-400 py-4'>Calculating slots based on {watchedDuration} minutes...</p>
                                    ) : availableSlots.length > 0 ? availableSlots.map((slot) => (
                                        <button
                                            key={slot.scheduledAt} // Use ISO string as unique key
                                            type="button"
                                            onClick={() => setSelectedStartTime(slot)}
                                            className={`py-2 text-sm font-medium rounded-md transition duration-150 ${selectedStartTime?.scheduledAt === slot.scheduledAt
                                                ? 'bg-teal-600 text-white shadow-lg'
                                                : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
                                                }`}
                                        >
                                            {slot.time} {/* Display formatted time string */}
                                        </button>
                                    )) : (
                                        <p className='col-span-4 text-center text-sm text-red-500 dark:text-red-400 py-4'>
                                            No available slots found for the selected date and duration.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 5. Confirmation Details */}
                        <div className="bg-teal-50 dark:bg-slate-700 p-4 rounded-md border border-teal-300 dark:border-teal-500">
                            <p className="text-xl font-extrabold text-slate-800 dark:text-white mb-1">
                                Total Estimated Price: <span className='text-teal-700 dark:text-teal-400'>₹{totalPrice}</span>
                            </p>
                            <p className='text-sm text-slate-600 dark:text-slate-300'>
                                Based on your selected duration ({watchedDuration} mins).
                            </p>
                            {!isAuthenticated && (
                                <p className='text-sm text-red-500 mt-2 font-medium'>
                                    You must be logged in to confirm booking.
                                </p>
                            )}
                        </div>

                    </div>

                    {/* Modal Footer */}
                    <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                        <button
                            type="submit"
                            disabled={isSubmitting || !selectedStartTime || !isAuthenticated || errors.notes}
                            className="px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 disabled:opacity-50 transition duration-150 flex items-center"
                        >
                            {isSubmitting ? 'Requesting...' : 'Request Booking'}
                            <FaCheckCircle className='ml-2' />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BookingModal;