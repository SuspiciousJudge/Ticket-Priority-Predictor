import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

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

export default function ForgotPassword() {
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const {
        register,
        handleSubmit,
        getValues,
        formState: { errors },
    } = useForm();

    const onSubmit = async () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setEmailSent(true);
            toast.success('Password reset link sent!');
        }, 1500);
    };

    return (
        <div className="min-h-screen flex">
            <DarkPanel tagline="We'll help you get back in." />

            <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="flex-1 flex items-center justify-center p-8 bg-white"
            >
                <div className="w-full max-w-sm">
                    {emailSent ? (
                        /* Success state */
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4 }}
                            className="text-center"
                        >
                            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-7 h-7 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
                            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                                We sent a reset link to{' '}
                                <span className="font-medium text-gray-900">{getValues('email')}</span>.
                                Check your inbox and follow the instructions.
                            </p>
                            <Link
                                to="/login"
                                className="block w-full py-3 px-4 rounded-lg font-medium text-white bg-orange-500 hover:bg-orange-600 active:bg-orange-700 transition-colors duration-150 text-sm text-center"
                            >
                                Back to sign in
                            </Link>
                            <p className="mt-5 text-sm text-gray-500">
                                Didn&apos;t receive it?{' '}
                                <button
                                    onClick={() => setEmailSent(false)}
                                    className="font-semibold text-gray-900 underline underline-offset-2 hover:text-orange-500 transition-colors"
                                >
                                    Try again
                                </button>
                            </p>
                        </motion.div>
                    ) : (
                        /* Form state */
                        <>
                            <div className="mb-7">
                                <StarburstIcon size={38} />
                            </div>

                            <div className="mb-6">
                                <h1 className="text-3xl font-bold text-gray-900 mb-1.5">
                                    Forgot password?
                                </h1>
                                <p className="text-sm text-gray-500">
                                    Enter your email and we&apos;ll send a reset link.
                                </p>
                            </div>

                            <div className="w-full h-px bg-gray-200 mb-7" />

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                                    {loading ? 'Sending...' : 'Send reset link'}
                                </button>
                            </form>

                            <p className="mt-8 text-center text-sm text-gray-500">
                                <Link
                                    to="/login"
                                    className="inline-flex items-center gap-1.5 font-semibold text-gray-900 underline underline-offset-2 hover:text-orange-500 transition-colors"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                    Back to sign in
                                </Link>
                            </p>
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
