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

export interface UXCourseItem {
    _id: string;
    courseName: string;
    courseCode: string;
}