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
    <footer className="border-t bg-muted text-muted-foreground">
      <div className="container mx-auto px-4 md:px-6 py-12">

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">

          {/* Column 1: Logo & Social */}
          <div className="col-span-2 md:col-span-1">
            <h5 className="text-xl font-bold text-foreground mb-4">TaskFlow</h5>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors"><FaTwitter className="h-5 w-5" /></a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors"><FaFacebook className="h-5 w-5" /></a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors"><FaInstagram className="h-5 w-5" /></a>
            </div>
          </div>

          {/* Column 2: Categories */}
          <div>
            <h5 className="font-semibold text-foreground mb-4 tracking-wide">Categories</h5>
            <ul className="space-y-2 text-sm">
              <li><Link to="/search?query=plumbing" className="hover:text-foreground transition-colors">Plumbing</Link></li>
              <li><Link to="/search?query=electrical" className="hover:text-foreground transition-colors">Electrical</Link></li>
              <li><Link to="/search?query=cleaning" className="hover:text-foreground transition-colors">Cleaning</Link></li>
              <li><Link to="/services" className="hover:text-foreground transition-colors">All Services</Link></li>
            </ul>
          </div>

          {/* Column 3: Account */}
          <div>
            <h5 className="font-semibold text-foreground mb-4 tracking-wide">Account</h5>
            <ul className="space-y-2 text-sm">
              <li><Link to="/register?role=provider" className="hover:text-foreground transition-colors">Become a Tasker</Link></li>
              {isAuthenticated ? (
                <li><Link to="/customer/dashboard" className="hover:text-foreground transition-colors">My Dashboard</Link></li>
              ) : (
                <li><Link to="/login" className="hover:text-foreground transition-colors">Log In</Link></li>
              )}
            </ul>
          </div>

          {/* Column 4: Company */}
          <div>
            <h5 className="font-semibold text-foreground mb-4 tracking-wide">Company</h5>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="hover:text-foreground transition-colors">About Us</Link></li>
              <li><Link to="/help" className="hover:text-foreground transition-colors">Help Center</Link></li>
            </ul>
          </div>

        </div>

        {/* Copyright */}
        <div className="border-t border-border mt-12 pt-8 text-center text-sm">
          <p>
            &copy; {new Date().getFullYear()} TaskFlow. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;