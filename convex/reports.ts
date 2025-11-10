import { query } from "./_generated/server";
import { v } from "convex/values";

export const listReports = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("qaReports")
      .withIndex("by_date")
      .order("desc")
      .take(10);
  },
});

export const getReport = query({
  args: { id: v.id("qaReports") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
