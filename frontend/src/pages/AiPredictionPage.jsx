import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import { getAiProjects, predictProject } from '../api/ai';

// Recharts Import
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

import { Sparkles, Brain, Building2, RefreshCw, AlertTriangle, CheckCircle2, Clock, ShieldAlert, Lightbulb, TrendingUp, IndianRupee, Cpu, Database } from 'lucide-react';

const AiPredictionPage = () => {

  // Data State
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      runPrediction(selectedProjectId);
    }
  }, [selectedProjectId]);

  const fetchProjects = async () => {
    try {
      const data = await getAiProjects();
      setProjects(data);
      if (data.length > 0) {
        setSelectedProjectId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch AI projects list:', err);
    }
  };

  const runPrediction = async (projectId, refresh = false) => {
    try {
      setLoadingPrediction(true);
      setErrorMsg('');
      const data = await predictProject(projectId, refresh);
      setPrediction(data);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Prediction cannot be generated. Missing required project information.';
      setErrorMsg(typeof msg === 'object' ? JSON.stringify(msg) : msg);
    } finally {
      setLoadingPrediction(false);
    }
  };

  // Helper Badge Color for Delay Probability (Green 0-30%, Yellow 31-60%, Red 61-100%)
  const getDelayBadge = (prob) => {
    if (prob <= 30) {
      return { label: 'Low Delay Risk (0-30%)', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', dot: 'bg-emerald-500' };
    } else if (prob <= 60) {
      return { label: 'Moderate Delay Risk (31-60%)', color: 'bg-amber-100 text-amber-800 border-amber-300', dot: 'bg-amber-500' };
    }
    return { label: 'High Delay Risk (61-100%)', color: 'bg-red-100 text-red-800 border-red-300', dot: 'bg-red-500' };
  };

  // Helper Badge Color for Risk (Low: Green, Medium: Yellow, High: Red)
  const getRiskBadge = (risk) => {
    const r = (risk || '').toLowerCase();
    if (r === 'low') {
      return { label: 'Low Risk', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    } else if (r === 'medium') {
      return { label: 'Medium Risk', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    return { label: 'High Risk', color: 'bg-red-50 text-red-700 border-red-200' };
  };

  const featureSnapshot = prediction?.feature_snapshot || {};

  // Recharts Chart Data powered strictly by LIVE PROJECT DATA
  const progressVal = Number(featureSnapshot.Progress_Percentage || 0);
  const progressChartData = [
    { name: 'Current Progress', value: progressVal, fill: '#10B981' },
    { name: 'Remaining Work', value: Math.max(0, 100 - progressVal), fill: '#E2E8F0' },
  ];

  const budgetUsed = Number(featureSnapshot.Budget_Used || 0);
  const totalBudget = Number(featureSnapshot.Total_Budget || 0);
  const budgetChartData = [
    { name: 'Budget Used', value: budgetUsed, fill: '#0FA4AF' },
    { name: 'Remaining Budget', value: Math.max(0, totalBudget - budgetUsed), fill: '#AFDDE5' },
  ];

  return (
    <div className="min-h-screen bg-[#003135] text-white flex flex-col selection:bg-[#0FA4AF] selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-[#0FA4AF]/20 border border-[#0FA4AF]/40 flex items-center justify-center text-[#0FA4AF]">
                <Brain className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
                  AI Predictive Intelligence Engine
                </h1>
                <p className="text-xs text-[#AFDDE5] mt-0.5">
                  Joblib RandomForest ML models trained on exact 15 dataset feature columns in exact order.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 self-stretch sm:self-auto">
            {/* Project Dropdown Selector */}
            <div className="flex items-center space-x-2 bg-black/20 px-3 py-2 rounded-xl border border-white/10">
              <Building2 className="w-4 h-4 text-[#0FA4AF]" />
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-transparent text-xs text-white font-bold focus:outline-none cursor-pointer"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#003135]">
                    {p.project_code} - {p.project_name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => runPrediction(selectedProjectId, true)}
              disabled={loadingPrediction || !selectedProjectId}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white gradient-btn shadow-md flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingPrediction ? 'animate-spin' : ''}`} />
              <span>Refresh Prediction</span>
            </button>
          </div>
        </div>

        {/* Error Handling State */}
        {errorMsg && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-2xl flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <p className="font-bold">{errorMsg}</p>
              <p className="text-[11px] text-red-300/80">
                Please ensure project attributes, daily logs, and attendance metrics are recorded.
              </p>
            </div>
          </div>
        )}

        {/* Loading Skeletons */}
        {loadingPrediction ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-[#0FA4AF] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-bold text-[#AFDDE5]">Executing Joblib RandomForest ML Model Pipeline...</p>
          </div>
        ) : prediction ? (
          <div className="space-y-8">
            
            {/* TOP SUMMARY CARDS (WHITE ENTERPRISE CARDS) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              {/* Card 1: Delay Probability */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl p-6 text-[#003135] border border-gray-100 shadow-xl relative overflow-hidden flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                    Delay Probability
                  </span>
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>

                <div className="my-4">
                  <div className="flex items-baseline space-x-1">
                    <h2 className="text-4xl font-black text-[#003135] tracking-tight">
                      {prediction.delay_probability}%
                    </h2>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full mt-3 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${
                        prediction.delay_probability <= 30 ? 'bg-emerald-500' :
                        prediction.delay_probability <= 60 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${prediction.delay_probability}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border inline-flex items-center gap-1.5 ${getDelayBadge(prediction.delay_probability).color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${getDelayBadge(prediction.delay_probability).dot}`}></span>
                    {getDelayBadge(prediction.delay_probability).label}
                  </span>
                </div>
              </motion.div>

              {/* Card 2: Completion Days Remaining */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                transition={{ delay: 0.1 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl p-6 text-[#003135] border border-gray-100 shadow-xl flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                    Completion Days Remaining
                  </span>
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>

                <div className="my-4">
                  <h2 className="text-4xl font-black text-[#003135] tracking-tight">
                    {prediction.completion_days_remaining} <span className="text-sm font-bold text-gray-400">Days</span>
                  </h2>
                  <p className="text-xs text-gray-500 font-semibold mt-1">
                    RandomForest ML Prediction
                  </p>
                </div>

                <div className="text-[11px] text-gray-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Based on exact 15 feature inputs
                </div>
              </motion.div>

              {/* Card 3: Project Risk */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                transition={{ delay: 0.2 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl p-6 text-[#003135] border border-gray-100 shadow-xl flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                    Project Risk Assessment
                  </span>
                  <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                </div>

                <div className="my-4">
                  <h2 className="text-3xl font-black text-[#003135] tracking-tight">
                    {prediction.project_risk}
                  </h2>
                  <p className="text-xs text-gray-400 font-semibold mt-1">
                    Model Classification Output
                  </p>
                </div>

                <div>
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${getRiskBadge(prediction.project_risk).color}`}>
                    {getRiskBadge(prediction.project_risk).label}
                  </span>
                </div>
              </motion.div>

              {/* Card 4: AI Model Status & Timestamp */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                transition={{ delay: 0.3 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl p-6 text-[#003135] border border-gray-100 shadow-xl flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                    AI Model Engine
                  </span>
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Cpu className="w-5 h-5" />
                  </div>
                </div>

                <div className="my-4">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    <h3 className="text-lg font-extrabold text-emerald-600">{prediction.model_status}</h3>
                  </div>
                  <p className="text-[11px] text-gray-400 font-mono mt-1">
                    {prediction.prediction_version}
                  </p>
                </div>

                <div className="text-[10px] text-gray-400 font-mono">
                  {prediction.prediction_time}
                </div>
              </motion.div>

            </div>

            {/* AI SUGGESTION CARD (MODEL OUTPUT ONLY) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-white via-slate-50 to-white p-7 rounded-3xl text-[#003135] border border-gray-200 shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-[#003135] text-[#0FA4AF] flex items-center justify-center shrink-0 shadow-md">
                  <Lightbulb className="w-6 h-6" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#0FA4AF]" />
                      Model Generated Actionable Recommendation
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 bg-white px-2.5 py-0.5 rounded-full border border-gray-200">
                      Trained RandomForest Classifier Output
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-[#003135] tracking-tight pt-1">
                    "{prediction.ai_suggestion}"
                  </h2>
                  <p className="text-xs text-gray-500 font-medium">
                    Recommendation generated directly by the trained model pipeline evaluating live project parameters.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* RECHARTS REAL-TIME ANALYTICS GRID (LIVE PROJECT DATA ONLY) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Progress Chart */}
              <div className="lg:col-span-6 glass-panel p-6 rounded-3xl border border-white/10 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#0FA4AF]" />
                    Project Completion Progress (%)
                  </h3>
                  <span className="text-xs font-extrabold text-emerald-400">{progressVal}%</span>
                </div>

                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={progressChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {progressChartData.map((entry, index) => (
                          <Cell key={`progress-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#003135', borderColor: '#0FA4AF', borderRadius: '12px', fontSize: '11px', color: '#fff' }} />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Budget Consumption Chart */}
              <div className="lg:col-span-6 glass-panel p-6 rounded-3xl border border-white/10 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-white flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-[#0FA4AF]" />
                    Budget Consumption (₹ INR)
                  </h3>
                  <span className="text-xs font-extrabold text-amber-300">
                    ₹{budgetUsed.toLocaleString()} / ₹{totalBudget.toLocaleString()}
                  </span>
                </div>

                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={budgetChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {budgetChartData.map((entry, index) => (
                          <Cell key={`budget-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#003135', borderColor: '#0FA4AF', borderRadius: '12px', fontSize: '11px', color: '#fff' }} />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* PROJECT FEATURE SNAPSHOT (EXACT 15 MODEL INPUT FEATURES) */}
            <div className="bg-white rounded-3xl p-7 text-[#003135] border border-gray-100 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-[#003135] tracking-tight flex items-center gap-2">
                    <Database className="w-5 h-5 text-[#0FA4AF]" />
                    Auto-Fetched Model Input Feature Snapshot (Exact 15 Columns)
                  </h3>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">
                    Live system values compiled across Projects, Workers, Attendance, Expenses, and Daily Operations modules.
                  </p>
                </div>
                <span className="text-xs font-bold bg-[#0FA4AF]/10 text-[#0FA4AF] px-3 py-1 rounded-full border border-[#0FA4AF]/20">
                  Read-Only Model Inputs
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                
                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-bold uppercase text-gray-400">1. Project_ID</p>
                  <p className="text-sm font-extrabold text-[#003135]">{featureSnapshot.Project_ID}</p>
                </div>

                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-bold uppercase text-gray-400">2. Day_Number</p>
                  <p className="text-sm font-extrabold text-[#003135]">Day {featureSnapshot.Day_Number}</p>
                </div>

                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-bold uppercase text-gray-400">3. Building_Type</p>
                  <p className="text-sm font-extrabold text-[#003135]">{featureSnapshot.Building_Type}</p>
                </div>

                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-bold uppercase text-gray-400">4. Blocks</p>
                  <p className="text-sm font-extrabold text-[#003135]">{featureSnapshot.Blocks} Blocks</p>
                </div>

                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-bold uppercase text-gray-400">5. Floors</p>
                  <p className="text-sm font-extrabold text-[#003135]">{featureSnapshot.Floors} Floors</p>
                </div>

                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-bold uppercase text-gray-400">6. Area_sqft</p>
                  <p className="text-sm font-extrabold text-[#003135]">{Number(featureSnapshot.Area_sqft || 0).toLocaleString()}</p>
                </div>

                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-bold uppercase text-gray-400">7. Total_Budget</p>
                  <p className="text-sm font-extrabold text-amber-600">₹{Number(featureSnapshot.Total_Budget || 0).toLocaleString()}</p>
                </div>

                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-bold uppercase text-gray-400">8. Expected_Workers</p>
                  <p className="text-sm font-extrabold text-[#003135]">{featureSnapshot.Expected_Workers}</p>
                </div>

                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-bold uppercase text-gray-400">9. Current_Workers</p>
                  <p className="text-sm font-extrabold text-blue-600">{featureSnapshot.Current_Workers}</p>
                </div>

                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-bold uppercase text-gray-400">10. Attendance_Percentage</p>
                  <p className="text-sm font-extrabold text-[#0FA4AF]">{featureSnapshot.Attendance_Percentage}%</p>
                </div>

                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-bold uppercase text-gray-400">11. Rainfall_mm</p>
                  <p className="text-sm font-extrabold text-blue-500">{featureSnapshot.Rainfall_mm} mm</p>
                </div>

                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-bold uppercase text-gray-400">12. Rain_Affected_Work</p>
                  <p className="text-sm font-extrabold text-slate-700">{featureSnapshot.Rain_Affected_Work}</p>
                </div>

                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-bold uppercase text-gray-400">13. Construction_Stage</p>
                  <p className="text-xs font-extrabold text-[#003135] truncate">{featureSnapshot.Construction_Stage}</p>
                </div>

                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-bold uppercase text-gray-400">14. Progress_Percentage</p>
                  <p className="text-sm font-extrabold text-emerald-600">{featureSnapshot.Progress_Percentage}%</p>
                </div>

                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-bold uppercase text-gray-400">15. Budget_Used</p>
                  <p className="text-sm font-extrabold text-amber-600">₹{Number(featureSnapshot.Budget_Used || 0).toLocaleString()}</p>
                </div>

              </div>
            </div>

          </div>
        ) : null}

      </main>
    </div>
  );
};

export default AiPredictionPage;
