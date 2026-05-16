const API_BASE = "http://127.0.0.1:5000/api";
const DEMO_MODE = false;

// 🧠 Synonym Map for Semantic Understanding
const SYMBOLS = {
    "AI/ML": ["data science", "machine learning", "ai", "ml", "deep learning", "nlp"],
    "Frontend": ["web", "react", "ui", "ux", "browser", "frontend developer", "nextjs"],
    "Backend": ["node", "express", "python", "java", "sql", "server", "api design"],
    "DevOps": ["cloud", "docker", "kubernetes", "aws", "pipeline", "deployment"],
    "Cyber security": ["hacking", "security", "encryption", "firewall", "pentesting", "infosec"]
};

// ✅ Interview state
let currentTurn = 1;
let interviewDomain = "Frontend";
let conversationHistory = [];

// ✅ Candidate adaptive profile (simulated learning)
let candidateProfile = {
    strengths: {},      // {topic: score}
    weaknesses: {},     // {topic: score}
    confidenceTrend: [],// [0.55, 0.62, ...]
    stressTrend: [],
    lastConfidence: 0.5,
    engagement: 0.5,
};

// ✅ Optimized Lexicon with weights
const POSITIVE_LEXICON = [
    { phrase: "i have experience", w: 0.25 },
    { phrase: "i am confident", w: 0.35 },
    { phrase: "implemented", w: 0.25 },
    { phrase: "built", w: 0.20 },
    { phrase: "deployed", w: 0.25 },
    { phrase: "optimized", w: 0.25 },
    { phrase: "debugged", w: 0.20 },
    { phrase: "solved", w: 0.20 },
    { phrase: "worked on", w: 0.15 },
    { phrase: "designed", w: 0.20 },
    { phrase: "architecture", w: 0.20 },
    { phrase: "production", w: 0.20 },
    { phrase: "scalable", w: 0.20 },
    { phrase: "improved performance", w: 0.30 },
    { phrase: "best practices", w: 0.15 },
];

const NEGATIVE_LEXICON = [
    { phrase: "don't know", w: -0.55 },
    { phrase: "dont know", w: -0.55 },
    { phrase: "no idea", w: -0.55 },
    { phrase: "not sure", w: -0.35 },
    { phrase: "unsure", w: -0.30 },
    { phrase: "confused", w: -0.30 },
    { phrase: "forgot", w: -0.25 },
    { phrase: "skip", w: -0.60 },
    { phrase: "pass", w: -0.60 },
    { phrase: "never used", w: -0.35 },
    { phrase: "haven't used", w: -0.35 },
    { phrase: "havent used", w: -0.35 },
    { phrase: "difficult", w: -0.20 },
    { phrase: "failed", w: -0.35 },
    { phrase: "stuck", w: -0.25 },
];

