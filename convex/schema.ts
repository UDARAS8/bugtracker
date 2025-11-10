import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  bugs: defineTable({
    title: v.string(),
    description: v.string(),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    status: v.union(v.literal("open"), v.literal("in-progress"), v.literal("resolved"), v.literal("closed")),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
    assignee: v.optional(v.string()),
    reporter: v.string(),
    environment: v.string(),
    steps: v.array(v.string()),
    expectedResult: v.string(),
    actualResult: v.string(),
    tags: v.array(v.string()),
    aiAnalysis: v.optional(v.string()),
    suggestedFix: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_severity", ["severity"])
    .index("by_reporter", ["reporter"])
    .searchIndex("search_bugs", {
      searchField: "title",
      filterFields: ["status", "severity", "priority"]
    }),

  testCases: defineTable({
    name: v.string(),
    description: v.string(),
    steps: v.array(v.string()),
    expectedResult: v.string(),
    category: v.string(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    automated: v.boolean(),
    lastRun: v.optional(v.number()),
    status: v.union(v.literal("pass"), v.literal("fail"), v.literal("pending")),
    relatedBugs: v.array(v.id("bugs")),
  })
    .index("by_category", ["category"])
    .index("by_status", ["status"])
    .searchIndex("search_tests", {
      searchField: "name",
      filterFields: ["category", "status", "priority"]
    }),

  qaReports: defineTable({
    title: v.string(),
    summary: v.string(),
    bugsFound: v.number(),
    testsRun: v.number(),
    testsPassed: v.number(),
    testsFailed: v.number(),
    coverage: v.number(),
    aiInsights: v.optional(v.string()),
    recommendations: v.array(v.string()),
    reportDate: v.number(),
    generatedBy: v.string(),
  })
    .index("by_date", ["reportDate"])
    .index("by_generator", ["generatedBy"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
