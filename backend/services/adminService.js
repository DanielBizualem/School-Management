import { User } from "../models/User.js";
import { TeacherProfile } from "../models/TeacherProfile.js";
import { Course } from "../models/Course.js";
import bcrypt from "bcrypt";
import crypto from "crypto";

// Internal helper to handle user creation base logic
const createBaseUser = async (email, role) => {
    const emailExists = await User.findOne({ email });
    if (emailExists) throw new Error("EMAIL_EXISTS");

    const tempPassword = crypto.randomBytes(4).toString("hex");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    const account = await User.create({
        email,
        password: hashedPassword,
        role,
        isFirstLogin: true
    });

    return { account, tempPassword };
};

export const createTeacherAccount = async ({ email, fullName, phone, department }) => {
    const { account, tempPassword } = await createBaseUser(email, "teacher");
    
    const profile = await TeacherProfile.create({
        user: account._id,
        fullName,
        phone,
        department,
        assignedCourses: [],
        attendanceLog: []
    });

    return { id: profile._id, tempPassword };
};

export const createDirectorAccount = async ({ email }) => {
    const { account, tempPassword } = await createBaseUser(email, "director");
    return { id: account._id, tempPassword };
};

export const createNewCourse = async ({ courseName, courseCode, teacherId }) => {
    // 1. Validation: Ensure the course code is unique
    const codeExists = await Course.findOne({ courseCode });
    if (codeExists) throw new Error("COURSE_CODE_EXISTS");

    // 2. Validation: Ensure the assigned teacher actually exists
    const teacher = await TeacherProfile.findById(teacherId);
    if (!teacher) throw new Error("TEACHER_NOT_FOUND");

    // 3. Create the course document and map it to the teacher
    const newCourse = await Course.create({ 
        courseName, 
        courseCode, 
        teacher: teacherId 
    });

    // 4. Update the teacher's profile array to include this new course
    teacher.assignedCourses.push(newCourse._id);
    await teacher.save();

    return newCourse;
};