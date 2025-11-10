import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listTestCases = query({
  args: {
    category: v.optional(v.string()),
    status: v.optional(v.union(v.literal("pass"), v.literal("fail"), v.literal("pending"))),
  },
  handler: async (ctx, args) => {
    let tests;
    
    if (args.category) {
      tests = await ctx.db.query("testCases")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .order("desc")
        .collect();
    } else {
      tests = await ctx.db.query("testCases").order("desc").collect();
    }
    
    if (args.status) {
      return tests.filter(test => test.status === args.status);
    }
    
    return tests;
  },
});

export const createTestCase = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    steps: v.array(v.string()),
    expectedResult: v.string(),
    category: v.string(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    automated: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to create test cases");
    }

    return await ctx.db.insert("testCases", {
      ...args,
      status: "pending",
      lastRun: undefined,
      relatedBugs: [],
    });
  },
});

export const updateTestStatus = mutation({
  args: {
    id: v.id("testCases"),
    status: v.union(v.literal("pass"), v.literal("fail"), v.literal("pending")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to update test cases");
    }

    await ctx.db.patch(args.id, {
      status: args.status,
      lastRun: Date.now(),
    });
  },
});

export const getTestCategories = query({
  args: {},
  handler: async (ctx) => {
    const tests = await ctx.db.query("testCases").collect();
    const categories = [...new Set(tests.map(test => test.category))];
    return categories;
  },
});
