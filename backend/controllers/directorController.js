import { getSystemAnalytics, trackTeacherAttendance, generateGlobalRoster,getStrugglingCoursesByGrade } from "../services/directorService.js";

export const viewDashboardAnalytics = async (req, res) => {
    try {
        // Run both service operations concurrently to keep response times fast
        const [metrics, strugglingCoursesData] = await Promise.all([
            getSystemAnalytics(),
            getStrugglingCoursesByGrade()
        ]);

        // Combine everything into a clean, unified response object
        return res.status(200).json({
            success: true,
            generalMetrics: metrics,                 // Your old analytics data stays intact
            strugglingCourses: strugglingCoursesData  // Your new grade-separated chart data
        });
    } catch (err) {
        return res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
};

export const logTeacherAttendance = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const log = await trackTeacherAttendance(teacherId, req.body);
        res.status(200).json({ message: "Attendance tracked successfully", log });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const downloadRosterData = async (req, res) => {
    try {
        const roster = await generateGlobalRoster();
        res.status(200).json(roster);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};