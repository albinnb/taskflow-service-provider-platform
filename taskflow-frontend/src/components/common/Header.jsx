import React from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { SocketContext } from '../../context/SocketContext'; // Import SocketContext
import { useContext } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { FaUserCircle, FaMoon, FaSun, FaBars, FaTimes, FaSearch, FaInfoCircle, FaQuestionCircle, FaSignOutAlt } from 'react-icons/fa';
import { Button } from '../ui/Button'; // Import Shadcn-style Button
import { useState } from 'react';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { totalUnreadCount } = useContext(SocketContext);
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

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
        <div className="hidden md:flex items-center gap-3">
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
              <Link to="/messages" className="relative">
                <Button variant="ghost" size="sm" className="font-semibold text-muted-foreground hover:text-foreground">
                  Messages
                </Button>
                {totalUnreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-bounce">
                    {totalUnreadCount}
                  </span>
                )}
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

        {/* MOBILE MENU TOGGLE */}
        <button
          className="md:hidden p-2 text-foreground"
          onClick={toggleMobileMenu}
        >
          {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>
      </div>

      {/* MOBILE MENU DRAWER */}
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={closeMobileMenu}
      />

      {/* Sidebar */}
      <div className={`fixed top-0 right-0 z-50 h-full w-[80%] max-w-[320px] bg-background shadow-2xl transform transition-transform duration-300 ease-out md:hidden flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header Section */}
        <div className="p-6 border-b border-border flex items-center justify-between bg-muted/30">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-lg">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg leading-none">{user?.name}</span>
                <span className="text-xs text-muted-foreground capitalize">{user?.role}</span>
              </div>
            </div>
          ) : (
            <span className="font-bold text-xl">Menu</span>
          )}
          <button onClick={closeMobileMenu} className="p-2 text-muted-foreground hover:text-foreground">
            <FaTimes size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-2">

          {isAuthenticated ? (
            <>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Account</div>
              <Link to={getDashboardLink()} onClick={closeMobileMenu} className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary transition-colors text-foreground font-medium">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary"><FaUserCircle size={14} /></div>
                Dashboard
              </Link>
              <Link to="/messages" onClick={closeMobileMenu} className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors text-foreground font-medium">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary"><FaMoon size={14} /></div>
                  Messages
                </div>
                {totalUnreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {totalUnreadCount}
                  </span>
                )}
              </Link>
            </>
          ) : (
            <div className="flex flex-col gap-3 mt-2">
              <Link to="/register?role=provider" onClick={closeMobileMenu}>
                <Button className="w-full rounded-xl h-12 text-lg font-bold shadow-md">
                  Become a Tasker
                </Button>
              </Link>
              <Link to="/login" onClick={closeMobileMenu}>
                <Button variant="outline" className="w-full rounded-xl h-12 text-lg font-semibold">
                  Log In
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Footer Section */}
        <div className="p-6 border-t border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Dark Mode</span>
            <button
              onClick={toggleTheme}
              className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${theme === 'dark' ? 'bg-primary' : 'bg-gray-300'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
          {isAuthenticated && (
            <button
              onClick={() => { logout(); closeMobileMenu(); }}
              className="mt-6 w-full flex items-center justify-center gap-2 text-destructive font-semibold hover:bg-destructive/10 p-3 rounded-lg transition-colors"
            >
              <FaSignOutAlt /> Log Out
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
