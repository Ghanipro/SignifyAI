import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Volume2, Upload, ShieldCheck, Home } from "lucide-react";

const Navbar = () => {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  // Add scroll effect to navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Function to check if link is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? "bg-indigo-900 bg-opacity-95 backdrop-blur-md shadow-lg py-3" 
        : "bg-indigo-900 bg-opacity-50 backdrop-blur-sm py-4"
    }`}>
      <div className="container mx-auto px-6 flex justify-between items-center">
        {/* Logo and brand */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="bg-white p-2 rounded-full shadow-lg group-hover:bg-indigo-100 transition-colors duration-300">
            <Volume2 size={24} className="text-indigo-700" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">Signify AI</span>
        </Link>
        
        {/* Navigation links */}
        <div className="flex items-center space-x-1">
          <NavLink to="/" icon={<Home size={18} />} label="Home" isActive={isActive('/')} />
          <NavLink to="/upload" icon={<Upload size={18} />} label="Upload" isActive={isActive('/upload')} />
          <NavLink to="/admin" icon={<ShieldCheck size={18} />} label="Admin" isActive={isActive('/admin')} />
        </div>
      </div>
    </nav>
  );
};

// NavLink component for consistent styling
const NavLink = ({ to, icon, label, isActive }) => (
  <Link
    to={to}
    className={`flex items-center space-x-1 px-4 py-2 rounded-lg transition-all duration-200 ${
      isActive
        ? "bg-white bg-opacity-20 text-white font-medium"
        : "text-indigo-100 hover:bg-white hover:bg-opacity-10"
    }`}
  >
    {icon}
    <span>{label}</span>
  </Link>
);

export default Navbar;