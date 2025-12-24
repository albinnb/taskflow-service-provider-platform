import React from 'react';
import { Link } from 'react-router-dom';
import { FaSearch, FaCalendarCheck, FaCreditCard, FaUserCheck, FaBriefcase, FaMoneyBillWave } from 'react-icons/fa';
import { Button } from '../../components/ui/Button';

const HowItWorksPage = () => {
    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Hero Section */}
            <section className="py-20 bg-muted/30 text-center border-b border-border">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">
                        How TaskFlow Works
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                        Whether you need a helping hand or want to earn extra income, TaskFlow makes it simple, safe, and secure.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Link to="/register">
                            <Button size="lg" className="font-bold text-lg px-8">Get Started</Button>
                        </Link>
                        <Link to="/services">
                            <Button variant="outline" size="lg" className="font-bold text-lg px-8">Browse Services</Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* For Customers Section */}
            <section className="py-16 container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold mb-4">For Customers</h2>
                    <p className="text-muted-foreground">Getting your to-do list done has never been easier.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Step 1 */}
                    <div className="bg-card rounded-xl border border-border flex flex-col items-center text-center shadow-sm hover:shadow-lg transition-all overflow-hidden group">
                        <div className="h-48 w-full overflow-hidden">
                            <img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&auto=format&fit=crop&q=60" alt="Find" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div className="p-6">
                            <h3 className="text-xl font-bold mb-3 flex items-center justify-center gap-2">
                                <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
                                Find a Tasker
                            </h3>
                            <p className="text-muted-foreground">
                                Search for the service you need. Filter by price, rating, and location to find the perfect match.
                            </p>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="bg-card rounded-xl border border-border flex flex-col items-center text-center shadow-sm hover:shadow-lg transition-all overflow-hidden group">
                        <div className="h-48 w-full overflow-hidden">
                            <img src="https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=500&auto=format&fit=crop&q=60" alt="Book" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div className="p-6">
                            <h3 className="text-xl font-bold mb-3 flex items-center justify-center gap-2">
                                <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
                                Book & Schedule
                            </h3>
                            <p className="text-muted-foreground">
                                Choose a date and time that works for you. Describe your task and book instantly.
                            </p>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="bg-card rounded-xl border border-border flex flex-col items-center text-center shadow-sm hover:shadow-lg transition-all overflow-hidden group">
                        <div className="h-48 w-full overflow-hidden">
                            <img src="https://images.unsplash.com/photo-1556742111-a301076d9d18?w=800&q=80" alt="Pay" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div className="p-6">
                            <h3 className="text-xl font-bold mb-3 flex items-center justify-center gap-2">
                                <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span>
                                Pay Securely
                            </h3>
                            <p className="text-muted-foreground">
                                Pay through our secure platform only when the job is done. Leave a review to help others.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* For Taskers Section */}
            <section className="py-16 bg-muted/10 border-t border-border">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4">For Taskers</h2>
                        <p className="text-muted-foreground">Turn your skills into earnings on your own schedule.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Step 1 */}
                        <div className="bg-card rounded-xl border border-border flex flex-col items-center text-center shadow-sm hover:shadow-lg transition-all overflow-hidden group">
                            <div className="h-48 w-full overflow-hidden">
                                <img src="https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=500&auto=format&fit=crop&q=60" alt="Profile" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-bold mb-3 flex items-center justify-center gap-2">
                                    <span className="bg-green-500/10 text-green-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
                                    Build Your Profile
                                </h3>
                                <p className="text-muted-foreground">
                                    Sign up as a provider, list your skills, set your rates, and showcase your experience.
                                </p>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="bg-card rounded-xl border border-border flex flex-col items-center text-center shadow-sm hover:shadow-lg transition-all overflow-hidden group">
                            <div className="h-48 w-full overflow-hidden">
                                <img src="https://images.unsplash.com/photo-1521791136064-7986c2920216?w=500&auto=format&fit=crop&q=60" alt="Accept" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-bold mb-3 flex items-center justify-center gap-2">
                                    <span className="bg-green-500/10 text-green-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
                                    Accept Jobs
                                </h3>
                                <p className="text-muted-foreground">
                                    Receive booking requests from nearby customers. Accept the ones that fit your schedule.
                                </p>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="bg-card rounded-xl border border-border flex flex-col items-center text-center shadow-sm hover:shadow-lg transition-all overflow-hidden group">
                            <div className="h-48 w-full overflow-hidden">
                                <img src="https://images.unsplash.com/photo-1579621970795-87facc2f976d?w=500&auto=format&fit=crop&q=60" alt="Money" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-bold mb-3 flex items-center justify-center gap-2">
                                    <span className="bg-green-500/10 text-green-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span>
                                    Get Paid
                                </h3>
                                <p className="text-muted-foreground">
                                    Complete the task and get paid directly to your bank account. Build your reputation with great reviews.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 text-center">
                        <Link to="/register?role=provider">
                            <Button size="lg" className="font-bold text-lg px-8 bg-green-600 hover:bg-green-700 text-white">Become a Tasker Today</Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HowItWorksPage;
