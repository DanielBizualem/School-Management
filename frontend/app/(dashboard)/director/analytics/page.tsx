"use client";

import React, { useEffect, useRef, useState, useId } from 'react';
import Axios from '@/utils/Axios';
import summeryApi from '@/common/summeryApi';
import {
  GraduationCap,
  Trophy,
  Target,
  TrendingUp,
  TrendingDown,
  Users,
  ChevronDown,
} from 'lucide-react';

interface BestClass {
  sectionId: string;
  sectionName: string;
  gradeLevel: string;
  averageScore: number;
  totalStudents: number;
}

interface CourseStat {
  courseId: string;
  courseName: string;
  averageScore: number;
  passCount: number;
  failCount: number;
  totalEvaluated: number;
  passRate: number;
}

interface AnalyticsData {
  bestClass: BestClass | null;
  bestCourses: CourseStat[];
  worstCourses: CourseStat[];
  additionalInsights: {
    overallSchoolPassRate: number;
    totalSectionsEvaluated: number;
    sectionRankings: BestClass[];
  };
}

const COLORS = {
  ink: '#12213B',
  sub: '#6B7A99',
  paper: '#F4F6FB',
  card: '#FFFFFF',
  line: '#E7EBF3',
  emerald: '#1FAE7A',
  emeraldSoft: '#E4F6EE',
  azure: '#3568E8',
  azureSoft: '#E9EFFE',
  violet: '#7C5CF0',
  violetSoft: '#F0ECFE',
  amber: '#DE9A2E',
  amberSoft: '#FBF0DD',
  rose: '#E0546B',
  roseSoft: '#FBE7EA',
};

function Gauge({
  value,
  max = 100,
  size = 128,
  stroke = 10,
  color,
  trackColor,
}: {
  value: number;
  max?: number;
  size?: number;
  stroke?: number;
  color: string;
  trackColor: string;
}) {
  const uid = useId();
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(1, max === 0 ? 0 : value / max));
  const offset = circumference * (1 - pct);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id={`grad-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.65" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
      </defs>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={trackColor}
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={`url(#grad-${uid})`}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(0.4,0,0.2,1)' }}
      />
    </svg>
  );
}

function GaugeStat({
  value,
  suffix = '%',
  size,
}: {
  value: number;
  suffix?: string;
  size: number;
}) {
  const big = size >= 120;
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center"
      style={{ color: COLORS.ink }}
    >
      <span className={big ? 'text-3xl font-bold tracking-tight' : 'text-xl font-bold tracking-tight'}>
        {value.toFixed(1)}
        <span className="text-sm font-semibold align-top ml-0.5" style={{ color: COLORS.sub }}>
          {suffix}
        </span>
      </span>
    </div>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-[11px] font-semibold uppercase tracking-[0.12em]"
      style={{ color: COLORS.sub }}
    >
      {children}
    </span>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        className="block text-[10px] font-semibold uppercase tracking-[0.12em] mb-1.5"
        style={{ color: COLORS.sub }}
      >
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none pl-3 pr-8 py-2 text-sm font-medium rounded-lg outline-none cursor-pointer"
          style={{
            color: COLORS.ink,
            background: COLORS.paper,
            border: `1px solid ${COLORS.line}`,
          }}
        >
          {children}
        </select>
        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"
          style={{ color: COLORS.sub }}
        />
      </div>
    </div>
  );
}

function CourseRow({
  rank,
  course,
  tone,
}: {
  rank: number;
  course: CourseStat;
  tone: 'good' | 'bad';
}) {
  const good = tone === 'good';
  const accent = good ? COLORS.emerald : COLORS.rose;
  const soft = good ? COLORS.emeraldSoft : COLORS.roseSoft;
  const metricValue = good ? course.passRate : 100 - course.passRate;

  return (
    <div className="flex items-center gap-3 py-3" style={{ borderTop: `1px solid ${COLORS.line}` }}>
      <span
        className="flex-none w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold"
        style={{ background: soft, color: accent }}
      >
        {rank}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold truncate" style={{ color: COLORS.ink }}>
          {course.courseName}
        </p>
        <p className="text-xs mt-0.5" style={{ color: COLORS.sub }}>
          {good
            ? `${course.passCount} of ${course.totalEvaluated} passed`
            : `${course.failCount} of ${course.totalEvaluated} failed`}
        </p>
      </div>

      <div className="flex-none w-24">
        <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: soft }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.max(4, metricValue)}%`, background: accent }}
          />
        </div>
      </div>

      <span
        className="flex-none text-xs font-bold tabular-nums w-12 text-right"
        style={{ color: accent }}
      >
        {good ? `${course.passRate.toFixed(0)}%` : course.failCount}
      </span>
    </div>
  );
}

function Bone({ w, h, radius = 999 }: { w: string | number; h: string | number; radius?: number }) {
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: radius,
        background: `linear-gradient(90deg, ${COLORS.line} 25%, #F0F2F8 37%, ${COLORS.line} 63%)`,
        backgroundSize: '400% 100%',
        animation: 'dash-shimmer 1.4s ease infinite',
      }}
    />
  );
}

