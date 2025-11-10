import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { internal } from "./_generated/api";
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.CONVEX_OPENAI_BASE_URL,
  apiKey: process.env.CONVEX_OPENAI_API_KEY,
});

export const analyzeBug = action({
  args: { bugId: v.id("bugs") },
  handler: async (ctx, args): Promise<string | null> => {
    const bug = await ctx.runQuery(api.bugs.getBug, { id: args.bugId });
    if (!bug) {
      throw new Error("Bug not found");
    }

    const prompt: string = `
Analyze this QA bug report and provide insights:

Title: ${bug.title}
Description: ${bug.description}
Severity: ${bug.severity}
Priority: ${bug.priority}
Environment: ${bug.environment}

Steps to reproduce:
${bug.steps.map((step: string, i: number) => `${i + 1}. ${step}`).join('\n')}

Expected Result: ${bug.expectedResult}
Actual Result: ${bug.actualResult}
Tags: ${bug.tags.join(', ')}

Please provide:
1. Root cause analysis
2. Potential impact assessment
3. Suggested fix or workaround
4. Prevention strategies
5. Related areas to test

Keep your response concise but comprehensive.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const analysis: string | null = response.choices[0].message.content;
    
    // Update the bug with AI analysis
    await ctx.runMutation(internal.aiAgentInternal.updateBugAnalysis, {
      bugId: args.bugId,
      analysis: analysis || "Analysis failed",
    });

    return analysis;
  },
});

export const scanAllBugs = action({
  args: {},
  handler: async (ctx): Promise<any> => {
    const bugs = await ctx.runQuery(api.bugs.listBugs, {});
    const duplicates = await ctx.runQuery(api.bugs.detectDuplicates, {});
    
    const issues = [];
    const suggestions = [];
    
    // Analyze each bug for issues
    for (const bug of bugs) {
      const bugIssues = [];
      
      // Check for missing fields
      if (!bug.title || bug.title.trim().length < 5) {
        bugIssues.push("Title is missing or too short");
      }
      
      if (!bug.description || bug.description.trim().length < 10) {
        bugIssues.push("Description is missing or too brief");
      }
      
      if (!bug.assignee) {
        bugIssues.push("No responsible person assigned");
      }
      
      if (!bug.status) {
        bugIssues.push("Status is missing");
      }
      
      if (bugIssues.length > 0) {
        issues.push({
          bugId: bug._id,
          title: bug.title,
          issues: bugIssues,
        });
      }
    }
    
    // Generate AI suggestions for improvements
    const prompt = `
Analyze this QA bug tracking data and provide recommendations:

Total Bugs: ${bugs.length}
Issues Found:
${issues.map(issue => `- Bug "${issue.title}": ${issue.issues.join(', ')}`).join('\n')}

Duplicates Found: ${duplicates.length}
${duplicates.map(dup => `- ${dup.type}: ${dup.value}`).join('\n')}

Bug Status Distribution:
- Open: ${bugs.filter(b => b.status === 'open').length}
- In Progress: ${bugs.filter(b => b.status === 'in-progress').length}
- Resolved: ${bugs.filter(b => b.status === 'resolved').length}
- Closed: ${bugs.filter(b => b.status === 'closed').length}

Unassigned Bugs: ${bugs.filter(b => !b.assignee).length}

Please provide:
1. Overall quality assessment of bug reports
2. Specific recommendations for improvement
3. Suggested workflow improvements
4. Priority actions to take

Keep it actionable and concise.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const aiRecommendations = response.choices[0].message.content;
    
    return {
      totalBugs: bugs.length,
      issues,
      duplicates,
      aiRecommendations,
      summary: {
        totalIssues: issues.length,
        duplicateCount: duplicates.length,
        unassignedCount: bugs.filter(b => !b.assignee).length,
        missingStatusCount: bugs.filter(b => !b.status).length,
      }
    };
  },
});

