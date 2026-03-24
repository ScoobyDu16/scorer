import React from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { adminAuthAPI } from '../lib/admin-auth';
import { 
  ChartBarIcon, 
  BuildingOfficeIcon, 
  UsersIcon, 
  CreditCardIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalTurfs: number;
  activeAdmins: number;
  turfsByVerificationStatus: {
    PENDING: number;
    VERIFIED: number;
    REJECTED: number;
    SUSPENDED: number;
  };
}

export const AdminDashboardPage: React.FC = () => {
  const { admin, logout } = useAdminAuth();
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminAuthAPI.getDashboardStats();
        setStats(response.data.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch dashboard stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total Turfs',
      value: stats?.totalTurfs || 0,
      icon: BuildingOfficeIcon,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Active Admins',
      value: stats?.activeAdmins || 0,
      icon: UsersIcon,
      color: 'bg-green-500',
      change: '+5%',
      changeType: 'positive'
    },
    {
      title: 'Pending Verifications',
      value: stats?.turfsByVerificationStatus?.PENDING || 0,
      icon: ClockIcon,
      color: 'bg-yellow-500',
      change: '-2%',
      changeType: 'negative'
    },
    {
      title: 'Verified Turfs',
      value: stats?.turfsByVerificationStatus?.VERIFIED || 0,
      icon: CheckCircleIcon,
      color: 'bg-emerald-500',
      change: '+8%',
      changeType: 'positive'
    }
  ];

  const quickActions = [
    {
      title: 'Manage Turfs',
      description: 'View and verify turf registrations',
      icon: BuildingOfficeIcon,
      link: '/admin/turfs',
      color: 'bg-blue-600'
    },
    {
      title: 'Manage Users',
      description: 'View and manage user accounts',
      icon: UsersIcon,
      link: '/admin/users',
      color: 'bg-green-600'
    },
    {
      title: 'Subscriptions',
      description: 'Manage subscription plans and billing',
      icon: CreditCardIcon,
      link: '/admin/subscriptions',
      color: 'bg-purple-600'
    },
    {
      title: 'Audit Logs',
      description: 'View system activity and logs',
      icon: ChartBarIcon,
      link: '/admin/audit-logs',
      color: 'bg-gray-600'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto" />
          <p className="mt-4 text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
              <p className="text-sm text-gray-500">Platform Management</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {admin?.name}
              </span>
              <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">
                {admin?.role}
              </span>
              <button
                onClick={logout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, index) => (
            <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 ${card.color} rounded-md p-3`}>
                    <card.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {card.title}
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        {card.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <span className={`font-medium ${
                    card.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {card.change}
                  </span>
                  <span className="text-gray-500"> from last month</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.link}
                className={`${action.color} rounded-lg p-6 text-white hover:opacity-90 transition-opacity`}
              >
                <action.icon className="h-8 w-8 mb-3" />
                <h3 className="text-lg font-medium">{action.title}</h3>
                <p className="text-sm opacity-90 mt-1">{action.description}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Platform Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-3">
                  <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.totalTurfs || 0}
                </p>
                <p className="text-sm text-gray-500">Total Turfs</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg mx-auto mb-3">
                  <ClockIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.turfsByVerificationStatus?.PENDING || 0}
                </p>
                <p className="text-sm text-gray-500">Pending Verification</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-3">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.turfsByVerificationStatus?.VERIFIED || 0}
                </p>
                <p className="text-sm text-gray-500">Verified Turfs</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
