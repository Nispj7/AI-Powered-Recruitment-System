import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, LogOut, PlayCircle, History, ChevronDown, ChevronUp, BrainCircuit, Mic } from 'lucide-react';
import ChatBubble from './ChatBubble';
import AudioRecorder from './AudioRecorder';
import Report from './Report';
import Feedback from './Feedback';
import api from '../services/api';

const Interview = ({ user, onLogout }) => {
    const [sessionId, setSessionId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [isInterviewStarted, setIsInterviewStarted] = useState(false);
    const [isInterviewComplete, setIsInterviewComplete] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [finalReport, setFinalReport] = useState(null);
    const [userAnswers, setUserAnswers] = useState([]); // Track all user inputs
    const [showHistory, setShowHistory] = useState(false); // Toggle history panel
    const [introSet, setIntroSet] = useState(false); // Track if introduction is provided
    const [domainSet, setDomainSet] = useState(false); // Track if domain is selected
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [questionStartTime, setQuestionStartTime] = useState(null);
    const chatEndRef = useRef(null);
    const silenceTimerRef = useRef(null);
    const textareaRef = useRef(null);
    const transcriptRef = useRef(''); // ✨ NEW: Avoid stale state in STT closure

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ✨ NEW: Auto-scroll textarea as data comes in
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
        }
    }, [inputText]);

    const startInterviewFlow = async () => {
        setIsInterviewStarted(true);
        setLoading(true);
        setMessages([
            {
                text: `Welcome, ${user.username}! Before we dive into the technicalities, could you please introduce yourself briefly?`,
                sender: 'bot',
            }
        ]);
        setLoading(false);
        setQuestionStartTime(Date.now());
    };

    const handleInitialIntroduction = async (introText) => {
        setLoading(true);
        try {
            // Optional: Here you could analyze the intro, but for now we just acknowledge and move on
            setIntroSet(true);
            setMessages((prev) => [
                ...prev,
                {
                    text: "Great to meet you! Now, to tailor the questions correctly, which field are you giving the interview for? (e.g., Frontend, Backend, Data Science)",
                    sender: 'bot',
                }
            ]);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setQuestionStartTime(Date.now());
        }
    };

    const handleInitialDomainSelection = async (domainText) => {
        setLoading(true);
        try {
            const result = await api.setDomain(domainText);

            if (result.ok) {
                setDomainSet(true);
                const data = await api.startSession(user.id);

                if (data.ok) {
                    setSessionId(data.session_id);
                    setMessages((prev) => [
                        ...prev,
                        {
                            text: `Great! I've set the focus to ${result.domain}. Let's begin.`,
                            sender: 'bot',
                        },
                        {
                            text: `QUESTION ${data.q_no}: ${data.question}`,
                            sender: 'bot',
                        }
                    ]);
                    setQuestionStartTime(Date.now());
                }
            } else {
                setMessages((prev) => [
                    ...prev,
                    {
                        text: `❌ ${result.error}`,
                        sender: 'bot',
                    }
                ]);
            }
        } catch (error) {
            console.error(error);
            alert('Failed to initialize interview. Please check backend connection.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitText = async (e) => {
        if (e && e.preventDefault) e.preventDefault();

        // Clear any pending silence timer
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }

        const userMessage = inputText.trim() || transcriptRef.current.trim();
        if (!userMessage) return;

        const delayMs = questionStartTime ? Date.now() - questionStartTime : 0;
        setInputText('');
        transcriptRef.current = ''; // Clear the ref
        setMessages((prev) => [...prev, { text: userMessage, sender: 'user' }]);

        if (!introSet) {
            await handleInitialIntroduction(userMessage);
            return;
        }

        if (!domainSet) {
            await handleInitialDomainSelection(userMessage);
            return;
        }

        if (!sessionId) return;

        setUserAnswers((prev) => [
            ...prev,
            {
                type: 'text',
                content: userMessage,
                timestamp: new Date().toLocaleTimeString(),
                questionNumber: userAnswers.length + 1,
            },
        ]);

        setLoading(true);
        try {
            const data = await api.submitAnswer(sessionId, userMessage, delayMs);

            if (!data.ok) {
                setMessages((prev) => [
                    ...prev,
                    { text: `Error: ${data.error}`, sender: 'bot' },
                ]);
                return;
            }

            if (data.done) {
                // 💾 SAVE REPORT TO MYSQL
                await api.saveReport({
                    name: user.username,
                    email: user.email,
                    total_grade: data.final_score,
                    result: data.decision,
                    performance: { report: data.report }
                });

                setIsInterviewComplete(true);
                setShowFeedback(true);
                setFinalReport({
                    decision: data.decision,
                    finalScore: data.final_score,
                    reportText: data.report,
                });
            } else {
                setMessages((prev) => [
                    ...prev,
                    {
                        text: `QUESTION ${data.q_no}: ${data.question}`,
                        sender: 'bot',
                    }
                ]);
                setQuestionStartTime(Date.now());
            }
        } catch (error) {
            setMessages((prev) => [
                ...prev,
                { text: 'Error submitting answer. Please try again.', sender: 'bot' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    // Simplified voice transcription that can be linked to the recorder
    const recognitionRef = useRef(null);

    const stopTranscribing = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        setIsTranscribing(false);
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };

    const startTranscribing = (shouldAutoSubmit = true) => {
        if (!('webkitSpeechRecognition' in window)) {
            setMessages((prev) => [...prev, { text: "❌ Browser speech recognition not supported.", sender: 'bot' }]);
            return;
        }

        stopTranscribing(); // Clean up existing
        setIsTranscribing(true);
        const recognition = new window.webkitSpeechRecognition();
        recognitionRef.current = recognition;

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        const resetTimer = () => {
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => {
                console.log("[STT] 5s Silence detected. Auto-submitting...");
                recognition.stop();
            }, 5000); // 5-second silence limit
        };

        recognition.onstart = () => {
            resetTimer();
            console.log("[STT] Speech recognition started");
        };

        recognition.onresult = (event) => {
            resetTimer();

            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const transcriptFragment = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    transcriptRef.current += transcriptFragment;
                } else {
                    interimTranscript += transcriptFragment;
                }
            }

            // Show immediate feedback in the textarea
            setInputText(transcriptRef.current + interimTranscript);
        };

        recognition.onend = () => {
            setIsTranscribing(false);
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

            // Auto-submit IF we are in standalone mode (not linked to recorder)
            const final = transcriptRef.current.trim();
            if (shouldAutoSubmit && final.length > 2) {
                handleSubmitText();
            } else {
                console.log("[STT] Ended (auto-submit: " + shouldAutoSubmit + ")");
            }
            if (shouldAutoSubmit) transcriptRef.current = '';
        };

        recognition.onerror = (e) => {
            console.error("STT Error", e);
            setIsTranscribing(false);
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

            if (e.error === 'not-allowed') {
                alert("Microphone access denied. Please click the Lock icon in the address bar and Allow your microphone.");
            } else if (e.error === 'no-speech') {
                console.log("[STT] No speech detected.");
            } else {
                alert(`Speech recognition error: ${e.error}. Please try again or use text input.`);
            }
        };

        recognition.start();
    };

    const handleAudioRecorded = async (audioBlob) => {
        if (isInterviewComplete || !sessionId) return;

        const delayMs = questionStartTime ? Date.now() - questionStartTime : 0;

        // Since we are in demo mode, we'll use STT alongside the recording 
        // to provide the text to the LLM. 
        // We've already improved api.uploadAudio to take a transcript.

        setMessages((prev) => [
            ...prev,
            {
                text: '🎤 Voice input received',
                sender: 'user',
                audioBlob: audioBlob,
                isAudio: true
            },
        ]);

        setUserAnswers((prev) => [
            ...prev,
            {
                type: 'audio',
                content: '🎤 Audio answer',
                timestamp: new Date().toLocaleTimeString(),
                questionNumber: userAnswers.length + 1,
                audioBlob: audioBlob,
            },
        ]);

        setLoading(true);
        try {
            // Use the current inputText as the transcript if the user used STT while recording
            const transcript = inputText || "The candidate provided a voice response.";
            const data = await api.uploadAudio(sessionId, audioBlob, transcript, delayMs);

            setInputText(''); // Clear for next round

            if (!data.ok) {
                setMessages((prev) => [
                    ...prev,
                    { text: `Error: ${data.error}`, sender: 'bot' },
                ]);
                return;
            }

            if (data.done) {
                // 💾 SAVE REPORT TO MYSQL
                await api.saveReport({
                    name: user.username,
                    email: user.email,
                    total_grade: data.final_score,
                    result: data.decision,
                    performance: { report: data.report }
                });

                setIsInterviewComplete(true);
                setShowFeedback(true);
                setFinalReport({
                    decision: data.decision,
                    finalScore: data.final_score,
                    reportText: data.report,
                });
            } else {
                setMessages((prev) => [
                    ...prev,
                    {
                        text: `QUESTION ${data.q_no}: ${data.question}`,
                        sender: 'bot',
                    }
                ]);
                setQuestionStartTime(Date.now());
            }
        } catch (error) {
            setMessages((prev) => [
                ...prev,
                { text: 'Error processing audio. Please try again.', sender: 'bot' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const playAudioAnswer = (audioBlob) => {
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
    };

    return (
        <div className="min-h-screen p-4">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-strong rounded-2xl p-4 mb-6 flex items-center justify-between"
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-primary-500/20 p-2 rounded-xl">
                            <BrainCircuit className="w-8 h-8 text-primary-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-tight">AI chatbot</h1>
                            <p className="text-xs text-gray-400 font-medium">Candidate: {user.username}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {isInterviewStarted && (
                            <button
                                onClick={() => setShowHistory(!showHistory)}
                                className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border border-white/5 transition-all active:scale-95"
                            >
                                <History className="w-4 h-4 text-primary-400" />
                                Review
                                <span className="bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded-md text-[10px] ml-1">{userAnswers.length}</span>
                                {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                        )}
                        <button onClick={onLogout} className="bg-red-500/10 hover:bg-red-500/20 px-4 py-2 rounded-xl text-xs font-bold text-red-400 border border-red-500/10 transition-all active:scale-95">
                            Logout
                        </button>
                    </div>
                </motion.div>

                <AnimatePresence>
                    {showHistory && userAnswers.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="glass-strong rounded-2xl p-6 mb-6 border border-white/10 shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-1 h-full bg-primary-500" />
                            <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-primary-400 uppercase tracking-widest">
                                <History className="w-4 h-4" />
                                Response Log
                            </h3>
                            <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                                {userAnswers.map((answer, idx) => (
                                    <div key={idx} className="bg-white/5 rounded-xl p-4 border border-white/5 group hover:border-primary-500/30 transition-all">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Turn {answer.questionNumber}</span>
                                            <span className="text-[10px] text-gray-500">{answer.timestamp}</span>
                                        </div>
                                        <p className="text-sm text-gray-200 leading-relaxed mb-3">{answer.content}</p>
                                        <div className="flex justify-between items-center">
                                            <span className={`text-[9px] px-2 py-1 rounded-md font-bold uppercase tracking-tighter ${answer.type === 'text' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                                                {answer.type}
                                            </span>
                                            {answer.type === 'audio' && (
                                                <button onClick={() => playAudioAnswer(answer.audioBlob)} className="text-[10px] text-primary-400 flex items-center gap-1.5 hover:text-primary-300 transition-colors font-bold group">
                                                    <PlayCircle className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" /> Play
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {!isInterviewStarted ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-strong rounded-[2.5rem] p-16 text-center shadow-2xl relative overflow-hidden group"
                    >
                        <div className="w-24 h-24 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-8 text-primary-400">
                            <PlayCircle className="w-12 h-12" />
                        </div>
                        <h2 className="text-5xl font-black mb-4 tracking-tight text-white">Your Interview Starts Here
                            Showcase Your Skills Today!
                        </h2>
                        <button
                            onClick={startInterviewFlow}
                            className="bg-primary-500 hover:bg-primary-600 text-white font-black py-5 px-14 rounded-3xl text-xl shadow-2xl shadow-primary-500/40 active:scale-95 transition-all hover:tracking-wide"
                        >
                            Initiate Assessment
                        </button>
                    </motion.div>
                ) : (
                    <div className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="glass-strong rounded-[2rem] p-8 h-[400px] overflow-y-auto shadow-2xl relative custom-scrollbar"
                        >
                            <div className="space-y-6">
                                {messages.map((msg, idx) => (
                                    <ChatBubble
                                        key={idx}
                                        message={msg.text}
                                        sender={msg.sender}
                                        index={idx}
                                        audioBlob={msg.audioBlob}
                                        isAudio={msg.isAudio}
                                    />
                                ))}
                                {loading && (
                                    <div className="flex items-center gap-3 text-gray-500 ml-14 group">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span className="text-xs font-bold tracking-widest uppercase opacity-60">AI Thinking</span>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>
                        </motion.div>

                        {!isInterviewComplete && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-strong rounded-[2rem] p-6 shadow-2xl border border-white/5 bg-white/5 relative"
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <button
                                        onClick={startTranscribing}
                                        disabled={loading || isTranscribing}
                                        className={`p-4 rounded-2xl transition-all shadow-xl active:scale-95 border-2 ${isTranscribing
                                            ? 'bg-red-500 border-red-400 animate-pulse'
                                            : 'bg-primary-500 border-primary-400 hover:bg-primary-600'
                                            }`}
                                        title={isTranscribing ? "Listening..." : "Stop & Speak"}
                                    >
                                        <Mic className={`w-6 h-6 text-white ${isTranscribing ? 'animate-bounce' : ''}`} />
                                    </button>

                                    <div className="flex flex-col gap-2">
                                        <AudioRecorder
                                            onAudioRecorded={handleAudioRecorded}
                                            disabled={loading}
                                            onStart={() => {
                                                transcriptRef.current = '';
                                                startTranscribing(false);
                                            }}
                                            onStop={stopTranscribing}
                                        />
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest pl-1">
                                            {isTranscribing ? "Recording Audio..." : "Voice Analysis Mode"}
                                        </p>
                                    </div>

                                    <form onSubmit={handleSubmitText} className="flex gap-4 flex-1 items-end">
                                        <textarea
                                            ref={textareaRef}
                                            value={inputText}
                                            onChange={(e) => setInputText(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSubmitText();
                                                }
                                            }}
                                            placeholder={!introSet ? "Introduce yourself..." : (!domainSet ? "Domain (e.g., Frontend)..." : "Answer...")}
                                            className="bg-white/5 border border-white/10 rounded-2xl flex-1 px-7 py-5 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all placeholder:text-gray-600 font-medium text-white shadow-inner min-h-[120px] resize-none overflow-y-auto"
                                            disabled={loading}
                                        />
                                        <button
                                            type="submit"
                                            disabled={loading || isTranscribing || !inputText.trim()}
                                            className="bg-primary-500 hover:bg-primary-600 p-5 rounded-2xl transition-all disabled:opacity-20 shadow-xl shadow-primary-500/20 active:scale-95 mb-1"
                                        >
                                            <Send className="w-6 h-6 text-white" />
                                        </button>
                                    </form>
                                </div>


                            </motion.div>
                        )}

                        {isInterviewComplete && showFeedback && (
                            <Feedback
                                sessionId={sessionId}
                                onComplete={() => setShowFeedback(false)}
                            />
                        )}

                        {isInterviewComplete && !showFeedback && finalReport && (
                            <Report
                                onLogout={onLogout}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Interview;
