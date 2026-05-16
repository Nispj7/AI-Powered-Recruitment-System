import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Loader2 } from 'lucide-react';

const AudioRecorder = ({ onAudioRecorded, disabled, onStart, onStop }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [countdown, setCountdown] = useState(8);
    const [isProcessing, setIsProcessing] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const countdownIntervalRef = useRef(null);

    useEffect(() => {
        return () => {
            if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
            }
        };
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                stream.getTracks().forEach(track => track.stop());

                setIsProcessing(true);
                try {
                    await onAudioRecorded(audioBlob);
                } catch (error) {
                    console.error("Error in onAudioRecorded:", error);
                } finally {
                    setIsProcessing(false);
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
            setCountdown(8);
            if (onStart) onStart();

            // Countdown timer
            countdownIntervalRef.current = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(countdownIntervalRef.current);
                        stopRecording();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Could not access microphone. Please check permissions.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
            }
            if (onStop) onStop();
        }
    };

    return (
        <div className="flex items-center gap-3">
            <AnimatePresence mode="wait">
                {!isRecording && !isProcessing ? (
                    <motion.button
                        key="record"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        onClick={startRecording}
                        disabled={disabled}
                        className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        <Mic className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        Record Answer
                    </motion.button>
                ) : isRecording ? (
                    <motion.button
                        key="recording"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="bg-red-500 border-2 border-red-400 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 flex items-center gap-2 hover:bg-red-600 active:scale-95"
                        onClick={stopRecording}
                        title="Click to stop early"
                    >
                        <div className="w-3 h-3 bg-white rounded-full animate-ping" />
                        Finish ({countdown}s)
                    </motion.button>
                ) : (
                    <motion.div
                        key="processing"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="glass-strong px-6 py-2 rounded-lg flex items-center gap-2"
                    >
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                    </motion.div>
                )}
            </AnimatePresence>

            {isRecording && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-1"
                >
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="w-1 bg-red-500 rounded-full"
                            animate={{
                                height: [10, 20, 10],
                            }}
                            transition={{
                                duration: 0.6,
                                repeat: Infinity,
                                delay: i * 0.2,
                            }}
                        />
                    ))}
                </motion.div>
            )}
        </div>
    );
};

export default AudioRecorder;
