import React from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { FaUserCircle, FaMoon, FaSun } from 'react-icons/fa';
import { Button } from '../ui/Button'; // Import Shadcn-style Button

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'provider') return '/provider/dashboard';
    return '/customer/dashboard';
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background transition-colors duration-300">
      <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">

        {/* LOGO */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-xl rounded-bl-sm">
            T
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
            TaskFlow
          </span>
        </Link>

        {/* DESKTOP NAV */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/services" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Services
          </Link>
          <Link to="/how-it-works" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            How it Works
          </Link>
        </nav>

        {/* ACTIONS */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? <FaMoon className="h-4 w-4" /> : <FaSun className="h-4 w-4" />}
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link to={getDashboardLink()}>
                <Button variant="ghost" size="sm" className="font-semibold text-muted-foreground hover:text-foreground">
                  Dashboard
                </Button>
              </Link>
              <Button onClick={logout} variant="outline" size="sm" className='border-destructive/50 text-destructive hover:bg-destructive/10'>
                Log Out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" className="font-semibold text-muted-foreground hover:text-foreground">
                  Log In
                </Button>
              </Link>
              <Link to="/register?role=provider">
                <Button className="rounded-full px-6 font-bold shadow-none hover:opacity-90 transition-opacity">
                  Become a Tasker
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
