import axios from "axios";
import summeryApi, { baseURL } from "../common/summeryApi";

const Axios = axios.create({
    baseURL: baseURL,
    withCredentials: true // Crucial for cookies
});

// Request Interceptor
Axios.interceptors.request.use((config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
        config.headers.authorization = `Bearer ${accessToken}`;
    }
    return config;
});

// Response Interceptor
// utils/Axios.js - Response Interceptor
Axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // 1. Only retry if it's a 401 and we haven't already retried
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            // 2. Attempt to refresh the token
            const newAccessToken = await refreshAccessToken();
            
            if (newAccessToken) {
                // 3. Update the Authorization header for the request that failed
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                // 4. Retry the original request
                return Axios(originalRequest);
            }
        }
        return Promise.reject(error);
    }
);

const refreshAccessToken = async () => {
    try {
        const oldRefreshToken = localStorage.getItem('refreshToken');
        
        // Send the refresh token in the body, as that's safer/common
        const response = await axios.post(`${baseURL}${summeryApi.refreshToken.url}`, {
            refreshToken: oldRefreshToken 
        });

        const newAccessToken = response.data.accessToken; // Matches your new response structure
        
        if (newAccessToken) {
            localStorage.setItem('accessToken', newAccessToken);
            return newAccessToken;
        }
        return null;
    } catch (error) {
        localStorage.clear();
        window.location.href = '/login';
        return null;
    }
};

export default Axios;