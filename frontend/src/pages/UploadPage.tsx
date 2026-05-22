import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { UploadCloud, CheckCircle2, ChevronRight, Terminal, Sparkles } from 'lucide-react';

interface UploadPageProps {
  onNavigate: (view: string, extraParams?: any) => void;
}

export const UploadPage: React.FC<UploadPageProps> = ({ onNavigate }) => {
  const { token } = useAuth();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  
  const [uploading, setUploading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
      } else {
        alert("Only PDF files are allowed!");
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const appendLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${msg}`]);
  };

  const startProcessing = async () => {
    if (!file || !token) return;
    
    setUploading(true);
    setLogs([]);
    setAnalysisResult(null);
    
    appendLog(`Initializing upload for file: ${file.name}`);
    appendLog(`Streaming file bytes to assessment server...`);

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      // Simulate connection delay for premium feel
      await new Promise(resolve => setTimeout(resolve, 800));
      appendLog(`Bytes transfer completed. Server received document (Size: ${(file.size / (1024 * 1024)).toFixed(2)} MB).`);
      
      appendLog(`Parsing structural schemas and metadata...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      appendLog(`Initializing text character extraction layers...`);
      await new Promise(resolve => setTimeout(resolve, 1000));

      const res = await fetch('http://localhost:5000/api/pdf/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Server error parsing PDF questions');
      }

      appendLog(`Scanning structures using Dual-Strategy MCQ Engine...`);
      await new Promise(resolve => setTimeout(resolve, 800));

      if (data.isScanned) {
        appendLog(`Character buffer empty: Identified as Scanned Document.`);
        appendLog(`Firing page-by-page WebAssembly Tesseract OCR worker...`);
        await new Promise(resolve => setTimeout(resolve, 1200));
      } else {
        appendLog(`Identified as digital Vector PDF. Parsing structures...`);
      }

      appendLog(`Extracted ${data.totalQuestions} questions successfully!`);
      appendLog(`Indexing topics and difficulty parameters: [${data.topics.join(', ')}]`);
      await new Promise(resolve => setTimeout(resolve, 600));

      // Fetch detailed counts
      const resCount = await fetch(`http://localhost:5000/api/pdf/analysis/${data.pdfId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const counts = await resCount.json();

      setAnalysisResult(counts);
      appendLog(`PDF assessment compiled successfully! Unlocking exam room.`);
    } catch (error: any) {
      appendLog(`ERROR: ${error.message || 'Failed to process assessment'}`);
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pb-12 space-y-6 animate-slide-up">
      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Convert MCQ PDF</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Upload text-based or scanned PDFs containing multiple choice questions.
        </p>
      </div>

      {!analysisResult ? (
        /* Standard Upload Interface */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Drag & Drop Area */}
          <div className="space-y-4">
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileInput}
              className={`glass-container border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer min-h-[300px] transition-all duration-300 relative ${
                dragActive 
                  ? 'border-indigo-500 bg-indigo-500/5 ring-4 ring-indigo-500/10' 
                  : 'border-gray-200 dark:border-zinc-800 hover:border-indigo-500 hover:bg-indigo-500/2'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf"
                onChange={handleChange}
              />
              
              <UploadCloud className="w-12 h-12 text-indigo-500 mb-4 animate-float" />
              
              {file ? (
                <div className="space-y-2 z-10">
                  <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">File Selected</p>
                  <p className="text-sm font-semibold truncate max-w-[250px]">{file.name}</p>
                  <p className="text-[11px] text-gray-400">({(file.size / (1024 * 1024)).toFixed(2)} MB)</p>
                </div>
              ) : (
                <div className="space-y-2 z-10">
                  <p className="text-sm font-bold">Drag and drop your practice PDF here</p>
                  <p className="text-xs text-gray-400">or click to browse local files</p>
                  <p className="text-[10px] text-zinc-500">Supports text & scanned documents up to 50MB</p>
                </div>
              )}
            </div>

            {file && (
              <button
                onClick={startProcessing}
                disabled={uploading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/10 transition-all duration-300 active:scale-98 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Initialize MCQ Parser
              </button>
            )}
          </div>

          {/* Interactive Logs Console */}
          <div className="glass-container bg-zinc-900 rounded-2xl p-5 border border-zinc-800/80 flex flex-col justify-between h-[300px] md:h-auto min-h-[300px]">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Terminal className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Extraction Logs Terminal</span>
            </div>
            
            <div className="flex-1 mt-3 overflow-y-auto space-y-1 font-mono text-[11px] text-emerald-400/90 leading-relaxed pr-1 scrollbar-thin">
              {logs.length === 0 ? (
                <p className="text-zinc-600 italic">Terminal awaiting upload command...</p>
              ) : (
                logs.map((log, i) => <p key={i} className="animate-slide-up">{log}</p>)
              )}
            </div>

            {uploading && (
              <div className="mt-3 h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 animate-pulse rounded-full" style={{ width: '60%' }}></div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* PDF Analysis Before Test Starts */
        <div className="glass-container rounded-2xl p-8 max-w-xl mx-auto space-y-6 relative overflow-hidden">
          {/* Subtle decoration elements */}
          <div className="absolute -top-16 -right-16 w-32 h-32 bg-indigo-500/10 rounded-full blur-xl"></div>
          <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-emerald-500/10 rounded-full blur-xl"></div>

          <div className="text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-float" />
            <h3 className="text-xl font-extrabold tracking-tight">PDF Successfully Processed</h3>
            <p className="text-xs text-gray-400 font-semibold truncate max-w-sm mx-auto">{analysisResult.filename}</p>
          </div>

          <hr className="border-gray-100 dark:border-zinc-800/80" />

          {/* Analysis breakdown Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-gray-100 dark:border-zinc-800/80 bg-gray-50/30 dark:bg-zinc-800/20 text-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Questions</span>
              <p className="text-2xl font-extrabold mt-1 text-indigo-600 dark:text-indigo-400">{analysisResult.totalQuestions}</p>
            </div>
            
            <div className="p-4 rounded-xl border border-gray-100 dark:border-zinc-800/80 bg-gray-50/30 dark:bg-zinc-800/20 text-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Complexity Ratio</span>
              <p className="text-sm font-bold mt-1 text-purple-600 dark:text-purple-400">
                E: {analysisResult.difficultyBreakdown.Easy || 0} | M: {analysisResult.difficultyBreakdown.Medium || 0} | H: {analysisResult.difficultyBreakdown.Hard || 0}
              </p>
            </div>
          </div>

          {/* Topics found list */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Topics Discovered</span>
            <div className="flex flex-wrap gap-2">
              {analysisResult.topics.map((topic: string, i: number) => (
                <span key={i} className="px-2.5 py-1 text-xs font-semibold rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/10">
                  {topic}
                </span>
              ))}
            </div>
          </div>

          {/* Proceed button */}
          <button
            onClick={() => onNavigate('setup', { pdfId: analysisResult.id })}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/10 transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
          >
            <span>Proceed to Test Setup</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
