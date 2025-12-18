import React from 'react';

const AboutPage = () => {
  return (
    <div className="max-w-4xl mx-auto py-16 px-4 bg-white shadow-lg rounded-lg my-12">
      <h1 className="text-4xl font-bold text-slate-800 mb-6">About TaskFlow</h1>
      <p className="text-xl text-slate-600 leading-relaxed">
        Welcome to TaskFlow! Our mission is to connect you with trusted, verified local professionals
        to help you get any task done, safely and efficiently.
      </p>
      <p className="text-xl text-slate-600 leading-relaxed mt-4">
        This platform was built as a final year project to demonstrate a full-stack MERN application,
        complete with authentication, a booking system, payments, and reviews.
      </p>
    </div>
  );
};

export default AboutPage;