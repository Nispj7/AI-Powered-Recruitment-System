import React, { useState } from 'react';
import { Star, Send, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

const Feedback = ({ sessionId, onComplete }) => {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [comments, setComments] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) return;

        setIsSubmitting(true);
        try {
            const data = await api.submitFeedback({
                session_id: sessionId,
                rating,
                comments
            });

            if (data.ok) {
                setIsSubmitted(true);
                setTimeout(() => {
                    if (onComplete) onComplete();
                }, 1500);
            }
        } catch (err) {
            console.error("Feedback error:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl overflow-hidden relative"
            >
                <AnimatePresence mode="wait">
                    {!isSubmitted ? (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, x: -50 }}
                            className="space-y-6"
                        >
                            <div className="text-center space-y-2">
                                <h2 className="text-3xl font-bold text-white tracking-tight">Interview Complete!</h2>
                                <p className="text-blue-200/70">Your feedback helps us improve the AI experience.</p>
                            </div>

                            <div className="flex flex-col items-center space-y-4">
                                <p className="text-sm font-medium text-blue-100/50 uppercase tracking-widest">Rate your experience</p>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <motion.button
                                            key={star}
                                            whileHover={{ scale: 1.2 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHover(star)}
                                            onMouseLeave={() => setHover(0)}
                                            className="focus:outline-none transition-colors"
                                        >
                                            <Star
                                                size={40}
                                                className={`${star <= (hover || rating)
                                                    ? 'fill-yellow-400 text-yellow-400'
                                                    : 'text-white/20'
                                                    } transition-all duration-200`}
                                            />
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-sm font-medium text-blue-100/50 uppercase tracking-widest">Any additional thoughts?</p>
                                <textarea
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                    placeholder="Tell us what you liked or how we can improve..."
                                    className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
                                />
                            </div>

                            <motion.button
                                whileHover={rating > 0 ? { scale: 1.02 } : {}}
                                whileTap={rating > 0 ? { scale: 0.98 } : {}}
                                onClick={handleSubmit}
                                disabled={rating === 0 || isSubmitting}
                                className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${rating > 0
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/40 hover:from-blue-500 hover:to-indigo-500'
                                    : 'bg-white/5 text-white/20 cursor-not-allowed'
                                    }`}
                            >
                                {isSubmitting ? (
                                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Send size={20} />
                                        <span>Submit Feedback</span>
                                    </>
                                )}
                            </motion.button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-10 space-y-6"
                        >
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-4">
                                <CheckCircle size={48} className="text-green-400" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-3xl font-bold text-white">Thank You!</h2>
                                <p className="text-blue-200/70 text-lg">Your feedback has been recorded.</p>
                            </div>
                            <p className="text-sm text-white/30 italic">Redirecting you shortly...</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
            </motion.div>
        </div>
    );
};

export default Feedback;
