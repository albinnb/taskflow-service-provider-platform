import React from 'react';
import { FaShieldAlt, FaUserCheck, FaClock, FaHeart } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <div className="bg-primary/10 py-20 px-4 text-center">
        <h1 className="text-5xl font-extrabold mb-6 text-primary">About TaskFlow</h1>
        <p className="text-xl max-w-2xl mx-auto text-muted-foreground">
          Connecting you with trusted local professionals to get life's to-dos done.
          Safe, simple, and secure.
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Our Mission */}
        <div className="mb-20 text-center">
          <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-4xl mx-auto">
            TaskFlow was built to bridge the gap between busy individuals and skilled service providers.
            Whether you need a quick home repair, a deep clean, or expert help, we make it easy to find
            the right person for the job. Our platform prioritizes trust, transparency, and quality
            in every connection.
          </p>
        </div>

        {/* Why Choose Us Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <FeatureCard
            icon={<FaShieldAlt className="text-4xl text-primary" />}
            title="Secure Payments"
            description="Your money is safe with us. We use industry-standard encryption and escrow-like payment handling."
          />
          <FeatureCard
            icon={<FaUserCheck className="text-4xl text-primary" />}
            title="Verified Pros"
            description="Every Tasker undergoes a verification process to ensure they are qualified and trustworthy."
          />
          <FeatureCard
            icon={<FaClock className="text-4xl text-primary" />}
            title="Save Time"
            description="Book a service in minutes. No more endless phone calls or waiting for quotes."
          />
        </div>

        {/* Origin Story / Student Project Note */}
        <div className="bg-card border border-border rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 shadow-sm">
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-4">Built with Passion</h3>
            <p className="text-muted-foreground mb-4">
              This platform started as a final year Full Stack MERN project. It demonstrates modern
              web development practices including real-time authentication, geo-location services,
              secure payments, and live chat.
            </p>
            <p className="text-muted-foreground font-medium">
              Developed by Albin Babu
            </p>
          </div>
          <div className="flex-shrink-0 bg-primary/20 p-6 rounded-full">
            <FaHeart className="text-6xl text-primary" />
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-20">
          <h2 className="text-3xl font-bold mb-6">Ready to get started?</h2>
          <div className="flex justify-center gap-4">
            <Link to="/services" className="px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors">
              Find a Service
            </Link>
            <Link to="/become-tasker" className="px-8 py-3 bg-secondary text-secondary-foreground font-semibold rounded-lg hover:bg-secondary/80 transition-colors">
              Become a Tasker
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <div className="bg-card p-8 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow text-center">
    <div className="mb-6 flex justify-center">{icon}</div>
    <h3 className="text-xl font-bold mb-3">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

export default AboutPage;