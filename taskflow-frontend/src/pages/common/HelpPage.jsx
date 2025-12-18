import React from 'react';

const HelpPage = () => {
  return (
    <div className="max-w-4xl mx-auto py-16 px-4 bg-white shadow-lg rounded-lg my-12">
      <h1 className="text-4xl font-bold text-slate-800 mb-6">Help Center</h1>
      <p className="text-xl text-slate-600 leading-relaxed mb-4">
        Need help with your account or a booking? Here are some common questions.
      </p>
      
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-700">How do I book a Pro?</h2>
        <p className="text-lg text-slate-600">
          Simply search for the task you need, select a Pro, choose a date and time, and confirm your booking.
        </p>
        
        <h2 className="text-2xl font-semibold text-slate-700">How do I become a Tasker?</h2>
        <p className="text-lg text-slate-600">
          Click the "Become a Tasker" button in the header, register for a provider account, and complete your profile.
        </p> 
      </div>
    </div>
  );
};

export default HelpPage;