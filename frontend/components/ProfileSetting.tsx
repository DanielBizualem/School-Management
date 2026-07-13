'use client';
import React, { useState } from 'react';
import { User, Shield } from 'lucide-react';
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
    message ? <p className="text-red-500 text-xs mt-1">{message}</p> : null;

  const handleUpdate = async (data: any, isPassword: boolean = false) => {
      let newErrors: Record<string, string> = {};
      // 1. Client-side Validation for Password
      if (isPassword && data.newPassword !== data.confirmPassword) {
        setModalConfig({ isOpen: true, message: "New password and confirm password do not match.", type: 'error' });
        return;
      }
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
      // 2. Map Backend Errors
      const errorMsg = error.response?.data?.message === "INCORRECT_CURRENT_PASSWORD" 
        ? "Your current password is incorrect." 
        : "An error occurred. Please try again.";
      
      setModalConfig({ isOpen: true, message: errorMsg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Account Settings</h2>
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-48 space-y-2">
          <button onClick={() => setActiveTab('profile')} className={`w-full font-Ubuntu tracking-wide text-left px-4 py-2 rounded-xl flex items-center gap-3 ${activeTab === 'profile' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'} text-md`}>
            <User size={18} /> Profile
          </button>
          <button onClick={() => setActiveTab('security')} className={`w-full text-left px-4 py-2 rounded-xl flex items-center gap-3 ${activeTab === 'security' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'} text-md`}>
            <Shield size={18} /> Security
          </button>
        </div>

        {/* Form Area */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="flex flex-col space-y-4">
              <div className="space-y-4">
                <div>
                  <input 
                    type="text" 
                    placeholder="Full Name" 
                    className={`px-4 py-2.5 border w-70 bg-slate-50 border-slate-200 rounded-lg text-sm outline-none ${errors.fullName ? 'border-red-500' : 'border-slate-300'}`} 
                    onChange={e => handleChange(setProfileData, 'fullName', e.target.value)} 
                  />
                  <ErrorText message={errors.fullName} />
                </div>

                <div>
                  <input 
                    type="text" 
                    placeholder="Phone Number" 
                    className={`px-4 py-2.5 border w-70 bg-slate-50 border-slate-200 rounded-lg text-sm outline-none ${errors.phoneNumber ? 'border-red-500' : 'border-slate-300'}`} 
                    onChange={e => handleChange(setProfileData, 'phoneNumber', e.target.value)} 
                  />
                  <ErrorText message={errors.phoneNumber} />
                </div>
              </div>
              <button onClick={() => handleUpdate(profileData)} disabled={loading} className="bg-slate-900 text-white px-6 py-2 rounded-lg hover:bg-slate-800 transition w-50">
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4 flex flex-col">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                <input 
                  type="password" 
                  className={`px-4 py-2.5 border w-70 bg-slate-50 border-slate-200 rounded-lg text-sm outline-none ${errors.currentPassword ? 'border-red-500' : 'border-slate-300'}`} 
                  onChange={e => handleChange(setPasswordData, 'currentPassword', e.target.value)}
                  placeholder='Current Password' 
                />
                <ErrorText message={errors.currentPassword} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                <input 
                  type="password" 
                  className={`px-4 py-2.5 border w-70 bg-slate-50 border-slate-200 rounded-lg text-sm outline-none ${errors.newPassword ? 'border-red-500' : 'border-slate-300'}`} 
                  onChange={e => handleChange(setPasswordData, 'newPassword', e.target.value)} 
                  placeholder='New Password'
                />
                <ErrorText message={errors.newPassword} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                <input 
                  type="password" 
                  className={`px-4 py-2.5 border w-70 bg-slate-50 border-slate-200 rounded-lg text-sm outline-none ${errors.confirmPassword ? 'border-red-500' : 'border-slate-300'} `} 
                  onChange={e => handleChange(setPasswordData, 'confirmPassword', e.target.value)} 
                  placeholder='Confirm New Password'
                />
                <ErrorText message={errors.confirmPassword} />
              </div>
              <button onClick={() => handleUpdate(passwordData, true)} disabled={loading} className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition w-50">
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