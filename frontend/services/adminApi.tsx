import Axios from "@/utils/Axios";
import summeryApi from "@/common/summeryApi";

export const registerStudentAPI = async (studentData: any) => {
    const response = await Axios({
        method: summeryApi.registerStudent.method,
        url: summeryApi.registerStudent.url,
        data: studentData
    });
    return response.data;
};

export const getAllStudentsAPI = async () => {
    const response = await Axios({
        method: summeryApi.getAllStudents.method,
        url: summeryApi.getAllStudents.url
    });
    return response.data;
};

export const enrollCourseAPI = async (studentId: string, courseId: string) => {
    const response = await Axios({
        method: summeryApi.enrollCourse.method,
        url: summeryApi.enrollCourse.url,
        data: { studentId, courseId }
    });
    return response.data;
};

export const getSystemCoursesAPI = async () => {
    const response = await Axios({
        method: summeryApi.getSystemCourses.method,
        url: summeryApi.getSystemCourses.url
    });
    return response.data;
};