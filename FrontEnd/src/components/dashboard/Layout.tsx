import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import {
  Home,
  Calendar,
  BarChart3,
  Users,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Moon,
  Sun,
  Shield
} from "lucide-react";
import { useDarkMode } from "../../wrap";
import { AssistantProvider } from "../../context/AssistantContext";
import "./Layout.css";
import ProfilePic from '../../assets/Profile.png';


const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);

  const { darkMode, toggleDarkMode } = useDarkMode();

  return (
    <AssistantProvider>
    <div className={`layout ${darkMode ? "dark-mode" : ""}`}>
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? "expanded" : "collapsed"}`}>
        <div className="sidebar-header">
          <span className="app-name">{sidebarOpen ? "Donezo" : "D"}</span>
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X /> : <Menu />}
          </button>
        </div>

       <nav>
          <NavLink to="/beat" end className={({ isActive }) => (isActive ? 'active' : undefined)}>
            <Home /><span>Dashboard</span>
          </NavLink>
          <NavLink to="/home" end className={({ isActive }) => (isActive ? 'active' : undefined)}>
            <Calendar /><span>Calendar</span>
          </NavLink>
          <NavLink to="/holistic" end className={({ isActive }) => (isActive ? 'active' : undefined)}>
            <BarChart3 /><span>Analytics</span>
          </NavLink>
          <NavLink to="/tasks" end className={({ isActive }) => (isActive ? 'active' : undefined)}>
            <Users /><span>Tasks</span>
          </NavLink>
          <NavLink to="/permissions" end className={({ isActive }) => (isActive ? 'active' : undefined)}>
            <Shield /><span>Permissions</span>
          </NavLink>

          <div className="bottom-links">
            <button type="button"><Settings /><span>Settings</span></button>
            <button type="button"><HelpCircle /><span>Help</span></button>
            <button type="button"><LogOut className="logout" /><span>Logout</span></button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="main">
        <header className="header">
          <input type="text" placeholder="Search task" />

          <div className="actions">
            {/* Dark Mode Toggle */}
            <div
              className="icon-circle"
              title="Toggle Dark Mode"
              onClick={toggleDarkMode}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </div>

            {/* Notifications */}
            <div className="icon-circle" title="Notifications">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C10.343 2 9 3.343 9 5v1.07c-3.938.49-7 3.858-7 7.93V16l-1 1v1h20v-1l-1-1v-2c0-4.07-3.062-7.44-7-7.93V5c0-1.657-1.343-3-3-3zm0 18c1.104 0 2-.896 2-2H10c0 1.104.896 2 2 2z"/>
              </svg>
              <span className="badge">3</span>
            </div>

            {/* Messages */}
            <div className="icon-circle" title="Messages">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 6h-18c-1.104 0-2 .896-2 2v10c0 1.104.896 2 2 2h4v3l3-3h11c1.104 0 2-.896 2-2v-10c0-1.104-.896-2-2-2zm0 12h-12.586l-2.707 2.707v-2.707h-3v-10h18v10z"/>
              </svg>
              <span className="badge">5</span>
            </div>

            {/* Profile Dropdown */}
            {/* Profile Dropdown */}
          <div className="profile-dropdown">
            <button
              className="profile-button"
              onClick={() => setProfileOpen(!profileOpen)}
            >
              <img
                src={ProfilePic} // cartoonish avatar
                alt="avatar"
                className="profile-avatar"
              />
            </button>

            <div className={`dropdown-menu ${profileOpen ? 'show' : ''}`}>
              <img src={ProfilePic} alt="avatar" className="profile-avatar-large" />
              <div className="profile-info">
                <p className="profile-fullname">Jessica Mores</p>
                <p className="profile-email">jessica@mail.com</p>
              </div>
              <button className="dropdown-item">Profile</button>
              <button className="dropdown-item">Settings</button>
              <button className="dropdown-item logout">Logout</button>
            </div>
          </div>

          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
    </AssistantProvider>
  );
};

export default Layout;
