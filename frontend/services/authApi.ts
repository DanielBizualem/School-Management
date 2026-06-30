import Axios from "@/utils/Axios";
import summeryApi from "@/common/summeryApi";

export const loginAPI = async (credentials: any) => {
    const response = await Axios({
        method: summeryApi.login.method,
        url: summeryApi.login.url,
        data: credentials
    });
    return response.data; // Expecting data structural keys like success, token, user profile, etc.
};