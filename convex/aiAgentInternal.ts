import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const updateBugAnalysis = internalMutation({
  args: {
    bugId: v.id("bugs"),
    analysis: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.bugId, {
      aiAnalysis: args.analysis,
    });
  },
});

export const createQAReport = internalMutation({
  args: {
    title: v.string(),
    summary: v.string(),
    bugsFound: v.number(),
    testsRun: v.number(),
    testsPassed: v.number(),
    testsFailed: v.number(),
    coverage: v.number(),
    aiInsights: v.optional(v.string()),
    recommendations: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("qaReports", {
      ...args,
      reportDate: Date.now(),
      generatedBy: "QA Bug Checker AI",
    });
  },
});
