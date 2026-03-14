import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Chrome, Github } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { authAPI, setAuthToken } from '../services/api';

export default function Login() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm();

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const res = await authAPI.login(data);
            const token = res.data.data.token;
            setAuthToken(token);
            toast.success('Login successful!');
            navigate('/');
        } catch (err) {
            toast.error(err.message || 'Login failed');
        } finally { setLoading(false); }
    };

    const handleSocialLogin = (provider) => {
        toast.success(`Logging in with ${provider}...`);
        setTimeout(() => navigate('/'), 1000);
    };

    return (
        <div className="min-h-screen flex">
            
            <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-dark-bg"
            >
                <div className="w-full max-w-md">
                    
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
                            Welcome back!
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Sign in to continue to your dashboard
                        </p>
                    </div>

                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <button
                            onClick={() => handleSocialLogin('Google')}
                            className="flex items-center justify-center space-x-2 px-4 py-3 border-2 border-gray-300 dark:border-dark-border rounded-lg hover:border-primary-500 dark:hover:border-primary-500 transition-all duration-200 group"
                        >
                            <Chrome className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-primary-600" />
                            <span className="font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary-600">
                                Google
                            </span>
                        </button>
                        <button
                            onClick={() => handleSocialLogin('GitHub')}
                            className="flex items-center justify-center space-x-2 px-4 py-3 border-2 border-gray-300 dark:border-dark-border rounded-lg hover:border-primary-500 dark:hover:border-primary-500 transition-all duration-200 group"
                        >
                            <Github className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-primary-600" />
                            <span className="font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary-600">
                                GitHub
                            </span>
                        </button>
                    </div>

                    
                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300 dark:border-dark-border"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white dark:bg-dark-bg text-gray-500 dark:text-gray-400">
                                or continue with email
                            </span>
                        </div>
                    </div>

                    
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        
                        <div>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    placeholder="Email address"
                                    {...register('email', {
                                        required: 'Email is required',
                                        pattern: {
                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                            message: 'Invalid email address',
                                        },
                                    })}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1 text-sm text-danger-600">{errors.email.message}</p>
                            )}
                        </div>

                        
                        <div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Password"
                                    {...register('password', {
                                        required: 'Password is required',
                                        minLength: {
                                            value: 6,
                                            message: 'Password must be at least 6 characters',
                                        },
                                    })}
                                    className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-sm text-danger-600">{errors.password.message}</p>
                            )}
                        </div>

                        
                        <div className="flex items-center justify-between">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                    Remember me
                                </span>
                            </label>
                            <Link
                                to="/forgot-password"
                                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        
                        <Button
                            type="submit"
                            loading={loading}
                            className="w-full"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </form>

                    
                    <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
                        Don't have an account?{' '}
                        <Link
                            to="/signup"
                            className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                            Sign up for free
                        </Link>
                    </p>
                </div>
            </motion.div>

            
            <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="hidden lg:flex flex-1 bg-gradient-to-br from-primary-600 via-purple-600 to-primary-800 relative overflow-hidden"
            >
                
                <div className="absolute inset-0">
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            rotate: [0, 90, 0],
                        }}
                        transition={{
                            duration: 20,
                            repeat: Infinity,
                            ease: 'linear',
                        }}
                        className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"
                    />
                    <motion.div
                        animate={{
                            scale: [1.2, 1, 1.2],
                            rotate: [90, 0, 90],
                        }}
                        transition={{
                            duration: 15,
                            repeat: Infinity,
                            ease: 'linear',
                        }}
                        className="absolute bottom-20 right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"
                    />
                </div>

                
                <div className="relative z-10 flex flex-col items-center justify-center p-12 text-white">
                    
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: 'spring' }}
                        className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8"
                    >
                        <span className="text-white font-bold text-3xl">TP</span>
                    </motion.div>

                    
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="text-4xl font-bold mb-4 text-center"
                    >
                        Streamline Your Support
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="text-xl text-white/80 mb-12 text-center max-w-md"
                    >
                        AI-powered ticket management that helps you resolve issues faster
                    </motion.p>

                    
                    <div className="grid grid-cols-2 gap-6 w-full max-w-lg">
                        {[
                            { icon: 'ðŸ¤–', title: 'AI-Powered Priority', desc: 'Smart ticket routing' },
                            { icon: 'âš¡', title: 'Real-time Updates', desc: 'Stay in sync' },
                            { icon: 'ðŸ“Š', title: 'Advanced Analytics', desc: 'Data-driven insights' },
                            { icon: 'ðŸ›¡ï¸', title: '24/7 Support', desc: 'Always here for you' },
                        ].map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 + index * 0.1 }}
                                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-all"
                            >
                                <div className="text-3xl mb-2">{feature.icon}</div>
                                <h3 className="font-semibold mb-1">{feature.title}</h3>
                                <p className="text-sm text-white/70">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
