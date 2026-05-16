import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, User, Volume2, Play } from 'lucide-react';

const ChatBubble = ({ message, sender, index, audioBlob, isAudio }) => {
    const isBot = sender === 'bot';
    const [isPlaying, setIsPlaying] = useState(false);

    const handleSpeak = () => {
        // Use Web Speech API to read the message
        if ('speechSynthesis' in window) {
            // Cancel any ongoing speech
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(message);
            utterance.rate = 0.9; // Slightly slower for clarity
            utterance.pitch = isBot ? 0.8 : 1.0; // Lower pitch for bot
            utterance.volume = 1.0;

            window.speechSynthesis.speak(utterance);
        } else {
            alert('Text-to-speech is not supported in your browser.');
        }
    };

    const handlePlayAudio = () => {
        if (audioBlob) {
            setIsPlaying(true);
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);

            audio.onended = () => {
                setIsPlaying(false);
                URL.revokeObjectURL(audioUrl);
            };

            audio.play();
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex gap-3 mb-4 ${isBot ? 'justify-start' : 'justify-end'}`}
        >
            {isBot && (
                <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-1 max-w-[80%]">
                <div className={isBot ? 'chat-bubble-bot' : 'chat-bubble-user'}>
                    <p className="text-sm leading-relaxed">{message}</p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                    {/* Listen button for text-to-speech */}
                    <button
                        onClick={handleSpeak}
                        className="self-start flex items-center gap-1 text-xs text-gray-400 hover:text-primary-400 transition-colors duration-200 px-2 py-1 rounded hover:bg-white/5"
                        title="Listen to this message"
                    >
                        <Volume2 className="w-3 h-3" />
                        <span>Listen</span>
                    </button>

                    {/* Play audio button if this is an audio message */}
                    {isAudio && audioBlob && (
                        <button
                            onClick={handlePlayAudio}
                            disabled={isPlaying}
                            className="self-start flex items-center gap-1 text-xs text-accent-400 hover:text-accent-300 transition-colors duration-200 px-2 py-1 rounded hover:bg-white/5 disabled:opacity-50"
                            title="Play recorded audio"
                        >
                            <Play className="w-3 h-3" />
                            <span>{isPlaying ? 'Playing...' : 'Play Recording'}</span>
                        </button>
                    )}
                </div>
            </div>

            {!isBot && (
                <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shadow-lg">
                        <User className="w-5 h-5 text-white" />
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default ChatBubble;
