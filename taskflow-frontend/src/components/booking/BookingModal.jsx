import React, { useState, forwardRef, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FaCalendarAlt, FaClock, FaTimes, FaPencilAlt, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { useForm } from 'react-hook-form';
import useAuth from '../../hooks/useAuth';
import { coreApi } from '../../api/serviceApi';
import { toast } from 'react-toastify';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

const CustomDatePickerInput = forwardRef(({ value, onClick, placeholder }, ref) => (
    <button
        type="button"
        className="w-full text-left bg-background border border-input text-foreground rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary p-2.5"
        onClick={onClick}
        ref={ref}
    >
        {value || <span className="text-muted-foreground">{placeholder}</span>}
    </button>
));

const generateDurationOptions = (minDuration) => {
    const options = [];
    let current = Math.ceil(minDuration / 30) * 30;
    while (current <= 300) {
        const hours = Math.floor(current / 60);
        const minutes = current % 60;
        const display = `${hours > 0 ? `${hours} hr` : ''} ${minutes > 0 ? `${minutes} min` : ''}`.trim();
        options.push({ value: current, label: display });
        current += 30;
    }
    return options;
};

const BookingModal = ({ service, provider, onClose }) => {
    const { isAuthenticated } = useAuth();
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedStartTime, setSelectedStartTime] = useState(null);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [selectedDuration, setSelectedDuration] = useState(service.durationMinutes);

    const { register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm({
        defaultValues: {
            notes: '',
            durationMinutes: service.durationMinutes,
        }
    });

    const watchedDuration = watch('durationMinutes');

    const totalPrice = useMemo(() => {
        const duration = watchedDuration || service.durationMinutes;
        const hours = duration / 60;
        return (service.price * hours).toFixed(2);
    }, [watchedDuration, service.price, service.durationMinutes]);

    const durationOptions = useMemo(() => generateDurationOptions(service.durationMinutes), [service.durationMinutes]);

    const checkAvailability = async (date) => {
        setSelectedDate(date);
        setSelectedStartTime(null);
        setAvailableSlots([]);

        if (!watchedDuration) return;

        setLoadingSlots(true);

        try {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const dateString = `${year}-${month}-${day}`;

            const res = await coreApi.getProviderAvailability(provider._id, {
                date: dateString,
                serviceId: service._id,
                durationMinutes: watchedDuration,
            });
            setAvailableSlots(res.data.data);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to get availability.');
        } finally {
            setLoadingSlots(false);
        }
    };

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

        const scheduledTime = new Date(selectedStartTime.scheduledAt);

        const bookingData = {
            serviceId: service._id,
            scheduledAt: scheduledTime.toISOString(),
            durationMinutes: finalDuration,
            totalPrice: totalPrice,
            notes: formData.notes,
        };

        try {
            await coreApi.createBooking(bookingData);
            toast.success('Booking requested! Waiting for provider approval.');
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to initiate booking.');
        }
    };

    const labelClass = "block text-sm font-semibold text-foreground mb-2";
    const inputClass = "w-full bg-background border border-input text-foreground rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary p-2.5";

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-card w-full max-w-lg rounded-xl shadow-2xl border border-border flex flex-col max-h-[90vh]">

                <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
                    <h2 className="text-xl font-bold text-foreground">Request to Book</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                    <form onSubmit={handleSubmit(handleBookingRequest)} className="space-y-6">

                        {/* Summary Card */}
                        <div className="bg-muted/50 p-4 rounded-lg flex items-center justify-between border border-border">
                            <div>
                                <p className="font-bold text-foreground">{service.title}</p>
                                <p className="text-sm text-primary font-semibold">₹{service.price} / hr</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-muted-foreground">Est. Total</p>
                                <p className="text-xl font-bold text-foreground">₹{totalPrice}</p>
                            </div>
                        </div>

                        {/* Task Details */}
                        <div>
                            <label htmlFor="notes" className={labelClass}>
                                <FaPencilAlt className="inline mr-2 text-primary" /> Task Details
                            </label>
                            <textarea
                                id="notes"
                                rows="3"
                                className={inputClass}
                                placeholder="Describe your task clearly..."
                                {...register('notes', { required: 'Please describe your task.' })}
                            ></textarea>
                            {errors.notes && <p className='mt-1 text-sm text-destructive'>{errors.notes.message}</p>}
                        </div>

                        {/* Duration */}
                        <div>
                            <label htmlFor="durationMinutes" className={labelClass}>
                                <FaClock className="inline mr-2 text-primary" /> Duration
                            </label>
                            <select
                                id="durationMinutes"
                                className={inputClass}
                                {...register('durationMinutes', {
                                    required: true,
                                    valueAsNumber: true,
                                    onChange: (e) => setSelectedDuration(Number(e.target.value))
                                })}
                            >
                                {durationOptions.map(option => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Date Picker */}
                        <div>
                            <label className={labelClass}>
                                <FaCalendarAlt className="inline mr-2 text-primary" /> Select Date
                            </label>
                            <DatePicker
                                selected={selectedDate}
                                onChange={checkAvailability}
                                dateFormat="MMMM d, yyyy"
                                minDate={new Date()}
                                placeholderText="Select a date"
                                customInput={<CustomDatePickerInput />}
                                withPortal
                            />
                        </div>

                        {/* Time Slots */}
                        {selectedDate && (
                            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                                <label className={labelClass}>
                                    <FaClock className="inline mr-2 text-primary" /> Available Slots
                                </label>
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1">
                                    {loadingSlots ? (
                                        <p className='col-span-4 text-center text-sm text-muted-foreground py-4'>Checking availability...</p>
                                    ) : availableSlots.length > 0 ? availableSlots.map((slot) => (
                                        <button
                                            key={slot.scheduledAt}
                                            type="button"
                                            onClick={() => setSelectedStartTime(slot)}
                                            className={cn(
                                                "py-2 px-1 text-sm font-medium rounded-md transition-all border",
                                                selectedStartTime?.scheduledAt === slot.scheduledAt
                                                    ? "bg-primary text-primary-foreground border-primary shadow-md transform scale-105"
                                                    : "bg-background text-foreground border-border hover:bg-muted hover:border-muted-foreground/50"
                                            )}
                                        >
                                            {slot.time}
                                        </button>
                                    )) : (
                                        <div className='col-span-4 text-center py-4 bg-destructive/10 rounded-lg'>
                                            <p className="text-sm text-destructive font-medium flex items-center justify-center gap-2">
                                                <FaExclamationCircle /> No slots available.
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">Try a different duration.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {!isAuthenticated && (
                            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive flex gap-2">
                                <FaExclamationCircle className="mt-0.5 flex-shrink-0" />
                                <p>You must be logged in to complete your booking.</p>
                            </div>
                        )}

                        <div className="pt-4 border-t border-border">
                            <Button
                                type="submit"
                                size="lg"
                                className="w-full text-lg font-bold"
                                disabled={isSubmitting || !selectedStartTime || !isAuthenticated || !!errors.notes}
                            >
                                {isSubmitting ? 'Processing...' : 'Request Booking'}
                            </Button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
};

export default BookingModal;