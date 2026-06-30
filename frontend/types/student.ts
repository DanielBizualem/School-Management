export interface StudentRegistrationInput {
    // Student fields
    email: string;
    fullName: string;
    gradeLevel: "9th Grade" | "10th Grade" | "11th Grade" | "12th Grade";
    gender: "Male" | "Female";
    
    // Parent fields
    parentName: string;
    parentPhone: string;
    parentJob: string;
    parentAddress: string;
    parentRelation: "Father" | "Mother" | "Guardian" | "Other";
}

export interface StudentRegistrationResponse {
    success: boolean;
    studentId: string;
    generatedStudentID: string; // The automated std/00001/26 structure
    temporaryPassword: string;
}