// ✅ Domain knowledge (expanded)
const domainKnowledge = {
    "Frontend": {
        starters: [
            "What is your experience with React, Angular, or Vue?",
            "How do you approach responsive UI design in production applications?"
        ],
        keywords: {
            "react": [
                "Since you mentioned React, explain the difference between state and props.",
                "How do you manage state in large apps (Redux vs Context vs Zustand)?"
            ],
            "css": [
                "How do you make CSS scalable in large projects? Explain BEM or utility-first approaches.",
                "What is CSS specificity and how do you debug UI styling issues quickly?"
            ],
            "performance": [
                "How do you improve frontend performance? Explain lazy loading and code splitting.",
                "How do you optimize Core Web Vitals like LCP, CLS and INP?"
            ]
        },
        fallback: "Good. Now explain how you would handle cross-browser compatibility for modern features."
    },

    "Backend": {
        starters: [
            "Tell me about your experience designing REST APIs.",
            "How do you design authentication and authorization securely?"
        ],
        keywords: {
            "api": [
                "How do you version APIs to avoid breaking old clients?",
                "Explain rate limiting and why it matters in backend systems."
            ],
            "database": [
                "How do you optimize slow SQL queries? Explain indexing.",
                "Explain ACID properties and isolation levels with a real example."
            ],
            "security": [
                "How do you prevent SQL injection and XSS?",
                "Explain hashing vs encryption and where each is used."
            ]
        },
        fallback: "Now tell me how you would design a scalable backend to handle 10x user traffic."
    },

    "AI/ML": {
        starters: [
            "Explain overfitting and two ways to prevent it.",
            "What is the difference between supervised and unsupervised learning?"
        ],
        keywords: {
            "bert": [
                "You mentioned BERT — what does contextual embedding mean in BERT?",
                "Explain attention and how transformers overcome RNN limitations."
            ],
            "evaluation": [
                "How do you evaluate classification models beyond accuracy?",
                "Explain precision, recall, F1-score and ROC-AUC."
            ],
            "feature": [
                "How do you handle feature engineering for a real dataset?",
                "How do you treat missing values and outliers effectively?"
            ]
        },
        fallback: "Now explain how you would deploy a model and monitor model drift."
    },
    "Data Science": {
        starters: [
            "What is your experience with statistical modeling and data analysis?",
            "Explain the difference between L1 and L2 regularization."
        ],
        keywords: {
            "pandas": ["How do you handle large datasets in memory using Python?", "Explain vectorized operations in Pandas."],
            "sql": ["Write a query to find the second highest salary in an employees table.", "Explain window functions in SQL."],
            "ml": ["Explain the bias-variance tradeoff.", "How do you handle imbalanced classes in a dataset?"]
        },
        fallback: "Describe a project where you derived actionable insights from messy data."
    },

    "DevOps": {
        starters: [
            "What is CI/CD and why is it important?",
            "Explain Docker vs Virtual Machines."
        ],
        keywords: {
            "docker": [
                "Explain Dockerfile and image layers. How do you optimize builds?",
                "What is Docker Compose and where do you use it?"
            ],
            "kubernetes": [
                "Explain Pods, Deployments, and Services in Kubernetes.",
                "What is autoscaling and how does Kubernetes help?"
            ],
            "pipeline": [
                "Design a CI/CD pipeline for a web app with backend + frontend.",
                "How do you handle rollback and zero-downtime deployment?"
            ]
        },
        fallback: "Explain how you monitor a production system and handle failures."
    },

    "Cyber security": {
        starters: [
            "What is the difference between authentication and authorization?",
            "Explain OWASP Top 10 and which one is most common in web apps."
        ],
        keywords: {
            "xss": [
                "Explain XSS and how you prevent it.",
                "What is CSP (Content Security Policy) and why it matters?"
            ],
            "csrf": [
                "Explain CSRF attacks and CSRF tokens.",
                "How do SameSite cookies help security?"
            ],
            "jwt": [
                "Explain JWT structure and risks.",
                "How do you safely store tokens in the browser?"
            ]
        },
        fallback: "Explain how you would secure a full-stack application end-to-end."
    }
};

