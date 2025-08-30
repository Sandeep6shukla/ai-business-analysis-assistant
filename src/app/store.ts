// app/store.ts
import { create } from "zustand";

export interface ProjectData {
  name: string;
  topic: string;
}

export interface ParsedOutput {
  executiveSummary: string;
  functionalRequirements: string[];
  nonFunctionalRequirements: string[];
  userStories: string[];
  technicalConsiderations: string[];
  businessRules: string[];
  successMetrics: string[];
  nextSteps: string[];
}

interface AppState {
  step: number;
  projectData: ProjectData;
  questions: string[];
  answers: string[];
  aiOutput: string;
  editedOutput: string;
  parsedOutput: ParsedOutput | null;
  modelInfo: string;
  aiSource: string;
  isEditing: boolean;

  // setters
  setStep: (s: number) => void;
  setProjectData: (d: ProjectData) => void;
  setQuestions: (q: string[]) => void;
  setAnswers: (a: string[]) => void;
  setAiOutput: (o: string) => void;
  setEditedOutput: (o: string) => void;
  setParsedOutput: (p: ParsedOutput | null) => void;
  setModelInfo: (i: string) => void;
  setAiSource: (s: string) => void;
  setIsEditing: (v: boolean) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  step: 1,
  projectData: { name: "", topic: "" },
  questions: [],
  answers: [],
  aiOutput: "",
  editedOutput: "",
  parsedOutput: null,
  modelInfo: "",
  aiSource: "",
  isEditing: false,

  setStep: (s) => set({ step: s }),
  setProjectData: (d) => set({ projectData: d }),
  setQuestions: (q) => set({ questions: q }),
  setAnswers: (a) => set({ answers: a }),
  setAiOutput: (o) => set({ aiOutput: o }),
  setEditedOutput: (o) => set({ editedOutput: o }),
  setParsedOutput: (p) => set({ parsedOutput: p }),
  setModelInfo: (i) => set({ modelInfo: i }),
  setAiSource: (s) => set({ aiSource: s }),
  setIsEditing: (v) => set({ isEditing: v }),

  reset: () =>
    set({
      step: 1,
      projectData: { name: "", topic: "" },
      questions: [],
      answers: [],
      aiOutput: "",
      editedOutput: "",
      parsedOutput: null,
      modelInfo: "",
      aiSource: "",
      isEditing: false,
    }),
}));
