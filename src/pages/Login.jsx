import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Chrome, Github, Sparkles, ShieldCheck, ArrowRight, Brain, Zap } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Button from '../components/common/Button';
import { authAPI, setAuthToken } from '../services/api';

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function RobotHero({ lookX, lookY }) {
    const eyeOffsetX = lookX * 14;
    const eyeOffsetY = lookY * 11;
    const faceTiltX = lookX * 5;
    const faceTiltY = lookY * 4;

    const eyeShellStyle = {
        transform: `translate3d(${lookX * 4}px, ${lookY * 3}px, 0)`,
    };

    const leftPupilStyle = {
        transform: `translate(${eyeOffsetX}px, ${eyeOffsetY}px)`,
    };

    const rightPupilStyle = {
        transform: `translate(${eyeOffsetX}px, ${eyeOffsetY}px)`,
    };

    const mouthGlowStyle = {
        boxShadow: `0 0 0 1px rgba(255,255,255,0.16), 0 0 48px rgba(34,211,238,0.18)`,
    };

    return (
        <div className="relative flex h-full min-h-[500px] items-center justify-center overflow-hidden rounded-[2rem] border border-white/18 bg-[radial-gradient(circle_at_18%_18%,_rgba(59,130,246,0.22),_transparent_28%),radial-gradient(circle_at_82%_14%,_rgba(139,92,246,0.20),_transparent_26%),radial-gradient(circle_at_50%_82%,_rgba(6,182,212,0.16),_transparent_30%),linear-gradient(160deg,_#07111f_0%,_#0f172a_48%,_#111827_100%)] p-4 shadow-[0_30px_80px_rgba(2,6,23,0.45)]">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:36px_36px] opacity-20" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.06),transparent_65%)]" />
            <div className="absolute left-0 top-0 h-full w-32 bg-gradient-to-r from-white/12 to-transparent" />
            <motion.div
                className="absolute -left-8 top-12 h-40 w-40 rounded-full bg-cyan-400/15 blur-3xl"
                animate={{ y: [0, -18, 0], x: [0, 10, 0] }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
                className="absolute bottom-12 right-0 h-52 w-52 rounded-full bg-fuchsia-500/15 blur-3xl"
                animate={{ y: [0, 18, 0], x: [0, -12, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
                className="absolute right-12 top-1/4 h-24 w-24 rounded-full bg-cyan-300/10 blur-2xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.25, 0.5, 0.25] }}
                transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
            />

            <div className="relative z-10 flex w-full max-w-xl flex-col items-center text-center text-white">
                <motion.div
                    initial={{ opacity: 0, y: 12, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-white/6 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100 backdrop-blur-md"
                >
                    <Sparkles className="h-3.5 w-3.5" />
                    Modern support ai workspace
                </motion.div>

                <div className="relative mt-2 flex h-[270px] w-[270px] items-center justify-center rounded-[2.5rem] border border-white/10 bg-white/4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl md:h-[300px] md:w-[300px]">
                    <motion.div
                        className="absolute top-0 h-20 w-28 rounded-full bg-cyan-300/20 blur-2xl"
                        animate={{ scale: [1, 1.08, 1] }}
                        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                    />

                    <motion.div className="absolute bottom-3 left-1/2 h-14 w-[72%] -translate-x-1/2 rounded-full bg-cyan-400/10 blur-2xl" animate={{ opacity: [0.15, 0.45, 0.15] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} />

                    <motion.div
                        animate={{ y: [0, -8, 0], rotateX: [0, 3, 0], rotateY: [0, -3, 0] }}
                        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                        className="relative flex h-[230px] w-[210px] items-center justify-center md:h-[250px] md:w-[230px]"
                        style={{ transformPerspective: 1200 }}
                    >
                        <div className="absolute inset-x-16 top-1 h-7 rounded-full bg-cyan-300/30 blur-lg" />

                        <motion.div className="absolute -left-6 top-11 h-24 w-18 rounded-full bg-gradient-to-b from-rose-500 via-pink-500 to-orange-400 shadow-[0_0_40px_rgba(244,114,182,0.25)]" animate={{ y: [0, -5, 0], rotate: [-3, 2, -3] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} />
                        <motion.div className="absolute -right-6 top-11 h-24 w-18 rounded-full bg-gradient-to-b from-fuchsia-500 via-rose-500 to-orange-400 shadow-[0_0_40px_rgba(244,114,182,0.25)]" animate={{ y: [0, -5, 0], rotate: [3, -2, 3] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }} />

                        <div className="absolute top-4 flex gap-3">
                            <motion.div
                                animate={{ rotate: [0, 7, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                                className="h-5 w-10 rounded-t-full bg-cyan-500"
                            />
                            <motion.div
                                animate={{ rotate: [0, -7, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                                className="h-5 w-10 rounded-t-full bg-cyan-500"
                            />
                        </div>

                        <div className="absolute bottom-0 left-1/2 h-4 w-48 -translate-x-1/2 rounded-full bg-black/25 blur-md" />

                        <motion.div
                            className="relative mt-6 h-[210px] w-[196px] rounded-[46%_46%_40%_40%/42%_42%_30%_30%] border border-cyan-200/20 bg-[radial-gradient(circle_at_50%_28%,_rgba(125,211,252,0.95),_rgba(34,211,238,0.92)_42%,_rgba(14,165,233,0.9)_68%,_rgba(15,23,42,0.98)_100%)] shadow-[inset_0_-20px_35px_rgba(8,47,73,0.45),0_30px_60px_rgba(2,6,23,0.35)]"
                            animate={{ rotateZ: [0, 0.6, 0, -0.6, 0] }}
                            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                            style={{ transform: `rotateX(${faceTiltY}deg) rotateY(${faceTiltX}deg)` }}
                        >
                            <div className="absolute left-1/2 top-5 h-8 w-16 -translate-x-1/2 rounded-full bg-cyan-500/80 blur-lg" />

                            <div className="absolute left-1/2 top-3 h-1.5 w-20 -translate-x-1/2 rounded-full bg-white/20" />

                            <div className="absolute inset-x-0 top-16 flex items-center justify-center gap-6 md:gap-7">
                                <div className="relative h-20 w-20 rounded-full border-[8px] border-slate-700 bg-[radial-gradient(circle_at_45%_35%,_#d9f5ff,_#63d3ff_40%,_#1d4ed8_82%)] shadow-[inset_0_0_22px_rgba(255,255,255,0.25)]" style={eyeShellStyle}>
                                    <div className="absolute inset-3 overflow-hidden rounded-full bg-white/90">
                                        <div className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_35%_35%,_#0f172a,_#1d4ed8_36%,_#38bdf8_78%)] transition-transform duration-75 ease-out" style={leftPupilStyle}>
                                            <div className="absolute left-2.5 top-1.5 h-2.5 w-2.5 rounded-full bg-white" />
                                        </div>
                                    </div>
                                </div>

                                <div className="relative h-20 w-20 rounded-full border-[8px] border-slate-700 bg-[radial-gradient(circle_at_45%_35%,_#d9f5ff,_#63d3ff_40%,_#1d4ed8_82%)] shadow-[inset_0_0_22px_rgba(255,255,255,0.25)]" style={eyeShellStyle}>
                                    <div className="absolute inset-3 overflow-hidden rounded-full bg-white/90">
                                        <div className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_35%_35%,_#0f172a,_#1d4ed8_36%,_#38bdf8_78%)] transition-transform duration-75 ease-out" style={rightPupilStyle}>
                                            <div className="absolute left-2.5 top-1.5 h-2.5 w-2.5 rounded-full bg-white" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute left-1/2 top-[86px] h-10 w-20 -translate-x-1/2 rounded-[40%] bg-gradient-to-b from-rose-500 via-red-500 to-orange-400 shadow-[0_0_30px_rgba(248,113,113,0.35)]" />
                            <div className="absolute left-1/2 top-[102px] h-4 w-14 -translate-x-1/2 rounded-full bg-rose-200/90 blur-[1px]" />

                            <div className="absolute left-1/2 top-[136px] h-12 w-[150px] -translate-x-1/2 rounded-[0_0_48px_48px] border-b-4 border-cyan-900/35 bg-[linear-gradient(180deg,_rgba(255,255,255,0.95)_0%,_rgba(237,254,255,0.86)_100%)] shadow-[inset_0_-10px_18px_rgba(6,182,212,0.18)]" style={mouthGlowStyle}>
                                <div className="absolute left-[14px] top-[10px] h-4 w-4 rounded-full bg-white/90 shadow-[0_0_0_5px_rgba(8,145,178,0.15)]" />
                                <div className="absolute right-[14px] top-[10px] h-4 w-4 rounded-full bg-white/90 shadow-[0_0_0_5px_rgba(8,145,178,0.15)]" />
                            </div>

                            <div className="absolute bottom-6 left-1/2 h-8 w-32 -translate-x-1/2 rounded-full bg-slate-950/25 blur-md" />
                                <div className="absolute bottom-0 left-5 h-5 w-10 rounded-tl-[2rem] rounded-tr-[2rem] bg-cyan-500/95 shadow-[inset_0_2px_0_rgba(255,255,255,0.15)]" />
                                <div className="absolute bottom-0 right-5 h-5 w-10 rounded-tl-[2rem] rounded-tr-[2rem] bg-cyan-500/95 shadow-[inset_0_2px_0_rgba(255,255,255,0.15)]" />
                        </motion.div>
                    </motion.div>
                </div>

                <motion.div
                    className="mt-4 w-full max-w-xl rounded-[1.5rem] border border-cyan-300/10 bg-white/5 p-3 backdrop-blur-md"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                >
                    <div className="mb-2 flex items-center justify-between">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-100/80">Ticket flow</p>
                        <p className="text-[10px] text-cyan-100/60">Incoming → triaged → resolved</p>
                    </div>
                    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/30 p-2.5">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.08),transparent_55%)]" />
                        <div className="absolute inset-x-4 top-5 h-px bg-gradient-to-r from-transparent via-cyan-300/35 to-transparent" />
                        <div className="absolute inset-x-4 bottom-5 h-px bg-gradient-to-r from-transparent via-fuchsia-400/25 to-transparent" />

                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { label: 'Incoming', tone: 'bg-cyan-400', text: 'Gateway timeout', delay: 0 },
                                { label: 'Triaging', tone: 'bg-amber-400', text: 'High priority', delay: 1.25 },
                                { label: 'Resolved', tone: 'bg-emerald-400', text: 'Assigned fast', delay: 2.5 },
                            ].map((item) => (
                                <motion.div
                                    key={item.label}
                                    className="relative overflow-hidden rounded-xl border border-white/10 bg-slate-900/70 p-2"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.35, delay: item.delay * 0.08 }}
                                >
                                    <div className="mb-1.5 flex items-center gap-2">
                                        <span className={`h-2.5 w-2.5 rounded-full ${item.tone} shadow-[0_0_18px_currentColor]`} />
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-100/70">{item.label}</p>
                                    </div>
                                    <p className="text-[11px] font-semibold text-white">{item.text}</p>
                                    <motion.div
                                        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10"
                                        animate={{ opacity: [0.4, 1, 0.4] }}
                                        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: item.delay }}
                                    >
                                        <div className={`h-full rounded-full ${item.tone} w-[72%]`} />
                                    </motion.div>
                                </motion.div>
                            ))}
                        </div>
                        <div className="mt-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-100/55">
                            <span>Auto-resolve in seconds</span>
                            <span>Low-touch triage</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

export default function Login() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [look, setLook] = useState({ x: 0, y: 0 });
    const heroRef = useRef(null);
    const targetLookRef = useRef({ x: 0, y: 0 });
    const rafRef = useRef(null);

    useEffect(() => {
        const handleMove = (event) => {
            const rect = heroRef.current?.getBoundingClientRect();
            if (!rect) return;

            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const deltaX = (event.clientX - centerX) / rect.width;
            const deltaY = (event.clientY - centerY) / rect.height;

            targetLookRef.current = {
                x: clamp(deltaX * 2.2, -1, 1),
                y: clamp(deltaY * 2.2, -1, 1),
            };
        };

        const tick = () => {
            setLook((current) => {
                const target = targetLookRef.current;
                return {
                    x: current.x + (target.x - current.x) * 0.08,
                    y: current.y + (target.y - current.y) * 0.08,
                };
            });
            rafRef.current = window.requestAnimationFrame(tick);
        };

        window.addEventListener('mousemove', handleMove);
        rafRef.current = window.requestAnimationFrame(tick);

        return () => {
            window.removeEventListener('mousemove', handleMove);
            if (rafRef.current) {
                window.cancelAnimationFrame(rafRef.current);
            }
        };
    }, []);

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors },
    } = useForm({ mode: 'onSubmit' });

    const loginMutation = useMutation({
        mutationFn: authAPI.login,
        onSuccess: (res) => {
            const token = res.data.data.token;
            setAuthToken(token, rememberMe);
            toast.success('Welcome back!');
            queryClient.invalidateQueries({ queryKey: ['me'] });
            navigate('/dashboard');
        },
        onError: (err) => {
            if (err.fieldErrors) {
                Object.entries(err.fieldErrors).forEach(([field, msg]) => {
                    setError(field, { type: 'server', message: msg });
                });
            }
            toast.error(err.message || 'Login failed');
        }
    });

    const onSubmit = (data) => {
        loginMutation.mutate({
            ...data,
            email: data.email?.trim(),
        });
    };

    const handleSocialLogin = (provider) => {
        toast(`${provider} login is coming soon!`, { icon: 'ℹ️' });
    };

    return (
        <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_20%_18%,rgba(59,130,246,0.14),transparent_30%),radial-gradient(circle_at_78%_14%,rgba(139,92,246,0.12),transparent_28%),radial-gradient(circle_at_50%_78%,rgba(6,182,212,0.12),transparent_30%),linear-gradient(135deg,_#e2e8f0_0%,_#eef2ff_36%,_#0f172a_36%,_#111827_100%)] text-slate-900 md:grid md:h-screen md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.18),transparent_58%)] opacity-40 mix-blend-screen" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.25)_1px,transparent_1px)] bg-[size:64px_64px] opacity-10" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_60%_50%,rgba(15,23,42,0.28),transparent_42%)]" />
            
            <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 flex items-center justify-center px-6 py-8 md:h-screen md:px-10"
            >
                <div className="w-full max-w-[520px] rounded-[2rem] border border-white/65 bg-white/95 p-5 text-slate-900 shadow-[0_20px_70px_rgba(15,23,42,0.12)] backdrop-blur-2xl md:p-6">
                    
                    <div className="mb-6 flex items-center space-x-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[linear-gradient(135deg,_#0f172a,_#2563eb_55%,_#22d3ee)] shadow-lg shadow-sky-500/20">
                            <span className="text-lg font-black tracking-tight text-white">TIQ</span>
                        </div>
                        <span className="text-2xl font-black tracking-tight text-slate-900">
                            TicketIQ
                        </span>
                    </div>

                    
                    <div className="mb-2.5">
                        <h1 className="mb-2 text-[1.95rem] font-black leading-[0.95] tracking-tight text-slate-900 md:text-[2.35rem]">
                            Welcome back.
                        </h1>
                        <p className="hidden max-w-md text-sm text-slate-700 xl:block">
                            Sign in to TicketIQ and resolve tickets faster.
                        </p>
                    </div>

                    
                    <div className="mb-4 hidden grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid">
                        <button
                            onClick={() => handleSocialLogin('Google')}
                            className="group flex items-center justify-center space-x-2 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.06)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-[0_18px_28px_rgba(59,130,246,0.16)]"
                        >
                            <Chrome className="h-5 w-5 text-slate-500 transition group-hover:text-sky-600" />
                            <span className="font-semibold text-slate-800 transition group-hover:text-sky-700">
                                Google
                            </span>
                        </button>
                        <button
                            onClick={() => handleSocialLogin('GitHub')}
                            className="group flex items-center justify-center space-x-2 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.06)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-[0_18px_28px_rgba(15,23,42,0.12)]"
                        >
                            <Github className="h-5 w-5 text-slate-500 transition group-hover:text-slate-900" />
                            <span className="font-semibold text-slate-800 transition group-hover:text-slate-950">
                                GitHub
                            </span>
                        </button>
                    </div>

                    
                    <div className="relative mb-4 hidden xl:block">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-white/80 px-4 text-slate-700 backdrop-blur-sm">
                                or continue with email
                            </span>
                        </div>
                    </div>

                    
                    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                        
                        <div className="lg:col-span-1">
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
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
                                    className={`w-full rounded-2xl border px-11 py-2.5 text-slate-950 shadow-[0_10px_24px_rgba(15,23,42,0.05)] outline-none transition-all placeholder:text-slate-500 focus:border-transparent focus:ring-2 focus:ring-sky-500 ${errors.email ? 'border-danger-500 bg-rose-50/60' : 'border-slate-200 bg-white/95 hover:border-slate-300'}`}
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1 text-sm text-danger-600">{errors.email.message}</p>
                            )}
                        </div>

                        
                        <div className="lg:col-span-1">
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Password"
                                    {...register('password', {
                                        required: 'Password is required',
                                    })}
                                    className={`w-full rounded-2xl border px-11 py-2.5 pr-12 text-slate-950 shadow-[0_10px_24px_rgba(15,23,42,0.05)] outline-none transition-all placeholder:text-slate-500 focus:border-transparent focus:ring-2 focus:ring-sky-500 ${errors.password ? 'border-danger-500 bg-rose-50/60' : 'border-slate-200 bg-white/95 hover:border-slate-300'}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-800"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-sm text-danger-600">{errors.password.message}</p>
                            )}
                        </div>

                        
                        <div className="flex items-center justify-between gap-4 pt-0 lg:col-span-2">
                            <label className="flex cursor-pointer items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                />
                                <span className="text-sm text-slate-800">
                                    Remember me
                                </span>
                            </label>
                            <Link
                                to="/forgot-password"
                                className="text-sm font-semibold text-sky-800 hover:text-sky-900"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        
                        <Button
                            type="submit"
                            loading={loginMutation.isPending}
                            className="w-full rounded-2xl bg-[linear-gradient(135deg,_#2563eb,_#06b6d4,_#8b5cf6)] px-5 py-2 font-semibold shadow-[0_18px_35px_rgba(37,99,235,0.25)] transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_40px_rgba(37,99,235,0.30)] lg:col-span-2"
                        >
                            {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </form>

                    
                    <p className="mt-4 hidden text-center text-sm text-slate-700 xl:block">
                        Don't have an account?{' '}
                        <Link
                            to="/signup"
                            className="font-semibold text-sky-800 hover:text-sky-900"
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
                ref={heroRef}
                className="relative z-10 flex min-h-[520px] p-4 md:h-screen md:p-5"
            >
                <RobotHero lookX={look.x} lookY={look.y} />
            </motion.div>
        </div>
    );
}
