import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authAPI, setAuthToken } from '../services/api';

const PASSWORD_RULES = [
    { key: 'length', label: 'At least 8 characters', test: (v) => v && v.length >= 8 },
    { key: 'upper', label: 'One uppercase letter', test: (v) => /[A-Z]/.test(v || '') },
    { key: 'number', label: 'One number', test: (v) => /[0-9]/.test(v || '') },
];

function PasswordStrength({ password }) {
    const passed = PASSWORD_RULES.filter((r) => r.test(password)).length;
    const total = PASSWORD_RULES.length;
    const pct = (passed / total) * 100;
    const barColor =
        pct < 50 ? 'bg-red-400' : pct < 100 ? 'bg-yellow-400' : 'bg-green-500';

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
                        <div
                            key={rule.key}
                            className={`flex items-center gap-1 text-xs transition-colors ${
                                ok ? 'text-green-600' : 'text-gray-400'
                            }`}
                        >
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

function DarkPanel() {
    return (
        <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="hidden lg:flex flex-1 relative overflow-hidden flex-col"
            style={{ backgroundColor: '#0c0c0c' }}
        >
            {/* Warm glow beams at the bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-3/4 pointer-events-none">
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            'radial-gradient(ellipse 70% 80% at 25% 110%, rgba(234,88,12,0.55) 0%, transparent 65%)',
                    }}
                />
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            'radial-gradient(ellipse 50% 60% at 55% 110%, rgba(251,146,60,0.35) 0%, transparent 60%)',
                    }}
                />
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            'radial-gradient(ellipse 40% 50% at 15% 110%, rgba(253,186,116,0.25) 0%, transparent 55%)',
                    }}
                />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full p-14 pt-20">
                <motion.p
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.65 }}
                    className="text-5xl font-bold text-white leading-tight max-w-xs"
                >
                    Convert your tickets into resolved issues.
                </motion.p>
            </div>
        </motion.div>
    );
}

export default function SignUp() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        setError,
        formState: { errors },
    } = useForm({ mode: 'onSubmit' });

    const password = watch('password');

    const registerMutation = useMutation({
        mutationFn: (data) =>
            authAPI.register({ name: data.name, email: data.email, password: data.password }),
        onSuccess: (res) => {
            const { token, user } = res.data.data;
            setAuthToken(token, true);
            queryClient.setQueryData(['me'], user);
            toast.success('Account created — welcome!');
            navigate('/');
        },
        onError: (err) => {
            if (err.fieldErrors) {
                Object.entries(err.fieldErrors).forEach(([field, msg]) => {
                    setError(field, { type: 'server', message: msg });
                });
            }
            toast.error(err.message || 'Signup failed');
        },
    });

    const onSubmit = (data) => {
        if (!agreedToTerms) {
            toast.error('Please agree to the terms and conditions');
            return;
        }
        registerMutation.mutate(data);
    };

    return (
        <div className="min-h-screen flex">
            <DarkPanel />

            {/* Form panel */}
            <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="flex-1 flex items-center justify-center p-8 bg-white overflow-y-auto"
            >
                <div className="w-full max-w-sm py-8">
                    {/* Logo */}
                    <div className="mb-7">
                        <StarburstIcon size={38} />
                    </div>

                    {/* Heading */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900 mb-1.5">Get Started</h1>
                        <p className="text-sm text-gray-500">TicketPro — Let&apos;s get started</p>
                    </div>

                    {/* Divider */}
                    <div className="w-full h-px bg-gray-200 mb-7" />

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Full name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1.5">
                                Your name
                            </label>
                            <input
                                type="text"
                                placeholder="Jane Smith"
                                {...register('name', { required: 'Name is required' })}
                                className={`w-full px-4 py-3 border rounded-lg text-gray-900 placeholder-gray-400 outline-none transition-all text-sm ${
                                    errors.name
                                        ? 'border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                                        : 'border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100'
                                }`}
                            />
                            {errors.name && (
                                <p className="mt-1.5 text-xs text-red-500">{errors.name.message}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1.5">
                                Your email
                            </label>
                            <input
                                type="email"
                                placeholder="you@example.com"
                                {...register('email', {
                                    required: 'Email is required',
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: 'Invalid email address',
                                    },
                                })}
                                className={`w-full px-4 py-3 border rounded-lg text-gray-900 placeholder-gray-400 outline-none transition-all text-sm ${
                                    errors.email
                                        ? 'border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                                        : 'border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100'
                                }`}
                            />
                            {errors.email && (
                                <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1.5">
                                Create new password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••••"
                                    {...register('password', {
                                        required: 'Password is required',
                                        minLength: {
                                            value: 8,
                                            message: 'Password must be at least 8 characters',
                                        },
                                        validate: {
                                            hasUpper: (v) =>
                                                /[A-Z]/.test(v) || 'Must contain an uppercase letter',
                                            hasNumber: (v) =>
                                                /[0-9]/.test(v) || 'Must contain a number',
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
                                        validate: (value) =>
                                            value === password || 'Passwords do not match',
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
                                    {showConfirmPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <p className="mt-1.5 text-xs text-red-500">
                                    {errors.confirmPassword.message}
                                </p>
                            )}
                        </div>

                        {/* Terms */}
                        <label className="flex items-start gap-2.5 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={agreedToTerms}
                                onChange={(e) => setAgreedToTerms(e.target.checked)}
                                className="w-4 h-4 mt-0.5 rounded border-gray-300 accent-orange-500 shrink-0"
                            />
                            <span className="text-sm text-gray-600 leading-relaxed">
                                I agree to the{' '}
                                <Link
                                    to="/terms"
                                    className="font-medium text-gray-900 underline underline-offset-2 hover:text-orange-500 transition-colors"
                                >
                                    Terms of Service
                                </Link>{' '}
                                and{' '}
                                <Link
                                    to="/privacy"
                                    className="font-medium text-gray-900 underline underline-offset-2 hover:text-orange-500 transition-colors"
                                >
                                    Privacy Policy
                                </Link>
                            </span>
                        </label>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={registerMutation.isPending}
                            className="w-full py-3 px-4 rounded-lg font-medium text-white bg-orange-500 hover:bg-orange-600 active:bg-orange-700 transition-colors duration-150 disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
                        >
                            {registerMutation.isPending && (
                                <svg
                                    className="animate-spin w-4 h-4"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                </svg>
                            )}
                            {registerMutation.isPending ? 'Creating account...' : 'Create new account'}
                        </button>
                    </form>

                    {/* Footer */}
                    <p className="mt-8 text-center text-sm text-gray-500">
                        Already have an account?{' '}
                        <Link
                            to="/login"
                            className="font-semibold text-gray-900 underline underline-offset-2 hover:text-orange-500 transition-colors"
                        >
                            Login
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
