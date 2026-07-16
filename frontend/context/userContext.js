'use client';
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Axios from '../utils/Axios';
import summeryApi from '../common/summeryApi';

const UserContext = createContext(undefined);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Prevent overlapping requests
  const isFetching = useRef(false);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
    document.cookie = "role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";

    setUser(null);
    window.location.href = '/login';
  }, []);

  const fetchUserDetails = useCallback(async () => {
    if (isFetching.current) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    if (!token) {
      setLoading(false);
      setUser(null);
      return;
    }

    try {
      isFetching.current = true;

      // Bust cache to avoid a stale 304
      const response = await Axios({
        ...summeryApi.getUserDetail,
        url: `${summeryApi.getUserDetail.url}?t=${Date.now()}`,
      });
      
      if (response.data.success) {
        const userData = response.data.data.user ?? response.data.data;
        setUser((prev) =>
          JSON.stringify(prev) === JSON.stringify(userData) ? prev : userData
        );
      } else {
        handleLogout();
      }
    } catch (error) {
      console.error("Auth Error:", error?.response?.data?.message || error.message);
      handleLogout();
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [handleLogout]);

  useEffect(() => {
    fetchUserDetails();
    // Runs once on mount by design
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, fetchUserDetails, loading, handleLogout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};