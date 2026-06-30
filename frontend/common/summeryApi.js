export const baseURL = "http://localhost:5000";

const summeryApi = {
    login: {
        url: "/api/auth/login",
        method: "POST"
    },
    refreshToken: {
        url: "/api/auth/refresh-token",
        method: "POST"
    },
    
    // Administrative Activities & System Controls
    registerStudent: {
        url: "/api/admin/register-student", // Handles collective Student + Parent generation payload
        method: "POST"
    },
    getAllStudents: {
        url: "/api/admin/students",         // Fetches the populated student data grid roster
        method: "GET"
    },
    enrollCourse: {
        url: "/api/admin/enroll-course",     // Assigns a student record pointer to a target course ID
        method: "POST"
    },
    getSystemCourses: {
        url: "/api/courses",                 // Lists available courses inside the academic directory
        method: "GET"
    }
};

export default summeryApi;