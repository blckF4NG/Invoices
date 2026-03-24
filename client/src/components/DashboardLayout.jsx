import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { FileText, Building2, History, Settings as SettingsIcon, LogOut, Menu, X } from 'lucide-react';
import axios from 'axios';

export default function DashboardLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await axios.post(`http://${window.location.hostname}:3001/api/auth/logout`, {}, { withCredentials: true });
      window.location.href = '/login';
    } catch (error) {
      console.error(error);
    }
  };

  const menuItems = [
    { path: '/invoice/new', icon: FileText, label: 'Generate Invoice' },
    { path: '/companies', icon: Building2, label: 'Manage Companies' },
    { path: '/invoice/history', icon: History, label: 'Invoice History' },
    { path: '/settings', icon: SettingsIcon, label: 'Settings' }
  ];

  const NavLinks = ({ onNavigate }) => (
    <>
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname.startsWith(item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-slate-800'
            }`}
          >
            <Icon size={20} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — hidden on mobile unless open, always visible on lg+ */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 bg-slate-900 text-white flex flex-col
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="p-5 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-wider">Invoice Manager</h1>
          <button
            className="lg:hidden text-gray-400 hover:text-white p-1"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 px-4 space-y-1 mt-2">
          <NavLinks onNavigate={() => setSidebarOpen(false)} />
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 text-gray-400 hover:text-white transition-colors w-full px-4 py-2 rounded-lg hover:bg-slate-800"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-white shadow-sm flex items-center justify-between px-4 z-20 flex-shrink-0">
          <div className="flex items-center space-x-3">
            {/* Hamburger button — only visible on mobile */}
            <button
              className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={22} />
            </button>
            <span className="text-gray-500 font-medium text-sm hidden sm:block">Dashboard</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-600 hidden sm:block">adminJ</div>
            <div className="h-8 w-8 bg-blue-100 rounded-full flex justify-center items-center text-blue-700 font-bold text-sm">
              A
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
