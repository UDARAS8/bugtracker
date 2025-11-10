import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { BugList } from "./BugList";
import { TestCaseList } from "./TestCaseList";
import { CreateBugForm } from "./CreateBugForm";
import { CreateTestForm } from "./CreateTestForm";
import { AIInsights } from "./AIInsights";
import { QAReports } from "./QAReports";
import { AIScanner } from "./AIScanner";
import { ExportTools } from "./ExportTools";

type Tab = "dashboard" | "bugs" | "tests" | "reports" | "ai-insights" | "ai-scanner";

export function QADashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [showCreateBug, setShowCreateBug] = useState(false);
  const [showCreateTest, setShowCreateTest] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");

  const stats = useQuery(api.bugs.getDashboardStats);
  const bugs = useQuery(api.bugs.listBugs, {});
  const testCases = useQuery(api.testCases.listTestCases, {});
  const assignees = useQuery(api.bugs.getAssignees);

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "bugs", label: "Bugs", icon: "🐛" },
    { id: "tests", label: "Test Cases", icon: "🧪" },
    { id: "ai-scanner", label: "AI Scanner", icon: "🔍" },
    { id: "reports", label: "Reports", icon: "📋" },
    { id: "ai-insights", label: "AI Insights", icon: "🤖" },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Dashboard Overview */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats?.total || 0}</div>
                <div className="text-sm text-gray-500">Total Bugs</div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats?.open || 0}</div>
                <div className="text-sm text-gray-500">Open</div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats?.inProgress || 0}</div>
                <div className="text-sm text-gray-500">In Progress</div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats?.resolved || 0}</div>
                <div className="text-sm text-gray-500">Resolved</div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats?.unassigned || 0}</div>
                <div className="text-sm text-gray-500">Unassigned</div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats?.critical || 0}</div>
                <div className="text-sm text-gray-500">Critical</div>
              </div>
            </div>
          </div>

          {/* Validation Issues Alert */}
          {(stats?.missingStatus || stats?.missingAssignee) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <span className="text-yellow-600 text-xl mr-3">⚠️</span>
                <div>
                  <h3 className="font-medium text-yellow-800">Validation Issues Detected</h3>
                  <p className="text-yellow-700 text-sm">
                    {stats?.missingAssignee} bugs without assignee, {stats?.missingStatus} bugs without status.
                    <button 
                      onClick={() => setActiveTab("ai-scanner")}
                      className="ml-2 text-yellow-800 underline hover:text-yellow-900"
                    >
                      Run AI Scanner →
                    </button>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Export Tools */}
          <ExportTools />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Bugs</h3>
              <BugList limit={5} />
            </div>
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Test Cases</h3>
              <TestCaseList limit={5} />
            </div>
          </div>
        </div>
      )}

      {/* Bugs Tab */}
      {activeTab === "bugs" && (
        <div className="space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-900">Bug Management</h2>
            <div className="flex flex-wrap gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border rounded px-3 py-2 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              
              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="border rounded px-3 py-2 text-sm"
              >
                <option value="">All Assignees</option>
                <option value="unassigned">Unassigned</option>
                {assignees?.map(assignee => (
                  <option key={assignee} value={assignee}>{assignee}</option>
                ))}
              </select>
              
              <button
                onClick={() => setShowCreateBug(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Report New Bug
              </button>
            </div>
          </div>
          
          {showCreateBug && (
            <CreateBugForm onClose={() => setShowCreateBug(false)} />
          )}
          
          <BugList statusFilter={statusFilter} assigneeFilter={assigneeFilter} />
        </div>
      )}

      {/* Test Cases Tab */}
      {activeTab === "tests" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Test Case Management</h2>
            <button
              onClick={() => setShowCreateTest(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Test Case
            </button>
          </div>
          {showCreateTest && (
            <CreateTestForm onClose={() => setShowCreateTest(false)} />
          )}
          <TestCaseList />
        </div>
      )}

      {/* AI Scanner Tab */}
      {activeTab === "ai-scanner" && <AIScanner />}

      {/* Reports Tab */}
      {activeTab === "reports" && <QAReports />}

      {/* AI Insights Tab */}
      {activeTab === "ai-insights" && <AIInsights />}
    </div>
  );
}
