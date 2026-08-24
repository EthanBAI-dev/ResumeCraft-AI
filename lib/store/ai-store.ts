"use client";

import { nanoid } from "nanoid";
import { create } from "zustand";

export type AiSuggestion = {
  id: string;
  sourceIndex: number;
  original: string;
  proposed: string;
};

export type AiReviewJob = {
  requestId: string;
  status: "loading" | "ready" | "error";
  suggestions: AiSuggestion[];
  missingFacts: string[];
  error?: string;
  retryable?: boolean;
};

type AiReviewState = {
  jobs: Record<string, AiReviewJob>;
  start: (target: string) => string;
  complete: (
    target: string,
    requestId: string,
    originals: string[],
    proposals: string[],
    missingFacts: string[],
    sourceIndices?: number[],
  ) => void;
  fail: (target: string, requestId: string, error: string, retryable?: boolean) => void;
  resolve: (target: string, suggestionId: string) => void;
  resolveAll: (target: string) => void;
  clear: (target: string) => void;
};

export const aiTargetKey = (sectionId: string, itemId: string) => `${sectionId}:${itemId}`;

export const useAiStore = create<AiReviewState>((set) => ({
  jobs: {},

  start: (target) => {
    const requestId = nanoid();
    set((state) => ({
      jobs: {
        ...state.jobs,
        [target]: {
          requestId,
          status: "loading",
          suggestions: state.jobs[target]?.suggestions ?? [],
          missingFacts: state.jobs[target]?.missingFacts ?? [],
        },
      },
    }));
    return requestId;
  },

  complete: (target, requestId, originals, proposals, missingFacts, sourceIndices) =>
    set((state) => {
      if (state.jobs[target]?.requestId !== requestId) return state;
      const suggestions = proposals.flatMap((proposed, proposalIndex) => {
        const original = originals[proposalIndex] ?? "";
        const sourceIndex = sourceIndices?.[proposalIndex] ?? proposalIndex;
        return original === proposed
          ? []
          : [
              {
                id: nanoid(),
                sourceIndex:
                  proposalIndex < originals.length ? sourceIndex : Number.MAX_SAFE_INTEGER,
                original,
                proposed,
              },
            ];
      });
      return {
        jobs: {
          ...state.jobs,
          [target]: { requestId, status: "ready", suggestions, missingFacts },
        },
      };
    }),

  fail: (target, requestId, error, retryable = false) =>
    set((state) => {
      if (state.jobs[target]?.requestId !== requestId) return state;
      return {
        jobs: {
          ...state.jobs,
          [target]: {
            ...state.jobs[target],
            status: "error",
            error,
            retryable,
          },
        },
      };
    }),

  resolve: (target, suggestionId) =>
    set((state) => {
      const job = state.jobs[target];
      if (!job) return state;
      return {
        jobs: {
          ...state.jobs,
          [target]: {
            ...job,
            suggestions: job.suggestions.filter((item) => item.id !== suggestionId),
          },
        },
      };
    }),

  resolveAll: (target) =>
    set((state) => {
      const job = state.jobs[target];
      if (!job) return state;
      return {
        jobs: { ...state.jobs, [target]: { ...job, suggestions: [] } },
      };
    }),

  clear: (target) =>
    set((state) => {
      const jobs = { ...state.jobs };
      delete jobs[target];
      return { jobs };
    }),
}));
