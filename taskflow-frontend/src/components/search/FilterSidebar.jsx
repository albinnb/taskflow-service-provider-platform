import React, { useState, useEffect } from 'react';
import { FaFilter, FaStar, FaDollarSign } from 'react-icons/fa';
import { coreApi } from '../../api/serviceApi';
import { toast } from 'react-toastify';

/**
 * @desc Redesigned sidebar component (with Dark Mode).
 */
const FilterSidebar = ({ filters, onFilterChange }) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const res = await coreApi.getCategories();
        setCategories(res.data.data);
      } catch (error) {
        toast.error('Could not load categories');
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // Sync local state
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? (checked ? true : undefined) : value;

    setLocalFilters(prev => {
      const newFilters = { ...prev, [name]: newValue };
      Object.keys(newFilters).forEach(key => 
        (newFilters[key] === '' || newFilters[key] === undefined || newFilters[key] === false) && delete newFilters[key]
      );
      return newFilters;
    });
  };
  
  const handleApply = (e) => {
      e.preventDefault();
      onFilterChange(localFilters);
  };
  
  const handleClear = () => {
      const cleared = { query: localFilters.query }; 
      setLocalFilters(cleared);
      onFilterChange(cleared);
  };

  // Reusable Tailwind classes
  const labelClass = "block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2";
  const inputClass = "w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg shadow-sm text-sm p-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500";
  const checkboxLabelClass = "ml-2 block text-sm font-medium text-slate-700 dark:text-slate-200";

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 sticky top-24">
      <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-5 flex items-center">
        <FaFilter className="mr-2 text-teal-600 dark:text-teal-400" /> Filters
      </h2>
      <form onSubmit={handleApply} className='space-y-5'>

        {/* Sorting Dropdown */}
        <div>
          <label htmlFor="sort" className={labelClass}>Sort By</label>
          <select
            id="sort"
            name="sort"
            value={localFilters.sort || '-ratingAvg'}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="-ratingAvg">Top Rated</option>
            <option value="price">Price: Low to High</option>
            <option value="-price">Price: High to Low</option>
            <option value="-createdAt">Newest Listings</option>
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <label htmlFor="category" className={labelClass}>Service Category</label>
          <select
            id="category"
            name="category"
            value={localFilters.category || ''}
            onChange={handleChange}
            disabled={loadingCategories}
            className={inputClass}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Rating Filter */}
        <div>
          <label htmlFor="ratingAvg[gte]" className={labelClass}>
            <FaStar className="inline mr-1 text-yellow-500" /> Minimum Rating
          </label>
          <input
            id="ratingAvg[gte]"
            type="number"
            name="ratingAvg[gte]"
            min="1" max="5" step="0.1"
            value={localFilters['ratingAvg[gte]'] || ''}
            onChange={handleChange}
            placeholder="e.g., 4.0"
            className={inputClass}
          />
        </div>

        {/* Price Range Filter (Max Price) */}
        <div>
          <label htmlFor="price[lte]" className={labelClass}>
            <FaDollarSign className="inline mr-1 text-green-600" /> Max Price
          </label>
          <input
            id="price[lte]"
            type="number"
            name="price[lte]"
            min="0"
            value={localFilters['price[lte]'] || ''}
            onChange={handleChange}
            placeholder="e.g., 150"
            className={inputClass}
          />
        </div>
        
        {/* Verified Provider Check */}
        <div className="flex items-center pt-2">
            <input
              type="checkbox"
              id="isVerified"
              name="isVerified"
              checked={!!localFilters.isVerified}
              onChange={handleChange}
              className="h-4 w-4 text-teal-600 border-slate-300 dark:border-slate-600 rounded focus:ring-teal-500"
            />
            <label htmlFor="isVerified" className={checkboxLabelClass}>
              Verified Taskers Only
            </label>
        </div>

        {/* Action Buttons */}
        <div className='pt-4 space-y-3'>
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-teal-600 text-white font-semibold rounded-lg shadow-sm hover:bg-teal-700 transition duration-300"
            >
              Apply Filters
            </button>
             <button
              type="button"
              onClick={handleClear}
              className="w-full py-2.5 px-4 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-100 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition duration-300"
            >
              Clear Filters
            </button>
        </div>

      </form>
    </div>
  );
};

export default FilterSidebar;