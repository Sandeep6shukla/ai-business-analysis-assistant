// src/app/api/generate/route.ts
import { NextRequest, NextResponse } from "next/server";

interface OllamaModel {
  name: string;
  size: number;
}

export async function POST(request: NextRequest) {
  let projectName = "Unknown Project";
  let projectTopic = "";
  let questions: string[] = [];
  let answers: string[] = [];
  let modelInfo = "llama3:latest";

  try {
    const body = await request.json();
    projectName = body.projectName || projectName;
    projectTopic = body.projectTopic || "";
    questions = body.questions || [];
    answers = body.answers || [];

    // Format Q&A section
    const qaSection = questions
      .map(
        (q: string, i: number) =>
          `**Q${i + 1}:** ${q}\n**A${i + 1}:** ${answers[i] || "No response provided"}`
      )
      .join("\n\n");

    // Build prompt
    const prompt = `You are a senior business analyst. Based on this detailed interview, generate a comprehensive, professional business analysis document.

PROJECT: ${projectName}

DESCRIPTION: ${projectTopic}

INTERVIEW RESULTS:

${qaSection}

Generate a well-structured document with the following sections:

# EXECUTIVE SUMMARY
Brief overview of the project and key findings (2-3 paragraphs)

# FUNCTIONAL REQUIREMENTS
List 8-10 specific functional requirements...

# NON-FUNCTIONAL REQUIREMENTS
...

# USER STORIES
...

# TECHNICAL CONSIDERATIONS
...

# BUSINESS RULES
...

# SUCCESS METRICS
...

# NEXT STEPS & RECOMMENDATIONS
...`;

    // Fetch model info
    try {
      const modelResponse = await fetch("http://localhost:11434/api/tags");
      if (modelResponse.ok) {
        const modelData: { models?: OllamaModel[] } = await modelResponse.json();
        const llama3Model = modelData.models?.find((m) =>
          m.name.includes("llama3")
        );
        if (llama3Model) {
          const sizeGB = (llama3Model.size / (1024 * 1024 * 1024)).toFixed(1);
          modelInfo = `${llama3Model.name} (${sizeGB}GB)`;
        }
      }
    } catch (fetchError: unknown) {
      console.warn(
        "⚠️ Could not fetch model info:",
        fetchError instanceof Error ? fetchError.message : fetchError
      );
    }

    // Call Ollama generate API
    const ollamaResponse = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3:latest",
        prompt,
        stream: false, // change to true later for streaming
      }),
    });

    if (!ollamaResponse.ok) {
      throw new Error("Ollama API returned an error");
    }

    const data: { response: string } = await ollamaResponse.json();

    return NextResponse.json({
      success: true,
      output: data.response,
      source: "ollama",
      modelInfo,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown error occurred";
    console.error("❌ Ollama failed, using fallback:", message);

    const fallbackOutput = `# EXECUTIVE SUMMARY
The ${projectName} project aims to address key user needs...

# FUNCTIONAL REQUIREMENTS
✅ FR-001: User authentication and secure access management
...

# NEXT STEPS & RECOMMENDATIONS
1. 📋 Create wireframes
2. 🏗️ Define architecture
...`;

    return NextResponse.json({
      success: true,
      output: fallbackOutput,
      source: "fallback",
      modelInfo: "llama3:latest (Demo Mode)",
    });
  }
}
