
export const baseURL = "http://localhost:5000";

export const summeryApi = {
    login: {
        url: "/api/auth/login",
        method: "POST"
    },
    refreshToken: {
        url: "/api/auth/refresh",
        method: "POST"
    },
    
    // Administrative Activities & System Controls
    registerStudent: {
        url: "/api/admin/register-student", // Handles collective Student + Parent generation payload
        method: "POST"
    },
    getAllStudents: {
        url: "/api/admin/get-all-students",       // Fetches the populated student data grid roster
        method: "GET"
    },
    enrollCourse: {
        url: "/api/admin/enroll-course",     // Assigns a student record pointer to a target course ID
        method: "POST"
    },
    addCourse: {
        url: "/api/admin/add-course",          // Adds a new course to the academic directory
        method: "POST"
    },
    getSystemCourses: {
        url: "/api/admin/get-all-courses",                 // Lists available courses inside the academic directory
        method: "GET"
    },
    getAllTeachers:{
        url: "/api/admin/getAllTeachers",
        method: "GET"
    },
    registerTeacher:{
        url: "/api/admin/register-teacher",
        method: "POST"
    },
    getUserDetail:{
        url: "/api/user/getUserDetail",
        method: "POST"
    },
    updateProfile:{
        url: "/api/user/updateProfile",
        method: "PATCH"
    },
    updateTeacher:{
        url: "/api/teacher/updateTeacher",
        method: "PATCH"
    }
};

export default summeryApi;