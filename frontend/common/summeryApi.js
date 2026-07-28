
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
        url: "/api/director/get-all-courses",                 // Lists available courses inside the academic directory
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
        url: "/api/director/getAllCourse",
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
    },
    getStudentScoreSheetTable:{
        url: '/api/teacher/score-sheet-table',
        method: 'GET'
    },
    uploadStudentImage: {
        url: '/api/upload/image',
        method: 'post'
    },
    getParentProfile: (id) => ({
        url: `/api/student/parentProfile/${id}`,
        method: "get",
    }),
    updateParentProfile: (id) => ({
        url: `/api/student/updateParentProfile/${id}`,
        method: "PATCH",
      }),
    uploadTeacherImage: {
        url: '/api/upload/image',
        method: 'post'
    },
    assignSecondaryRole: {
        url: `${baseURL}/api/admin/add-role`,
        method: "POST"
    },
    getRegistrationStatus: {
        url: "/api/admin/registration-status",
        method: "GET"
    },
    toggleRegistration: {
        url: "/api/admin/registration-control",
        method: "POST"
    },
    submitStudentRegistration: {
        url: "/api/student/register-grade",
        method: "POST"
    },
    getStudentRegistrations: {
        url: "/api/student/registrations",
        method: "GET"
    },
    getStudentRegistrationStatus: {
        url: "/api/student/registration-status",
        method: "GET"
    },
    submitStudentRegistration: {
        url: "/api/student/register-grade",
        method: "POST"
    },
    getPendingRegistrations: {
        url: "/api/admin/pending-registrations",
        method: "GET"
    },
    approveStudentRegistration: {
        url: "/api/admin/registration-approve", // append /:id dynamically when calling
        method: "PUT"
    },
    assignHomeroomTeacher: {
        url: "/api/director/sections", // Will be combined with `/${sectionId}/homeroom-teacher`
        method: "PUT"
    },
    getAcademicYearConfig: {
        url: "/api/teacher/academic-year-configs",
        method: "GET"
    },
    getSectionRoster: {
        url: '/api/teacher/section-roster',
        method: 'get'
    }
};

export default summeryApi;