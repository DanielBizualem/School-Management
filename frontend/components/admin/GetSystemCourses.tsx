'use client';

import React from "react";
import { UXCourseItem } from "@/types/uxAdmin";

interface GetSystemCoursesProps {
    courses: UXCourseItem[];
}

export default function GetSystemCourses({ courses }: GetSystemCoursesProps): React.JSX.Element {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.length === 0 ? (
                <p className="text-xs text-slate-400 font-medium col-span-full text-center py-4">No tracks available in the catalog.</p>
            ) : (
                courses.map((course) => (
                    <div key={course._id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex flex-col justify-between">
                        <div>
                            <span className="font-mono text-2xs font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md">
                                {course.courseCode}
                            </span>
                            <h4 className="text-sm font-bold text-slate-800 mt-3">{course.courseName}</h4>
                        </div>
                        <div className="text-2xs text-slate-400 mt-4 border-t border-slate-50 pt-2 font-medium">Department Core Unit</div>
                    </div>
                ))
            )}
        </div>
    );
}