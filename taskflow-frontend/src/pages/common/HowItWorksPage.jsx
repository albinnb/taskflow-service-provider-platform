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
                    <div className="bg-card p-8 rounded-xl border border-border flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
                            <FaSearch className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">1. Find a Tasker</h3>
                        <p className="text-muted-foreground">
                            Search for the service you need. Filter by price, rating, and location to find the perfect match.
                        </p>
                    </div>

                    {/* Step 2 */}
                    <div className="bg-card p-8 rounded-xl border border-border flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
                            <FaCalendarCheck className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">2. Book & Schedule</h3>
                        <p className="text-muted-foreground">
                            Choose a date and time that works for you. Describe your task and book instantly.
                        </p>
                    </div>

                    {/* Step 3 */}
                    <div className="bg-card p-8 rounded-xl border border-border flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
                            <FaCreditCard className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">3. Pay Securely</h3>
                        <p className="text-muted-foreground">
                            Pay through our secure platform only when the job is done. Leave a review to help others.
                        </p>
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
                        <div className="bg-card p-8 rounded-xl border border-border flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-16 h-16 bg-green-500/10 text-green-600 rounded-full flex items-center justify-center mb-6">
                                <FaUserCheck className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">1. Build Your Profile</h3>
                            <p className="text-muted-foreground">
                                Sign up as a provider, list your skills, set your rates, and showcase your experience.
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="bg-card p-8 rounded-xl border border-border flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-16 h-16 bg-green-500/10 text-green-600 rounded-full flex items-center justify-center mb-6">
                                <FaBriefcase className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">2. Accept Jobs</h3>
                            <p className="text-muted-foreground">
                                Receive booking requests from nearby customers. Accept the ones that fit your schedule.
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="bg-card p-8 rounded-xl border border-border flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-16 h-16 bg-green-500/10 text-green-600 rounded-full flex items-center justify-center mb-6">
                                <FaMoneyBillWave className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">3. Get Paid</h3>
                            <p className="text-muted-foreground">
                                Complete the task and get paid directly to your bank account. Build your reputation with great reviews.
                            </p>
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