export const suggestAssigneeAndStatus = action({
  args: { bugId: v.id("bugs") },
  handler: async (ctx, args): Promise<any> => {
    const bug = await ctx.runQuery(api.bugs.getBug, { id: args.bugId });
    const allBugs = await ctx.runQuery(api.bugs.listBugs, {});
    
    if (!bug) {
      throw new Error("Bug not found");
    }

    // Get existing assignees for suggestions
    const assignees = [...new Set(allBugs.map(b => b.assignee).filter(Boolean))];
    
    const prompt = `
Based on this bug report, suggest the most appropriate status and responsible person:

Bug Details:
Title: ${bug.title}
Description: ${bug.description}
Severity: ${bug.severity}
Priority: ${bug.priority}
Environment: ${bug.environment}
Current Status: ${bug.status || 'Not set'}
Current Assignee: ${bug.assignee || 'Not assigned'}

Available team members who have worked on bugs: ${assignees.join(', ')}

Similar bugs in the system:
${allBugs.filter(b => 
  b.tags.some(tag => bug.tags.includes(tag)) || 
  b.severity === bug.severity
).slice(0, 3).map(b => `- ${b.title} (${b.status}, assigned to ${b.assignee || 'unassigned'})`).join('\n')}

Please suggest:
1. Most appropriate status (open/in-progress/resolved/closed)
2. Best person to assign this to (from available team members or suggest role)
3. Reasoning for your suggestions

Format as JSON: {"suggestedStatus": "status", "suggestedAssignee": "person", "reasoning": "explanation"}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const content = response.choices[0].message.content;
    
    try {
      return JSON.parse(content || "{}");
    } catch (error) {
      return { rawSuggestion: content };
    }
  },
});

export const generateBugSummary = action({
  args: { bugId: v.id("bugs") },
  handler: async (ctx, args): Promise<string | null> => {
    const bug = await ctx.runQuery(api.bugs.getBug, { id: args.bugId });
    if (!bug) {
      throw new Error("Bug not found");
    }

    const prompt = `
Generate a concise, professional summary for this bug report:

Title: ${bug.title}
Description: ${bug.description}
Severity: ${bug.severity}
Priority: ${bug.priority}
Status: ${bug.status}
Environment: ${bug.environment}

Create a 2-3 sentence executive summary that captures:
- What the issue is
- Its impact/severity
- Current status

Keep it under 100 words and professional.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    return response.choices[0].message.content;
  },
});

export const generateQAReport = action({
  args: {},
  handler: async (ctx): Promise<{ reportId: any; insights: string | null }> => {
    const bugs = await ctx.runQuery(api.bugs.listBugs, {});
    const testCases = await ctx.runQuery(api.testCases.listTestCases, {});

    const openBugs: number = bugs.filter((bug: any) => bug.status === "open").length;
    const criticalBugs: number = bugs.filter((bug: any) => bug.severity === "critical").length;
    const passedTests: number = testCases.filter((test: any) => test.status === "pass").length;
    const failedTests: number = testCases.filter((test: any) => test.status === "fail").length;

    const prompt: string = `
Generate a QA report summary based on this data:

Total Bugs: ${bugs.length}
Open Bugs: ${openBugs}
Critical Bugs: ${criticalBugs}

Total Test Cases: ${testCases.length}
Passed Tests: ${passedTests}
Failed Tests: ${failedTests}

Bug Severity Distribution:
- Critical: ${bugs.filter((b: any) => b.severity === "critical").length}
- High: ${bugs.filter((b: any) => b.severity === "high").length}
- Medium: ${bugs.filter((b: any) => b.severity === "medium").length}
- Low: ${bugs.filter((b: any) => b.severity === "low").length}

Please provide:
1. Overall quality assessment
2. Key risk areas
3. Recommendations for improvement
4. Testing priorities
5. Release readiness assessment

Keep it professional and actionable.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const insights: string | null = response.choices[0].message.content;

    // Create QA report
    const reportId = await ctx.runMutation(internal.aiAgentInternal.createQAReport, {
      title: `QA Report - ${new Date().toLocaleDateString()}`,
      summary: insights || "Report generation failed",
      bugsFound: bugs.length,
      testsRun: testCases.length,
      testsPassed: passedTests,
      testsFailed: failedTests,
      coverage: testCases.length > 0 ? Math.round((passedTests / testCases.length) * 100) : 0,
      aiInsights: insights || undefined,
      recommendations: [
        "Focus on critical and high severity bugs",
        "Increase test coverage in failing areas",
        "Review and update test cases regularly",
      ],
    });

    return { reportId, insights };
  },
});

export const suggestTestCases = action({
  args: { 
    feature: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    const prompt: string = `
Generate comprehensive test cases for this feature:

Feature: ${args.feature}
Description: ${args.description}

Please provide 5-8 test cases covering:
1. Happy path scenarios
2. Edge cases
3. Error conditions
4. Boundary testing
5. Integration points

For each test case, provide:
- Test name
- Description
- Steps to execute
- Expected result
- Priority (low/medium/high)
- Category

Format as JSON array with objects containing: name, description, steps (array), expectedResult, priority, category.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
    });

    const content: string | null = response.choices[0].message.content;
    
    try {
      // Try to parse JSON response
      const testCases = JSON.parse(content || "[]");
      return testCases;
    } catch (error) {
      // If JSON parsing fails, return the raw content
      return { rawSuggestions: content };
    }
  },
});
