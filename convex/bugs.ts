import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listBugs = query({
  args: {
    status: v.optional(v.union(v.literal("open"), v.literal("in-progress"), v.literal("resolved"), v.literal("closed"))),
    severity: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical"))),
    assignee: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let bugs;
    
    if (args.status) {
      bugs = await ctx.db.query("bugs")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    } else {
      bugs = await ctx.db.query("bugs").order("desc").collect();
    }
    
    if (args.severity) {
      bugs = bugs.filter(bug => bug.severity === args.severity);
    }

    if (args.assignee) {
      bugs = bugs.filter(bug => bug.assignee === args.assignee);
    }
    
    return bugs;
  },
});

export const getBug = query({
  args: { id: v.id("bugs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const createBug = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
    environment: v.string(),
    steps: v.array(v.string()),
    expectedResult: v.string(),
    actualResult: v.string(),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to create bugs");
    }

    const user = await ctx.db.get(userId);
    const reporter = user?.email || "Unknown";

    return await ctx.db.insert("bugs", {
      ...args,
      status: "open",
      reporter,
      assignee: undefined,
      aiAnalysis: undefined,
      suggestedFix: undefined,
    });
  },
});

export const updateBug = mutation({
  args: {
    id: v.id("bugs"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.union(v.literal("open"), v.literal("in-progress"), v.literal("resolved"), v.literal("closed"))),
    assignee: v.optional(v.string()),
    severity: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical"))),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to update bugs");
    }

    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const deleteBug = mutation({
  args: { id: v.id("bugs") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to delete bugs");
    }

    await ctx.db.delete(args.id);
  },
});

export const updateBugStatus = mutation({
  args: {
    id: v.id("bugs"),
    status: v.union(v.literal("open"), v.literal("in-progress"), v.literal("resolved"), v.literal("closed")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to update bugs");
    }

    await ctx.db.patch(args.id, {
      status: args.status,
    });
  },
});

export const searchBugs = query({
  args: {
    searchTerm: v.string(),
    status: v.optional(v.union(v.literal("open"), v.literal("in-progress"), v.literal("resolved"), v.literal("closed"))),
  },
  handler: async (ctx, args) => {
    let searchQuery = ctx.db.query("bugs").withSearchIndex("search_bugs", (q) => 
      q.search("title", args.searchTerm)
    );

    if (args.status) {
      searchQuery = searchQuery.filter((q) => q.eq(q.field("status"), args.status!));
    }

    return await searchQuery.take(20);
  },
});

export const getAssignees = query({
  args: {},
  handler: async (ctx) => {
    const bugs = await ctx.db.query("bugs").collect();
    const assignees = [...new Set(bugs.map(bug => bug.assignee).filter(Boolean))];
    return assignees;
  },
});

export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const bugs = await ctx.db.query("bugs").collect();
    
    return {
      total: bugs.length,
      open: bugs.filter(bug => bug.status === "open").length,
      inProgress: bugs.filter(bug => bug.status === "in-progress").length,
      resolved: bugs.filter(bug => bug.status === "resolved").length,
      closed: bugs.filter(bug => bug.status === "closed").length,
      unassigned: bugs.filter(bug => !bug.assignee).length,
      critical: bugs.filter(bug => bug.severity === "critical").length,
      missingStatus: bugs.filter(bug => !bug.status).length,
      missingAssignee: bugs.filter(bug => !bug.assignee).length,
    };
  },
});

export const detectDuplicates = query({
  args: {},
  handler: async (ctx) => {
    const bugs = await ctx.db.query("bugs").collect();
    const duplicates = [];
    
    // Check for duplicate titles
    const titleGroups = bugs.reduce((acc, bug) => {
      const title = bug.title.toLowerCase().trim();
      if (!acc[title]) acc[title] = [];
      acc[title].push(bug);
      return acc;
    }, {} as Record<string, any[]>);
    
    for (const [title, bugGroup] of Object.entries(titleGroups)) {
      if (bugGroup.length > 1) {
        duplicates.push({
          type: "title",
          value: title,
          bugs: bugGroup.map(b => ({ id: b._id, title: b.title })),
        });
      }
    }
    
    // Check for similar descriptions (basic similarity check)
    for (let i = 0; i < bugs.length; i++) {
      for (let j = i + 1; j < bugs.length; j++) {
        const desc1 = bugs[i].description.toLowerCase();
        const desc2 = bugs[j].description.toLowerCase();
        
        // Simple similarity check - if descriptions are very similar
        if (desc1.length > 50 && desc2.length > 50) {
          const similarity = calculateSimilarity(desc1, desc2);
          if (similarity > 0.8) {
            duplicates.push({
              type: "description",
              value: "Similar descriptions",
              bugs: [
                { id: bugs[i]._id, title: bugs[i].title },
                { id: bugs[j]._id, title: bugs[j].title }
              ],
              similarity,
            });
          }
        }
      }
    }
    
    return duplicates;
  },
});

// Helper function for basic text similarity
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = str1.split(/\s+/);
  const words2 = str2.split(/\s+/);
  const allWords = new Set([...words1, ...words2]);
  
  let matches = 0;
  for (const word of allWords) {
    if (words1.includes(word) && words2.includes(word)) {
      matches++;
    }
  }
  
  return matches / allWords.size;
}
