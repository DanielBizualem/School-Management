
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
        method: "get"
    },
    updateProfile:{
        url: "/api/user/updateProfile",
        method: "PATCH"
    },
    updateTeacher:{
        url: "/api/admin/updateTeacher",
        method: "PATCH"
    },
    getAllCourses:{
        url: "/api/admin/getAllCourse",
        method: "GET"
    },
    addCourse:{
        url: "/api/admin/registerCourse",
        method: "POST"
    },
    getTranscript:{
        url: "/api/student/transcript",
        method: "GET"
    },
    getTeacherCourses: {
        url: `/api/teacher/courses`,
        method: "GET"
    },
    getStudentsByCourse: {
        url: `/api/teacher/courseStudent`,
        method: "GET"
    },
    updateStudentGrades: {
        url: `/api/teacher/updateGrade`,
        method: "POST"
    },
    assignTeacher:{
        url: '/api/admin/assignTeacher',
        method: "POST"
    },
    getAllClassSection:{
        url: '/api/admin/getAllClassSection',
        method: "GET"
    },
    createClassSection:{
        url: '/api/admin/createClassSection',
        method: "POST"
    },
    updateStudentGrade:{
        url: '/api/teacher/update-grade',
        method: 'PATCH'
    },
    saveMaxScore:{
        url: '/api/teacher/maxScore',
        method: 'POST'
    },
    viewScore:{
        url: '/api/student/viewScore',
        method: 'GET'
    },
    getTeacherAssigned:{
        url:'/api/teacher/teacherDetail',
        method: 'GET'
    },
    getMaxScore:{
        url: '/api/teacher/getMaxScore',
        method: 'GET'
    },
    getStudentScoresForTeacher:{
        url: '/api/teacher/viewScore',
        method: 'GET'
    },
    studentAnalytics:{
        url: '/api/teacher/analytics',
        method: 'GET'
    },
    getCourseAndSection:{
        url: '/api/teacher/courseSections',
        method: 'GET'
    }
};

export default summeryApi;