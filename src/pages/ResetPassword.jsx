import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Button from '../components/common/Button';
import { authAPI } from '../services/api';

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

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            await authAPI.resetPassword(token, { password: data.password });
            setLoading(false);
            setResetSuccess(true);
            toast.success('Password reset successfully!');
            setTimeout(() => navigate('/login'), 2000);
        } catch (error) {
            setLoading(false);
            toast.error(error.message || 'Unable to reset password.');
        }
    };

    if (resetSuccess) {
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
                        Password Reset Successful!
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                        Your password has been reset successfully. You can now log in with your new password.
                    </p>

                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-600 border-t-transparent"></div>
                        <span>Redirecting to login...</span>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-primary-50 via-purple-50 to-secondary-50 dark:from-dark-bg dark:to-dark-surface">
                <div className="w-full max-w-md bg-white dark:bg-dark-surface rounded-2xl shadow-strong p-8 text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Invalid Reset Link
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                        This password reset link is invalid or has expired. Please request a new one.
                    </p>
                    <Link to="/forgot-password">
                        <Button className="w-full">
                            Request New Link
                        </Button>
                    </Link>
                </div>
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
                        Reset Password
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Enter your new password below. Make sure it's at least 8 characters long.
                    </p>
                </div>

                
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            New Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter new password"
                                {...register('password', {
                                    required: 'Password is required',
                                    minLength: {
                                        value: 8,
                                        message: 'Password must be at least 8 characters',
                                    },
                                    pattern: {
                                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                                        message: 'Password must contain uppercase, lowercase, and number',
                                    },
                                })}
                                className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="mt-1 text-sm text-danger-600">{errors.password.message}</p>
                        )}

                        
                        <div className="mt-2 space-y-1">
                            <div className="flex items-center space-x-2 text-xs">
                                <div className={`h-1 flex-1 rounded ${password?.length >= 8 ? 'bg-success-500' : 'bg-gray-300 dark:bg-dark-border'}`} />
                                <div className={`h-1 flex-1 rounded ${password?.length >= 12 ? 'bg-success-500' : 'bg-gray-300 dark:bg-dark-border'}`} />
                                <div className={`h-1 flex-1 rounded ${/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password || '') ? 'bg-success-500' : 'bg-gray-300 dark:bg-dark-border'}`} />
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {password?.length >= 8 ? 'âœ“' : 'â—‹'} At least 8 characters
                                {' â€¢ '}
                                {/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password || '') ? 'âœ“' : 'â—‹'} Uppercase, lowercase & number
                            </p>
                        </div>
                    </div>

                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="Confirm new password"
                                {...register('confirmPassword', {
                                    required: 'Please confirm your password',
                                    validate: (value) =>
                                        value === password || 'Passwords do not match',
                                })}
                                className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        {errors.confirmPassword && (
                            <p className="mt-1 text-sm text-danger-600">{errors.confirmPassword.message}</p>
                        )}
                    </div>

                    <Button type="submit" loading={loading} className="w-full mt-6">
                        {loading ? 'Resetting password...' : 'Reset Password'}
                    </Button>
                </form>

                
                <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
                    Remember your password?{' '}
                    <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                        Back to login
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
