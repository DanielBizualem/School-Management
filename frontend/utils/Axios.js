import axios from 'axios';
import summeryApi, { baseURL } from "../common/summeryApi";

const Axios = axios.create({
    baseURL: baseURL,
    withCredentials: true
});

// Request Interceptor
Axios.interceptors.request.use(
    (config) => {
        if (typeof window !== "undefined") {
            const accessToken = localStorage.getItem('accessToken');
            if (accessToken) {
                config.headers.Authorization = `Bearer ${accessToken}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor
Axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originRequest = error.config;

        if (error.response && error.response.status === 401 && !originRequest._retry) {
            originRequest._retry = true; 

            if (typeof window !== "undefined") {
                const refreshToken = localStorage.getItem('refreshToken');
                
                if (refreshToken) {
                    const newAccessToken = await refreshAccessToken(refreshToken);
                    if (newAccessToken) {
                        originRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                        return Axios(originRequest);
                    }
                }
            }
        }
        return Promise.reject(error);
    }
);

// Core Token Refresh Helper Function
const refreshAccessToken = async (refreshToken) => {
    try {
        const response = await axios({
            method: summeryApi.refreshToken.method,
            url: `${baseURL}${summeryApi.refreshToken.url}`,
            headers: {
                Authorization: `Bearer ${refreshToken}`
            }
        });

        const accessToken = response.data?.data?.accessToken;
        
        if (accessToken) {
            localStorage.setItem('accessToken', accessToken);
            return accessToken;
        }
        
        return null;
    } catch (error) {
        console.error("Refresh operations failed. Flushing credentials:", error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        return null;
    }
};

export default Axios;