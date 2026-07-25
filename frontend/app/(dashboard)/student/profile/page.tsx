'use client';

import React, { useEffect, useState } from "react";
import { Users, GraduationCap, X } from "lucide-react";
import Axios from "@/utils/Axios";
import summeryApi from "@/common/summeryApi";

interface SectionRecord {
  _id: string;
  sectionName: string;
  gradeLevel: string;
}

interface StudentProfileData {
  fullName: string;
  studentID: string;
  gradeLevel: string;
  gender: string;
  studentDob: string;
  studentPhoto?: string;
  status?: string;
  academicYear?: string;
  enrolledSections?: SectionRecord[];
  familyProfile?: string; // reference ID — resolve via a separate API call
}

interface ParentProfileData {
  fullName: string;
  relation: "Father" | "Mother" | "Guardian" | "Other";
  phoneNumber: string;
  jobType: string;
  address: string;
  familyPersonDob?: string;
  familyPhoto?: string;
}

type TabKey = "student" | "parent";

interface ProfileField {
  label: string;
  value: string | undefined;
}

// Config for the editable form fields — separate from display fields
// since editing needs a `key` (to build the payload) and an input type.
type EditFieldType = "text" | "date" | "select";

interface EditFieldConfig {
  key: string;
  label: string;
  type: EditFieldType;
  options?: string[];
}

const STUDENT_EDIT_FIELDS: EditFieldConfig[] = [
  { key: "fullName", label: "Full Name", type: "text" },
  { key: "gradeLevel", label: "Grade Level", type: "text" },
  { key: "academicYear", label: "Academic Year", type: "text" },
  { key: "gender", label: "Gender", type: "select", options: ["Male", "Female"] },
  { key: "studentDob", label: "Date Of Birth", type: "date" },
];

const PARENT_EDIT_FIELDS: EditFieldConfig[] = [
  { key: "fullName", label: "Full Name", type: "text" },
  { key: "relation", label: "Relation", type: "select", options: ["Father", "Mother", "Guardian", "Other"] },
  { key: "phoneNumber", label: "Phone Number", type: "text" },
  { key: "jobType", label: "Job Type", type: "text" },
  { key: "address", label: "Address", type: "text" },
  { key: "familyPersonDob", label: "Date Of Birth", type: "date" },
];

const PLACEHOLDER_PARENT: ParentProfileData = {
  fullName: "",
  relation: "Other",
  phoneNumber: "",
  jobType: "",
  address: "",
};

function initials(name = ""): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

function formatDate(d?: string): string | undefined {
  if (!d) return undefined;
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// yyyy-mm-dd for <input type="date">
function toDateInputValue(d?: string): string {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

// Inline "Label: value" row, matching the reference layout
function Field({ label, value }: ProfileField) {
  return (
    <p className="text-sm text-slate-700 leading-relaxed">
      <span className="font-semibold text-slate-900">{label}:</span>{" "}
      <span>{value || "—"}</span>
    </p>
  );
}

function Photo({ name, src }: { name?: string; src?: string }) {
  return (
    <div className="w-40 h-48 md:w-44 md:h-52 border border-slate-300 rounded-sm bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-2xl font-semibold text-slate-400">{initials(name)}</span>
      )}
    </div>
  );
}

interface ProfileCardProps {
  name?: string;
  photo?: string;
  fields: ProfileField[];
  onEdit: () => void;
}

