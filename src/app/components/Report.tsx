"use client";
import { useEffect } from "react";
import { useAppStore } from "../store";
import { parseAIOutput } from "../lib/parseAIOutput";
import {
  BarChart,
  Edit,
  Check,
  FileText,
  RefreshCcw,
} from "lucide-react";

export default function Report() {
  const {
    projectData,
    aiOutput,
    editedOutput,
    isEditing,
    setIsEditing,
    setEditedOutput,
    parsedOutput,
    setParsedOutput,
    reset,
    modelInfo,
  } = useAppStore();

  // Parse when AI finishes streaming
  useEffect(() => {
    if (aiOutput && !parsedOutput) {
      const parsed = parseAIOutput(aiOutput);
      setParsedOutput(parsed);
    }
  }, [aiOutput, parsedOutput, setParsedOutput]);

  const exportToRichText = () => {
    const finalOutput = isEditing ? editedOutput : aiOutput;

    const htmlContent = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>${projectData.name} Report</title></head>
<body>
<h1>Business Analysis Report</h1>
<h2>${projectData.name}</h2>
<p><strong>Description:</strong> ${projectData.topic}</p>
<p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
<p><strong>Model:</strong> ${modelInfo || "Local AI"}</p>
<hr/>
<pre style="white-space: pre-wrap;">${finalOutput}</pre>
</body></html>`;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectData.name.replace(/\s+/g, "_")}_Report.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto bg-white p-12 rounded-3xl shadow-2xl">
      <h2 className="text-3xl text-gray-900 font-bold mb-6 flex items-center gap-2">
        <BarChart className="w-6 h-6 text-blue-600" />
        Business Analysis Report
      </h2>

      {/* If we have parsed structured output */}
      {parsedOutput ? (
        <div className="space-y-8">
          {parsedOutput.executiveSummary && (
            <section>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Executive Summary</h3>
              <p className="text-gray-700">{parsedOutput.executiveSummary}</p>
            </section>
          )}

          {parsedOutput.functionalRequirements.length > 0 && (
            <section>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Functional Requirements</h3>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                {parsedOutput.functionalRequirements.map((req, i) => (
                  <li key={i}>{req}</li>
                ))}
              </ul>
            </section>
          )}

          {parsedOutput.nonFunctionalRequirements.length > 0 && (
            <section>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Non-Functional Requirements</h3>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                {parsedOutput.nonFunctionalRequirements.map((req, i) => (
                  <li key={i}>{req}</li>
                ))}
              </ul>
            </section>
          )}

          {parsedOutput.userStories.length > 0 && (
            <section>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">User Stories</h3>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                {parsedOutput.userStories.map((story, i) => (
                  <li key={i}>{story}</li>
                ))}
              </ul>
            </section>
          )}

          {parsedOutput.technicalConsiderations.length > 0 && (
            <section>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Technical Considerations</h3>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                {parsedOutput.technicalConsiderations.map((tc, i) => (
                  <li key={i}>{tc}</li>
                ))}
              </ul>
            </section>
          )}

          {parsedOutput.businessRules.length > 0 && (
            <section>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Business Rules</h3>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                {parsedOutput.businessRules.map((rule, i) => (
                  <li key={i}>{rule}</li>
                ))}
              </ul>
            </section>
          )}

          {parsedOutput.successMetrics.length > 0 && (
            <section>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Success Metrics</h3>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                {parsedOutput.successMetrics.map((metric, i) => (
                  <li key={i}>{metric}</li>
                ))}
              </ul>
            </section>
          )}

          {parsedOutput.nextSteps.length > 0 && (
            <section>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Next Steps & Recommendations</h3>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                {parsedOutput.nextSteps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      ) : (
        // Fallback if parsing hasn't completed yet
        <p className="text-gray-500 italic">
          {aiOutput ? "Processing AI output..." : "Waiting for AI to start generating..."}
        </p>
      )}

      {/* Controls */}
      <div className="flex flex-wrap gap-4 mt-8">
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold"
        >
          {isEditing ? (
            <>
              <Check className="w-5 h-5" /> Done Editing
            </>
          ) : (
            <>
              <Edit className="w-5 h-5" /> Edit Raw Output
            </>
          )}
        </button>

        <button
          onClick={exportToRichText}
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold"
        >
          <FileText className="w-5 h-5" /> Export to Word (HTML)
        </button>

        <button
          onClick={reset}
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gray-700 text-white font-bold"
        >
          <RefreshCcw className="w-5 h-5" /> Start New Project
        </button>
      </div>

      {/* Raw editing mode */}
      {isEditing && (
        <div className="mt-6">
          <textarea
            value={editedOutput}
            onChange={(e) => setEditedOutput(e.target.value)}
            rows={20}
            className="w-full p-6 rounded-lg border border-gray-300 text-gray-900 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      )}
    </div>
  );
}
