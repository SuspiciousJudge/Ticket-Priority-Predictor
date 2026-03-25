import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, CheckCircle, Check, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const PASSWORD_RULES = [
    { key: 'length', label: 'At least 8 characters', test: (v) => v && v.length >= 8 },
    { key: 'upper', label: 'One uppercase letter', test: (v) => /[A-Z]/.test(v || '') },
    { key: 'number', label: 'One number', test: (v) => /[0-9]/.test(v || '') },
];

function PasswordStrength({ password }) {
    const passed = PASSWORD_RULES.filter((r) => r.test(password)).length;
    const total = PASSWORD_RULES.length;
    const pct = (passed / total) * 100;
    const barColor = pct < 50 ? 'bg-red-400' : pct < 100 ? 'bg-yellow-400' : 'bg-green-500';

    return (
        <div className="mt-2.5 space-y-2">
            <div className="h-1 rounded-full bg-gray-200 overflow-hidden">
                <motion.div
                    className={`h-full rounded-full ${barColor}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.3 }}
                />
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
                {PASSWORD_RULES.map((rule) => {
                    const ok = rule.test(password);
                    return (
                        <div key={rule.key} className={`flex items-center gap-1 text-xs transition-colors ${ok ? 'text-green-600' : 'text-gray-400'}`}>
                            {ok ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                            {rule.label}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function StarburstIcon({ size = 38 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
            {Array.from({ length: 8 }, (_, i) => (
                <rect
                    key={i}
                    x="18"
                    y="1"
                    width="2"
                    height="15"
                    rx="1"
                    fill="#f97316"
                    transform={`rotate(${i * 45} 19 19)`}
                />
            ))}
        </svg>
    );
}

function DarkPanel({ tagline }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="hidden lg:flex flex-1 relative overflow-hidden flex-col"
            style={{ backgroundColor: '#0c0c0c' }}
        >
            <div className="absolute bottom-0 left-0 right-0 h-3/4 pointer-events-none">
                <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 80% at 25% 110%, rgba(234,88,12,0.55) 0%, transparent 65%)' }} />
                <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 50% 60% at 55% 110%, rgba(251,146,60,0.35) 0%, transparent 60%)' }} />
                <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 40% 50% at 15% 110%, rgba(253,186,116,0.25) 0%, transparent 55%)' }} />
            </div>
            <div className="relative z-10 flex flex-col h-full p-14 pt-20">
                <motion.p
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.65 }}
                    className="text-5xl font-bold text-white leading-tight max-w-xs"
                >
                    {tagline}
                </motion.p>
            </div>
        </motion.div>
    );
}

export default function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm();

    const password = watch('password');

    const onSubmit = async () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setResetSuccess(true);
            toast.success('Password reset successfully!');
            setTimeout(() => navigate('/login'), 2000);
        }, 1500);
    };

    /* Success state */
    if (resetSuccess) {
        return (
            <div className="min-h-screen flex">
                <DarkPanel tagline="Password updated, you're all set." />
                <motion.div
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex-1 flex items-center justify-center p-8 bg-white"
                >
                    <div className="w-full max-w-sm text-center">
                        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-7 h-7 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Password reset!</h2>
                        <p className="text-sm text-gray-500 mb-8">
                            Your password has been reset. Redirecting you to sign in…
                        </p>
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                            <svg className="animate-spin w-4 h-4 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Redirecting to sign in…
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    /* Invalid / missing token */
    if (!token) {
        return (
            <div className="min-h-screen flex">
                <DarkPanel tagline="Something went wrong." />
                <motion.div
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex-1 flex items-center justify-center p-8 bg-white"
                >
                    <div className="w-full max-w-sm text-center">
                        <div className="mb-7">
                            <StarburstIcon size={38} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid reset link</h2>
                        <p className="text-sm text-gray-500 mb-8">
                            This link is invalid or has expired. Please request a new one.
                        </p>
                        <Link
                            to="/forgot-password"
                            className="block w-full py-3 px-4 rounded-lg font-medium text-white bg-orange-500 hover:bg-orange-600 active:bg-orange-700 transition-colors duration-150 text-sm text-center"
                        >
                            Request new link
                        </Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    /* Main reset form */
    return (
        <div className="min-h-screen flex">
            <DarkPanel tagline="Set a new password, stay secure." />

            <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="flex-1 flex items-center justify-center p-8 bg-white overflow-y-auto"
            >
                <div className="w-full max-w-sm py-8">
                    <div className="mb-7">
                        <StarburstIcon size={38} />
                    </div>

                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900 mb-1.5">Reset password</h1>
                        <p className="text-sm text-gray-500">
                            TicketPro — Choose a strong new password.
                        </p>
                    </div>

                    <div className="w-full h-px bg-gray-200 mb-7" />

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* New password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1.5">
                                New password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••••"
                                    {...register('password', {
                                        required: 'Password is required',
                                        minLength: { value: 8, message: 'At least 8 characters' },
                                        validate: {
                                            hasUpper: (v) => /[A-Z]/.test(v) || 'Must contain an uppercase letter',
                                            hasNumber: (v) => /[0-9]/.test(v) || 'Must contain a number',
                                        },
                                    })}
                                    className={`w-full px-4 py-3 pr-11 border rounded-lg text-gray-900 placeholder-gray-400 outline-none transition-all text-sm ${
                                        errors.password
                                            ? 'border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                                            : 'border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100'
                                    }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>
                            )}
                            <PasswordStrength password={password} />
                        </div>

                        {/* Confirm password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1.5">
                                Confirm password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="••••••••••"
                                    {...register('confirmPassword', {
                                        required: 'Please confirm your password',
                                        validate: (value) => value === password || 'Passwords do not match',
                                    })}
                                    className={`w-full px-4 py-3 pr-11 border rounded-lg text-gray-900 placeholder-gray-400 outline-none transition-all text-sm ${
                                        errors.confirmPassword
                                            ? 'border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                                            : 'border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100'
                                    }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <p className="mt-1.5 text-xs text-red-500">{errors.confirmPassword.message}</p>
                            )}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 rounded-lg font-medium text-white bg-orange-500 hover:bg-orange-600 active:bg-orange-700 transition-colors duration-150 disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
                        >
                            {loading && (
                                <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            )}
                            {loading ? 'Resetting password…' : 'Reset password'}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm text-gray-500">
                        Remember your password?{' '}
                        <Link
                            to="/login"
                            className="font-semibold text-gray-900 underline underline-offset-2 hover:text-orange-500 transition-colors"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
