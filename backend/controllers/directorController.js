import { getSystemAnalytics, trackTeacherAttendance, generateGlobalRoster } from "../services/directorService.js";

export const viewDashboardAnalytics = async (req, res) => {
    try {
        const metrics = await getSystemAnalytics();
        res.status(200).json(metrics);
    } catch (err) {
        res.status(500).json({ error: err.message });
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