import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram } from 'react-icons/fa';
import useAuth from '../../hooks/useAuth';

/**
 * @desc Redesigned, multi-column footer for TaskFlow.
 */
const Footer = () => {
  const { isAuthenticated } = useAuth();
  
  return (
    <footer className="bg-slate-800 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          
          {/* Column 1: Logo & Social */}
          <div className="col-span-2 md:col-span-1">
            <h5 className="text-2xl font-bold text-white mb-4">TaskFlow</h5>
            <div className="flex space-x-4">
              <a href="#" className="text-slate-400 hover:text-white transition-colors duration-300"><FaTwitter className="w-6 h-6" /></a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors duration-300"><FaFacebook className="w-6 h-6" /></a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors duration-300"><FaInstagram className="w-6 h-6" /></a>
            </div>
          </div>

          {/* Column 2: Categories */}
          <div>
            <h5 className="font-semibold text-white mb-4 tracking-wide">Categories</h5>
            <ul className="space-y-2">
              <li><Link to="/search?query=plumbing" className="hover:text-white transition-colors duration-300">Plumbing</Link></li>
              <li><Link to="/search?query=electrical" className="hover:text-white transition-colors duration-300">Electrical</Link></li>
              <li><Link to="/search?query=cleaning" className="hover:text-white transition-colors duration-300">Cleaning</Link></li>
              <li><Link to="/services" className="hover:text-white transition-colors duration-300">All Services</Link></li>
            </ul>
          </div>

          {/* Column 3: Account */}
          <div>
            <h5 className="font-semibold text-white mb-4 tracking-wide">Account</h5>
            <ul className="space-y-2">
              <li><Link to="/register?role=provider" className="hover:text-white transition-colors duration-300">Become a Tasker</Link></li>
              {isAuthenticated ? (
                <li><Link to="/customer/dashboard" className="hover:text-white transition-colors duration-300">My Dashboard</Link></li>
              ) : (
                <li><Link to="/login" className="hover:text-white transition-colors duration-300">Log In</Link></li>
              )}
            </ul>
          </div>
          
          {/* Column 4: Company */}
          <div>
            <h5 className="font-semibold text-white mb-4 tracking-wide">Company</h5>
            <ul className="space-y-2">
              <li><Link to="/about" className="hover:text-white transition-colors duration-300">About Us</Link></li>
              <li><Link to="/help" className="hover:text-white transition-colors duration-300">Help Center</Link></li>
            </ul>
          </div>

        </div>

        {/* Copyright */}
        <div className="border-t border-slate-700 mt-12 pt-8 text-center text-slate-400">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} TaskFlow. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;