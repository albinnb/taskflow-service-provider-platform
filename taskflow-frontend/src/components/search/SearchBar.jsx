import React, { useState } from 'react';
import { FaSearch, FaMapMarkerAlt } from 'react-icons/fa';

/**
 * @desc Search bar component for home and header.
 */
const SearchBar = ({ onSearch, large = false }) => {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState(''); // Placeholder for actual location data

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query, location);
  };

  const inputClasses = large
    ? 'py-4 text-base'
    : 'py-2 text-sm';

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex bg-white rounded-full shadow-lg ${large ? 'p-1' : 'p-0.5'} border border-gray-200`}
      role="search"
    >
      <div className="flex-grow flex items-center">
        <FaSearch className={`ml-4 text-gray-400 ${large ? 'w-5 h-5' : 'w-4 h-4'}`} />
        <input
          type="text"
          placeholder="What service do you need?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={`w-full px-4 border-none focus:ring-0 rounded-full ${inputClasses}`}
        />
      </div>
      
      <div className="flex items-center border-l border-gray-200 hidden sm:flex">
        <FaMapMarkerAlt className={`ml-4 text-gray-400 ${large ? 'w-5 h-5' : 'w-4 h-4'}`} />
        <input
          type="text"
          placeholder="Location (e.g., city, zip)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className={`w-full px-4 border-none focus:ring-0 rounded-full ${inputClasses}`}
        />
      </div>

      <button
        type="submit"
        className={`bg-primary text-white rounded-full font-semibold hover:bg-primary/90 transition duration-150 ${large ? 'px-8 py-3 text-base' : 'px-5 text-sm'}`}
      >
        Search
      </button>
    </form>
  );
};

export default SearchBar;