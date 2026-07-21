export interface UXParentProfile {
    fullName: string;
    phoneNumber: string;
    jobType: string;
    address: string;
    relation: "Father" | "Mother" | "Guardian" | "Other";
}

export interface UXStudentRecord {
    _id: string;
    fullName: string;
    studentID: string; 
    email: string;
    gradeLevel: string;
    gender: "Male" | "Female";
    familyProfile: UXParentProfile;
    enrolledCourses: string[];
}
export interface UXTeacherRecord {
    _id: string;
    fullName: string;
    teacherID: string;
    email: string;
    subject: string;
    phoneNumber?: string;
    department?: string; // Optional if you have a separate department profile
    // Add other fields returned by your API here
}
export interface UXCourseItem {
    _id: string;
    courseName: string;
    courseCode: string;
    gradeLevel: string[];
}

export interface UXDepartmentProfile {
    _id: string;
    departmentName: string;
    headOfDepartment: string;
    contactEmail: string;
    contactPhone?: string;
    // Add other fields returned by your API here
}