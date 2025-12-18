import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaRegCalendarCheck, FaUserShield, FaTools, FaBolt, FaHome } from 'react-icons/fa';
import { Link } from 'react-router-dom';

/**
 * @desc Single-input search bar for the new homepage.
 */
const HomepageSearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex items-center bg-white dark:bg-slate-700 rounded-full shadow-lg transition-all duration-300 border-2 border-slate-200 dark:border-slate-600 focus-within:border-teal-500">
        <input
          type="text"
          placeholder="What task do you need help with?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-grow py-4 pl-6 pr-4 text-lg sm:text-xl border-none focus:ring-0 focus:outline-none placeholder-gray-500 dark:placeholder-gray-300 rounded-l-full bg-transparent dark:text-white" 
        />
        <button
          type="submit"
          className="bg-teal-600 text-white py-4 px-6 m-1.5 flex items-center justify-center transition-all duration-300 hover:bg-teal-700 rounded-full"
          aria-label="Search"
        >
          <FaSearch className="w-6 h-6" />
        </button>
      </div>
    </form>
  );
};

/**
 * @desc Redesigned landing page with scrollable content.
 */
const HomePage = () => {
  const navigate = useNavigate();

  // *** THIS FUNCTION WAS MISSING/BROKEN ***
  const handleSearch = (query) => {
    const params = new URLSearchParams();
    if (query) params.set('query', query);
    navigate(`/search?${params.toString()}`);
  };

  const popularCategories = [
    { name: 'Plumbing', icon: FaTools, query: 'plumbing' },
    { name: 'Electrical', icon: FaBolt, query: 'electrical' },
    { name: 'Cleaning', icon: FaHome, query: 'cleaning' },
  ];

  return (
    <div className="min-h-screen">
      
      {/* --- 1. Hero Section --- */}
      <section className="py-24 sm:py-32 text-center bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-5xl sm:text-7xl font-extrabold text-slate-800 dark:text-white mb-12 leading-tight">
            Book trusted help for any task
          </h1>
          <div className="max-w-2xl mx-auto">
            {/* This passes the function to the search bar */}
            <HomepageSearchBar onSearch={handleSearch} />
          </div>
        </div>
      </section>
      
      {/* --- 2. "How It Works" Section --- */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-slate-800 dark:text-white mb-16">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            {/* Step 1 */}
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center w-20 h-20 bg-teal-100 dark:bg-teal-900 rounded-full mb-4">
                <FaSearch className="w-8 h-8 text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="text-2xl font-semibold text-slate-800 dark:text-white mb-2">1. Find Your Pro</h3>
              <p className="text-lg text-slate-600 dark:text-slate-300">
                Search for the task you need done, from plumbing to cleaning.
              </p>
            </div>
            {/* Step 2 */}
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center w-20 h-20 bg-teal-100 dark:bg-teal-900 rounded-full mb-4">
                <FaRegCalendarCheck className="w-8 h-8 text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="text-2xl font-semibold text-slate-800 dark:text-white mb-2">2. Schedule & Book</h3>
              <p className="text-lg text-slate-600 dark:text-slate-300">
                Select a date and time that works for you and confirm your booking.
              </p>
            </div>
            {/* Step 3 */}
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center w-20 h-20 bg-teal-100 dark:bg-teal-900 rounded-full mb-4">
                <FaUserShield className="w-8 h-8 text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="text-2xl font-semibold text-slate-800 dark:text-white mb-2">3. Get It Done</h3>
              <p className="text-lg text-slate-600 dark:text-slate-300">
                Your verified pro arrives, completes the task, and you pay securely.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- 3. "Popular Services" Section --- */}
      <section className="py-20 bg-white dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-slate-800 dark:text-white mb-16">Popular Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {popularCategories.map((cat) => (
              <div
                key={cat.name}
                className="group bg-white dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
                // This also needs handleSearch
                onClick={() => handleSearch(cat.query)}
              >
                <div className="p-8">
                  <cat.icon className="w-12 h-12 text-teal-600 dark:text-teal-400 mb-4" />
                  <h3 className="text-2xl font-semibold text-slate-800 dark:text-white mb-2">{cat.name}</h3>
                  <p className="text-lg text-slate-600 dark:text-slate-300 mb-4">Get help with your {cat.query} needs, fast.</p>
                  <span className="text-lg font-semibold text-teal-600 dark:text-teal-400 group-hover:underline">
                    Book Now
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- 4. "Why Choose Us" Feature Section --- */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            {/* Image */}
            <div>
              <img 
                src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1740&auto=format&fit=crop" 
                alt="Trusted Professionals in a meeting" 
                className="rounded-xl shadow-lg"
              />
            </div>
            {/* Text Content */}
            <div>
              <span className="text-lg font-semibold text-teal-600 dark:text-teal-400">Peace of Mind</span>
              <h2 className="text-4xl font-bold text-slate-800 dark:text-white mt-2 mb-6">A Pro for Every Task</h2>
              <p className="text-xl text-slate-600 dark:text-slate-300 mb-6">
                From home repairs and cleaning to errands and deliveries, find a skilled professional on TaskFlow. All Taskers are background-checked and reviewed by your neighbors.
              </p>
              <Link 
                to="/register?role=provider" 
                className="inline-block px-8 py-3 text-lg font-semibold bg-teal-600 text-white rounded-lg shadow-sm hover:bg-teal-700 transition-all duration-300"
              >
                Become a Tasker
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;