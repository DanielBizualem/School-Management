'use client';

import React, { useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
    User,
    Mail,
    Calendar,
    GraduationCap,
    Users,
    Phone,
    Briefcase,
    MapPin,
    Camera,
    ArrowLeft,
    ArrowRight,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Check
} from "lucide-react";
import Axios from "@/utils/Axios";
import summeryApi from "@/common/summeryApi";

interface RegisterStudentProps {
    onSuccess: () => void;
}

type FormState = {
    email: string;
    fullName: string;
    gradeLevel: string;
    gender: "Male" | "Female";
    studentPhoto: string;
    studentDob: string;
    parentName: string;
    parentPhone: string;
    parentJob: string;
    parentAddress: string;
    parentRelation: "Father" | "Mother" | "Guardian" | "Other";
    familyPhoto: string;
    familyPersonDob: string;
    parentDob: string;
};

const INITIAL_FORM: FormState = {
    email: "", fullName: "", gradeLevel: "9th Grade", gender: "Male",
    studentPhoto: "", studentDob: "",
    parentName: "", parentPhone: "", parentJob: "", parentAddress: "", parentRelation: "Father",
    familyPhoto: "", familyPersonDob: "", parentDob: ""
};

const STEP1_REQUIRED = ["fullName", "email", "studentDob"] as const;
const STEP2_REQUIRED = ["parentName", "parentPhone", "parentJob", "parentDob", "parentAddress"] as const;

const FIELD_LABELS: Record<string, string> = {
    fullName: "Full legal name",
    email: "Email address",
    studentDob: "Date of birth",
    parentName: "Parent full name",
    parentPhone: "Contact phone",
    parentJob: "Occupation",
    parentDob: "Date of birth",
    parentAddress: "Residential address",
};

