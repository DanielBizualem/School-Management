import { getStudentDashboard, createNewComplaint } from "../services/studentService.js";

export const viewGradesAndProfile = async (req, res) => {
    try {
        const profile = await getStudentDashboard(req.user.id);
        res.status(200).json(profile);
    } catch (err) {
        res.status(404).json({ error: err.message });
    }
};

export const fileComplaint = async (req, res) => {
    try {
        const activeComplaints = await createNewComplaint(req.user.id, req.body);
        res.status(201).json({ message: "Complaint logged as Pending", activeComplaints });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};