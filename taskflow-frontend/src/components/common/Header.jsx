import React from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext'; // Import useTheme
import { FaUserCircle, FaMoon, FaSun } from 'react-icons/fa'; // Import icons

/**
 * @desc Redesigned header with Dark Mode Toggle.
 */
const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // *** THIS IS THE MISSING FUNCTION ***
  // I've added it back in.
  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'provider') return '/provider/dashboard';
    return '/customer/dashboard';
  };

  return (
    <header className="bg-white dark:bg-slate-800 sticky top-0 z-50 border-b border-slate-200 dark:border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo */}
          <Link to="/" className="text-3xl font-extrabold text-slate-800 dark:text-white transition-colors duration-300 hover:text-teal-600 dark:hover:text-teal-500">
            TaskFlow
          </Link>

          {/* Navigation Links (Right Side) */}
          <nav className="flex items-center space-x-6">
            <Link 
              to="/services" 
              className="text-lg font-medium text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-500 transition-colors duration-300"
            >
              Services
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to={getDashboardLink()}
                  className="text-lg font-medium text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-500 transition-colors duration-300 flex items-center"
                >
                  <FaUserCircle className='mr-2'/> 
                  Dashboard
                </Link>
                
                <button
                  onClick={logout}
                  className="text-lg font-medium text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-500 transition-colors duration-300"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-lg font-medium text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-500 transition-colors duration-300"
                >
                  Sign In
                </Link>
                
                <Link
                  to="/register?role=provider" 
                  className="px-5 py-2.5 text-lg font-semibold bg-teal-600 text-white rounded-lg shadow-sm hover:bg-teal-700 transition-all duration-300"
                >
                  Become a Tasker
                </Link>
              </>
            )}

            {/* Dark Mode Toggle Button */}
            <button
              onClick={toggleTheme}
              className="text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-500 transition-all duration-300"
              aria-label="Toggle dark mode"
            >
              {theme === 'light' ? (
                <FaMoon className="w-5 h-5" />
              ) : (
                <FaSun className="w-5 h-5" />
              )}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;