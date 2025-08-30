"use client";
import ProjectSetup from "./components/ProjectSetup";
import Interview from "./components/Interview";
import Report from "./components/Report";
import { useAppStore } from "./store";
import { Rocket, Mic, BarChart } from "lucide-react";

export default function Home() {
  const { step, setStep } = useAppStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-10 text-white">
      {/* 🔹 App Header */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <Rocket className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-4xl font-extrabold">Business Analysis Assistant</h1>
        <p className="mt-2 text-lg text-white/80">
          AI-powered tool to capture requirements, run interviews, 
          and generate professional business reports.
        </p>
      </div>

      {/* 🔹 Progress Tracker */}
      <div className="flex justify-center mb-12 gap-12">
        {/* Step 1 */}
        <div
          className={`flex flex-col items-center ${
            step >= 1 ? "text-white" : "text-white/40"
          }`}
        >
          <div
            className={`flex items-center justify-center w-14 h-14 rounded-full mb-2 transition-all ${
              step === 1
                ? "bg-gradient-to-r from-blue-500 to-purple-600 shadow-xl scale-110"
                : "bg-white/10"
            }`}
          >
            <Rocket className="w-7 h-7" />
          </div>
          <span className="text-sm font-semibold">Project Setup</span>
        </div>

        {/* Step 2 */}
        <div
          className={`flex flex-col items-center ${
            step >= 2 ? "text-white" : "text-white/40"
          }`}
        >
          <div
            className={`flex items-center justify-center w-14 h-14 rounded-full mb-2 transition-all ${
              step === 2
                ? "bg-gradient-to-r from-purple-500 to-pink-600 shadow-xl scale-110"
                : "bg-white/10"
            }`}
          >
            <Mic className="w-7 h-7" />
          </div>
          <span className="text-sm font-semibold">AI Interview</span>
        </div>

        {/* Step 3 */}
        <div
          className={`flex flex-col items-center ${
            step >= 3 ? "text-white" : "text-white/40"
          }`}
        >
          <div
            className={`flex items-center justify-center w-14 h-14 rounded-full mb-2 transition-all ${
              step === 3
                ? "bg-gradient-to-r from-pink-500 to-red-600 shadow-xl scale-110"
                : "bg-white/10"
            }`}
          >
            <BarChart className="w-7 h-7" />
          </div>
          <span className="text-sm font-semibold">Report</span>
        </div>
      </div>

      {/* 🔹 Step Content */}
      {step === 1 && <ProjectSetup onStart={() => setStep(2)} />}
      {step === 2 && <Interview onGenerate={() => setStep(3)} />}
      {step === 3 && <Report />}
    </div>
  );
}
