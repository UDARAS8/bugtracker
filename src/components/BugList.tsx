import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";

interface BugListProps {
  limit?: number;
  statusFilter?: string;
  assigneeFilter?: string;
}

export function BugList({ limit, statusFilter, assigneeFilter }: BugListProps) {
  const validStatus = statusFilter && statusFilter !== "" ? 
    statusFilter as "open" | "in-progress" | "resolved" | "closed" : 
    undefined;
  const validAssignee = assigneeFilter && assigneeFilter !== "" ? assigneeFilter : undefined;
  
  const bugs = useQuery(api.bugs.listBugs, { 
    status: validStatus,
    assignee: validAssignee
  });
  const updateBug = useMutation(api.bugs.updateBug);
  const deleteBug = useMutation(api.bugs.deleteBug);
  const analyzeBug = useAction(api.aiAgent.analyzeBug);
  const suggestAssigneeAndStatus = useAction(api.aiAgent.suggestAssigneeAndStatus);
  const generateBugSummary = useAction(api.aiAgent.generateBugSummary);
  
  const [analyzingBug, setAnalyzingBug] = useState<Id<"bugs"> | null>(null);
  const [suggestingFor, setSuggestingFor] = useState<Id<"bugs"> | null>(null);
  const [generatingSummary, setGeneratingSummary] = useState<Id<"bugs"> | null>(null);
  const [editingBug, setEditingBug] = useState<Id<"bugs"> | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    assignee: "",
  });

  const displayBugs = limit ? bugs?.slice(0, limit) : bugs;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-100 text-red-800 border-red-200";
      case "high": return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-red-100 text-red-800 border-red-200";
      case "in-progress": return "bg-blue-100 text-blue-800 border-blue-200";
      case "resolved": return "bg-green-100 text-green-800 border-green-200";
      case "closed": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const hasValidationIssues = (bug: any) => {
    const issues = [];
    if (!bug.title || bug.title.trim().length < 5) issues.push("Title too short");
    if (!bug.description || bug.description.trim().length < 10) issues.push("Description too brief");
    if (!bug.assignee) issues.push("No assignee");
    if (!bug.status) issues.push("No status");
    return issues;
  };

  const handleStatusChange = async (bugId: Id<"bugs">, newStatus: "open" | "in-progress" | "resolved" | "closed") => {
    await updateBug({ id: bugId, status: newStatus });
  };

  const handleAssigneeChange = async (bugId: Id<"bugs">, newAssignee: string) => {
    await updateBug({ id: bugId, assignee: newAssignee });
  };

  const handleAnalyzeBug = async (bugId: Id<"bugs">) => {
    setAnalyzingBug(bugId);
    try {
      await analyzeBug({ bugId });
    } finally {
      setAnalyzingBug(null);
    }
  };

  const handleSuggestAssigneeAndStatus = async (bugId: Id<"bugs">) => {
    setSuggestingFor(bugId);
    try {
      const suggestions = await suggestAssigneeAndStatus({ bugId });
      console.log("AI Suggestions:", suggestions);
      // You could auto-apply suggestions or show them to the user
    } finally {
      setSuggestingFor(null);
    }
  };

  const handleGenerateSummary = async (bugId: Id<"bugs">) => {
    setGeneratingSummary(bugId);
    try {
      const summary = await generateBugSummary({ bugId });
      console.log("Generated Summary:", summary);
      // You could update the bug description or show the summary
    } finally {
      setGeneratingSummary(null);
    }
  };

  const handleDeleteBug = async (bugId: Id<"bugs">) => {
    if (confirm("Are you sure you want to delete this bug?")) {
      await deleteBug({ id: bugId });
    }
  };

  const startEditing = (bug: any) => {
    setEditingBug(bug._id);
    setEditForm({
      title: bug.title,
      description: bug.description,
      assignee: bug.assignee || "",
    });
  };

  const saveEdit = async () => {
    if (editingBug) {
      await updateBug({
        id: editingBug,
        title: editForm.title,
        description: editForm.description,
        assignee: editForm.assignee || undefined,
      });
      setEditingBug(null);
    }
  };

  const cancelEdit = () => {
    setEditingBug(null);
    setEditForm({ title: "", description: "", assignee: "" });
  };

  if (!bugs) {
    return <div className="animate-pulse">Loading bugs...</div>;
  }

  if (bugs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No bugs reported yet. Great job! 🎉
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {displayBugs?.map((bug) => {
        const validationIssues = hasValidationIssues(bug);
        const hasIssues = validationIssues.length > 0;
        
        return (
          <div 
            key={bug._id} 
            className={`bg-white border rounded-lg p-4 shadow-sm ${
              hasIssues ? 'border-l-4 border-l-red-400 bg-red-50' : ''
            }`}
          >
            {/* Validation Issues Alert */}
            {hasIssues && (
              <div className="mb-3 p-2 bg-red-100 border border-red-200 rounded text-sm">
                <span className="font-medium text-red-800">⚠️ Issues: </span>
                <span className="text-red-700">{validationIssues.join(", ")}</span>
              </div>
            )}

            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                {editingBug === bug._id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-2 py-1 border rounded text-lg font-semibold"
                      placeholder="Bug title"
                    />
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-2 py-1 border rounded text-sm"
                      rows={3}
                      placeholder="Bug description"
                    />
                    <input
                      type="text"
                      value={editForm.assignee}
                      onChange={(e) => setEditForm(prev => ({ ...prev, assignee: e.target.value }))}
                      className="w-full px-2 py-1 border rounded text-sm"
                      placeholder="Assignee email"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={saveEdit}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="font-semibold text-gray-900 mb-1">{bug.title}</h3>
                    <p className="text-gray-600 text-sm mb-2">{bug.description}</p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(bug.severity)}`}>
                        {bug.severity}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(bug.status)}`}>
                        {bug.status}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                        {bug.priority} priority
                      </span>
                      {bug.assignee && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                          👤 {bug.assignee}
                        </span>
                      )}
                    </div>
                    {bug.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {bug.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded border border-blue-200">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
              
              {editingBug !== bug._id && (
                <div className="flex flex-wrap gap-2 ml-4">
                  <button
                    onClick={() => handleAnalyzeBug(bug._id)}
                    disabled={analyzingBug === bug._id}
                    className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 disabled:opacity-50"
                  >
                    {analyzingBug === bug._id ? "🤖 Analyzing..." : "🤖 Analyze"}
                  </button>
                  
                  <button
                    onClick={() => handleSuggestAssigneeAndStatus(bug._id)}
                    disabled={suggestingFor === bug._id}
                    className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {suggestingFor === bug._id ? "🎯 Suggesting..." : "🎯 Suggest"}
                  </button>
                  
                  <button
                    onClick={() => handleGenerateSummary(bug._id)}
                    disabled={generatingSummary === bug._id}
                    className="bg-teal-600 text-white px-3 py-1 rounded text-sm hover:bg-teal-700 disabled:opacity-50"
                  >
                    {generatingSummary === bug._id ? "📝 Generating..." : "📝 Summary"}
                  </button>
                  
                  <button
                    onClick={() => startEditing(bug)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    ✏️ Edit
                  </button>
                  
                  <select
                    value={bug.status}
                    onChange={(e) => handleStatusChange(bug._id, e.target.value as any)}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                  
                  <input
                    type="text"
                    value={bug.assignee || ""}
                    onChange={(e) => handleAssigneeChange(bug._id, e.target.value)}
                    placeholder="Assign to..."
                    className="border rounded px-2 py-1 text-sm w-32"
                  />
                  
                  <button
                    onClick={() => handleDeleteBug(bug._id)}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>
            
            {bug.aiAnalysis && (
              <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded">
                <h4 className="font-medium text-purple-900 mb-2">🤖 AI Analysis</h4>
                <p className="text-purple-800 text-sm whitespace-pre-wrap">{bug.aiAnalysis}</p>
              </div>
            )}
            
            <div className="text-xs text-gray-500 mt-2">
              Reported by {bug.reporter} • {new Date(bug._creationTime).toLocaleDateString()}
            </div>
          </div>
        );
      })}
    </div>
  );
}
