import React from 'react';
import { useForm } from 'react-hook-form';
import { FaTimes } from 'react-icons/fa';

const DisputeModal = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
    const { register, handleSubmit, formState: { errors }, reset } = useForm();

    if (!isOpen) return null;

    const handleFormSubmit = (data) => {
        onSubmit(data);
        reset();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col relative animation-fade-in">

                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Report an Issue</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition">
                        <FaTimes />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 overflow-y-auto">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Please describe the issue with this booking:
                        </label>
                        <textarea
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 resize-none h-32"
                            placeholder="e.g., Provider did not show up, Service was incomplete..."
                            {...register('reason', { required: 'Reason is required' })}
                        ></textarea>
                        {errors.reason && <p className="mt-1 text-sm text-red-600">{errors.reason.message}</p>}
                    </div>

                    <div className="flex justify-end space-x-3">
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
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Report'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DisputeModal;
