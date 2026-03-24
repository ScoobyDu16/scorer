import React from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { 
  HomeIcon,
  BuildingOfficeIcon,
  UsersIcon,
  CreditCardIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { admin, logout } = useAdminAuth();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: HomeIcon,
      current: window.location.pathname === '/admin/dashboard'
    },
    {
      name: 'Turfs',
      href: '/admin/turfs',
      icon: BuildingOfficeIcon,
      current: window.location.pathname === '/admin/turfs'
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: UsersIcon,
      current: window.location.pathname === '/admin/users'
    },
    {
      name: 'Subscriptions',
      href: '/admin/subscriptions',
      icon: CreditCardIcon,
      current: window.location.pathname === '/admin/subscriptions'
    },
    {
      name: 'Audit Logs',
      href: '/admin/audit-logs',
      icon: ChartBarIcon,
      current: window.location.pathname === '/admin/audit-logs'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-4 bg-indigo-600">
            <h1 className="text-xl font-bold text-white">Scorer Admin</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    item.current
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                  {item.current && (
                    <ArrowRightOnRectangleIcon className="ml-auto h-5 w-5" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center">
              <UserCircleIcon className="h-8 w-8 text-gray-400 mr-3" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">{admin?.name}</p>
                <p className="text-xs text-gray-500">{admin?.role}</p>
              </div>
              <button
                onClick={logout}
                className="ml-3 flex-shrink-0 bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-64">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Platform Management</h1>
                <p className="text-sm text-gray-500">Super Admin Dashboard</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Welcome back, {admin?.name}
                </span>
                <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">
                  {admin?.role}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};
