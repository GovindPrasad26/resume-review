import React, { useRef, useState } from "react";
import { FaUpload, FaMoon, FaSun, FaCheckCircle, FaExclamationTriangle, FaLightbulb, FaSearch } from "react-icons/fa";

const Resume = () => {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [dark, setDark] = useState(false);

  const theme = {
    bg: dark ? "#0f172a" : "#f8fafc",
    card: dark ? "#1e293b" : "#ffffff",
    text: dark ? "#f8fafc" : "#1e293b",
    muted: dark ? "#94a3b8" : "#64748b",
    border: dark ? "#334155" : "#e2e8f0",
    input: dark ? "#0f172a" : "#ffffff",
    accent: "#6366f1",
  };

  const getPerf = (score) => {
    if (score >= 80) return { label: "Excellent", color: "#22c55e", bg: "#f0fdf4" };
    if (score >= 50) return { label: "Good Match", color: "#eab308", bg: "#fefce8" };
    return { label: "Needs Improvement", color: "#ef4444", bg: "#fef2f2" };
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) setFile(e.target.files[0]);
  };

  const uploadResume = async () => {
    if (!file) return alert("Please upload a resume first!");
    if (!jd.trim()) return alert("Please paste a Job Description!");
    const formData = new FormData();
    formData.append("resume", file);
    formData.append("jobDescription", jd);

    setLoading(true);
    try {
      const res = await fetch("https://resume-review-1-czmn.onrender.com/resume/score", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      setResult(data);
    } catch (err) {
      alert("Error connecting to server.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const perf = getPerf(result?.matchScore || 0);

  const styles = {
    page: { 
      minHeight: "100vh", 
      padding: "clamp(15px, 5vw, 40px)", // Responsive padding
      backgroundColor: theme.bg, 
      color: theme.text, 
      fontFamily: "'Inter', sans-serif", 
      transition: "0.3s all ease" 
    },
    container: { maxWidth: "1200px", margin: "0 auto" },
    header: { 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "30px",
        flexWrap: "wrap",
        gap: "15px"
    },
    mainGrid: { 
        display: "grid", 
        // 1 column on mobile, 2 columns on desktop (at 850px)
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 450px), 1fr))", 
        gap: "25px", 
        alignItems: "start" 
    },
    card: { 
        backgroundColor: theme.card, 
        padding: "clamp(20px, 4vw, 30px)", 
        borderRadius: "24px", 
        boxShadow: "0 10px 30px rgba(0,0,0,0.05)", 
        border: `1px solid ${theme.border}` 
    },
    resultsCard: { 
        backgroundColor: theme.card, 
        padding: "clamp(20px, 4vw, 30px)", 
        borderRadius: "24px", 
        boxShadow: "0 10px 30px rgba(0,0,0,0.05)", 
        border: `1px solid ${theme.border}`,
    },
    dropZone: { border: `2px dashed ${theme.border}`, borderRadius: "16px", padding: "30px 10px", textAlign: "center", cursor: "pointer", backgroundColor: theme.input, marginBottom: "20px" },
    textarea: { width: "100%", height: "180px", padding: "15px", borderRadius: "12px", border: `1px solid ${theme.border}`, backgroundColor: theme.input, color: theme.text, fontSize: "0.95rem", resize: "none", marginBottom: "20px", outline: "none", boxSizing: "border-box" },
    primaryBtn: { width: "100%", padding: "16px", backgroundColor: theme.accent, color: "#fff", border: "none", borderRadius: "12px", fontWeight: "700", fontSize: "1rem", cursor: "pointer" }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={{ fontSize: "clamp(1.4rem, 4vw, 1.8rem)", fontWeight: "850", margin: 0 }}>AI Resume Intel</h1>
            <p style={{ color: theme.muted, margin: "5px 0 0" }}>ATS Analysis & Skill Gap Finder</p>
          </div>
          <button onClick={() => setDark(!dark)} style={{ padding: "10px 18px", borderRadius: "12px", border: `1px solid ${theme.border}`, backgroundColor: theme.card, color: theme.text, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
            {dark ? <FaSun /> : <FaMoon />} {dark ? "Light" : "Dark"}
          </button>
        </div>

        <div style={styles.mainGrid}>
          {/* STEP 1: INPUT */}
          <div style={styles.card}>
            <h3 style={{ marginBottom: "20px" }}>Step 1: Data Entry</h3>
            <div style={styles.dropZone} onClick={() => fileInputRef.current.click()}>
              <FaUpload size={24} color={theme.accent} style={{ marginBottom: "10px" }} />
              <p style={{ margin: "5px 0", fontWeight: "600", fontSize: "0.9rem" }}>{file ? file.name : "Upload Resume (PDF)"}</p>
              <input ref={fileInputRef} type="file" hidden onChange={handleFileChange} accept=".pdf" />
            </div>
            <textarea style={styles.textarea} placeholder="Paste the Job Description here..." value={jd} onChange={(e) => setJd(e.target.value)} />
            <button style={styles.primaryBtn} onClick={uploadResume} disabled={loading}>{loading ? "Analyzing..." : "Analyze Match Score"}</button>
          </div>

          {/* STEP 2: RESULTS */}
          <div style={styles.resultsCard} className="sticky-results custom-scrollbar">
            {!result ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: theme.muted }}>
                <FaSearch size={40} style={{ opacity: 0.2, marginBottom: "15px" }} />
                <h3>Waiting for Input</h3>
              </div>
            ) : (
              <div style={{ animation: "fadeIn 0.5s ease-out" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "30px", flexWrap: "wrap" }}>
                  <ProgressRing percentage={result.matchScore} color={perf.color} dark={dark} />
                  <div>
                    <span style={{ backgroundColor: perf.bg, color: perf.color, padding: "4px 10px", borderRadius: "20px", fontSize: "0.7rem", fontWeight: "850" }}>{perf.label}</span>
                    <h2 style={{ fontSize: "2.5rem", margin: "5px 0" }}>{result.matchScore}<span style={{ fontSize: "1rem", opacity: 0.4 }}>/100</span></h2>
                  </div>
                </div>

                <div style={{ display: "grid", gap: "20px" }}>
                  <FeedbackList title="Matched Skills" items={result.matchedSkills} icon={<FaCheckCircle />} color="#22c55e" />
                  <FeedbackList title="Missing Skills" items={result.missingSkills} icon={<FaExclamationTriangle />} color="#ef4444" />
                  
                  <div style={{ marginTop: "10px" }}>
                    <h4 style={{ display: "flex", alignItems: "center", gap: "8px", color: theme.accent, fontSize: "0.85rem", textTransform: "uppercase", marginBottom: "12px" }}><FaLightbulb /> AI Recommendations</h4>
                    {result.recommendations?.map((rec, i) => (
                      <div key={i} style={{ padding: "12px", borderRadius: "10px", backgroundColor: dark ? "#0f172a" : "#f1f5f9", fontSize: "0.85rem", marginBottom: "8px", borderLeft: `4px solid ${theme.accent}` }}>
                         {rec.replace(/\*\*/g, '')}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        /* Tablet & Desktop: Make results sticky */
        @media (min-width: 850px) {
            .sticky-results {
                position: sticky !important;
                top: 20px;
                max-height: 85vh;
                overflow-y: auto;
            }
        }

        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${dark ? "#334155" : "#cbd5e1"}; border-radius: 10px; }
      `}</style>
    </div>
  );
};

const ProgressRing = ({ percentage, color, dark }) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <svg width="100" height="100" style={{ transform: "rotate(-90deg)" }}>
        <circle stroke={dark ? "#334155" : "#f1f5f9"} fill="transparent" strokeWidth="8" r={radius} cx="50" cy="50" />
        <circle stroke={color} fill="transparent" strokeWidth="8" r={radius} cx="50" cy="50" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease-in-out" }} />
      </svg>
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", fontWeight: "900", fontSize: "1.2rem" }}>{percentage}%</div>
    </div>
  );
};

const FeedbackList = ({ title, items, icon, color }) => (
  <div>
    <h4 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", textTransform: "uppercase", marginBottom: "10px", color: "#64748b" }}><span style={{ color }}>{icon}</span> {title}</h4>
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
      {items?.map((it, i) => (
        <span key={i} style={{ padding: "5px 10px", borderRadius: "6px", border: `1px solid ${color}33`, fontSize: "0.75rem", backgroundColor: `${color}11` }}>{it}</span>
      ))}
    </div>
  </div>
);

export default Resume;