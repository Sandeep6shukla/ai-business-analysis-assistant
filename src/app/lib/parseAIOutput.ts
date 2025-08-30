// src/app/lib/parseAIOutput.ts

export interface ParsedOutput {
  executiveSummary: string;
  functionalRequirements: string[];
  nonFunctionalRequirements: string[];
  userStories: string[];
  technicalConsiderations: string[];
  businessRules: string[];
  successMetrics: string[];
  nextSteps: string[];
  raw?: string; // keep original text if needed
}

export function parseAIOutput(output: string): ParsedOutput {
  const sections: ParsedOutput = {
    executiveSummary: "",
    functionalRequirements: [],
    nonFunctionalRequirements: [],
    userStories: [],
    technicalConsiderations: [],
    businessRules: [],
    successMetrics: [],
    nextSteps: [],
    raw: output,
  };

  const lines = output.split("\n");
  let currentSection: keyof ParsedOutput | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // --- Detect section headers (flexible) ---
    if (/executive summary/i.test(trimmed)) {
      currentSection = "executiveSummary"; continue;
    }
    if (/functional requirements/i.test(trimmed)) {
      currentSection = "functionalRequirements"; continue;
    }
    if (/non[- ]?functional requirements/i.test(trimmed)) {
      currentSection = "nonFunctionalRequirements"; continue;
    }
    if (/user stories/i.test(trimmed)) {
      currentSection = "userStories"; continue;
    }
    if (/technical considerations/i.test(trimmed)) {
      currentSection = "technicalConsiderations"; continue;
    }
    if (/business rules/i.test(trimmed)) {
      currentSection = "businessRules"; continue;
    }
    if (/success metrics/i.test(trimmed)) {
      currentSection = "successMetrics"; continue;
    }
    if (/next steps|recommendations/i.test(trimmed)) {
      currentSection = "nextSteps"; continue;
    }

    // --- Append content ---
    if (currentSection === "executiveSummary") {
      // Paragraphs, not bullets
      if (trimmed) sections.executiveSummary += trimmed + " ";
    } else if (currentSection) {
      // Normalize bullets/numbers/emoji checkmarks
      if (trimmed.match(/^(\d+[\.\)]|[-*•✅🔹➤])\s*/)) {
        const clean = trimmed.replace(/^(\d+[\.\)]|[-*•✅🔹➤])\s*/, "");
        (sections[currentSection] as string[]).push(clean);
      }
    }
  }

  // --- Fallback: if nothing matched, just dump everything into exec summary ---
  const isEmpty =
    !sections.executiveSummary &&
    sections.functionalRequirements.length === 0 &&
    sections.nonFunctionalRequirements.length === 0 &&
    sections.userStories.length === 0 &&
    sections.technicalConsiderations.length === 0 &&
    sections.businessRules.length === 0 &&
    sections.successMetrics.length === 0 &&
    sections.nextSteps.length === 0;

  if (isEmpty) {
    sections.executiveSummary = output;
  }

  return sections;
}
