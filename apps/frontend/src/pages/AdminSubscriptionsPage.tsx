import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { adminAuthAPI } from '../lib/admin-auth';
import { 
  CreditCardIcon, 
  PlusIcon,
  PencilIcon,
  XCircleIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

interface Plan {
  id: string;
  name: string;
  priceMonthly?: number;
  priceYearly?: number;
  featuresJson?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Subscription {
  id: string;
  turfId: string;
  planId: string;
  status: 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  startDate: string;
  endDate?: string;
  trialEndsAt?: string;
  paymentProvider?: string;
  paymentSubscriptionId?: string;
  turf: {
    id: string;
    name: string;
    email: string;
  };
  plan: Plan;
}

export const AdminSubscriptionsPage: React.FC = () => {
  const { admin } = useAdminAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'plans'>('subscriptions');
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await adminAuthAPI.getSubscriptions(1, 50);
      setSubscriptions(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await adminAuthAPI.getAllPlans();
      setPlans(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch plans');
    }
  };

  useEffect(() => {
    if (activeTab === 'subscriptions') {
      fetchSubscriptions();
    } else {
      fetchPlans();
    }
  }, [activeTab]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'TRIAL':
        return 'bg-blue-100 text-blue-800';
      case 'EXPIRED':
        return 'bg-red-100 text-red-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPrice = (price?: number) => {
    if (!price) return 'Free';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price);
  };

  const handleCreatePlan = () => {
    setEditingPlan(null);
    setShowPlanForm(true);
  };

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan(plan);
    setShowPlanForm(true);
  };

  const handleSavePlan = async (planData: Partial<Plan>) => {
    try {
      if (editingPlan) {
        await adminAuthAPI.updatePlan(editingPlan.id, planData);
      } else {
        await adminAuthAPI.createPlan(planData);
      }
      setShowPlanForm(false);
      setEditingPlan(null);
      fetchPlans();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save plan');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Subscription Management</h1>
              <p className="text-sm text-gray-500">Manage plans and subscriptions</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {admin?.name}
              </span>
              <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">
                {admin?.role}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('subscriptions')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'subscriptions'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Subscriptions
              </button>
              <button
                onClick={() => setActiveTab('plans')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'plans'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Plans
              </button>
            </nav>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'subscriptions' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Active Subscriptions</h3>
            </div>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading subscriptions...</p>
              </div>
            ) : subscriptions.length === 0 ? (
              <div className="text-center py-12">
                <CreditCardIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No subscriptions found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No active subscriptions at the moment
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Turf
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Period
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {subscriptions.map((subscription) => (
                      <tr key={subscription.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {subscription.turf.name}
                            </div>
                            <div className="text-sm text-gray-500">{subscription.turf.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{subscription.plan.name}</div>
                          <div className="text-sm text-gray-500">
                            {formatPrice(subscription.plan.priceMonthly)}/month
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(subscription.status)}`}>
                            {subscription.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(subscription.startDate).toLocaleDateString()} - 
                            {subscription.endDate ? new Date(subscription.endDate).toLocaleDateString() : 'Ongoing'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => {/* Handle subscription management */}}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'plans' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Subscription Plans</h3>
              <button
                onClick={handleCreatePlan}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Plan
              </button>
            </div>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading plans...</p>
              </div>
            ) : plans.length === 0 ? (
              <div className="text-center py-12">
                <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No plans found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Create your first subscription plan
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {plans.map((plan) => (
                  <div key={plan.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        plan.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-6">
                      <div className="text-2xl font-bold text-gray-900">
                        {formatPrice(plan.priceMonthly)}
                        <span className="text-sm font-normal text-gray-500">/month</span>
                      </div>
                      {plan.priceYearly && (
                        <div className="text-sm text-gray-500">
                          {formatPrice(plan.priceYearly)}/year
                        </div>
                      )}
                    </div>

                    {plan.featuresJson && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Features</h4>
                        <div className="text-sm text-gray-600">
                          {JSON.parse(plan.featuresJson || '{}')}
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditPlan(plan)}
                        className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
                      >
                        <PencilIcon className="h-4 w-4 mr-2" />
                        Edit
                      </button>
                      <button
                        className={`flex-1 py-2 px-4 rounded-md ${
                          plan.isActive 
                            ? 'bg-gray-600 text-white hover:bg-gray-700' 
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {plan.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Plan Form Modal */}
        {showPlanForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center pb-3 border-b">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingPlan ? 'Edit Plan' : 'Create Plan'}
                </h3>
                <button
                  onClick={() => {
                    setShowPlanForm(false);
                    setEditingPlan(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
              
              <PlanForm
                plan={editingPlan}
                onSave={handleSavePlan}
                onCancel={() => {
                  setShowPlanForm(false);
                  setEditingPlan(null);
                }}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// Plan Form Component
interface PlanFormProps {
  plan?: Plan | null;
  onSave: (plan: Partial<Plan>) => void;
  onCancel: () => void;
}

const PlanForm: React.FC<PlanFormProps> = ({ plan, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: plan?.name || '',
    priceMonthly: plan?.priceMonthly || 0,
    priceYearly: plan?.priceYearly || 0,
    featuresJson: plan?.featuresJson || '{}',
    isActive: plan?.isActive ?? true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Plan Name</label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Monthly Price (₹)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.priceMonthly}
            onChange={(e) => setFormData({ ...formData, priceMonthly: parseFloat(e.target.value) })}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Yearly Price (₹)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.priceYearly}
            onChange={(e) => setFormData({ ...formData, priceYearly: parseFloat(e.target.value) })}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Features (JSON)</label>
        <textarea
          rows={4}
          value={formData.featuresJson}
          onChange={(e) => setFormData({ ...formData, featuresJson: e.target.value })}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder='{"feature1": "description", "feature2": "description"}'
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
        <label className="ml-2 block text-sm text-gray-900">
          Active
        </label>
      </div>

      <div className="flex space-x-3 pt-4">
        <button
          type="submit"
          className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
        >
          {plan ? 'Update Plan' : 'Create Plan'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};
