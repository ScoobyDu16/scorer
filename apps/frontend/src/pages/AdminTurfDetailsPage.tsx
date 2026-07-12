import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../lib/auth';

interface TurfDetails {
  id: string;
  name: string;
  email: string;
  phone?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstNumber?: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
  subscriptionStatus: string;
  createdAt: string;
  verifiedAt?: string;
}

interface Subscription {
  id: string;
  status: string;
  startDate?: string;
  endDate?: string;
  trialEndsAt?: string;
  plan: {
    id: string;
    name: string;
    priceMonthly?: number;
    priceYearly?: number;
  };
}

export const AdminTurfDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-turf-details', id],
    queryFn: () => adminAPI.getTurfDetails(id!),
    enabled: !!id,
  });

  const updateVerificationMutation = useMutation({
    mutationFn: (status: string) => adminAPI.updateTurfVerification(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-turf-details', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-turfs'] });
    },
  });

  const handleVerificationUpdate = (status: string) => {
    if (window.confirm(`Are you sure you want to change verification status to ${status}?`)) {
      updateVerificationMutation.mutate(status);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'SUSPENDED': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSubscriptionColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'TRIAL': return 'bg-blue-100 text-blue-800';
      case 'EXPIRED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        Failed to load turf details. Please try again.
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Turf not found</h3>
        <button
          onClick={() => navigate('/admin/turfs')}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
        >
          Back to Turfs
        </button>
      </div>
    );
  }

  const turf = data.turf as TurfDetails;
  const subscription = data.subscription as Subscription;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{turf.name}</h1>
          <p className="text-gray-600">Turf Management</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => navigate('/admin/turfs')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to Turfs
          </button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Verification Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Current Status:</span>
              <span className={`inline-flex px-3 py-1 text-sm leading-5 font-semibold rounded-full ${getStatusColor(turf.verificationStatus)}`}>
                {turf.verificationStatus}
              </span>
            </div>
            {turf.verifiedAt && (
              <div className="text-sm text-gray-600">
                Verified on: {new Date(turf.verifiedAt).toLocaleDateString()}
              </div>
            )}
            <div className="flex space-x-3">
              {turf.verificationStatus === 'PENDING' && (
                <button
                  onClick={() => handleVerificationUpdate('VERIFIED')}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200"
                  disabled={updateVerificationMutation.isPending}
                >
                  Approve
                </button>
              )}
              {turf.verificationStatus === 'VERIFIED' && (
                <button
                  onClick={() => handleVerificationUpdate('SUSPENDED')}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-orange-700 bg-orange-100 hover:bg-orange-200"
                  disabled={updateVerificationMutation.isPending}
                >
                  Suspend
                </button>
              )}
              <button
                onClick={() => handleVerificationUpdate('REJECTED')}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                disabled={updateVerificationMutation.isPending}
              >
                Reject
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Subscription Status</h3>
          {subscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Status:</span>
                <span className={`inline-flex px-3 py-1 text-sm leading-5 font-semibold rounded-full ${getSubscriptionColor(subscription.status)}`}>
                  {subscription.status}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Plan: <span className="font-medium">{subscription.plan.name}</span>
              </div>
              {subscription.plan?.priceMonthly && (
                <div className="text-sm text-gray-600">
                  Monthly: <span className="font-medium">₹{subscription.plan.priceMonthly}</span>
                </div>
              )}
              {subscription.startDate && (
                <div className="text-sm text-gray-600">
                  Started: {new Date(subscription.startDate).toLocaleDateString()}
                </div>
              )}
              {subscription.trialEndsAt && (
                <div className="text-sm text-gray-600">
                  Trial Ends: {new Date(subscription.trialEndsAt).toLocaleDateString()}
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-600">No subscription found</p>
          )}
        </div>
      </div>

      {/* Turf Details */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Turf Information</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-600">Turf Name</h4>
                <p className="text-gray-900">{turf.name}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-600">Email</h4>
                <p className="text-gray-900">{turf.email}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-600">Phone</h4>
                <p className="text-gray-900">{turf.phone || 'N/A'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-600">GST Number</h4>
                <p className="text-gray-900">{turf.gstNumber || 'N/A'}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-600">Address</h4>
                <p className="text-gray-900">{turf.addressLine1 || 'N/A'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-600">City</h4>
                <p className="text-gray-900">{turf.city || 'N/A'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-600">State</h4>
                <p className="text-gray-900">{turf.state || 'N/A'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-600">PIN Code</h4>
                <p className="text-gray-900">{turf.pincode || 'N/A'}</p>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Created:</span> {new Date(turf.createdAt).toLocaleDateString()}
              </div>
              {turf.verifiedAt && (
                <div>
                  <span className="font-medium">Verified:</span> {new Date(turf.verifiedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
