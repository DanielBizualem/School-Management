
import Axios from "@/utils/Axios";
import summeryApi from "@/common/summeryApi";

export const loginAPI = async (credentials: any) => {
    const response = await Axios({
        method: summeryApi.login.method,
        url: summeryApi.login.url,
        data: credentials
    });

    if (response.data.accessToken) {
        localStorage.setItem('accessToken', response.data.accessToken);
    }
    if (response.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.refreshToken);
    }
    
    return response.data;
};
 