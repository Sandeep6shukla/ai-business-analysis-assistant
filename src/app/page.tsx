'use client';
import { useState, useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

// Import for PDF generation
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface ProjectData {
  name: string;
  topic: string;
}

interface ParsedOutput {
  executiveSummary: string;
  functionalRequirements: string[];
  nonFunctionalRequirements: string[];
  userStories: string[];
  technicalConsiderations: string[];
  businessRules: string[];
  successMetrics: string[];
  nextSteps: string[];
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);
  const [projectData, setProjectData] = useState<ProjectData>({ name: '', topic: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  
  // All questions generated at once from project description
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [modelInfo, setModelInfo] = useState('');
  
  // AI output and editing
  const [aiOutput, setAiOutput] = useState('');
  const [aiSource, setAiSource] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedOutput, setEditedOutput] = useState('');
  const [parsedOutput, setParsedOutput] = useState<ParsedOutput | null>(null);
  
  // Voice recognition - per question
  const [isListening, setIsListening] = useState(false);
  const [currentRecordingQuestion, setCurrentRecordingQuestion] = useState(-1);
  
  const {
    transcript,
    listening: _listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Parse AI output into structured sections
  const parseAIOutput = (output: string): ParsedOutput => {
    const sections = {
      executiveSummary: '',
      functionalRequirements: [] as string[],
      nonFunctionalRequirements: [] as string[],
      userStories: [] as string[],
      technicalConsiderations: [] as string[],
      businessRules: [] as string[],
      successMetrics: [] as string[],
      nextSteps: [] as string[]
    };

    const lines = output.split('\n');
    let currentSection = '';

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.includes('EXECUTIVE SUMMARY') || trimmedLine.includes('Executive Summary')) {
        currentSection = 'executiveSummary';
        continue;
      } else if (trimmedLine.includes('FUNCTIONAL REQUIREMENTS') || trimmedLine.includes('Functional Requirements')) {
        currentSection = 'functionalRequirements';
        continue;
      } else if (trimmedLine.includes('NON-FUNCTIONAL REQUIREMENTS') || trimmedLine.includes('Non-Functional Requirements')) {
        currentSection = 'nonFunctionalRequirements';
        continue;
      } else if (trimmedLine.includes('USER STORIES') || trimmedLine.includes('User Stories')) {
        currentSection = 'userStories';
        continue;
      } else if (trimmedLine.includes('TECHNICAL CONSIDERATIONS') || trimmedLine.includes('Technical Considerations')) {
        currentSection = 'technicalConsiderations';
        continue;
      } else if (trimmedLine.includes('BUSINESS RULES') || trimmedLine.includes('Business Rules')) {
        currentSection = 'businessRules';
        continue;
      } else if (trimmedLine.includes('SUCCESS METRICS') || trimmedLine.includes('Success Metrics')) {
        currentSection = 'successMetrics';
        continue;
      } else if (trimmedLine.includes('NEXT STEPS') || trimmedLine.includes('Next Steps') || trimmedLine.includes('RECOMMENDATIONS')) {
        currentSection = 'nextSteps';
        continue;
      }

      if (trimmedLine && !trimmedLine.startsWith('#') && !trimmedLine.startsWith('*') && trimmedLine.length > 10) {
        if (currentSection === 'executiveSummary') {
          sections.executiveSummary += trimmedLine + ' ';
        } else if (currentSection && sections[currentSection as keyof ParsedOutput]) {
          if (trimmedLine.match(/^[\d\w\-✅🔒📱📊♿🔄⚡📋🎯😊🚀📈🐛]/)) {
            const cleanLine = trimmedLine.replace(/^[\d\w\-✅🔒📱📊♿🔄⚡📋🎯😊🚀📈🐛:\s]+/, '').trim();
            if (cleanLine) {
              (sections[currentSection as keyof ParsedOutput] as string[]).push(cleanLine);
            }
          }
        }
      }
    }

    return sections;
  };

  // Generate all questions at once based on project description
  const generateQuestions = async () => {
    setIsLoadingQuestions(true);
    
    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectName: projectData.name,
          projectTopic: projectData.topic
        })
      });

      const data = await response.json();
      
      if (data.success && data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        setAnswers(new Array(data.questions.length).fill(''));
        if (data.modelInfo) {
          setModelInfo(data.modelInfo);
        }
      }
    } catch (error) {
      console.error('Question generation failed:', error);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  // Start the interview process
  const startInterview = async () => {
    await generateQuestions();
    setStep(2);
  };

  // Handle voice input for a specific question
  const startListening = (questionIndex: number) => {
    setCurrentRecordingQuestion(questionIndex);
    resetTranscript();
    setIsListening(true);
    SpeechRecognition.startListening({ continuous: true });
  };

  const stopListening = () => {
    SpeechRecognition.stopListening();
    setIsListening(false);
    
    if (currentRecordingQuestion >= 0) {
      const newAnswers = [...answers];
      newAnswers[currentRecordingQuestion] = transcript;
      setAnswers(newAnswers);
    }
    
    setCurrentRecordingQuestion(-1);
    resetTranscript();
  };

  // Generate AI analysis
  const generateAI = async () => {
    setIsGenerating(true);
    setStep(3);
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectName: projectData.name,
          projectTopic: projectData.topic,
          questions: questions,
          answers: answers
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setAiOutput(data.output);
        setEditedOutput(data.output);
        setAiSource(data.source);
        if (data.modelInfo) {
          setModelInfo(data.modelInfo);
        }
        // Parse the output for better display
        setParsedOutput(parseAIOutput(data.output));
      }
    } catch (error) {
      console.error('AI generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Export to Rich Text (HTML format that can be opened in Word)
  const exportToRichText = () => {
    const finalOutput = isEditing ? editedOutput : aiOutput;
    
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Business Analysis Report - ${projectData.name}</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            margin: 40px; 
            color: #333;
        }
        h1 { 
            color: #2563eb; 
            border-bottom: 3px solid #2563eb; 
            padding-bottom: 10px;
            text-align: center;
        }
        h2 { 
            color: #1d4ed8; 
            margin-top: 30px; 
            border-left: 4px solid #3b82f6;
            padding-left: 15px;
        }
        h3 { 
            color: #3730a3; 
            margin-top: 20px;
        }
        .header { 
            text-align: center; 
            margin-bottom: 40px; 
            padding: 20px;
            background-color: #f8fafc;
            border-radius: 10px;
        }
        .section { 
            margin-bottom: 30px; 
            padding: 20px;
            background-color: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
        }
        .qa-section { 
            background-color: #eff6ff; 
            padding: 20px; 
            border-left: 4px solid #2563eb;
            margin-bottom: 30px;
        }
        .qa-item {
            margin-bottom: 15px;
            padding: 10px;
            background-color: white;
            border-radius: 5px;
        }
        ul { 
            padding-left: 20px; 
        }
        li { 
            margin-bottom: 8px; 
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            font-style: italic;
            color: #6b7280;
            border-top: 1px solid #d1d5db;
            padding-top: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Business Analysis Report</h1>
        <h2>${projectData.name}</h2>
        <p><strong>Generated on:</strong> ${new Date().toLocaleDateString()}</p>
        <p><strong>Project Description:</strong> ${projectData.topic}</p>
        <p><strong>AI Model:</strong> ${modelInfo || 'Business Analysis Assistant'}</p>
    </div>
    
    <div class="section qa-section">
        <h2>📋 Interview Summary</h2>
        ${questions.map((q, i) => `
            <div class="qa-item">
                <p><strong>Q${i + 1}:</strong> ${q}</p>
                <p><strong>A${i + 1}:</strong> ${answers[i] || 'No response provided'}</p>
            </div>
        `).join('')}
    </div>
    
    <div class="section">
        <h2>📊 Analysis Results</h2>
        <pre style="white-space: pre-wrap; font-family: 'Segoe UI', sans-serif; font-size: 14px;">${finalOutput}</pre>
    </div>
    
    <div class="footer">
        Generated by Business Analysis Assistant using ${modelInfo || 'Local AI'}
    </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectData.name.replace(/\s+/g, '_')}_Business_Analysis.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export to PDF
  const exportToPDF = async () => {
    const element = document.getElementById('results-content');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 190;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${projectData.name.replace(/\s+/g, '_')}_Business_Analysis.pdf`);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('PDF export failed. Please try the HTML export instead.');
    }
  };

  // Export formatted markdown document
  const exportToMarkdown = () => {
    const finalOutput = isEditing ? editedOutput : aiOutput;
    
    const documentContent = `# Business Analysis Report
## Project: ${projectData.name}

**Generated on:** ${new Date().toLocaleDateString()}
**Project Description:** ${projectData.topic}
**AI Model:** ${modelInfo || 'Business Analysis Assistant'}

---

## Interview Summary

${questions.map((q, i) => `**Q${i + 1}:** ${q}
**A${i + 1}:** ${answers[i] || 'No response provided'}
`).join('\n')}

---

${finalOutput}

---
*Generated by Business Analysis Assistant using ${modelInfo || 'Local AI'}*`;

    const blob = new Blob([documentContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectData.name.replace(/\s+/g, '_')}_Business_Analysis.md`;
    a.click();
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/20 border-t-white mx-auto mb-6"></div>
            <div className="animate-ping absolute top-0 left-1/2 transform -translate-x-1/2 rounded-full h-16 w-16 border-4 border-white/40"></div>
          </div>
          <p className="text-white text-lg font-medium">Initializing Business Analysis Assistant...</p>
          <p className="text-white/70 text-sm mt-2">Powered by AI Technology</p>
        </div>
      </div>
    );
  }

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-8 flex items-center justify-center">
        <div className="max-w-lg mx-auto">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 text-white px-8 py-6 rounded-2xl shadow-2xl">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚠️</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Browser Compatibility Issue</h3>
            </div>
            <p className="mb-2"><strong>Sorry!</strong> Your browser doesn&apos;t support speech recognition.</p>
            <p className="text-white/80">Please try <strong>Chrome</strong> or <strong>Edge</strong> for the voice features to work.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-10 right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="relative z-10 p-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Enhanced Header with Glassmorphism */}
          <div className="text-center mb-16">
            <div className="inline-block p-8 bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl mb-8">
              <h1 className="text-6xl font-black mb-4 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
                🎯 Business Analysis Assistant
              </h1>
              <p className="text-white/90 text-xl font-medium">AI-Powered Requirements Elicitation Platform</p>
              <div className="mt-4 flex items-center justify-center space-x-4 text-white/70">
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                  AI-Powered
                </span>
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></span>
                  Voice Enabled
                </span>
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse"></span>
                  Professional Reports
                </span>
              </div>
            </div>
          </div>
          
          {/* Enhanced Progress Bar with Animations */}
          <div className="flex items-center justify-center mb-16">
            <div className="flex items-center">
              <div className={`relative flex items-center transition-all duration-500 ${step >= 1 ? 'text-white' : 'text-white/40'}`}>
                <div className={`relative w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-500 ${step >= 1 ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-2xl transform scale-110' : 'bg-white/20 text-white/60'}`}>
                  1
                  {step >= 1 && <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse opacity-75"></div>}
                </div>
                <span className="ml-4 font-bold text-lg">Project Setup</span>
              </div>
              
              <div className={`w-24 h-2 mx-8 rounded-full transition-all duration-700 ${step >= 2 ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-white/20'}`}>
                {step >= 2 && <div className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-pulse"></div>}
              </div>
              
              <div className={`relative flex items-center transition-all duration-500 ${step >= 2 ? 'text-white' : 'text-white/40'}`}>
                <div className={`relative w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-500 ${step >= 2 ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-2xl transform scale-110' : 'bg-white/20 text-white/60'}`}>
                  2
                  {step >= 2 && <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 animate-pulse opacity-75"></div>}
                </div>
                <span className="ml-4 font-bold text-lg">AI Interview</span>
              </div>
              
              <div className={`w-24 h-2 mx-8 rounded-full transition-all duration-700 ${step >= 3 ? 'bg-gradient-to-r from-purple-500 to-pink-600' : 'bg-white/20'}`}>
                {step >= 3 && <div className="h-full bg-gradient-to-r from-purple-400 to-pink-500 rounded-full animate-pulse"></div>}
              </div>
              
              <div className={`relative flex items-center transition-all duration-500 ${step >= 3 ? 'text-white' : 'text-white/40'}`}>
                <div className={`relative w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-500 ${step >= 3 ? 'bg-gradient-to-r from-pink-500 to-red-600 text-white shadow-2xl transform scale-110' : 'bg-white/20 text-white/60'}`}>
                  3
                  {step >= 3 && <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 to-red-600 animate-pulse opacity-75"></div>}
                </div>
                <span className="ml-4 font-bold text-lg">Professional Report</span>
              </div>
            </div>
          </div>

          {/* STEP 1: Enhanced Project Setup with Glassmorphism */}
          {step === 1 && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl shadow-2xl p-12 transform transition-all duration-500 hover:bg-white/15">
                <div className="text-center mb-12">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
                    <span className="text-3xl">📋</span>
                  </div>
                  <h2 className="text-4xl font-bold text-white mb-4">Project Setup</h2>
                  <p className="text-white/80 text-lg">Tell us about your project to generate intelligent, targeted questions</p>
                </div>
                
                <div className="space-y-10">
                  <div className="group">
                    <label className="block text-xl font-bold text-white mb-4">
                      Project Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={projectData.name}
                        onChange={(e) => setProjectData({...projectData, name: e.target.value})}
                        className="w-full p-6 text-lg bg-white/10 border-2 border-white/20 rounded-2xl focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-white placeholder-white/60 backdrop-blur-sm"
                        placeholder="e.g., Task Management Mobile App"
                      />
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    </div>
                  </div>
                  
                  <div className="group">
                    <label className="block text-xl font-bold text-white mb-4">
                      Project Description
                    </label>
                    <div className="relative">
                      <textarea
                        value={projectData.topic}
                        onChange={(e) => setProjectData({...projectData, topic: e.target.value})}
                        className="w-full p-6 text-lg bg-white/10 border-2 border-white/20 rounded-2xl focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-white placeholder-white/60 backdrop-blur-sm resize-none"
                        rows={6}
                        placeholder="Describe your project in detail - what it does, who it's for, key goals..."
                      />
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    </div>
                  </div>
                  
                  <button
                    onClick={startInterview}
                    disabled={!projectData.name || !projectData.topic || isLoadingQuestions}
                    className="w-full relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-6 px-8 rounded-2xl font-bold text-xl hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-2xl transform hover:scale-105 active:scale-95 group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <span className="relative z-10 flex items-center justify-center">
                      {isLoadingQuestions ? (
                        <>
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/30 border-t-white mr-3"></div>
                          🤖 Generating Intelligent Questions...
                        </>
                      ) : (
                        <>
                          🚀 Generate Questions & Start Interview
                          <svg className="w-6 h-6 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </>
                      )}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Enhanced Questions Interface */}
          {step === 2 && (
            <div className="max-w-6xl mx-auto">
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl shadow-2xl p-12">
                <div className="text-center mb-12">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl animate-bounce">
                    <span className="text-3xl">🎤</span>
                  </div>
                  <h2 className="text-4xl font-bold text-white mb-4">AI Business Interview</h2>
                  <p className="text-white/80 text-lg">Answer all questions for <strong className="text-blue-300">{projectData.name}</strong></p>
                  {modelInfo && (
                    <div className="mt-4 inline-block bg-green-500/20 backdrop-blur-sm text-green-200 px-4 py-2 rounded-full text-sm font-medium border border-green-400/30">
                      <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                      Questions powered by {modelInfo}
                    </div>
                  )}
                </div>

                {isLoadingQuestions ? (
                  <div className="text-center py-16">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-20 w-20 border-4 border-white/20 border-t-white mx-auto mb-6"></div>
                      <div className="animate-ping absolute top-0 left-1/2 transform -translate-x-1/2 rounded-full h-20 w-20 border-4 border-white/40"></div>
                    </div>
                    <p className="text-white text-xl font-semibold">🤖 AI is crafting intelligent questions for your project...</p>
                    <p className="text-white/70 text-sm mt-2">Analyzing project context and generating targeted requirements</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {questions.map((question, index) => (
                      <div key={index} className="group relative">
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 transform transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:scale-[1.02]">
                          <div className="flex items-center mb-6">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                              {index + 1}
                            </div>
                            <h3 className="text-xl font-bold text-white ml-4">
                              Question {index + 1}
                            </h3>
                          </div>
                          
                          <p className="text-white/90 mb-6 text-lg leading-relaxed bg-white/5 p-4 rounded-xl border border-white/10">
                            {question}
                          </p>
                          
                          {/* Enhanced Voice Controls */}
                          <div className="flex items-center gap-4 mb-6">
                            <button
                              onClick={() => startListening(index)}
                              disabled={isListening && currentRecordingQuestion !== index}
                              className={`relative overflow-hidden px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 transform hover:scale-105 active:scale-95 ${
                                currentRecordingQuestion === index && isListening
                                  ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50'
                                  : 'bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700 disabled:opacity-50 shadow-lg'
                              }`}
                            >
                              <span className="text-xl">🎤</span>
                              {currentRecordingQuestion === index && isListening ? 'Recording...' : 'Record Answer'}
                              {currentRecordingQuestion === index && isListening && (
                                <div className="absolute inset-0 bg-gradient-to-r from-red-400/30 to-pink-400/30 animate-pulse"></div>
                              )}
                            </button>
                            
                            {currentRecordingQuestion === index && isListening && (
                              <button 
                                onClick={stopListening}
                                className="relative overflow-hidden bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all flex items-center gap-2 shadow-lg transform hover:scale-105 active:scale-95"
                              >
                                <span className="text-xl">⏹️</span>
                                Stop & Save
                                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity"></div>
                              </button>
                            )}
                            
                            <span className="text-white/70 font-medium">or type below</span>
                          </div>

                          {/* Enhanced Live Transcript */}
                          {currentRecordingQuestion === index && isListening && (
                            <div className="mb-6 p-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-xl backdrop-blur-sm">
                              <div className="flex items-center mb-3">
                                <div className="animate-pulse bg-red-500 rounded-full w-3 h-3 mr-3"></div>
                                <span className="text-green-200 font-bold">🎤 Live Transcript:</span>
                              </div>
                              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
                                <p className="text-white font-mono text-lg">
                                  &quot;{transcript}&quot;
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Enhanced Answer Input */}
                          <div className="relative group">
                            <textarea
                              value={answers[index] || ''}
                              onChange={(e) => {
                                const newAnswers = [...answers];
                                newAnswers[index] = e.target.value;
                                setAnswers(newAnswers);
                              }}
                              className="w-full p-6 text-lg bg-white/10 border-2 border-white/20 rounded-xl focus:ring-4 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-white placeholder-white/60 backdrop-blur-sm resize-none"
                              rows={5}
                              placeholder="Type your answer here or use voice recording above..."
                            />
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Enhanced Submit Button */}
                    <div className="flex justify-center pt-8">
                      <button
                        onClick={generateAI}
                        disabled={answers.some(answer => !answer?.trim()) || isListening}
                        className="relative overflow-hidden bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white py-6 px-12 rounded-2xl font-bold text-xl hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-2xl transform hover:scale-105 active:scale-95 group"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <span className="relative z-10 flex items-center justify-center">
                          {isListening ? (
                            <>
                              <div className="animate-pulse bg-yellow-500 rounded-full w-3 h-3 mr-3"></div>
                              Complete recording first...
                            </>
                          ) : (
                            <>
                              🤖 Generate Professional Analysis
                              <svg className="w-6 h-6 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            </>
                          )}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Enhanced Professional Results */}
          {step === 3 && (
            <div className="max-w-7xl mx-auto">
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl shadow-2xl p-12">
                <div className="flex items-center justify-between mb-12">
                  <div>
                    <div className="flex items-center mb-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-red-600 rounded-full flex items-center justify-center mr-6 shadow-2xl">
                        <span className="text-2xl">📊</span>
                      </div>
                      <div>
                        <h2 className="text-4xl font-bold text-white mb-2">Professional Business Analysis</h2>
                        <p className="text-white/80 text-lg">Comprehensive requirements analysis generated from your interview</p>
                      </div>
                    </div>
                  </div>
                  {aiSource === 'ollama' && (
                    <div className="flex flex-col items-end">
                      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm text-green-200 px-6 py-3 rounded-full font-bold mb-2 border border-green-400/30">
                        <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                        🤖 Powered by Local AI
                      </div>
                      <div className="text-xs text-green-300 font-mono bg-green-500/10 px-3 py-1 rounded-full border border-green-400/20">
                        {modelInfo || 'llama3:latest'}
                      </div>
                    </div>
                  )}
                </div>
                
                {isGenerating ? (
                  <div className="text-center py-20">
                    <div className="relative mb-8">
                      <div className="animate-spin rounded-full h-24 w-24 border-4 border-white/20 border-t-white mx-auto"></div>
                      <div className="animate-ping absolute top-0 left-1/2 transform -translate-x-1/2 rounded-full h-24 w-24 border-4 border-white/40"></div>
                    </div>
                    <h3 className="text-white text-2xl font-bold mb-4">🤖 AI is analyzing your interview responses...</h3>
                    <p className="text-white/70 text-lg">This may take 15-30 seconds for comprehensive analysis</p>
                    <div className="mt-8 flex justify-center space-x-2">
                      <div className="animate-bounce bg-blue-500 rounded-full w-3 h-3"></div>
                      <div className="animate-bounce bg-purple-500 rounded-full w-3 h-3 animation-delay-150"></div>
                      <div className="animate-bounce bg-pink-500 rounded-full w-3 h-3 animation-delay-300"></div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-10">
                    {/* Enhanced Professional Results Display */}
                    <div id="results-content" className="space-y-10">
                      {/* Enhanced Document Header */}
                      <div className="border-b-4 border-gradient-to-r from-blue-500 to-purple-600 pb-8 bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                        <h1 className="text-5xl font-black text-white mb-4 bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">{projectData.name}</h1>
                        <h2 className="text-3xl text-blue-300 mb-6 font-bold">Business Analysis Report</h2>
                        <div className="grid grid-cols-2 gap-6 text-white/80">
                          <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                            <strong>Generated:</strong> {new Date().toLocaleDateString()}
                          </div>
                          <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                            <strong>AI Model:</strong> {modelInfo || 'Local AI'}
                          </div>
                          <div className="col-span-2 bg-white/5 p-4 rounded-lg border border-white/10">
                            <strong>Description:</strong> {projectData.topic}
                          </div>
                        </div>
                      </div>

                      {/* Enhanced Interview Summary */}
                      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm p-8 rounded-2xl border border-blue-400/30">
                        <h3 className="text-2xl font-bold text-blue-200 mb-6 flex items-center">
                          <span className="text-3xl mr-3">📋</span>
                          Interview Summary
                        </h3>
                        <div className="space-y-6">
                          {questions.map((q, i) => (
                            <div key={i} className="bg-white/10 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/20 transform transition-all hover:bg-white/15">
                              <p className="font-bold text-white mb-3 text-lg">Q{i + 1}: {q}</p>
                              <div className="pl-6 border-l-4 border-blue-400">
                                <p className="text-white/90 leading-relaxed">{answers[i]}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Enhanced Parsed Structured Output */}
                      {parsedOutput ? (
                        <div className="space-y-8">
                          {parsedOutput.executiveSummary && (
                            <div className="bg-gradient-to-r from-gray-500/20 to-slate-500/20 backdrop-blur-sm p-8 rounded-2xl border border-gray-400/30">
                              <h3 className="text-2xl font-bold text-gray-200 mb-6 flex items-center">
                                <span className="text-3xl mr-3">📊</span>
                                Executive Summary
                              </h3>
                              <p className="text-white/90 leading-relaxed text-lg bg-white/5 p-6 rounded-xl border border-white/10">{parsedOutput.executiveSummary}</p>
                            </div>
                          )}

                          {parsedOutput.functionalRequirements.length > 0 && (
                            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm p-8 rounded-2xl border border-green-400/30">
                              <h3 className="text-2xl font-bold text-green-200 mb-6 flex items-center">
                                <span className="text-3xl mr-3">⚙️</span>
                                Functional Requirements
                              </h3>
                              <ul className="space-y-4">
                                {parsedOutput.functionalRequirements.map((req, i) => (
                                  <li key={i} className="flex items-start bg-white/5 p-4 rounded-lg border border-white/10">
                                    <span className="text-green-400 mr-3 text-xl">✓</span>
                                    <span className="text-white/90 leading-relaxed">{req}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {parsedOutput.userStories.length > 0 && (
                            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm p-8 rounded-2xl border border-purple-400/30">
                              <h3 className="text-2xl font-bold text-purple-200 mb-6 flex items-center">
                                <span className="text-3xl mr-3">👥</span>
                                User Stories
                              </h3>
                              <div className="space-y-4">
                                {parsedOutput.userStories.map((story, i) => (
                                  <div key={i} className="bg-white/10 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/20">
                                    <p className="text-white/90 leading-relaxed">{story}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {parsedOutput.technicalConsiderations.length > 0 && (
                            <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-sm p-8 rounded-2xl border border-orange-400/30">
                              <h3 className="text-2xl font-bold text-orange-200 mb-6 flex items-center">
                                <span className="text-3xl mr-3">🔧</span>
                                Technical Considerations
                              </h3>
                              <ul className="space-y-4">
                                {parsedOutput.technicalConsiderations.map((tech, i) => (
                                  <li key={i} className="flex items-start bg-white/5 p-4 rounded-lg border border-white/10">
                                    <span className="text-orange-400 mr-3 text-xl">▶</span>
                                    <span className="text-white/90 leading-relaxed">{tech}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {parsedOutput.successMetrics.length > 0 && (
                            <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 backdrop-blur-sm p-8 rounded-2xl border border-yellow-400/30">
                              <h3 className="text-2xl font-bold text-yellow-200 mb-6 flex items-center">
                                <span className="text-3xl mr-3">📈</span>
                                Success Metrics
                              </h3>
                              <ul className="space-y-4">
                                {parsedOutput.successMetrics.map((metric, i) => (
                                  <li key={i} className="flex items-start bg-white/5 p-4 rounded-lg border border-white/10">
                                    <span className="text-yellow-400 mr-3 text-xl">📊</span>
                                    <span className="text-white/90 leading-relaxed">{metric}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Fallback to raw output with enhanced styling */
                        <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10">
                          <div className="prose max-w-none">
                            <pre className="whitespace-pre-wrap text-base leading-relaxed text-white/90 font-sans bg-black/20 p-6 rounded-xl border border-white/10">
                              {editedOutput || aiOutput}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Enhanced Edit Toggle */}
                    <div className="flex items-center justify-between p-6 bg-blue-500/20 backdrop-blur-sm rounded-2xl border border-blue-400/30">
                      <span className="font-bold text-blue-200 text-lg">
                        {isEditing ? '✏️ Edit Mode: Make changes below' : '👁️ Review Mode: Click edit to modify'}
                      </span>
                      <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={`px-8 py-3 rounded-xl font-bold transition-all transform hover:scale-105 active:scale-95 ${
                          isEditing 
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg' 
                            : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg'
                        }`}
                      >
                        {isEditing ? '✅ Done Editing' : '✏️ Edit Output'}
                      </button>
                    </div>
                    
                    {/* Enhanced Edit Mode */}
                    {isEditing && (
                      <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10">
                        <label className="block text-xl font-bold text-white mb-6">
                          Edit Your Requirements Document:
                        </label>
                        <textarea
                          value={editedOutput}
                          onChange={(e) => setEditedOutput(e.target.value)}
                          className="w-full p-6 text-sm font-mono bg-black/30 border-2 border-white/20 rounded-xl focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-white placeholder-white/60 backdrop-blur-sm resize-none"
                          rows={30}
                        />
                      </div>
                    )}
                    
                    {/* Enhanced Export Options */}
                    <div className="bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-red-500/20 backdrop-blur-sm p-8 rounded-2xl border border-purple-400/30">
                      <h3 className="text-2xl font-bold text-purple-200 mb-6 flex items-center">
                        <span className="text-3xl mr-3">📄</span>
                        Export Options
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <button
                          onClick={exportToRichText}
                          className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg transform hover:scale-105 active:scale-95"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <span className="relative z-10 flex items-center justify-center flex-col">
                            <span className="text-2xl mb-2">📄</span>
                            <span>Export to HTML</span>
                            <span className="text-xs opacity-80">(Opens in Word)</span>
                          </span>
                        </button>
                        
                        <button
                          onClick={exportToPDF}
                          className="group relative overflow-hidden bg-gradient-to-r from-red-600 to-red-700 text-white py-4 px-6 rounded-xl font-bold hover:from-red-700 hover:to-red-800 transition-all shadow-lg transform hover:scale-105 active:scale-95"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <span className="relative z-10 flex items-center justify-center flex-col">
                            <span className="text-2xl mb-2">📋</span>
                            <span>Export to PDF</span>
                          </span>
                        </button>
                        
                        <button
                          onClick={exportToMarkdown}
                          className="group relative overflow-hidden bg-gradient-to-r from-gray-600 to-gray-700 text-white py-4 px-6 rounded-xl font-bold hover:from-gray-700 hover:to-gray-800 transition-all shadow-lg transform hover:scale-105 active:scale-95"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <span className="relative z-10 flex items-center justify-center flex-col">
                            <span className="text-2xl mb-2">📝</span>
                            <span>Export Markdown</span>
                          </span>
                        </button>
                      </div>
                      <p className="text-white/70 text-sm mt-4 text-center bg-white/5 p-3 rounded-lg border border-white/10">
                        💡 The HTML export can be opened directly in Microsoft Word for further editing
                      </p>
                    </div>

                    {/* Enhanced Action Button */}
                    <div className="flex justify-center">
                      <button
                        onClick={() => {
                          setStep(1);
                          setQuestions([]);
                          setAnswers([]);
                          setAiOutput('');
                          setEditedOutput('');
                          setParsedOutput(null);
                          setModelInfo('');
                          setIsEditing(false);
                          resetTranscript();
                        }}
                        className="group relative overflow-hidden bg-gradient-to-r from-gray-600 to-slate-700 text-white py-4 px-8 rounded-xl font-bold hover:from-gray-700 hover:to-slate-800 transition-all shadow-lg transform hover:scale-105 active:scale-95"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <span className="relative z-10 flex items-center">
                          <svg className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                          </svg>
                          Start New Project
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
      
      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animation-delay-150 {
          animation-delay: 150ms;
        }
        
        .animation-delay-300 {
          animation-delay: 300ms;
        }
      `}</style>
    </div>
  );
}