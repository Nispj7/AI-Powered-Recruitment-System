import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Award, Calendar, ChevronRight, BarChart3, ArrowLeft, RefreshCw, Search, FileText, XCircle, UserPlus, Plus, LogOut } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import "react-datepicker/dist/react-datepicker.css";
import api from '../services/api';

const AdminDashboard = ({ onBack }) => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedReport, setSelectedReport] = useState(null); // Modal state
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [regFormData, setRegFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        interview_time: ''
    });
    const [regLoading, setRegLoading] = useState(false);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const data = await api.getReports();
            if (data.ok) {
                setReports(data.reports);
            }
        } catch (error) {
            console.error("Failed to fetch reports:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleRegister = async (e) => {
        e.preventDefault();
        setRegLoading(true);
        try {
            const res = await api.registerCandidate(regFormData);
            if (res.ok) {
                setShowRegisterModal(false);
                setRegFormData({ full_name: '', email: '', password: '', interview_time: '' });
                fetchReports();
            } else {
                alert(res.error || "Failed to register candidate");
            }
        } catch (error) {
            alert("Error connecting to server");
        } finally {
            setRegLoading(false);
        }
    };

    const filteredReports = reports.filter(r =>
        r.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.result.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen p-6 bg-slate-950">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-black text-white tracking-tight">Admin <span className="text-primary-400">Panel</span></h1>
                            <p className="text-gray-500 text-sm font-medium">Monitoring Global Assessment Results</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowRegisterModal(true)}
                            className="bg-primary-500 hover:bg-primary-600 text-white px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 font-bold text-sm active:scale-95 shadow-lg shadow-primary-500/20"
                        >
                            <UserPlus className="w-4 h-4" />
                            Register Candidate
                        </button>
                        <button
                            onClick={fetchReports}
                            className="bg-white/5 hover:bg-white/10 text-gray-300 px-5 py-2.5 rounded-xl border border-white/5 transition-all flex items-center gap-2 font-bold text-sm active:scale-95"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Sync
                        </button>
                        <button
                            onClick={onBack}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-5 py-2.5 rounded-xl border border-red-500/10 transition-all flex items-center gap-2 font-bold text-sm active:scale-95"
                        >
                            <LogOut className="w-4 h-4" />
                            Logout
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="glass-strong p-6 rounded-[2rem] border border-white/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Users className="w-16 h-16" />
                        </div>
                        <div className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">Total Candidates</div>
                        <div className="text-4xl font-black text-white">{reports.length}</div>
                    </div>
                    <div className="glass-strong p-6 rounded-[2rem] border border-white/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 text-green-500">
                            <Award className="w-16 h-16" />
                        </div>
                        <div className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">Hire Rate</div>
                        <div className="text-4xl font-black text-green-400">
                            {reports.length > 0 ? ((reports.filter(r => r.result !== 'SCHEDULED' && Number(r.total_grade) >= 7).length / reports.length) * 100).toFixed(0) : 0}%
                        </div>
                    </div>
                    <div className="glass-strong p-6 rounded-[2rem] border border-white/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 text-primary-500">
                            <BarChart3 className="w-16 h-16" />
                        </div>
                        <div className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">Avg. Grade</div>
                        <div className="text-4xl font-black text-primary-400">
                            {reports.length > 0 ? (reports.reduce((acc, r) => acc + Number(r.total_grade), 0) / reports.length).toFixed(1) : 0}
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="glass-strong rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
                    <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                        <h2 className="font-bold text-lg text-white">Interview Logs</h2>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search by name or result..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 w-64 transition-all"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-gray-500 text-[10px] font-black uppercase tracking-widest border-b border-white/5">
                                    <th className="px-8 py-5">Candidate</th>
                                    <th className="px-8 py-5">Email</th>
                                    <th className="px-8 py-5 text-center">Grade</th>
                                    <th className="px-8 py-5">Result</th>
                                    <th className="px-8 py-5">Schedule</th>
                                    <th className="px-8 py-5 text-right">View</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <RefreshCw className="w-8 h-8 text-primary-500 animate-spin" />
                                                <span className="text-gray-500 font-bold text-sm tracking-widest uppercase">Syncing Cloud Database...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredReports.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-8 py-20 text-center text-gray-500 font-bold italic">
                                            No assessment data found.
                                        </td>
                                    </tr>
                                ) : filteredReports.map((report) => (
                                    <motion.tr
                                        key={report.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="group hover:bg-white/[0.02] transition-colors"
                                    >
                                        <td className="px-8 py-6">
                                            <div className="font-bold text-white group-hover:text-primary-400 transition-colors uppercase tracking-tight">{report.candidate_name}</div>
                                            <div className="text-[10px] text-gray-500 font-black uppercase tracking-tighter mt-1">ID: #{report.id.toString().padStart(4, '0')}</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-xs text-gray-400 font-medium">{report.email || 'N/A'}</div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className={`inline-block px-4 py-1.5 rounded-xl font-black text-sm border ${report.total_grade >= 7 ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                                {report.total_grade ? Number(report.total_grade).toFixed(1) : '—'}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            {report.result === 'SCHEDULED' ? (
                                                <span className="text-[10px] font-black uppercase tracking-widest py-1 px-3 rounded-full bg-primary-500/20 text-primary-400 border border-primary-500/30">
                                                    SCHEDULED
                                                </span>
                                            ) : Number(report.total_grade) < 7 ? (
                                                <span className="text-[10px] font-black uppercase tracking-widest py-1 px-3 rounded-full bg-red-500 text-white">
                                                    NOT HIRED
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-black uppercase tracking-widest py-1 px-3 rounded-full bg-green-500 text-white">
                                                    HIRED
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-gray-300 text-xs font-bold">
                                                    <Calendar className="w-3.5 h-3.5 opacity-50 text-primary-400" />
                                                    {report.interview_time ? new Date(report.interview_time).toLocaleString() : 'Not set'}
                                                </div>
                                                <div className="text-[9px] text-gray-600 font-black uppercase">Added: {new Date(report.created_at).toLocaleDateString()}</div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            {report.result !== 'SCHEDULED' ? (
                                                <button
                                                    onClick={() => setSelectedReport(report)}
                                                    className="bg-primary-500/10 hover:bg-primary-500 text-primary-400 hover:text-white p-2.5 rounded-xl transition-all group/btn border border-primary-500/20 hover:border-primary-500 active:scale-95"
                                                >
                                                    <FileText className="w-5 h-5 transition-colors" />
                                                </button>
                                            ) : (
                                                <span className="text-[10px] text-gray-600 font-black uppercase">Pending</span>
                                            )}
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Assessment Modal */}
            {selectedReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-slate-900 border border-white/10 w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Modal Header */}
                        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                            <div className="flex items-center gap-4">
                                <div className="bg-primary-500/20 p-3 rounded-2xl">
                                    <BarChart3 className="w-6 h-6 text-primary-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white uppercase tracking-tight">{selectedReport.candidate_name}'s Report</h3>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Graded at {new Date(selectedReport.created_at).toLocaleString()}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedReport(null)}
                                className="text-gray-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-xl"
                            >
                                <XCircle className="w-8 h-8" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-8 overflow-y-auto custom-scrollbar bg-slate-900/50">
                            {(() => {
                                const reportText = selectedReport.performance_json?.report || "";

                                // Simple parser for the custom report format
                                const getVal = (regex) => (reportText.match(regex) || [])[1] || "N/A";

                                const domain = getVal(/\*\*Domain:\*\* (.*)/);
                                const grade = getVal(/\*\*Final Grade:\*\* (.*)/);
                                const emotion = getVal(/\*\*Emotional state:\*\* (.*)/);
                                const strengths = getVal(/\*\*Strengths:\*\* (.*)/);
                                const growth = getVal(/\*\*Growth Areas:\*\* (.*)/);
                                const decision = getVal(/\*\*Final Decision:\*\* (.*)/);

                                // Extract Percentages
                                const getPct = (regex) => (reportText.match(regex) || [])[1] || "0";
                                const techPct = getPct(/\*\*Technical Depth \(40%\):\*\* ([\d]+)%/);
                                const confPct = getPct(/\*\*Confidence Level \(40%\):\*\* ([\d]+)%/);
                                const compPct = getPct(/\*\*.* Composure \(20%\):\*\* ([\d]+)%/);

                                const isActuallyHired = selectedReport.result === 'HIRE' || (selectedReport.result !== 'NO_HIRE' && Number(selectedReport.total_grade) >= 7);
                                const emotionColor = emotion.includes("Calm") ? "text-green-400 bg-green-500/10" : "text-yellow-400 bg-yellow-500/10";

                                return (
                                    <div className="space-y-8">
                                        {/* Top Stats Row */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-white/5 p-5 rounded-3xl border border-white/5">
                                                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Target Domain</div>
                                                <div className="text-xl font-bold text-white uppercase">{domain}</div>
                                            </div>
                                            <div className={`p-5 rounded-3xl border border-white/5 ${emotionColor}`}>
                                                <div className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">Emotional State</div>
                                                <div className="text-xl font-bold uppercase">{emotion}</div>
                                            </div>
                                        </div>

                                        {/* Score Visualizer */}
                                        <div className="bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden">
                                            <div className="flex items-center justify-between mb-8">
                                                <div>
                                                    <div className="text-[10px] font-black text-primary-400 uppercase tracking-[0.3em] mb-2">Final Evaluation</div>
                                                    <div className="text-5xl font-black text-white">{selectedReport.total_grade}<span className="text-gray-600 text-xl font-medium">/10</span></div>
                                                </div>
                                                <div className={`px-6 py-2 rounded-2xl font-black text-xs uppercase tracking-widest ${isActuallyHired ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                                    {decision}
                                                </div>
                                            </div>

                                            {/* Bars */}
                                            <div className="space-y-6">
                                                {[
                                                    { label: "Technical Depth", val: techPct, color: "from-blue-500 to-cyan-400" },
                                                    { label: "Confidence & Fluency", val: confPct, color: "from-purple-500 to-pink-500" },
                                                    { label: "Response Composure", val: compPct, color: "from-orange-500 to-yellow-400" }
                                                ].map((bar, i) => (
                                                    <div key={i}>
                                                        <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase tracking-tighter mb-2">
                                                            <span>{bar.label}</span>
                                                            <span className="text-white">{bar.val}%</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${bar.val}%` }}
                                                                transition={{ delay: 0.3 + i * 0.1 }}
                                                                className={`h-full bg-gradient-to-r ${bar.color}`}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Insights */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-green-500/5 border border-green-500/10 p-6 rounded-3xl">
                                                <div className="flex items-center gap-2 mb-4 text-green-400 font-black text-[10px] uppercase">
                                                    <Award className="w-4 h-4" /> Core Strengths
                                                </div>
                                                <p className="text-gray-300 text-sm font-medium leading-relaxed">{strengths}</p>
                                            </div>
                                            <div className="bg-primary-500/5 border border-primary-500/10 p-6 rounded-3xl">
                                                <div className="flex items-center gap-2 mb-4 text-primary-400 font-black text-[10px] uppercase">
                                                    <RefreshCw className="w-4 h-4" /> Growth areas
                                                </div>
                                                <p className="text-gray-300 text-sm font-medium leading-relaxed">{growth}</p>
                                            </div>
                                        </div>

                                        {/* Footer Basis */}
                                        <div className="pt-4 border-t border-white/5">
                                            <p className="text-[10px] text-gray-500 font-medium italic leading-relaxed text-center px-10">
                                                Assessments are calculated via a weighted multi-turn analysis focusing on technical accuracy (40%), verbal confidence (40%), and response speed (20%).
                                            </p>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-white/5 text-center">
                            <button
                                onClick={() => setSelectedReport(null)}
                                className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-2xl font-bold transition-all text-sm uppercase tracking-widest active:scale-95"
                            >
                                Close Summary
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Candidate Registration Modal */}
            {showRegisterModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
                    >
                        <div className="p-8 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary-500/20 p-2.5 rounded-xl">
                                    <UserPlus className="w-6 h-6 text-primary-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white tracking-tight">Onboard Candidate</h3>
                            </div>
                            <button onClick={() => setShowRegisterModal(false)} className="text-gray-500 hover:text-white transition-colors">
                                <XCircle className="w-7 h-7" />
                            </button>
                        </div>

                        <form onSubmit={handleRegister} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Full Name</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="John Doe"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
                                        value={regFormData.full_name}
                                        onChange={(e) => setRegFormData({ ...regFormData, full_name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Email Address</label>
                                    <input
                                        required
                                        type="email"
                                        placeholder="john@example.com"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
                                        value={regFormData.email}
                                        onChange={(e) => setRegFormData({ ...regFormData, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Portal Password</label>
                                        <input
                                            required
                                            type="text"
                                            placeholder="Set password"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
                                            value={regFormData.password}
                                            onChange={(e) => setRegFormData({ ...regFormData, password: e.target.value })}
                                        />
                                    </div>
                                    <div className="relative">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Interview Schedule</label>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none z-10">
                                                <Calendar className="w-5 h-5 text-gray-400" />
                                            </span>
                                            <DatePicker
                                                selected={regFormData.interview_time ? new Date(regFormData.interview_time) : null}
                                                onChange={(date) => setRegFormData({ ...regFormData, interview_time: date ? format(date, 'yyyy-MM-dd HH:mm:ss') : '' })}
                                                showTimeSelect
                                                dateFormat="MMMM d, yyyy h:mm aa"
                                                placeholderText="Select date and time"
                                                required
                                                className="pl-12 w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white placeholder:text-gray-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/30 outline-none transition-all duration-200"
                                                calendarClassName="custom-datepicker"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={regLoading}
                                className="w-full bg-primary-500 hover:bg-primary-600 text-white font-black py-5 rounded-3xl shadow-xl shadow-primary-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {regLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                                {regLoading ? "Initializing Portal..." : "Confirm & Send invite"}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
