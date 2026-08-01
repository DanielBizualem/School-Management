"use client"

import React, { useState, FormEvent } from 'react';
import { AxiosError } from 'axios';
import Axios from '@/utils/Axios';
import summeryApi from '@/common/summeryApi';
import { Mail, Lock, KeyRound, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';

interface ErrorResponse {
    success?: boolean;
    message?: string;
}

const STEPS = [
    { id: 1, label: 'Email' },
    { id: 2, label: 'Verify' },
    { id: 3, label: 'Reset' },
];

export default function ForgotPassword() {
    const [step, setStep] = useState<number>(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
    const [email, setEmail] = useState<string>('');
    const [otp, setOtp] = useState<string>('');
    const [newPassword, setNewPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');

    const [loading, setLoading] = useState<boolean>(false);
    const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' | '' }>({ text: '', type: '' });

    // Step 1: Request OTP
    const handleSendOtp = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            const response = await Axios({
                url: summeryApi.forgotPassword.url,
                method: summeryApi.forgotPassword.method,
                data: { email }
            });

            if (response.data.success) {
                setStep(2);
                setMessage({ text: response.data.message, type: 'success' });
            }
        } catch (error) {
            const err = error as AxiosError<ErrorResponse>;
            setMessage({
                text: err.response?.data?.message || 'Something went wrong. Please try again.',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOtp = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            const response = await Axios({
                url: summeryApi.verifyOtp.url,
                method: summeryApi.verifyOtp.method,
                data: { email, otp }
            });

            if (response.data.success) {
                setStep(3);
                setMessage({ text: '', type: '' });
            }
        } catch (error) {
            const err = error as AxiosError<ErrorResponse>;
            setMessage({
                text: err.response?.data?.message || 'Invalid or expired OTP.',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Reset Password
    const handleResetPassword = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage({ text: 'Passwords do not match.', type: 'error' });
            return;
        }

        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            const response = await Axios({
                url: summeryApi.resetPassword.url,
                method: summeryApi.resetPassword.method,
                data: { email, otp, newPassword }
            });

            if (response.data.success) {
                setStep(4);
            }
        } catch (error) {
            const err = error as AxiosError<ErrorResponse>;
            setMessage({
                text: err.response?.data?.message || 'Failed to reset password.',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-colors";
    const labelClass = "block text-[13px] font-medium text-slate-700 mb-1.5";
    const iconWrapClass = "absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400";
    const primaryButtonClass = "w-full flex items-center justify-center py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
            <div className="max-w-md w-full">

                <div className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.06)] border border-slate-200/80 overflow-hidden">

                    {/* Step Progress */}
                    {step !== 4 && (
                        <div className="flex items-center gap-2 px-8 pt-7">
                            {STEPS.map((s, idx) => (
                                <React.Fragment key={s.id}>
                                    <div className="flex items-center gap-1.5">
                                        <div
                                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold transition-colors ${
                                                step > s.id
                                                    ? 'bg-slate-900 text-white'
                                                    : step === s.id
                                                    ? 'bg-slate-900 text-white'
                                                    : 'bg-slate-100 text-slate-400'
                                            }`}
                                        >
                                            {step > s.id ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.id}
                                        </div>
                                        <span className={`text-xs font-medium hidden sm:inline ${step >= s.id ? 'text-slate-700' : 'text-slate-400'}`}>
                                            {s.label}
                                        </span>
                                    </div>
                                    {idx < STEPS.length - 1 && (
                                        <div className={`flex-1 h-px ${step > s.id ? 'bg-slate-900' : 'bg-slate-200'}`} />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    )}

                    <div className="p-8 space-y-6">

                        {/* Header */}
                        <div className="space-y-1.5">
                            <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-slate-100 text-slate-700 mb-1">
                                {step === 1 && <Mail className="w-5 h-5" />}
                                {step === 2 && <KeyRound className="w-5 h-5" />}
                                {step === 3 && <Lock className="w-5 h-5" />}
                                {step === 4 && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                            </div>
                            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
                                {step === 1 && "Forgot your password?"}
                                {step === 2 && "Enter verification code"}
                                {step === 3 && "Set a new password"}
                                {step === 4 && "Password updated"}
                            </h1>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                {step === 1 && "Enter your email address and we'll send you a one-time code to reset your password."}
                                {step === 2 && <>We sent a 6-digit code to <span className="font-medium text-slate-700">{email}</span></>}
                                {step === 3 && "Choose a strong password you haven't used before."}
                                {step === 4 && "Your password has been changed successfully. You can now sign in with your new password."}
                            </p>
                        </div>

                        {/* Status Alert */}
                        {message.text && (
                            <div
                                role="alert"
                                className={`flex items-start gap-2.5 p-3.5 rounded-lg text-sm border ${
                                    message.type === 'error'
                                        ? 'bg-rose-50 text-rose-700 border-rose-100'
                                        : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                }`}
                            >
                                <span className="flex-1">{message.text}</span>
                            </div>
                        )}

                        {/* Step 1: Email */}
                        {step === 1 && (
                            <form onSubmit={handleSendOtp} className="space-y-5">
                                <div>
                                    <label className={labelClass}>Email address</label>
                                    <div className="relative">
                                        <span className={iconWrapClass}>
                                            <Mail className="w-[18px] h-[18px]" />
                                        </span>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="name@school.edu"
                                            className={inputClass}
                                        />
                                    </div>
                                </div>

                                <button type="submit" disabled={loading} className={primaryButtonClass}>
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send verification code"}
                                </button>
                            </form>
                        )}

                        {/* Step 2: OTP */}
                        {step === 2 && (
                            <form onSubmit={handleVerifyOtp} className="space-y-5">
                                <div>
                                    <label className={labelClass}>6-digit code</label>
                                    <div className="relative">
                                        <span className={iconWrapClass}>
                                            <KeyRound className="w-[18px] h-[18px]" />
                                        </span>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={6}
                                            required
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            placeholder="123456"
                                            className={`${inputClass} tracking-[0.3em] font-mono`}
                                        />
                                    </div>
                                </div>

                                <button type="submit" disabled={loading} className={primaryButtonClass}>
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify code"}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => { setStep(1); setMessage({ text: '', type: '' }); }}
                                    className="w-full text-center text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors"
                                >
                                    Didn't receive a code? Change email
                                </button>
                            </form>
                        )}

                        {/* Step 3: New Password */}
                        {step === 3 && (
                            <form onSubmit={handleResetPassword} className="space-y-5">
                                <div>
                                    <label className={labelClass}>New password</label>
                                    <div className="relative">
                                        <span className={iconWrapClass}>
                                            <Lock className="w-[18px] h-[18px]" />
                                        </span>
                                        <input
                                            type="password"
                                            required
                                            minLength={8}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className={inputClass}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className={labelClass}>Confirm new password</label>
                                    <div className="relative">
                                        <span className={iconWrapClass}>
                                            <Lock className="w-[18px] h-[18px]" />
                                        </span>
                                        <input
                                            type="password"
                                            required
                                            minLength={8}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className={inputClass}
                                        />
                                    </div>
                                </div>

                                <button type="submit" disabled={loading} className={primaryButtonClass}>
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update password"}
                                </button>
                            </form>
                        )}

                        {/* Step 4: Success */}
                        {step === 4 && (
                            <a
                                href="/login"
                                className={`${primaryButtonClass} no-underline`}
                            >
                                Return to login
                            </a>
                        )}

                        {/* Back to Login */}
                        {step !== 4 && (
                            <div className="text-center pt-1">
                                <a
                                    href="/login"
                                    className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to login
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}