// Two-column ID-card style profile: photo left, fields right, edit footer
function ProfileCard({ photo, name, fields, onEdit }: ProfileCardProps) {
  const mid = Math.ceil(fields.length / 2);
  const colOne = fields.slice(0, mid);
  const colTwo = fields.slice(mid);

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-8">
          <Photo name={name} src={photo} />
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4">
            <div className="flex flex-col gap-4">
              {colOne.map((f) => (
                <Field key={f.label} {...f} />
              ))}
            </div>
            <div className="flex flex-col gap-4">
              {colTwo.map((f) => (
                <Field key={f.label} {...f} />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="bg-slate-50 border-t border-slate-200 px-6 md:px-8 py-3">
        <button
          onClick={onEdit}
          className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
        >
          Edit
        </button>
      </div>
    </div>
  );
}

function SkeletonLine({ width = "w-3/4" }: { width?: string }) {
  return <div className={`h-3.5 rounded bg-slate-200 animate-pulse ${width}`} />;
}

function LoadingState() {
  const leftLines = ["w-1/2", "w-2/3", "w-1/3", "w-3/4"];
  const rightLines = ["w-1/3", "w-2/3", "w-1/2", "w-3/4"];

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="bg-white border border-slate-200 rounded-lg mb-4 px-2">
        <div className="flex items-center gap-1 py-3 px-2">
          <div className="h-4 w-28 rounded bg-slate-200 animate-pulse" />
          <div className="h-4 w-28 rounded bg-slate-200 animate-pulse ml-4" />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-40 h-48 md:w-44 md:h-52 rounded-sm bg-slate-200 animate-pulse shrink-0" />
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4">
              <div className="flex flex-col gap-5">
                {leftLines.map((w, i) => (
                  <SkeletonLine key={i} width={w} />
                ))}
              </div>
              <div className="flex flex-col gap-5">
                {rightLines.map((w, i) => (
                  <SkeletonLine key={i} width={w} />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-slate-50 border-t border-slate-200 px-6 md:px-8 py-3">
          <div className="h-3.5 w-10 rounded bg-slate-200 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="w-full max-w-5xl mx-auto p-10 text-center rounded-lg border border-dashed border-slate-300">
      <p className="text-sm font-medium text-slate-600">No profile data available</p>
      <p className="text-xs text-slate-400 mt-1">
        This account isn't linked to a student record yet.
      </p>
    </div>
  );
}

interface TopNavProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

function TopNav({ active, onChange }: TopNavProps) {
  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "student", label: "Student Profile", icon: <GraduationCap size={15} /> },
    { key: "parent", label: "Parent Profile", icon: <Users size={15} /> },
  ];
  const activeLabel = tabs.find((t) => t.key === active)?.label;

  return (
    <div className="bg-white border border-slate-200 rounded-lg mb-4 px-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                active === tab.key
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
        <span className="hidden sm:block text-xs text-slate-400 pr-3">
          Viewing: {activeLabel}
        </span>
      </div>
    </div>
  );
}

interface EditModalProps {
  title: string;
  fields: EditFieldConfig[];
  initialValues: Record<string, string>;
  saving: boolean;
  error: string | null;
  onCancel: () => void;
  onSave: (values: Record<string, string>) => void;
}

function EditModal({ title, fields, initialValues, saving, error, onCancel, onSave }: EditModalProps) {
  const [values, setValues] = useState<Record<string, string>>(initialValues);

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(values);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-lg border border-slate-200 w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-5 py-4 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                {error}
              </p>
            )}

            {fields.map((f) => (
              <div key={f.key} className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">{f.label}</label>
                {f.type === "select" ? (
                  <select
                    value={values[f.key] ?? ""}
                    onChange={(e) => handleChange(f.key, e.target.value)}
                    className="text-sm border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  >
                    {(f.options || []).map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={f.type}
                    value={values[f.key] ?? ""}
                    onChange={(e) => handleChange(f.key, e.target.value)}
                    className="text-sm border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-200 bg-slate-50">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="text-sm px-4 py-2 rounded border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="text-sm px-4 py-2 rounded bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StudentParentProfile() {
  const [student, setStudent] = useState<StudentProfileData | null>(null);
  const [parent, setParent] = useState<ParentProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabKey>("student");
  const [editTarget, setEditTarget] = useState<TabKey | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fetchDetail = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await Axios({ ...summeryApi.getUserDetail });
      const data: StudentProfileData = response.data.data;
      setStudent(data);

      if (data.familyProfile) {
        try {
          const parentRes = await Axios({
            ...summeryApi.getParentProfile(data.familyProfile),
          });
          setParent(parentRes.data.data);
        } catch (parentError) {
          console.error("Failed to fetch parent profile", parentError);
          setParent(PLACEHOLDER_PARENT);
        }
      } else {
        setParent(PLACEHOLDER_PARENT);
      }
    } catch (error) {
      console.error("Failed to fetch profile details", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, []);

  const handleSaveStudent = async (values: Record<string, string>) => {
    if (!student) return;
    try {
      setSaving(true);
      setSaveError(null);
      await Axios({ ...summeryApi.updateProfile, data: values });
      setStudent({ ...student, ...values });
      setEditTarget(null);
    } catch (error) {
      console.error("Failed to update student profile", error);
      setSaveError("Couldn't save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveParent = async (values: Record<string, string>) => {
    if (!student?.familyProfile) return;
    try {
      setSaving(true);
      setSaveError(null);
      // Assumes an updateParentProfile entry in summeryApi — see the
      // integration notes at the top of this file.
      await Axios({
        ...summeryApi.updateParentProfile(student.familyProfile),
        data: values,
      });
      setParent((prev) => (prev ? { ...prev, ...values } as ParentProfileData : prev));
      setEditTarget(null);
    } catch (error) {
      console.error("Failed to update parent profile", error);
      setSaveError("Couldn't save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState />;
  if (!student) return <EmptyState />;

  const sectionText: string =
    student.enrolledSections && student.enrolledSections.length > 0
      ? student.enrolledSections.map((s) => s.sectionName).join(", ")
      : "Not assigned";

  const studentFields: ProfileField[] = [
    { label: "User", value: student.studentID },
    { label: "Full Name", value: student.fullName },
    { label: "Grade", value: student.gradeLevel +'th' },
    { label: "Section", value: sectionText },
    { label: "Academic Year", value: student.academicYear },
    { label: "Gender", value: student.gender },
    { label: "Date Of Birth", value: formatDate(student.studentDob) },
  ];

  const parentFields: ProfileField[] = [
    { label: "Full Name", value: parent?.fullName },
    { label: "Relation", value: parent?.relation },
    { label: "Phone Number", value: parent?.phoneNumber },
    { label: "Job Type", value: parent?.jobType },
    { label: "Address", value: parent?.address },
    { label: "Date Of Birth", value: formatDate(parent?.familyPersonDob) },
  ];

  const studentInitialValues: Record<string, string> = {
    fullName: student.fullName || "",
    gradeLevel: student.gradeLevel || "",
    academicYear: student.academicYear || "",
    gender: student.gender || "Male",
    studentDob: toDateInputValue(student.studentDob),
  };

  const parentInitialValues: Record<string, string> = {
    fullName: parent?.fullName || "",
    relation: parent?.relation || "Other",
    phoneNumber: parent?.phoneNumber || "",
    jobType: parent?.jobType || "",
    address: parent?.address || "",
    familyPersonDob: toDateInputValue(parent?.familyPersonDob),
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <TopNav active={activeTab} onChange={setActiveTab} />

      {activeTab === "student" && (
        <ProfileCard
          name={student.fullName}
          photo={student.studentPhoto}
          fields={studentFields}
          onEdit={() => {
            setSaveError(null);
            setEditTarget("student");
          }}
        />
      )}

      {activeTab === "parent" && (
        <ProfileCard
          name={parent?.fullName}
          photo={parent?.familyPhoto}
          fields={parentFields}
          onEdit={() => {
            setSaveError(null);
            setEditTarget("parent");
          }}
        />
      )}

      {editTarget === "student" && (
        <EditModal
          title="Edit Student Profile"
          fields={STUDENT_EDIT_FIELDS}
          initialValues={studentInitialValues}
          saving={saving}
          error={saveError}
          onCancel={() => setEditTarget(null)}
          onSave={handleSaveStudent}
        />
      )}

      {editTarget === "parent" && (
        <EditModal
          title="Edit Parent Profile"
          fields={PARENT_EDIT_FIELDS}
          initialValues={parentInitialValues}
          saving={saving}
          error={saveError}
          onCancel={() => setEditTarget(null)}
          onSave={handleSaveParent}
        />
      )}
    </div>
  );
}