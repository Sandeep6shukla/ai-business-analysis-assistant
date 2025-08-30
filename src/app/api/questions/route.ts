// src/app/api/questions/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const projectName: string = body.projectName || "Unknown Project";
    const projectTopic: string = body.projectTopic || "";

    const prompt = `You are a senior business analyst. Generate exactly 5 focused, comprehensive questions for a business analysis interview about this project:

PROJECT: ${projectName}
DESCRIPTION: ${projectTopic}

Make sure the questions:
- Cover functional requirements, users, technical needs, business processes, and success criteria
- Are specific to this project domain
- Are clear and professional
- Format as: 1. Question ... 2. Question ... etc
- ONLY return the numbered list`;

    const ollamaResponse = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3:latest",
        prompt,
        stream: false,
      }),
    });

    if (!ollamaResponse.ok) {
      console.error("❌ Ollama error:", await ollamaResponse.text());
      return NextResponse.json(
        { success: false, error: "Ollama returned error" },
        { status: 500 }
      );
    }

    const data: { response: string } = await ollamaResponse.json();

    // Robust question extraction
    let questions: string[] = data.response
      .split("\n")
      .map((line) => line.trim())
      .filter((line) =>
        line.match(/^(\d+[\.\)]|[-*])\s+/) // matches "1.", "1)", "-", "*"
      )
      .map((line) =>
        line.replace(/^(\d+[\.\)]\s*|[-*]\s*)/, "").trim()
      )
      .filter((line) => line.length > 0)
      .slice(0, 5);

    // Fallback if Ollama output is junk
    if (questions.length === 0) {
      questions = [
        `What are the primary goals and objectives of ${projectName}?`,
        "Who are the main users or stakeholders, and what are their needs?",
        "What core features or functionalities must be included?",
        "What technical requirements, integrations, or constraints exist?",
        "How will success be measured and what business outcomes are expected?",
      ];
    }

    return NextResponse.json({ success: true, questions });
  } catch (err: unknown) {
    // ✅ use `unknown` instead of `any`
    const message =
      err instanceof Error ? err.message : "Unknown error occurred";
    console.error("❌ Question route failed:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
