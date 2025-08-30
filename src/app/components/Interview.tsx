"use client";
import { useState } from "react";
import { useAppStore } from "../store";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { BarChart, Loader2, Mic, Square } from "lucide-react"; // ✅ icons

export default function Interview() {
  const {
    projectData,
    questions,
    answers,
    setAnswers,
    setAiOutput,
    setEditedOutput,
    setParsedOutput,
    setStep,
  } = useAppStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentRecordingQuestion, setCurrentRecordingQuestion] = useState(-1);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  // ✅ Non-streaming generateAnalysis
  const generateAnalysis = async () => {
    setLoading(true);
    setError("");
    setAiOutput("");
    setEditedOutput("");
    setParsedOutput(null);
    setStep(3);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: projectData.name,
          projectTopic: projectData.topic,
          questions,
          answers,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate analysis");

      const data = await res.json();

      if (data.success && data.output) {
        setAiOutput(data.output);
        setEditedOutput(data.output);
      } else {
        setError("AI did not return valid output");
      }
    } catch (err: any) {
      console.error("❌ Generation failed:", err);
      setError("Could not generate analysis. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const startListening = (index: number) => {
    setCurrentRecordingQuestion(index);
    resetTranscript();
    SpeechRecognition.startListening({ continuous: true });
  };

  const stopListening = () => {
    SpeechRecognition.stopListening();
    if (currentRecordingQuestion >= 0) {
      const newAnswers = [...answers];
      newAnswers[currentRecordingQuestion] = transcript;
      setAnswers(newAnswers);
    }
    setCurrentRecordingQuestion(-1);
    resetTranscript();
  };

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="max-w-2xl mx-auto bg-red-50 p-6 rounded-xl text-red-800">
        Your browser does not support speech recognition.  
        Please use <strong>Chrome</strong> or <strong>Edge</strong>.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto bg-white p-12 rounded-3xl shadow-2xl">
      <h2 className="text-3xl text-gray-900 font-bold mb-8">
        AI Interview – {projectData.name}
      </h2>

      <div className="space-y-6">
        {questions.map((q, i) => (
          <div key={i} className="bg-gray-50 p-6 rounded-xl border border-gray-300">
            <p className="text-gray-900 mb-4 font-semibold">
              Q{i + 1}: {q}
            </p>

            {/* Voice Recording Controls */}
            <div className="flex gap-4 mb-4">
              {currentRecordingQuestion === i && listening ? (
                <button
                  onClick={stopListening}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white font-bold"
                >
                  <Square className="w-5 h-5" /> Stop & Save
                </button>
              ) : (
                <button
                  onClick={() => startListening(i)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-bold"
                >
                  <Mic className="w-5 h-5" /> Record Answer
                </button>
              )}
            </div>

            {/* Live Transcript */}
            {currentRecordingQuestion === i && listening && (
              <div className="mb-4 bg-blue-50 border border-blue-300 p-3 rounded">
                <p className="text-blue-700 font-mono">
                  🎙️ {transcript || "Listening..."}
                </p>
              </div>
            )}

            {/* Answer Box */}
            <textarea
              value={answers[i] || ""}
              onChange={(e) => {
                const newAnswers = [...answers];
                newAnswers[i] = e.target.value;
                setAnswers(newAnswers);
              }}
              rows={4}
              className="w-full p-4 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              placeholder="Type your answer here..."
            />
          </div>
        ))}
      </div>

      {error && <p className="text-red-600 mt-4">{error}</p>}

      <div className="text-center mt-8">
        <button
          onClick={generateAnalysis}
          disabled={answers.some((a) => !a.trim()) || loading}
          className="flex items-center justify-center gap-2 py-4 px-8 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Generating Analysis...
            </>
          ) : (
            <>
              <BarChart className="w-5 h-5" /> Generate Professional Analysis
            </>
          )}
        </button>
      </div>
    </div>
  );
}