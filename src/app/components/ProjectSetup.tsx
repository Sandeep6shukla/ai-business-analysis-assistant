"use client";
import { useState } from "react";
import { useAppStore } from "../store";
import { Rocket, Loader2 } from "lucide-react"; // ✅ icons

export default function ProjectSetup() {
  const {
    projectData,
    setProjectData,
    setQuestions,
    setAnswers,
    setStep,
    setModelInfo,
  } = useAppStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generateQuestions = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: projectData.name,
          projectTopic: projectData.topic,
        }),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const data = await res.json();

      if (data.success && data.questions?.length > 0) {
        setQuestions(data.questions);
        setAnswers(new Array(data.questions.length).fill("")); // blank answers
        if (data.modelInfo) setModelInfo(data.modelInfo);
        setStep(2); // move to Interview step
      } else {
        throw new Error("No questions returned");
      }
    } catch (err: any) {
      console.error("❌ Question generation failed:", err);
      setError("Could not generate questions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-12 rounded-3xl shadow-2xl">
      <h2 className="text-3xl text-gray-900 font-bold mb-6">Project Setup</h2>

      {/* Project Name */}
      <label className="block text-gray-800 mb-2">Project Name</label>
      <input
        type="text"
        value={projectData.name}
        onChange={(e) =>
          setProjectData({ ...projectData, name: e.target.value })
        }
        className="w-full p-4 mb-6 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        placeholder="e.g., Task Management App"
      />

      {/* Project Description */}
      <label className="block text-gray-800 mb-2">Project Description</label>
      <textarea
        value={projectData.topic}
        onChange={(e) =>
          setProjectData({ ...projectData, topic: e.target.value })
        }
        rows={5}
        className="w-full p-4 mb-6 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        placeholder="Describe your project..."
      />

      {/* Error message */}
      {error && <p className="text-red-600 mb-4">{error}</p>}

      {/* CTA Button */}
      <button
        onClick={generateQuestions}
        disabled={!projectData.name || !projectData.topic || loading}
        className="flex items-center justify-center gap-2 w-full py-4 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" /> Generating Questions...
          </>
        ) : (
          <>
            <Rocket className="w-5 h-5" /> Generate Questions & Start Interview
          </>
        )}
      </button>
    </div>
  );
}
