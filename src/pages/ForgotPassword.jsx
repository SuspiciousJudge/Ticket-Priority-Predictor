import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Button from '../components/common/Button';
import { authAPI } from '../services/api';

export default function ForgotPassword() {
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [developmentResetUrl, setDevelopmentResetUrl] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm();

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const response = await authAPI.forgotPassword({ email: data.email });
            if (response.data?.resetUrl) {
                setDevelopmentResetUrl(response.data.resetUrl);
            }
            setLoading(false);
            setEmailSent(true);
            toast.success('If that email exists, reset instructions were sent.');
        } catch (error) {
            setLoading(false);
            toast.error(error.message || 'Unable to request a password reset.');
        }
    };

    if (emailSent) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-primary-50 via-purple-50 to-secondary-50 dark:from-dark-bg dark:to-dark-surface">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md bg-white dark:bg-dark-surface rounded-2xl shadow-strong p-8 text-center"
                >
                    <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-8 h-8 text-success-600" />
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Check Your Email
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                        We've sent a password reset link to your email address. Please check your inbox and follow the instructions.
                    </p>

                    {developmentResetUrl && (
                        <a
                            href={developmentResetUrl}
                            className="block mb-6 text-sm text-primary-600 hover:text-primary-700 underline break-all"
                        >
                            Open development reset link
                        </a>
                    )}

                    <Link to="/login">
                        <Button className="w-full">
                            Back to Login
                        </Button>
                    </Link>

                    <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                        Didn't receive the email?{' '}
                        <button
                            onClick={() => setEmailSent(false)}
                            className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                            Try again
                        </button>
                    </p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-primary-50 via-purple-50 to-secondary-50 dark:from-dark-bg dark:to-dark-surface">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md bg-white dark:bg-dark-surface rounded-2xl shadow-strong p-8"
            >
                
                <Link
                    to="/login"
                    className="inline-flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 mb-8 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Back to login</span>
                </Link>

                
                <div className="flex items-center space-x-2 mb-8">
                    <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">TP</span>
                    </div>
                    <span className="font-bold text-2xl text-gray-900 dark:text-white">
                        TicketPro
                    </span>
                </div>

                
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Forgot Password?
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        No worries! Enter your email address and we'll send you a link to reset your password.
                    </p>
                </div>

                
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="email"
                                placeholder="Enter your email address"
                                {...register('email', {
                                    required: 'Email is required',
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: 'Invalid email address',
                                    },
                                })}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        {errors.email && (
                            <p className="mt-1 text-sm text-danger-600">{errors.email.message}</p>
                        )}
                    </div>

                    <Button type="submit" loading={loading} className="w-full">
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </Button>
                </form>

                
                <div className="mt-6 p-4 bg-primary-50 dark:bg-dark-border/30 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Tip:</strong> Make sure to check your spam folder if you don't see the email within a few minutes.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
