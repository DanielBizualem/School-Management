export interface CourseAnalytics {
    courseName: string;
    courseCode: string;
    averageScore: number;
}

export interface GradeLevelCohort {
    gradeLevel: "9th Grade" | "10th Grade" | "11th Grade" | "12th Grade";
    courses: CourseAnalytics[];
}

export interface GenderBreakdown {
    Male: number;
    Female: number;
}

export interface GeneralMetrics {
    totalStudents: number;
    totalTeachers: number;
    genderBreakdown: GenderBreakdown;
}

export interface StrugglingCoursesPayload {
    chartData: GradeLevelCohort[];
    aiInsights: string;
}

export interface DirectorAnalyticsResponse {
    success: boolean;
    generalMetrics: GeneralMetrics;
    strugglingCourses: StrugglingCoursesPayload;
}