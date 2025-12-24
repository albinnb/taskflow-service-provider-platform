import React from 'react';
import { FaQuestionCircle, FaCreditCard, FaUserShield, FaSearch } from 'react-icons/fa';

const HelpPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Search */}
      <div className="bg-primary text-primary-foreground py-20 px-4 text-center">
        <h1 className="text-4xl font-bold mb-4">How can we help?</h1>
        <div className="max-w-2xl mx-auto relative">
          <input
            type="text"
            placeholder="Search for answers..."
            className="w-full py-4 px-6 rounded-full text-foreground focus:outline-none shadow-lg pl-14"
          />
          <FaSearch className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16">

        {/* Categories */}
        <h2 className="text-2xl font-bold mb-8">Browse by Category</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <CategoryCard
            icon={<FaQuestionCircle className="text-3xl text-blue-500" />}
            title="Getting Started"
            items={['How to create an account', 'Verifying your email', 'Resetting password']}
          />
          <CategoryCard
            icon={<FaCreditCard className="text-3xl text-green-500" />}
            title="Payments & Pricing"
            items={['Payment methods', 'Refund policy', 'Tipping guide']}
          />
          <CategoryCard
            icon={<FaUserShield className="text-3xl text-purple-500" />}
            title="Trust & Safety"
            items={['Community Guidelines', 'Reporting an issue', 'Insurance coverage']}
          />
        </div>

        {/* FAQs */}
        <h2 className="text-2xl font-bold mb-8">Frequently Asked Questions</h2>
        <div className="space-y-4 max-w-4xl">
          <FaqItem
            question="How do I book a specialized service?"
            answer="Simply search for the service you need on the home page, browse through the list of verified providers, check their reviews, and click 'Book Now' to select a time slot."
          />
          <FaqItem
            question="Is my payment secure?"
            answer="Yes! We use Razorpay for all transactions. Payments are held securely and only released to the provider once the job is completed to your satisfaction."
          />
          <FaqItem
            question="What happens if the provider cancels?"
            answer="If a provider cancels your booking, you will receive a full refund automatically. We will also help you find a replacement Tasker immediately."
          />
          <FaqItem
            question="How do I become a Tasker?"
            answer="Click 'Become a Tasker' in the top menu. You'll need to complete your profile, submit verification documents, and set up your service offerings."
          />
        </div>

        {/* Contact Support Footer */}
        <div className="mt-20 p-8 bg-card border border-border rounded-xl text-center">
          <h3 className="text-2xl font-bold mb-2">Still need help?</h3>
          <p className="text-muted-foreground mb-6">Our support team is available 24/7 to assist you.</p>
          <button className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors">
            Contact Support
          </button>
        </div>

      </div>
    </div>
  );
};

const CategoryCard = ({ icon, title, items }) => (
  <div className="bg-card p-6 rounded-xl border border-border hover:border-primary/50 transition-colors">
    <div className="flex items-center gap-3 mb-4">
      {icon}
      <h3 className="font-bold text-lg">{title}</h3>
    </div>
    <ul className="space-y-2">
      {items.map((item, idx) => (
        <li key={idx} className="text-muted-foreground text-sm hover:text-primary cursor-pointer transition-colors">
          • {item}
        </li>
      ))}
    </ul>
  </div>
);

const FaqItem = ({ question, answer }) => (
  <div className="bg-card border border-border rounded-lg p-6">
    <h3 className="font-semibold text-lg mb-2">{question}</h3>
    <p className="text-muted-foreground">{answer}</p>
  </div>
);

export default HelpPage;