function SkeletonGaugeCard() {
  return (
    <div
      className="p-6 rounded-2xl flex flex-col items-center text-center gap-4"
      style={{ background: COLORS.card, border: `1px solid ${COLORS.line}` }}
    >
      <Bone w={150} h={12} />
      <Bone w={128} h={128} radius={999} />
      <Bone w={120} h={14} />
      <Bone w={90} h={10} />
    </div>
  );
}

function SkeletonListCard() {
  return (
    <div
      className="p-6 rounded-2xl"
      style={{ background: COLORS.card, border: `1px solid ${COLORS.line}` }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Bone w={28} h={28} radius={8} />
        <Bone w={170} h={14} />
      </div>
      {[0, 1].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 py-3"
          style={{ borderTop: `1px solid ${COLORS.line}` }}
        >
          <Bone w={24} h={24} radius={999} />
          <div className="flex-1 flex flex-col gap-2">
            <Bone w="70%" h={12} />
            <Bone w="45%" h={10} />
          </div>
          <Bone w={96} h={6} />
          <Bone w={32} h={10} />
        </div>
      ))}
    </div>
  );
}


export default function DirectorAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const [academicYear, setAcademicYear] = useState<string>('');
  const [semester, setSemester] = useState<string>('');

  useEffect(() => {
    if (!academicYear || !semester) {
      setLoading(false);
      return;
    }

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await Axios({
          ...summeryApi.directorAnalytics,
          params: { academicYear, semester },
        });

        const result = response.data;

        if (!result.success) {
          throw new Error(result.message || 'Failed to load academic analytics.');
        }

        setAnalytics(result.data);
      } catch (err: any) {
        setError(err?.response?.data?.message || err.message || 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [academicYear, semester]);

  const ready = academicYear && semester;
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const restore: Array<{ el: HTMLElement; bg: string }> = [];
    let el: HTMLElement | null = rootRef.current?.parentElement ?? null;
    let depth = 0;
    while (el && depth < 8) {
      restore.push({ el, bg: el.style.background });
      el.style.background = COLORS.paper;
      el = el.parentElement;
      depth++;
    }
    const prevBodyBg = document.body.style.background;
    const prevHtmlBg = document.documentElement.style.background;
    document.body.style.background = COLORS.paper;
    document.documentElement.style.background = COLORS.paper;

    return () => {
      restore.forEach(({ el, bg }) => {
        el.style.background = bg;
      });
      document.body.style.background = prevBodyBg;
      document.documentElement.style.background = prevHtmlBg;
    };
  }, []);

  return (
    <main
      ref={rootRef}
      className="min-h-screen p-3 md:p-2"
      style={{ background: COLORS.paper }}
    >
      <style>{`
        @keyframes dash-shimmer {
          0% { background-position: 100% 0; }
          100% { background-position: 0 0; }
        }
      `}</style>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div
          className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 rounded-2xl gap-4"
          style={{ background: COLORS.card, border: `1px solid ${COLORS.line}` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-none"
              style={{ background: COLORS.azureSoft, color: COLORS.azure }}
            >
              <GraduationCap size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: COLORS.ink }}>
                Director&rsquo;s Academic Dashboard
              </h1>
              <p className="text-sm mt-0.5" style={{ color: COLORS.sub }}>
                Institutional performance across class sections and courses
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <FilterSelect label="Academic Year" value={academicYear} onChange={setAcademicYear}>
              <option value="">Select year</option>
              <option value="26">2026</option>
              <option value="25">2025</option>
            </FilterSelect>

            <FilterSelect label="Semester" value={semester} onChange={setSemester}>
              <option value="">Select semester</option>
              <option value="semester1">Semester 1</option>
              <option value="semester2">Semester 2</option>
            </FilterSelect>
          </div>
        </div>

        {!ready ? (
          <div
            className="flex flex-col items-center justify-center gap-2 py-24 rounded-2xl"
            style={{ background: COLORS.card, border: `1px dashed ${COLORS.line}` }}
          >
            <Target size={28} style={{ color: COLORS.sub }} />
            <p className="text-sm font-medium" style={{ color: COLORS.sub }}>
              Select an academic year and semester to view analytics.
            </p>
          </div>
        ) : loading ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SkeletonGaugeCard />
              <SkeletonGaugeCard />
              <SkeletonGaugeCard />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SkeletonListCard />
              <SkeletonListCard />
            </div>
          </>
        ) : error ? (
          <div
            className="p-4 rounded-xl"
            style={{ background: COLORS.roseSoft, border: `1px solid ${COLORS.rose}33`, color: COLORS.rose }}
          >
            <p className="text-sm">
              <strong>Error:</strong> {error}
            </p>
          </div>
        ) : (
          <>
            {/* Gauge row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Best class */}
              <div
                className="p-6 rounded-2xl flex flex-col items-center text-center gap-4"
                style={{ background: COLORS.card, border: `1px solid ${COLORS.line}` }}
              >
                <div className="flex items-center gap-2">
                  <Trophy size={14} style={{ color: COLORS.emerald }} />
                  <SectionEyebrow>Best performing class</SectionEyebrow>
                </div>

                {analytics?.bestClass ? (
                  <>
                    <div className="relative" style={{ width: 128, height: 128 }}>
                      <Gauge
                        value={analytics.bestClass.averageScore}
                        color={COLORS.emerald}
                        trackColor={COLORS.emeraldSoft}
                      />
                      <GaugeStat value={analytics.bestClass.averageScore} size={128} />
                    </div>
                    <div>
                      <p className="text-base font-bold" style={{ color: COLORS.ink }}>
                        Grade {analytics.bestClass.gradeLevel} &middot; {analytics.bestClass.sectionName}
                      </p>
                      <p
                        className="text-xs mt-1 inline-flex items-center gap-1 justify-center"
                        style={{ color: COLORS.sub }}
                      >
                        <Users size={12} /> {analytics.bestClass.totalStudents} students
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-sm py-10" style={{ color: COLORS.sub }}>
                    No class data for this filter
                  </p>
                )}
              </div>

              {/* Pass rate */}
              <div
                className="p-6 rounded-2xl flex flex-col items-center text-center gap-4"
                style={{ background: COLORS.card, border: `1px solid ${COLORS.line}` }}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp size={14} style={{ color: COLORS.azure }} />
                  <SectionEyebrow>Overall school pass rate</SectionEyebrow>
                </div>
                <div className="relative" style={{ width: 128, height: 128 }}>
                  <Gauge
                    value={analytics?.additionalInsights?.overallSchoolPassRate ?? 0}
                    color={COLORS.azure}
                    trackColor={COLORS.azureSoft}
                  />
                  <GaugeStat value={analytics?.additionalInsights?.overallSchoolPassRate ?? 0} size={128} />
                </div>
                <p className="text-xs" style={{ color: COLORS.sub }}>
                  Across{' '}
                  <span className="font-semibold" style={{ color: COLORS.ink }}>
                    {analytics?.additionalInsights?.totalSectionsEvaluated ?? 0}
                  </span>{' '}
                  active sections
                </p>
              </div>

              {/* Threshold */}
              <div
                className="p-6 rounded-2xl flex flex-col items-center text-center gap-4"
                style={{ background: COLORS.card, border: `1px solid ${COLORS.line}` }}
              >
                <div className="flex items-center gap-2">
                  <Target size={14} style={{ color: COLORS.violet }} />
                  <SectionEyebrow>Evaluation threshold</SectionEyebrow>
                </div>
                <div className="relative" style={{ width: 128, height: 128 }}>
                  <Gauge value={50} color={COLORS.violet} trackColor={COLORS.violetSoft} />
                  <GaugeStat value={50} size={128} />
                </div>
                <p className="text-xs" style={{ color: COLORS.sub }}>
                  Minimum passing mark, scaled configuration
                </p>
              </div>
            </div>

            {/* Course lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                className="p-6 rounded-2xl"
                style={{ background: COLORS.card, border: `1px solid ${COLORS.line}` }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: COLORS.emeraldSoft, color: COLORS.emerald }}
                  >
                    <TrendingUp size={14} />
                  </div>
                  <h2 className="text-sm font-bold" style={{ color: COLORS.ink }}>
                    Top 2 courses &middot; most passes
                  </h2>
                </div>

                <div>
                  {analytics?.bestCourses?.length ? (
                    analytics.bestCourses.slice(0, 2).map((course, i) => (
                      <CourseRow key={course.courseId} rank={i + 1} course={course} tone="good" />
                    ))
                  ) : (
                    <p className="text-sm py-8" style={{ color: COLORS.sub }}>
                      No course data available.
                    </p>
                  )}
                </div>
              </div>

              <div
                className="p-6 rounded-2xl"
                style={{ background: COLORS.card, border: `1px solid ${COLORS.line}` }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: COLORS.roseSoft, color: COLORS.rose }}
                  >
                    <TrendingDown size={14} />
                  </div>
                  <h2 className="text-sm font-bold" style={{ color: COLORS.ink }}>
                    Bottom 2 courses &middot; most fails
                  </h2>
                </div>

                <div>
                  {analytics?.worstCourses?.length ? (
                    analytics.worstCourses.slice(0, 2).map((course, i) => (
                      <CourseRow key={course.courseId} rank={i + 1} course={course} tone="bad" />
                    ))
                  ) : (
                    <p className="text-sm py-8" style={{ color: COLORS.sub }}>
                      No failing records found.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}