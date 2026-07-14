import Axios from "@/utils/Axios";
import summeryApi from "@/common/summeryApi";

export const registerStudentAPI = async (formData: FormData) => {
    const response = await Axios({
        method: summeryApi.registerStudent.method,
        url: summeryApi.registerStudent.url,
        data: formData, // Axios detects this is FormData and handles the header!
    });
    if(response.data.success){
        console.log("Registration successful:", response.data);
    }
    return response.data;
};

export const getAllStudentsAPI = async () => {
    const response = await Axios({
        method: summeryApi.getAllStudents.method,
        url: summeryApi.getAllStudents.url
    });
    return response.data.data;
};
export const getAllTeachersAPI = async () => {
    const response = await Axios({
        method: summeryApi.getAllTeachers.method,
        url: summeryApi.getAllTeachers.url
    });

   

    return response.data.data;
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

export const updateTeacherStatusAPI = async (teacherId: string, status: string) => {
    const response = await Axios({
        method: summeryApi.updateTeacher.method,
        url: summeryApi.updateTeacher.url,
        data: { teacherId, status }
    });
    return response.data;
}