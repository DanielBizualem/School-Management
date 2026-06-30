import { getStudentDashboard, createNewComplaint } from "../services/studentService.js";

export const viewMyDashboard = async (req, res) => {
    // Securely pull the user ID from the validated JWT token payload
    const studentUserId = req.user.id;

    try {
        const profileData = await getStudentDashboard(studentUserId);

        return res.status(200).json({
            success: true,
            message: "Student data fetched successfully.",
            data: {
                fullName: profileData.fullName,
                studentID: profileData.studentID,
                gradeLevel: profileData.gradeLevel,
                enrolledCourses: profileData.enrolledCourses,
                grades: profileData.grades,       // Contains only their personal marks
                complaints: profileData.complaints
            }
        });

    } catch (error) {
        if (error.message === "STUDENT_PROFILE_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "Profile error: No student profile registration linked to this account token."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error occurred while loading dashboard.",
            error: error.message
        });
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