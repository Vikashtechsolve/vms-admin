// src/components/common/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';

// Import your Figma icons
import VTSLogo from '../../assets/icon/logo.png';
import DashboardIcon from '../../assets/icon/DashboardIcon.png';
import MyCoursesIcon from '../../assets/icon/MyCourseIcon.png';
import AssignmentsIcon from '../../assets/icon/AssignmentIcon.png';
import AnnouncementsIcon from '../../assets/icon/AnnouncementsIcon.png';
import SupportIcon from '../../assets/icon/SupportIcon.png';
import ProfileIcon from '../../assets/icon/ProfileIcon.png';



const Sidebar = () => {
  const menuItems = [
    { name: 'Dashboard', icon: DashboardIcon, path: '/' },
    { name: 'My Courses', icon: MyCoursesIcon, path: '/courses' },
    { name: 'Assignments', icon: AssignmentsIcon, path: '/assignments' },
    { name: 'Announcements', icon: AnnouncementsIcon, path: '/announcements' },
    { name: 'Support/Help', icon: SupportIcon, path: '/support' },
    { name: 'Profile', icon: ProfileIcon, path: '/profile' },
  ];

  return (
    <div className="w-64 bg-white h-screen fixed left-0 top-0 shadow-lg">
      {/* Logo */}
        <div className="p-6 border-b border-gray-200 flex items-center">
        <img src={VTSLogo} alt="VTS Logo" className="h-8" />
      </div>

      {/* Navigation Menu */}
      <nav className="mt-6">
        {menuItems.map((item, index) => (
          <NavLink
            key={index}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-4 px-6 py-3.5 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200 ${
                isActive 
                  ? 'bg-red-50 text-red-600 border-l-4 border-red-600 font-medium' 
                  : 'border-l-4 border-transparent'
              }`
            }
          >
            <img src={item.icon} alt={item.name} className="w-5 h-5" />
            <span className="text-sm">{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;