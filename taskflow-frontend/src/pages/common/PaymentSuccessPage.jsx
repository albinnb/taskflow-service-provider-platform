import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { coreApi } from '../../api/serviceApi';
import { toast } from 'react-toastify';
import { FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';
import { Button } from '../../components/ui/Button';

const PaymentSuccessPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying'); // verifying, success, error

    useEffect(() => {
        const verify = async () => {
            const razorpay_payment_id = searchParams.get('razorpay_payment_id');
            const razorpay_order_id = searchParams.get('razorpay_order_id');
            const razorpay_signature = searchParams.get('razorpay_signature');
            // Some integrations pass bookingId in params too if we set it in success url,
            // but here we only rely on the signature verification.
            // However, the backend verifyPayment requires `bookingId` in the body!
            // Wait, looking at paymentController.js:
            // const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

            // PROBLEM: The redirect from Razorpay gives payment_id, order_id, signature.
            // It does NOT give bookingId unless we encoded it in the callback URL or stored it.
            // When using Razorpay standard checkout, we can't easily pass custom query params to the callback unless we set callback_url per transaction.

            // We need to retrieve the bookingId.
            // Strategy:
            // 1. When creating order, we get `order_id`.
            // 2. We can try to assume the backend can find the booking by `razorpay_order_id`.
            // BUT `paymentController.js` expects `bookingId`.

            // FIX: We need to modify `paymentController.js` to optionally find booking by orderId OR modify the callback URL to include bookingId.
            // In DashboardCustomer.jsx, we can set `callback_url` dynamically.

            if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
                setStatus('error');
                return;
            }

            // We need bookingId. Let's try to get it from query params if we added it.
            // We will modify DashboardCustomer to add ?bookingId=... to the callback_url.
            const bookingId = searchParams.get('bookingId');

            try {
                await coreApi.verifyPayment({
                    razorpay_order_id,
                    razorpay_payment_id,
                    razorpay_signature,
                    bookingId // This might be null if not passed
                });
                setStatus('success');
                toast.success('Payment verified successfully!');
                setTimeout(() => navigate('/customer/dashboard'), 3000);
            } catch (error) {
                console.error(error);
                setStatus('error');
                toast.error('Payment verification failed.');
            }
        };

        verify();
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="bg-card border border-border p-8 rounded-xl shadow-lg max-w-md w-full text-center">
                {status === 'verifying' && (
                    <div className="flex flex-col items-center">
                        <FaSpinner className="animate-spin text-primary h-12 w-12 mb-4" />
                        <h2 className="text-xl font-bold">Verifying Payment...</h2>
                        <p className="text-muted-foreground mt-2">Please do not close this window.</p>
                    </div>
                )}
                {status === 'success' && (
                    <div className="flex flex-col items-center">
                        <FaCheckCircle className="text-green-500 h-16 w-16 mb-4" />
                        <h2 className="text-2xl font-bold text-green-600">Payment Successful!</h2>
                        <p className="text-muted-foreground mt-2">Your booking has been confirmed.</p>
                        <p className="text-sm text-muted-foreground mt-4">Redirecting to dashboard...</p>
                        <Button onClick={() => navigate('/customer/dashboard')} className="mt-6">
                            Go to Dashboard
                        </Button>
                    </div>
                )}
                {status === 'error' && (
                    <div className="flex flex-col items-center">
                        <FaTimesCircle className="text-destructive h-16 w-16 mb-4" />
                        <h2 className="text-2xl font-bold text-destructive">Payment Verification Failed</h2>
                        <p className="text-muted-foreground mt-2">We couldn't verify your payment. If money was deducted, please contact support.</p>
                        <Button onClick={() => navigate('/customer/dashboard')} variant="outline" className="mt-6">
                            Return to Dashboard
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentSuccessPage;
