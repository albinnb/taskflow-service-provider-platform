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

  const imageMap = {
    plumbing: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=500&auto=format&fit=crop&q=60',
    electrical: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=500&auto=format&fit=crop&q=60',
    cleaning: 'https://images.unsplash.com/photo-1627905646269-7f034dcc5738?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Y2xlYW5pbmclMjBzZXJ2aWNlc3xlbnwwfHwwfHx8MA%3D%3D',
    moving: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=500&auto=format&fit=crop&q=60',
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
              const imageUrl = imageMap[cat.slug] || 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=500&auto=format&fit=crop&q=60';

              return (
                <div
                  key={cat._id}
                  className="group bg-card rounded-xl border border-border hover:shadow-lg hover:border-primary/50 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col"
                  onClick={() => handleCategoryClick(cat.slug)}
                >
                  <div className="h-48 overflow-hidden relative">
                    <img src={imageUrl} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 text-white flex items-center gap-3">
                      <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold">{cat.name}</h3>
                    </div>
                  </div>
                  <div className="p-6 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground line-clamp-2">{cat.desc || `Find professionals for ${cat.name}.`}</p>
                    <FaChevronRight className="text-muted-foreground group-hover:text-primary transition-colors text-lg" />
                  </div>
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