// ✅ helpers
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function normalize(text) {
    return (text || "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}

function computeLexiconScore(text) {
    let score = 0;
    let posHits = [];
    let negHits = [];

    for (const item of POSITIVE_LEXICON) {
        if (text.includes(item.phrase)) {
            score += item.w;
            posHits.push(item.phrase);
        }
    }

    for (const item of NEGATIVE_LEXICON) {
        if (text.includes(item.phrase)) {
            score += item.w; // negative weights
            negHits.push(item.phrase);
        }
    }

    return { score, posHits, negHits };
}

function detectTopics(text) {
    const topics = [];

    const topicMap = {
        react: ["react", "jsx", "hooks", "redux"],
        css: ["css", "tailwind", "bootstrap", "scss"],
        api: ["api", "rest", "endpoint", "express"],
        database: ["mysql", "sql", "query", "index", "transaction"],
        ml: ["model", "training", "overfitting", "dataset"],
        bert: ["bert", "transformer", "attention"],
        devops: ["docker", "kubernetes", "ci/cd", "pipeline"],
        security: ["xss", "csrf", "jwt", "encryption"]
    };

    for (const [topic, words] of Object.entries(topicMap)) {
        for (const w of words) {
            if (text.includes(w)) {
                topics.push(topic);
                break;
            }
        }
    }

    return [...new Set(topics)];
}

// ✅ Update candidate profile with turn-by-turn metrics
function updateProfile(text, topics, confidence) {
    const wordCount = text.split(" ").length;
    candidateProfile.confidenceTrend.push(confidence);
    candidateProfile.lastConfidence = confidence;

    // Track fluency (normalized: ~20-30 words is good for an interview)
    const currentFluency = Math.min(1, wordCount / 40);
    candidateProfile.stressTrend.push(currentFluency); // Using stressTrend array to store fluency for now

    // Strength/weakness updates based on topic match + confidence
    for (const t of topics) {
        if (confidence >= 0.65) {
            candidateProfile.strengths[t] = (candidateProfile.strengths[t] || 0) + 1;
        } else {
            candidateProfile.weaknesses[t] = (candidateProfile.weaknesses[t] || 0) + 1;
        }
    }
}

function chooseNextQuestion(text, confidence) {
    const domainData = domainKnowledge[interviewDomain] || domainKnowledge["Frontend"];
    const topics = detectTopics(text);

    // supportive recovery
    if (confidence < 0.45) {
        return {
            question: `No worries. Tell me about one topic in ${interviewDomain} you feel confident about, and explain it with an example.`,
            reason: "Low confidence detected → supportive recovery question."
        };
    }

    // keyword deep follow-up
    const keys = Object.keys(domainData.keywords || {});
    const matchKey = keys.find(k => text.includes(k));
    if (matchKey) {
        const options = domainData.keywords[matchKey];
        return {
            question: options[Math.floor(Math.random() * options.length)],
            reason: `Keyword "${matchKey}" detected → deep follow-up chosen.`
        };
    }

    // topic-based adaptive follow-up
    if (topics.length > 0) {
        return {
            question: `You mentioned ${topics[0]}. Can you explain it with a real-world example and complexity/performance considerations?`,
            reason: "Topic detected → adaptive elaboration question."
        };
    }

    // fallback
    return {
        question: domainData.starters[currentTurn % domainData.starters.length] || domainData.fallback,
        reason: "No keyword/topic → baseline progression."
    };
}

function generateFinalReport() {
    const trends = candidateProfile.confidenceTrend;
    const stressTrend = candidateProfile.stressTrend;

    // 1. Confidence Score (Avg with slight weight on later turns)
    const avgConf = trends.reduce((acc, val, idx) => acc + val * (1 + idx * 0.1), 0) /
        trends.reduce((acc, _, idx) => acc + (1 + idx * 0.1), 0);

    // 2. Hesitation/Stress Factor (Avg hesitation detected)
    const avgStress = stressTrend.reduce((a, b) => a + b, 0) / stressTrend.length;

    // 3. Technical Depth (Unique strengths vs weaknesses)
    const totalStrengths = Object.keys(candidateProfile.strengths).length;
    const totalWeaknesses = Object.keys(candidateProfile.weaknesses).length;
    const techScore = Math.min(1, (totalStrengths + 0.1) / (totalStrengths + totalWeaknesses + 0.5));

    // 4. Final Weighted Score
    const finalScore = (avgConf * 4 + (1 - avgStress) * 2 + techScore * 4);

    // 5. Emotional Assessment
    const emotionalState = avgStress > 0.2 ? "Hesitant/Nervous" : (avgStress > 0.1 ? "Slightly Unsure" : "Calm & Confident");

    let grade = "D";
    if (finalScore >= 8.5) grade = "A (Expert)";
    else if (finalScore >= 7.0) grade = "B (Competent)";
    else if (finalScore >= 5.5) grade = "C (Needs Training)";
    else grade = "D (Not Recommended)";

    return {
        final_score: Number(finalScore.toFixed(1)),
        decision: finalScore >= 6.5 ? "HIRE" : "NO_HIRE",
        report: `### 📊 INTERVIEW ADAPTIVE REPORT
**Domain:** ${interviewDomain}
**Final Grade:** ${grade}
**Emotional state:** ${emotionalState}

#### 📈 Competency Breakdown
- **Technical Depth (40%):** ${(techScore * 100).toFixed(0)}% (Topic mastery & keywords)
- **Confidence Level (40%):** ${(avgConf * 100).toFixed(0)}% (Assertion & fluency)
- **Speech Composure (20%):** ${((1 - avgStress) * 100).toFixed(0)}% (Response speed & delay)

#### 💡 Insights
**Strengths:** ${Object.keys(candidateProfile.strengths).join(", ") || "General Concepts"}
**Growth Areas:** ${avgStress > 0.15 ? "Stress Management, " : ""}${Object.keys(candidateProfile.weaknesses).join(", ") || "None Identified"}

#### ⚖️ Grading Basis
*Your grade is calculated on a weighted scale where technical accuracy and confidence are weighted equally (40% each), while communication composure (absence of heavy hesitation) accounts for the final 20%.*

**Final Decision:** ${finalScore >= 6.5 ? "RECOMMENDED" : "NOT RECOMMENDED"}`
    };
}

// ✅ API object
const api = {
    login: async (email, password) => {
        // 🚀 SUPER ADMIN BYPASS (Hardcoded as requested)
        const normalizedEmail = email?.toLowerCase().trim();
        if (normalizedEmail === 'admin' && password === '123456') {
            console.log("⚡ Super Admin Access Granted via Bypass");
            return {
                success: true,
                user_id: 0,
                username: "Super Admin",
                email: "admin@system.local",
                role: "admin"
            };
        }

        if (DEMO_MODE) {
            await delay(500);
            const isAdmin = normalizedEmail === 'nisargpj7@gmail.com' || normalizedEmail === 'admin';
            return {
                success: true,
                user_id: isAdmin ? 999 : 1,
                username: isAdmin ? "Admin" : (email || "Demo User"),
                email: email,
                role: isAdmin ? "admin" : "candidate"
            };
        }
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        return response.json();
    },

    registerCandidate: async (candidateData) => {
        const response = await fetch(`${API_BASE}/reports/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(candidateData)
        });
        return response.json();
    },

    setDomain: async (domain) => {
        if (DEMO_MODE) {
            await delay(300);
            const input = normalize(domain);
            const validDomains = Object.keys(domainKnowledge);

            // 🔍 Smart Match using Synonym Map
            let matched = validDomains.find(d => {
                const normD = d.toLowerCase();
                if (normD === input || input.includes(normD)) return true;

                const synonyms = SYMBOLS[d] || [];
                return synonyms.some(s => input.includes(s) || s.includes(input));
            });

            if (!matched) {
                return { ok: false, error: `Domain not recognized. Try saying 'Frontend', 'Backend', or 'Data Science'.` };
            }
            interviewDomain = matched;
            console.log(`%c[LLM] Semantic Match Found: ${matched}`, "color: green; font-weight: bold");
            return { ok: true, domain: interviewDomain };
        }

        // Production Mode: For now, just echo back the domain to start the session.
        // We can add a real backend domain setter later if needed.
        interviewDomain = domain || "General";
        return { ok: true, domain: interviewDomain };
    },

    startSession: async (userId) => {
        if (DEMO_MODE) {
            await delay(600);
            currentTurn = 1;
            conversationHistory = [];
            candidateProfile = {
                strengths: {},
                weaknesses: {},
                confidenceTrend: [],
                stressTrend: [], // Now tracking delay/stress
                lastConfidence: 0.5,
                engagement: 0.5
            };

            const domainData = domainKnowledge[interviewDomain];
            const firstQ = domainData.starters[0];

            return { ok: true, session_id: 12345, question: firstQ, q_no: 1 };
        }

        const response = await fetch(`${API_BASE}/interview/start_session`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId, domain: interviewDomain })
        });
        return response.json();
    },

    submitAnswer: async (sessionId, answerText, delayMs = 0) => {
        const text = normalize(answerText);

        if (DEMO_MODE) {
            await delay(900);

            // 1. Relevance filter
            if (text.length < 5) {
                return {
                    ok: true,
                    done: false,
                    question: "That answer is too short. Please explain with more technical detail.",
                    q_no: currentTurn
                };
            }

            // 2. Lexicon & Bucket Analysis
            const lex = computeLexiconScore(text);

            // 3. Confidence + Emotion (Delay) analysis
            const lengthBonus = Math.min(0.25, text.length / 400);
            let confidence = 0.50 + lengthBonus + lex.score;

            // 5-SECOND GRACE PERIOD: Thinking time is allowed.
            // Hesitation only starts AFTER 5 seconds of silence/delay.
            const adjustedDelay = Math.max(0, delayMs - 5000);
            const hesitation = adjustedDelay > 10000 ? 0.4 : (adjustedDelay > 5000 ? 0.2 : (adjustedDelay > 2000 ? 0.05 : 0));
            const stressLevel = hesitation > 0.3 ? "HIGH" : (hesitation > 0.1 ? "MODERATE" : "LOW");

            confidence = Math.max(0.10, Math.min(0.95, confidence - hesitation));

            // 📊 COMPREHENSIVE CONSOLE TELEMETRY
            console.group(`%c[LLM TELEMETRY - TURN ${currentTurn}]`, "color: #00d2d3; font-weight: bold; font-size: 11px;");
            console.log(`%cUser Input:`, "font-weight: bold", answerText);
            console.log(`%cReading Grace:`, "color: gray", "5.0s (Not counted towards hesitation)");
            console.log(`%cAdjusted Hesitation Time:`, "color: #ff9f43", `${(adjustedDelay / 1000).toFixed(1)}s`);
            console.log(`%cDetection:`, "color: #5f27cd", {
                positive_hits: lex.posHits,
                negative_hits: lex.negHits,
                detected_topics: detectTopics(text)
            });
            console.log(`%cMath Basis:`, "color: #2e86de", {
                base_confidence: 0.50,
                length_bonus: lengthBonus.toFixed(2),
                lexicon_impact: lex.score.toFixed(2),
                hesitation_penalty: `-${hesitation.toFixed(2)}`,
                final_turn_confidence: confidence.toFixed(2)
            });
            console.log(`%cEmotional State:`, stressLevel === "HIGH" ? "color: red" : "color: green", stressLevel);
            console.groupEnd();

            // 4. Trace the turn & learn profile
            const topics = detectTopics(text);
            updateProfile(text, topics, confidence, hesitation);

            // store history
            conversationHistory.push({
                turn: currentTurn,
                answer: answerText,
                confidence,
                topics
            });

            // 5. Check for interview completion (Short demo mode: 3 turns)
            if (currentTurn >= 3) {
                const reportData = generateFinalReport();
                console.log("%c[LLM] Interview Complete. Compiling Multi-Factor Grades...", "color: #feca57; font-weight: bold");
                return {
                    ok: true,
                    done: true,
                    ...reportData
                };
            }

            // 6. Generate next adaptive question
            const next = chooseNextQuestion(text, confidence);
            currentTurn++;

            return {
                ok: true,
                done: false,
                q_no: currentTurn,
                question: next.question,
                reason: next.reason,
                debug: {
                    stress: stressLevel,
                    confidence: confidence.toFixed(2),
                    term_detected: topics
                }
            };
        }

        // backend mode
        const response = await fetch(`${API_BASE}/interview/submit_answer`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: sessionId, answer_text: answerText, answer_mode: "text" })
        });
        return response.json();
    },

    uploadAudio: async (sessionId, audioBlob, transcript, delayMs = 0) => {
        if (DEMO_MODE) {
            const text = transcript || "Audio response submitted.";
            return api.submitAnswer(sessionId, text, delayMs);
        }

        const formData = new FormData();
        formData.append("audio", audioBlob, "answer.wav");
        formData.append("session_id", sessionId);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

        try {
            const response = await fetch(`${API_BASE}/interview/upload_audio`, {
                method: "POST",
                body: formData,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                return { ok: false, error: "Upload timed out. Please try again." };
            }
            throw error;
        }
    },

    // 📝 NEW: Reports & Admin Logic
    saveReport: async (reportData) => {
        console.log("%c[API] Saving Interview Report", "color: #0fbcf9; font-weight: bold", reportData);
        // Sync to backend even in Demo Mode (Happy Flow Sync)
        const response = await fetch(`${API_BASE}/reports/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(reportData)
        });
        return response.json();
    },

    getReports: async () => {
        console.log("%c[API] Fetching Admin Reports", "color: #0fbcf9; font-weight: bold");
        const response = await fetch(`${API_BASE}/reports/`);
        return response.json();
    },

    submitFeedback: async (feedbackData) => {
        const response = await fetch(`${API_BASE}/interview/feedback`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(feedbackData)
        });
        return response.json();
    }
};

export default api;