export default function RegisterStudent({ onSuccess }: RegisterStudentProps): React.JSX.Element {
    const [step, setStep] = useState(1);
    const [actionLoading, setActionLoading] = useState<boolean>(false);
    const [form, setForm] = useState<FormState>(INITIAL_FORM);
    const [errors, setErrors] = useState<{ [key: string]: boolean }>({});
    const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

    const [files, setFiles] = useState<{ studentPhoto: File | null; familyPhoto: File | null }>({
        studentPhoto: null,
        familyPhoto: null
    });

    const [previews, setPreviews] = useState<{ studentPhoto: string | null; familyPhoto: string | null }>({
        studentPhoto: null, familyPhoto: null
    });

    const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: false }));
    };

    const validateFields = (fields: readonly string[]) => {
        const newErrors: { [key: string]: boolean } = {};
        fields.forEach((field) => {
            const value = (form as any)[field];
            if (!value || !String(value).trim()) newErrors[field] = true;
        });
        if (fields.includes("email") && form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
            newErrors.email = true;
        }
        setErrors(prev => ({ ...prev, ...newErrors }));
        return Object.keys(newErrors).length === 0;
    };

    const uploadImageToCloudinary = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append("image", file); // Must match multer's upload.single("image")

        const response = await Axios({
            ...summeryApi.uploadStudentImage,
            data: formData,
        });

        if (response?.data?.success && response?.data?.url) {
            return response.data.url;
        }
        throw new Error("Failed to upload image.");
    };

    const downloadRegistrationPDF = (data: any, studentID: string, tempPassword: string, previews: any) => {
        const doc = new jsPDF();

        // Header
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.text("Onesmos Nesib High School", 105, 20, { align: "center" });
        doc.text("Registration Confirmation", 105, 28, { align: "center" });

        // Photo Boxes
        doc.setFillColor(207, 219, 229);
        doc.roundedRect(25, 40, 60, 60, 3, 3, 'F'); // Student Box
        doc.roundedRect(125, 40, 60, 60, 3, 3, 'F'); // Parent Box

        // Placeholder Text
        doc.setTextColor(150, 150, 150);
        doc.text("User Icon", 55, 70, { align: "center" });
        doc.text("Group Icon", 155, 70, { align: "center" });
        doc.setTextColor(0, 0, 0);

        // Add actual images if available
        if (previews?.studentPhoto) doc.addImage(previews.studentPhoto, 'JPEG', 25, 40, 60, 60);
        if (previews?.familyPhoto) doc.addImage(previews.familyPhoto, 'JPEG', 125, 40, 60, 60);

        // Detail Rows Generator
        const drawField = (label: string, value: string, y: number, x: number) => {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            doc.text(label, x, y);

            doc.setFillColor(225, 225, 225);
            doc.roundedRect(x + 40, y - 5, 50, 8, 1, 1, 'F');

            doc.setFont("helvetica", "normal");
            doc.text(value || "", x + 42, y + 1);
        };

        // Columns
        let y = 120;
        doc.setFontSize(14);
        doc.text("Student Details", 25, 110);
        drawField("Student ID", studentID, y, 25);
        drawField("Temp Password", tempPassword, y += 12, 25);
        drawField("Full Name", data.fullName, y += 12, 25);
        drawField("Date of Birth", data.studentDob, y += 12, 25);
        drawField("Grade", data.gradeLevel, y += 12, 25);

        doc.text("Parent / Guardian Details", 125, 110);
        y = 120;
        drawField("Parent Name", data.parentName, y, 125);
        drawField("Parent Phone", data.parentPhone, y += 12, 125);
        drawField("Relation", data.parentRelation, y += 12, 125);
        drawField("Parent Job", data.parentJob, y += 12, 125);

        // Portal Access
        doc.setFontSize(14);
        doc.text("Portal Access", 25, 185);
        doc.setFontSize(11);
        doc.text("Student Portal: http://studentportal.com", 25, 193);

        // Security Notice Box
        doc.setDrawColor(100, 100, 100);
        doc.roundedRect(25, 200, 160, 20, 2, 2, 'S');
        doc.setFont("helvetica", "bold");
        doc.text("Security Notice:", 28, 207);
        doc.setFont("helvetica", "normal");
        doc.text("Please remember that you must change your default temporary", 28, 212);
        doc.text("password upon your first successful login to the Student Portal.", 28, 217);

        doc.save(`Registration_${data.fullName.replace(/\s+/g, '_')}.pdf`);
    };

    const registerStudentAPI = async (payload: any) => {
        const response = await Axios({
            method: summeryApi.registerStudent.method,
            url: summeryApi.registerStudent.url,
            data: payload,
        });
        if (response.data.success) {
            console.log("Registration successful:", response.data);
        }
        return response.data;
    };

    const handleNext = () => {
        if (validateFields(STEP1_REQUIRED)) {
            setStep(2);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus(null);

        if (!validateFields(STEP2_REQUIRED)) return;

        setActionLoading(true);

        try {
            let studentPhotoUrl = form.studentPhoto;
            let familyPhotoUrl = form.familyPhoto;

            // 1. Upload Student Photo to Cloudinary if a new file was chosen
            if (files.studentPhoto) {
                studentPhotoUrl = await uploadImageToCloudinary(files.studentPhoto);
            }

            // 2. Upload Family Photo to Cloudinary if a new file was chosen
            if (files.familyPhoto) {
                familyPhotoUrl = await uploadImageToCloudinary(files.familyPhoto);
            }

            // 3. Prepare final submission payload with Cloudinary URLs
            const finalPayload = {
                ...form,
                studentPhoto: studentPhotoUrl,
                familyPhoto: familyPhotoUrl,
            };

            // 4. Send registered payload to backend directly via summeryApi
            const res = await registerStudentAPI(finalPayload);

            const studentID = res?.data?.customStudentID || res?.customStudentID;
            const tempPassword = res?.data?.tempPassword || res?.tempPassword;

            if (!studentID) {
                throw new Error("Student ID not found in server response.");
            }

            downloadRegistrationPDF(finalPayload, studentID, tempPassword, previews);
            setStatus({ type: "success", message: `${form.fullName} was registered successfully. Their confirmation PDF has been downloaded.` });
            onSuccess();

            setForm(INITIAL_FORM);
            setFiles({ studentPhoto: null, familyPhoto: null });
            setPreviews({ studentPhoto: null, familyPhoto: null });
            setErrors({});
            setStep(1);
        } catch (err: any) {
            console.error(err);
            setStatus({ type: "error", message: err?.response?.data?.message || "Registration failed. Please check the details and try again." });
        } finally {
            setActionLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: "studentPhoto" | "familyPhoto") => {
        const file = e.target.files?.[0];
        if (file) {
            setFiles(prev => ({ ...prev, [field]: file }));

            const reader = new FileReader();
            reader.onloadend = () => setPreviews(prev => ({ ...prev, [field]: reader.result as string }));
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 px-6 py-10 md:px-10">
            <div className="mx-auto w-full max-w-5xl">
                <div className="mb-7">
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Student registration</h1>
                    <p className="mt-1 text-sm text-slate-500">Add a new student and their parent or guardian to the system.</p>
                </div>

            <form onSubmit={handleSubmit} noValidate className="bg-white p-6 md:p-10 rounded-3xl border border-slate-200/70 shadow-sm w-full">

                {/* --- STEP INDICATOR --- */}
                <div className="flex items-center justify-center gap-3 mb-10">
                    <StepPip index={1} label="Student detail" active={step === 1} complete={step > 1} />
                    <div className={`h-px w-10 sm:w-16 transition-colors ${step > 1 ? "bg-indigo-600" : "bg-slate-200"}`} />
                    <StepPip index={2} label="Parent detail" active={step === 2} complete={false} />
                </div>

                {status && (
                    <div className={`mb-6 flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-sm ${
                        status.type === "success"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : "border-red-200 bg-red-50 text-red-700"
                    }`}>
                        {status.type === "success" ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <AlertCircle size={16} className="mt-0.5 shrink-0" />}
                        <span>{status.message}</span>
                    </div>
                )}

                {step === 1 && (
                    <div className="flex flex-col sm:flex-row gap-6">
                        <PhotoUpload
                            preview={previews.studentPhoto}
                            onChange={(e) => handleFileChange(e, "studentPhoto")}
                        />

                        <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            <Field
                                label={FIELD_LABELS.fullName}
                                icon={User}
                                error={errors.fullName}
                                errorText="Enter the student's full name"
                            >
                                <input
                                    type="text"
                                    placeholder="e.g. Amanuel Bekele"
                                    value={form.fullName}
                                    onChange={e => updateField("fullName", e.target.value)}
                                    className={inputClass(errors.fullName)}
                                />
                            </Field>

                            <Field
                                label={FIELD_LABELS.email}
                                icon={Mail}
                                error={errors.email}
                                errorText="Enter a valid email address"
                            >
                                <input
                                    type="email"
                                    placeholder="student@email.com"
                                    value={form.email}
                                    onChange={e => updateField("email", e.target.value)}
                                    className={inputClass(errors.email)}
                                />
                            </Field>

                            <Field
                                label={FIELD_LABELS.studentDob}
                                icon={Calendar}
                                error={errors.studentDob}
                                errorText="Date of birth is required"
                            >
                                <input
                                    type="date"
                                    value={form.studentDob}
                                    onChange={e => updateField("studentDob", e.target.value)}
                                    className={inputClass(errors.studentDob)}
                                />
                            </Field>

                            <Field label="Grade level" icon={GraduationCap}>
                                <select
                                    value={form.gradeLevel}
                                    onChange={e => updateField("gradeLevel", e.target.value)}
                                    className={inputClass(false)}
                                >
                                    <option value="9th Grade">9th Grade</option>
                                    <option value="10th Grade">10th Grade</option>
                                    <option value="11th Grade">11th Grade</option>
                                    <option value="12th Grade">12th Grade</option>
                                </select>
                            </Field>

                            <Field label="Gender" icon={Users}>
                                <select
                                    value={form.gender}
                                    onChange={e => updateField("gender", e.target.value as FormState["gender"])}
                                    className={inputClass(false)}
                                >
                                    <option>Male</option>
                                    <option>Female</option>
                                </select>
                            </Field>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="flex flex-col sm:flex-row gap-6">
                        <PhotoUpload
                            preview={previews.familyPhoto}
                            onChange={(e) => handleFileChange(e, "familyPhoto")}
                        />

                        <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            <Field
                                label={FIELD_LABELS.parentName}
                                icon={User}
                                error={errors.parentName}
                                errorText="Enter the parent's full name"
                            >
                                <input
                                    type="text"
                                    placeholder="e.g. Bekele Girma"
                                    value={form.parentName}
                                    onChange={e => updateField("parentName", e.target.value)}
                                    className={inputClass(errors.parentName)}
                                />
                            </Field>

                            <Field
                                label={FIELD_LABELS.parentPhone}
                                icon={Phone}
                                error={errors.parentPhone}
                                errorText="Enter a contact phone number"
                            >
                                <input
                                    type="tel"
                                    placeholder="+251 9xx xxx xxx"
                                    value={form.parentPhone}
                                    onChange={e => updateField("parentPhone", e.target.value)}
                                    className={inputClass(errors.parentPhone)}
                                />
                            </Field>

                            <Field
                                label={FIELD_LABELS.parentJob}
                                icon={Briefcase}
                                error={errors.parentJob}
                                errorText="Enter an occupation"
                            >
                                <input
                                    type="text"
                                    placeholder="e.g. Civil engineer"
                                    value={form.parentJob}
                                    onChange={e => updateField("parentJob", e.target.value)}
                                    className={inputClass(errors.parentJob)}
                                />
                            </Field>

                            <Field label="Relation to student" icon={Users}>
                                <select
                                    value={form.parentRelation}
                                    onChange={e => updateField("parentRelation", e.target.value as FormState["parentRelation"])}
                                    className={inputClass(false)}
                                >
                                    <option>Father</option>
                                    <option>Mother</option>
                                    <option>Guardian</option>
                                    <option>Other</option>
                                </select>
                            </Field>

                            <Field
                                label={FIELD_LABELS.parentDob}
                                icon={Calendar}
                                error={errors.parentDob}
                                errorText="Date of birth is required"
                            >
                                <input
                                    type="date"
                                    value={form.parentDob}
                                    onChange={e => updateField("parentDob", e.target.value)}
                                    className={inputClass(errors.parentDob)}
                                />
                            </Field>

                            <Field
                                label={FIELD_LABELS.parentAddress}
                                icon={MapPin}
                                error={errors.parentAddress}
                                errorText="Enter a residential address"
                                className="sm:col-span-2 lg:col-span-3"
                            >
                                <input
                                    type="text"
                                    placeholder="Street, city, region"
                                    value={form.parentAddress}
                                    onChange={e => updateField("parentAddress", e.target.value)}
                                    className={inputClass(errors.parentAddress)}
                                />
                            </Field>
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-3 mt-10 border-t border-slate-100 pt-6">
                    {step > 1 && (
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-white text-slate-600 font-semibold text-xs rounded-xl border border-slate-200 hover:bg-slate-50 transition"
                        >
                            <ArrowLeft size={14} />
                            Back
                        </button>
                    )}
                    {step < 2 ? (
                        <button
                            type="button"
                            onClick={handleNext}
                            className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-indigo-600 text-white font-semibold text-xs rounded-xl shadow-sm hover:bg-indigo-700 transition"
                        >
                            Next
                            <ArrowRight size={14} />
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={actionLoading}
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-semibold text-xs rounded-xl shadow-sm hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {actionLoading && <Loader2 size={14} className="animate-spin" />}
                            {actionLoading ? "Registering…" : "Complete registration"}
                        </button>
                    )}
                </div>
            </form>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------

function inputClass(hasError: boolean) {
    return `w-full p-2.5 bg-slate-50 border rounded-xl text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:bg-white focus:ring-2 ${
        hasError
            ? "border-red-300 focus:ring-red-100 focus:border-red-400"
            : "border-slate-200 focus:ring-indigo-100 focus:border-indigo-400"
    }`;
}

function Field({
    label,
    icon: Icon,
    error,
    errorText,
    className = "",
    children,
}: {
    label: string;
    icon: React.ElementType;
    error?: boolean;
    errorText?: string;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div className={className}>
            <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <Icon size={12} className="text-slate-400" />
                {label}
            </label>
            {children}
            {error && errorText && (
                <p className="mt-1 text-[11px] font-medium text-red-500">{errorText}</p>
            )}
        </div>
    );
}

function StepPip({ index, label, active, complete }: { index: number; label: string; active: boolean; complete: boolean }) {
    return (
        <div className="flex items-center gap-2">
            <div
                className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-[11px] font-bold transition-colors ${
                    active
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : complete
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-slate-200 text-slate-300"
                }`}
            >
                {complete ? <Check size={13} /> : index}
            </div>
            <span className={`text-[11px] font-semibold uppercase tracking-wide ${active ? "text-slate-900" : "text-slate-400"}`}>
                {label}
            </span>
        </div>
    );
}

function PhotoUpload({
    preview,
    onChange,
}: {
    preview: string | null;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
    return (
        <label className="group relative flex-shrink-0 w-[110px] h-[146px] rounded-2xl overflow-hidden cursor-pointer border border-dashed border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/40 transition">
            {preview ? (
                <>
                    <img src={preview} className="h-full w-full object-cover" alt="Preview" />
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/0 opacity-0 transition group-hover:bg-slate-900/50 group-hover:opacity-100">
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-white">
                            <Camera size={12} />
                            Change
                        </span>
                    </div>
                </>
            ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-center px-2">
                    <Camera size={18} className="text-slate-400" />
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        3×4 photo
                    </span>
                </div>
            )}
            <input type="file" className="hidden" accept="image/*" onChange={onChange} />
        </label>
    );
}