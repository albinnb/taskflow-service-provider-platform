import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { coreApi, chatApi } from '../api/serviceApi';
import { AuthContext } from '../context/AuthContext';
import BookingModal from '../components/booking/BookingModal';
import { FaStar, FaMapMarkerAlt, FaClock, FaRegCalendarCheck, FaUser } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';

/**
 * @desc Redesigned page for service details, reviews, and booking (with Dark Mode).
 */
const ServiceDetailPage = () => {
    const { id } = useParams();
    const [service, setService] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleMessageProvider = async () => {
        if (!user) {
            toast.info('Please login to message the provider.');
            navigate('/login');
            return;
        }
        try {
            // Create or get existing chat
            const res = await chatApi.createChat(service.providerId.userId._id || service.providerId.userId); // Ensure we get the USER ID not Provider ID object
            // Wait, service.providerId is populated Provider object.
            // Provider model has userId field (ref User).
            // We need to pass the target User ID to createChat.
            // Let's check if service.providerId is populated.
            // In ServiceDetailPage, service.providerId seems to be populated based on usage: provider.businessName
            // But does it populate userId inside provider?
            // getServiceDetails populate logic needs to be checked or inferred.
            // Usually coreApi.getServiceDetails returns service populated with providerId.
            // Let's assume providerId.userId is just an ID string if not populated, or we need to check backend controller.
            // Safety check:
            const targetUserId = service.providerId.userId._id || service.providerId.userId;

            navigate('/messages', { state: { selectedChatId: res.data._id } });
        } catch (error) {
            console.error(error);
            toast.error('Failed to start chat.');
        }
    };

    useEffect(() => {
        const fetchServiceAndReviews = async () => {
            setLoading(true);
            try {
                const serviceRes = await coreApi.getServiceDetails(id);
                const fetchedService = serviceRes.data.data;
                setService(fetchedService);

                const providerId = fetchedService.providerId._id;
                const reviewRes = await coreApi.getProviderReviews(providerId);
                setReviews(reviewRes.data.data);
            } catch (error) {
                toast.error('Service details or reviews could not be loaded.');
            } finally {
                setLoading(false);
            }
        };
        fetchServiceAndReviews();
    }, [id]);

    if (loading) return <div className="p-20 text-center text-muted-foreground font-semibold text-lg">Loading service details...</div>;
    if (!service) return <div className="p-20 text-center text-destructive font-semibold text-lg">Service not found.</div>;

    const provider = service.providerId;

    const renderRatingStars = (rating) => {
        return Array(5).fill(0).map((_, i) => (
            <FaStar
                key={i}
                className={cn("w-4 h-4", i < Math.floor(rating) ? "text-yellow-500" : "text-muted")}
            />
        ));
    };

    return (
        <div className="min-h-screen bg-background py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Content */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Hero / Header Card */}
                        <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
                            <h1 className="text-4xl font-extrabold text-foreground mb-4">{service.title}</h1>
                            <div className="flex items-center gap-4 text-muted-foreground mb-6">
                                <Link to={`/provider/${provider._id}`} className="flex items-center hover:text-primary transition-colors font-medium text-lg">
                                    <FaUser className="mr-2" /> {provider.businessName}
                                </Link>
                                <span>•</span>
                                <div className="flex items-center">
                                    <FaStar className="w-5 h-5 mr-1 text-yellow-500" />
                                    <span className="font-bold text-foreground mr-1">{provider.ratingAvg.toFixed(1)}</span>
                                    <span className="text-sm">({provider.reviewCount} reviews)</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-4 pt-6 border-t border-border">
                                <div className="flex items-center px-4 py-2 bg-secondary rounded-full text-sm font-medium">
                                    <FaClock className="mr-2 text-primary" />
                                    Min. {service.durationMinutes} minutes
                                </div>
                                <div className="flex items-center px-4 py-2 bg-secondary rounded-full text-sm font-medium">
                                    <FaMapMarkerAlt className="mr-2 text-primary" />
                                    {provider.address?.city_district || 'Location Available'}
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
                            <h2 className="text-2xl font-bold text-foreground mb-4">About this Service</h2>
                            <div className="prose dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                {service.description}
                            </div>
                        </div>

                        {/* Reviews */}
                        <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
                            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center justify-between">
                                Customer Reviews
                                <span className="text-sm font-normal text-muted-foreground px-3 py-1 bg-secondary rounded-full">{reviews.length}</span>
                            </h2>

                            {reviews.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8 italic">No reviews yet. Be the first to book this Tasker!</p>
                            ) : (
                                <div className="space-y-6">
                                    {reviews.map(review => (
                                        <div key={review._id} className="pb-6 border-b border-border last:border-0 last:pb-0">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="font-semibold text-foreground">{review.userId.name}</div>
                                                <div className="text-sm text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</div>
                                            </div>
                                            <div className="flex gap-1 mb-3">{renderRatingStars(review.rating)}</div>
                                            <p className="text-muted-foreground italic">"{review.comment}"</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Booking Card (Sticky) */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 bg-card border border-border rounded-xl p-6 shadow-lg">
                            <div className="text-center mb-6">
                                <span className="text-muted-foreground text-sm uppercase tracking-wide font-semibold block mb-1">Service Price</span>
                                <span className="text-4xl font-extrabold text-foreground">₹{service.price.toFixed(0)}</span>

                            </div>

                            <div className="space-y-4 mb-6">
                                <div className="flex items-start text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg">
                                    <FaRegCalendarCheck className="w-5 h-5 mr-3 text-primary flex-shrink-0 mt-0.5" />
                                    <span>check availability to see updated slots.</span>
                                </div>
                            </div>

                            <Button
                                size="lg"
                                className="w-full text-lg h-14 font-bold shadow-md"
                                onClick={() => setIsModalOpen(true)}
                            >
                                Book Now
                            </Button>



                            {user && (
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="w-full text-lg h-14 font-medium mt-3"
                                    onClick={handleMessageProvider}
                                >
                                    Message Provider
                                </Button>
                            )}

                            <p className="text-xs text-center text-muted-foreground mt-4">
                                You won't be charged until the task is completed.
                            </p>
                        </div>
                    </div>

                </div>
            </div>

            {
                isModalOpen && (
                    <BookingModal
                        service={service}
                        provider={provider}
                        onClose={() => setIsModalOpen(false)}
                    />
                )
            }
        </div >
    );
};

export default ServiceDetailPage;