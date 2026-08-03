'use client';
import React, { useState } from 'react';
import { User, Shield, Loader2 } from 'lucide-react';
import Axios from "@/utils/Axios";
import summeryApi from "@/common/summeryApi";
import StatusModal from "@/components/StatusModal";

export default function ProfileSettings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    message: "",
    type: 'success' as 'success' | 'error'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [profileData, setProfileData] = useState({ fullName: "", phoneNumber: "" });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const handleChange = (setter: any, key: string, value: string) => {
    setter((prev: any) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" })); // Clear error for this field
  };

  const ErrorText = ({ message }: { message?: string }) =>
    message ? <p className="text-red-500 text-xs mt-1.5">{message}</p> : null;

  const handleUpdate = async (data: any, isPassword: boolean = false) => {
    let newErrors: Record<string, string> = {};

    if (isPassword) {
      if (!data.currentPassword) newErrors.currentPassword = "Required";
      if (!data.newPassword) newErrors.newPassword = "Required";
      if (data.newPassword !== data.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    } else {
      if (!data.fullName) newErrors.fullName = "Full name is required";
      if (!data.phoneNumber) newErrors.phoneNumber = "Phone number is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return; // Stop execution
    }

    setLoading(true);
    try {
      const response = await Axios({
        ...summeryApi.updateProfile,
        data: data
      });

      if (response.data.success) {
        setModalConfig({
          isOpen: true,
          message: isPassword ? "Password updated successfully!" : "Profile updated successfully!",
          type: 'success'
        });
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message === "INCORRECT_CURRENT_PASSWORD"
        ? "Your current password is incorrect."
        : "An error occurred. Please try again.";

      setModalConfig({ isOpen: true, message: errorMsg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  const inputClass = (field: string) =>
    `w-full px-4 py-2.5 border bg-slate-50 rounded-lg text-sm text-slate-900 outline-none transition focus:bg-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 ${
      errors[field] ? 'border-red-400' : 'border-slate-200'
    }`;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Account Settings</h2>
        <p className="text-sm text-slate-500 mt-1">Manage your profile information and account security</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 md:gap-10">
        {/* Tab Navigation */}
        <div className="w-full md:w-48 shrink-0">
          <div
            role="tablist"
            className="flex md:flex-col gap-1.5 sm:gap-2 overflow-x-auto md:overflow-visible pb-1 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-none border-b md:border-b-0 border-slate-100"
          >
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                role="tab"
                aria-selected={activeTab === id}
                onClick={() => setActiveTab(id)}
                className={`shrink-0 md:w-full font-medium tracking-wide text-left px-4 py-2.5 rounded-xl flex items-center gap-2.5 text-sm transition ${
                  activeTab === id
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <Icon size={17} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Form Area */}
        <div className="flex-1 min-w-0">
          {activeTab === 'profile' && (
            <div className="flex flex-col gap-5 max-w-md">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  className={inputClass('fullName')}
                  value={profileData.fullName}
                  onChange={e => handleChange(setProfileData, 'fullName', e.target.value)}
                />
                <ErrorText message={errors.fullName} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number</label>
                <input
                  type="text"
                  placeholder="Enter your phone number"
                  className={inputClass('phoneNumber')}
                  value={profileData.phoneNumber}
                  onChange={e => handleChange(setProfileData, 'phoneNumber', e.target.value)}
                />
                <ErrorText message={errors.phoneNumber} />
              </div>

              <button
                onClick={() => handleUpdate(profileData)}
                disabled={loading}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#0a2f2b] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 active:bg-slate-900 transition disabled:opacity-60 disabled:cursor-not-allowed mt-1"
              >
                {loading && <Loader2 size={15} className="animate-spin" />}
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="flex flex-col gap-5 max-w-md">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Current Password</label>
                <input
                  type="password"
                  className={inputClass('currentPassword')}
                  value={passwordData.currentPassword}
                  onChange={e => handleChange(setPasswordData, 'currentPassword', e.target.value)}
                  placeholder="Enter current password"
                />
                <ErrorText message={errors.currentPassword} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
                <input
                  type="password"
                  className={inputClass('newPassword')}
                  value={passwordData.newPassword}
                  onChange={e => handleChange(setPasswordData, 'newPassword', e.target.value)}
                  placeholder="Enter new password"
                />
                <ErrorText message={errors.newPassword} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  className={inputClass('confirmPassword')}
                  value={passwordData.confirmPassword}
                  onChange={e => handleChange(setPasswordData, 'confirmPassword', e.target.value)}
                  placeholder="Re-enter new password"
                />
                <ErrorText message={errors.confirmPassword} />
              </div>

              <button
                onClick={() => handleUpdate(passwordData, true)}
                disabled={loading}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#0a2f2b] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#233937] active:bg-teal-600 transition disabled:opacity-60 disabled:cursor-not-allowed mt-1"
              >
                {loading && <Loader2 size={15} className="animate-spin" />}
                {loading ? "Updating..." : "Update Password"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status Modal */}
      <StatusModal
        isOpen={modalConfig.isOpen}
        message={modalConfig.message}
        type={modalConfig.type}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
      />
    </div>
  );
}