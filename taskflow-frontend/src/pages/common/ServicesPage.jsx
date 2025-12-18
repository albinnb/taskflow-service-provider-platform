import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaWrench, FaBolt, FaHome, FaStar, FaChevronRight } from 'react-icons/fa';
import { coreApi } from '../../api/serviceApi'; // Import the API
import { toast } from 'react-toastify';

/**
 * @desc Redesigned page to display all available service categories (with Dark Mode).
 */
const ServicesPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch real categories from the API
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const res = await coreApi.getCategories();
        setCategories(res.data.data);
      } catch (error) {
        toast.error('Failed to load categories.');
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleSearch = (query) => {
    const params = new URLSearchParams();
    if (query) params.set('query', query);
    navigate(`/search?${params.toString()}`);
  };

  // Placeholder icons (we can map real icons later if added to schema)
  const iconMap = {
    plumbing: FaWrench,
    electrical: FaBolt,
    cleaning: FaHome,
    fitness: FaStar, // Placeholder
    'it-repair': FaStar, // Placeholder
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-extrabold text-slate-800 dark:text-white mb-8">
        All Services
      </h1>
      <p className="text-lg text-slate-600 dark:text-slate-300 mb-10">
        Find the right Tasker for any task, big or small.
      </p>

      {loading ? (
        <p className="p-10 text-center text-teal-600 dark:text-teal-400">Loading categories...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((cat) => {
            const Icon = iconMap[cat.slug] || FaStar;
            return (
              <div
                key={cat._id}
                className="group bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-teal-500 dark:hover:border-teal-500 transition duration-300 cursor-pointer flex items-center justify-between"
                onClick={() => handleSearch(cat.slug)}
              >
                <div className="flex items-center">
                  <Icon className="w-10 h-10 text-teal-600 dark:text-teal-400 mr-5" />
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition duration-300">
                      {cat.name}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400">{cat.desc || `Find professionals for ${cat.name}.`}</p>
                  </div>
                </div>
                <FaChevronRight className="text-slate-400 dark:text-slate-500 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition duration-300" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ServicesPage;