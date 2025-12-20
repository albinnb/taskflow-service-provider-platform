import React, { useState, useEffect } from 'react';
import { FaFilter, FaStar, FaDollarSign, FaLocationArrow } from 'react-icons/fa';
import { coreApi } from '../../api/serviceApi';
import { toast } from 'react-toastify';

/**
 * @desc Redesigned sidebar component (with Dark Mode).
 */
const FilterSidebar = ({ filters, onFilterChange }) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);

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

  const handleLocationToggle = (e) => {
    if (e.target.checked) {
      setLocationLoading(true);
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const updated = { ...localFilters, lat: latitude, lng: longitude };
            setLocalFilters(updated);
            setLocationLoading(false);
            onFilterChange(updated);
            toast.success("Location applied!");
          },
          (error) => {
            console.error("Error getting location:", error);
            toast.error("Could not get your location.");
            setLocationLoading(false);
          }
        );
      } else {
        toast.error("Geolocation is not available in your browser.");
        setLocationLoading(false);
      }
    } else {
      // Remove location info
      const updated = { ...localFilters };
      delete updated.lat;
      delete updated.lng;
      setLocalFilters(updated);
      onFilterChange(updated);
    }
  };

  // Reusable Tailwind classes
  const labelClass = "block text-sm font-semibold text-foreground mb-2";
  const inputClass = "w-full border-input bg-background text-foreground rounded-lg shadow-sm text-sm p-2.5 focus:ring-2 focus:ring-primary focus:border-primary";
  const checkboxLabelClass = "ml-2 block text-sm font-medium text-foreground";

  return (
    <div className="bg-card p-6 rounded-xl shadow-lg border border-border sticky top-24">
      <h2 className="text-xl font-bold text-foreground mb-5 flex items-center">
        <FaFilter className="mr-2 text-primary" /> Filters
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
        {/* Location Filter */}
        <div className="pt-2 border-t border-border">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              onChange={handleLocationToggle}
              checked={!!localFilters.lat}
              disabled={locationLoading}
              className="sr-only peer"
            />
            <div className="relative w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-ring rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            <span className="ml-3 text-sm font-medium text-foreground flex items-center">
              {locationLoading ? (
                <span className="animate-pulse">Locating...</span>
              ) : (
                <>
                  <FaLocationArrow className="mr-1.5 text-primary" /> Sort by Nearest
                </>
              )}
            </span>
          </label>
          {localFilters.lat && (
            <p className="text-xs text-primary mt-1 ml-14">
              Location set ({localFilters.lat.toFixed(2)}, {localFilters.lng.toFixed(2)})
            </p>
          )}
        </div>

        {/* Verified Provider Check */}
        <div className="flex items-center pt-2">
          <input
            type="checkbox"
            id="isVerified"
            name="isVerified"
            checked={!!localFilters.isVerified}
            onChange={handleChange}
            className="h-4 w-4 text-primary border-input rounded focus:ring-primary"
          />
          <label htmlFor="isVerified" className={checkboxLabelClass}>
            Verified Taskers Only
          </label>
        </div>

        {/* Action Buttons */}
        <div className='pt-4 space-y-3'>
          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-primary text-primary-foreground font-semibold rounded-lg shadow-sm hover:opacity-90 transition duration-300"
          >
            Apply Filters
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="w-full py-2.5 px-4 bg-secondary text-secondary-foreground font-semibold rounded-lg hover:bg-secondary/80 transition duration-300"
          >
            Clear Filters
          </button>
        </div>

      </form >
    </div >
  );
};

export default FilterSidebar;