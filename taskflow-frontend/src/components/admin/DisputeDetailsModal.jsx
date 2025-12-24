import React, { useState } from 'react';
import { FaTimes, FaPhone, FaEnvelope, FaUser, FaBuilding, FaClipboardList, FaStickyNote } from 'react-icons/fa';

const DisputeDetailsModal = ({ isOpen, onClose, dispute, onUpdateStatus }) => {
    const [adminNotes, setAdminNotes] = useState(dispute?.adminNotes || '');
    const [isUpdating, setIsUpdating] = useState(false);

    // Sync state with props when dispute changes
    React.useEffect(() => {
        setAdminNotes(dispute?.adminNotes || '');
    }, [dispute]);

    if (!isOpen || !dispute) return null;

    const handleStatusChange = async (newStatus) => {
        setIsUpdating(newStatus); // Use status as loading indicator
        await onUpdateStatus(dispute._id, newStatus, adminNotes);
        setIsUpdating(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col relative animation-fade-in">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center">
                            Dispute Investigation
                            <span className={`ml-3 px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${dispute.status === 'open' ? 'bg-red-100 text-red-800' :
                                dispute.status === 'investigating' ? 'bg-purple-100 text-purple-800' :
                                    dispute.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                        dispute.status === 'refunded' ? 'bg-blue-100 text-blue-800' :
                                            'bg-slate-100 text-slate-800'
                                }`}>
                                {dispute.status}
                            </span>
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Booking ID: {dispute.bookingId?._id || 'N/A'}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition">
                        <FaTimes size={24} />
                    </button>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto custom-scrollbar">

                    {/* Column 1: Parties Involved */}
                    <div className="space-y-6">

                        {/* Customer Details */}
                        <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-100 dark:border-slate-600">
                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-3 flex items-center">
                                <FaUser className="mr-2" /> Customer (Raised By)
                            </h4>
                            <p className="font-semibold text-slate-800 dark:text-white text-lg">{dispute.raisedBy?.name || 'Unknown'}</p>
                            <div className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                                <p className="flex items-center"><FaEnvelope className="mr-2 opacity-50" /> {dispute.raisedBy?.email || 'N/A'}</p>
                                <p className="flex items-center"><FaPhone className="mr-2 opacity-50" /> {dispute.raisedBy?.phone || 'No phone provided'}</p>
                            </div>
                        </div>

                        {/* Provider Details */}
                        <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-100 dark:border-slate-600">
                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-3 flex items-center">
                                <FaBuilding className="mr-2" /> Service Provider
                            </h4>
                            <p className="font-semibold text-slate-800 dark:text-white text-lg">{dispute.providerId?.businessName || 'Unknown'}</p>
                            <div className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                                <p className="flex items-center"><FaUser className="mr-2 opacity-50" /> {dispute.providerId?.userId?.name || 'N/A'}</p>
                                <p className="flex items-center"><FaEnvelope className="mr-2 opacity-50" /> {dispute.providerId?.userId?.email || 'N/A'}</p>
                                <p className="flex items-center"><FaPhone className="mr-2 opacity-50" /> {dispute.providerId?.userId?.phone || 'No phone provided'}</p>
                            </div>
                        </div>

                    </div>

                    {/* Column 2: The Issue */}
                    <div className="space-y-6">
                        <div>
                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-2">Reported Issue</h4>
                            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-800/50 text-slate-800 dark:text-slate-200">
                                "{dispute.reason}"
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-2 flex items-center">
                                <FaStickyNote className="mr-2" /> Admin Investigation Notes
                            </h4>
                            <textarea
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 resize-none h-32"
                                placeholder="Log your findings here (e.g. 'Called customer, verified claim...')"
                            ></textarea>
                            <p className="text-xs text-slate-500 mt-1">Notes are saved when you update the status.</p>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">

                    {['resolved', 'refunded', 'rejected'].includes(dispute.status) ? (
                        <div className="w-full text-center py-2 text-slate-500 font-medium bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                            🔒 Dispute is closed. No further actions can be taken.
                        </div>
                    ) : (
                        <>
                            <div className="flex gap-2 w-full sm:w-auto">
                                {/* Investigation Action */}
                                {dispute.status !== 'investigating' && (
                                    <button
                                        onClick={() => handleStatusChange('investigating')}
                                        disabled={isUpdating}
                                        className="flex-1 sm:flex-none px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition font-medium shadow-sm ring-1 ring-purple-700"
                                    >
                                        {isUpdating === 'investigating' ? 'Updating...' : 'Start Investigation'}
                                    </button>
                                )}

                                {/* If already investigating, show update button for notes only */}
                                {dispute.status === 'investigating' && (
                                    <button
                                        onClick={() => handleStatusChange('investigating')}
                                        disabled={isUpdating}
                                        className="flex-1 sm:flex-none px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 transition font-medium"
                                    >
                                        {isUpdating === 'investigating' ? 'Saving...' : 'Save Notes'}
                                    </button>
                                )}
                            </div>

                            <div className="flex gap-2 w-full sm:w-auto">
                                <button
                                    onClick={() => handleStatusChange('resolved')}
                                    disabled={isUpdating}
                                    className="flex-1 sm:flex-none px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition font-medium shadow-sm"
                                >
                                    Resolve
                                </button>
                                <button
                                    onClick={() => handleStatusChange('refunded')}
                                    disabled={isUpdating}
                                    className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium shadow-sm"
                                >
                                    Refund
                                </button>
                                <button
                                    onClick={() => handleStatusChange('rejected')}
                                    disabled={isUpdating}
                                    className="flex-1 sm:flex-none px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 transition font-medium"
                                >
                                    Reject
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DisputeDetailsModal;
