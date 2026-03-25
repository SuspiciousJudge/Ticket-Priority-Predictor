import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authAPI, setAuthToken } from '../services/api';

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
                    Resolve your tickets smarter, faster.
                </motion.p>
            </div>
        </motion.div>
    );
}

export default function Login() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors },
    } = useForm({ mode: 'onSubmit' });

    const loginMutation = useMutation({
        mutationFn: authAPI.login,
        onSuccess: (res) => {
            const { token, user } = res.data.data;
            setAuthToken(token, rememberMe);
            // Pre-populate the ['me'] cache so Topbar shows the name instantly —
            // no second round-trip to /auth/me is needed.
            queryClient.setQueryData(['me'], user);
            toast.success('Welcome back!');
            navigate('/');
        },
        onError: (err) => {
            if (err.fieldErrors) {
                Object.entries(err.fieldErrors).forEach(([field, msg]) => {
                    setError(field, { type: 'server', message: msg });
                });
            }
            toast.error(err.message || 'Login failed');
        },
    });

    const onSubmit = (data) => loginMutation.mutate(data);

    return (
        <div className="min-h-screen flex">
            <DarkPanel />

            {/* Form panel */}
            <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="flex-1 flex items-center justify-center p-8 bg-white"
            >
                <div className="w-full max-w-sm">
                    {/* Logo */}
                    <div className="mb-7">
                        <StarburstIcon size={38} />
                    </div>

                    {/* Heading */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900 mb-1.5">Welcome back</h1>
                        <p className="text-sm text-gray-500">TicketPro — Sign in to continue</p>
                    </div>

                    {/* Divider */}
                    <div className="w-full h-px bg-gray-200 mb-7" />

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••••"
                                    {...register('password', { required: 'Password is required' })}
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
                        </div>

                        {/* Remember me + Forgot password */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 accent-orange-500"
                                />
                                <span className="text-sm text-gray-600">Remember me</span>
                            </label>
                            <Link
                                to="/forgot-password"
                                className="text-sm font-medium text-orange-500 hover:text-orange-600 transition-colors"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loginMutation.isPending}
                            className="w-full py-3 px-4 rounded-lg font-medium text-white bg-orange-500 hover:bg-orange-600 active:bg-orange-700 transition-colors duration-150 disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
                        >
                            {loginMutation.isPending && (
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
                            {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
                        </button>
                    </form>

                    {/* Footer */}
                    <p className="mt-8 text-center text-sm text-gray-500">
                        Don&apos;t have an account?{' '}
                        <Link
                            to="/signup"
                            className="font-semibold text-gray-900 underline underline-offset-2 hover:text-orange-500 transition-colors"
                        >
                            Sign up
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
