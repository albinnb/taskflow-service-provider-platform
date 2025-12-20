import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaWrench, FaBolt, FaHome, FaStar, FaChevronRight } from 'react-icons/fa';
import { coreApi } from '../../api/serviceApi';
import { toast } from 'react-toastify';
import { cn } from '../../lib/utils';

/**
 * @desc Redesigned page to display all available service categories (with Dark Mode).
 */
const ServicesPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleCategoryClick = (categorySlug) => {
    const params = new URLSearchParams();
    if (categorySlug) params.set('category', categorySlug);
    navigate(`/search?${params.toString()}`);
  };

  const iconMap = {
    plumbing: FaWrench,
    electrical: FaBolt,
    cleaning: FaHome,
  };

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-foreground mb-4">
            All Services
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Find the right Tasker for any task, big or small.
          </p>
        </div>

        {loading ? (
          <p className="p-20 text-center text-muted-foreground text-lg">Loading categories...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => {
              const Icon = iconMap[cat.slug] || FaStar;
              return (
                <div
                  key={cat._id}
                  className="group bg-card p-6 rounded-xl border border-border hover:shadow-lg hover:border-primary/50 transition-all duration-300 cursor-pointer flex items-center justify-between"
                  onClick={() => handleCategoryClick(cat.slug)}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-secondary group-hover:bg-primary/10 transition-colors">
                      <Icon className="w-6 h-6 text-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                        {cat.name}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">{cat.desc || `Find professionals for ${cat.name}.`}</p>
                    </div>
                  </div>
                  <FaChevronRight className="text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServicesPage;