import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Award, FileText, LogOut } from 'lucide-react';

const Report = ({ onLogout }) => {
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    if (onLogout) onLogout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [onLogout]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            {/* Simple Thank You Message */}
            <div className="glass-strong rounded-[2.5rem] p-16 text-center shadow-2xl relative overflow-hidden group">
                <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-8 text-green-400">
                    <CheckCircle className="w-12 h-12" />
                </div>
                <h2 className="text-4xl font-black mb-4 tracking-tight text-white leading-tight">
                    Thank you for the response.<br />We will get back to you soon!
                </h2>
                <p className="text-gray-400 font-medium max-w-md mx-auto">
                    Your assessment has been successfully recorded and submitted for review.
                </p>
            </div>

            {/* Auto-logout Footer */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-center pt-8"
            >
                <div className="inline-flex flex-col items-center gap-4 bg-white/5 backdrop-blur-md px-10 py-6 rounded-[2rem] border border-white/10">
                    <div className="flex items-center gap-3 text-gray-300">
                        <div className="relative w-6 h-6">
                            <svg className="w-6 h-6 transform -rotate-90">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-white/10" />
                                <motion.circle
                                    cx="12" cy="12" r="10" stroke="#3b82f6" strokeWidth="2" fill="transparent"
                                    strokeDasharray={62.8}
                                    initial={{ strokeDashoffset: 0 }}
                                    animate={{ strokeDashoffset: 62.8 }}
                                    transition={{ duration: 5, ease: "linear" }}
                                />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">{countdown}</span>
                        </div>
                        <span className="text-sm font-bold tracking-wide uppercase opacity-70">Logging out in {countdown}s</span>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default Report;
