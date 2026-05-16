import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, ShieldCheck, UserCircle2, Loader2 } from 'lucide-react';
import api from '../services/api';

const Login = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('password123');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const data = await api.login(email, password);

            if (data.success) {
                onLoginSuccess({
                    id: data.user_id,
                    username: data.username,
                    email: data.email,
                    role: data.role
                });
            } else {
                setError('Invalid credentials. Please try again.');
            }
        } catch (err) {
            setError('Connection error. Please ensure the backend is running.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                {/* Logo/Title */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        className="inline-block mb-4"
                    >
                        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/50">
                            <LogIn className="w-10 h-10 text-white" />
                        </div>
                    </motion.div>
                    <h1 className="text-4xl font-bold mb-2">
                        <span className="text-gradient">AI Interview Chatbot</span>
                    </h1>
                    <p className="text-gray-400">Step into a true interview experience with AI</p>
                </div>

                {/* Login Form */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="glass-strong rounded-2xl p-8 shadow-2xl"
                >
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">
                                Email Address or Username
                            </label>
                            <div className="relative group">
                                <Mail className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-500 transition-colors" />
                                <input
                                    type="text"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-7 py-5 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all placeholder:text-gray-600 font-medium text-white shadow-inner"
                                    placeholder="Enter email or 'admin'"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">
                                Portal Password
                            </label>
                            <div className="relative group">
                                <Lock className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-500 transition-colors" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-7 py-5 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all placeholder:text-gray-600 font-medium text-white shadow-inner"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm"
                            >
                                {error}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Logging in...
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-5 h-5" />
                                    Login
                                </>
                            )}
                        </button>
                    </form>


                </motion.div>

                {/* Footer */}
                <p className="text-center text-gray-500 text-sm mt-6">
                    Research Prototype • AI-Powered Interview System
                </p>
            </motion.div>
        </div>
    );
};

export default Login;
