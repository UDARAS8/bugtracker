import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";

export function QAReports() {
  const reports = useQuery(api.reports.listReports);
  const generateQAReport = useAction(api.aiAgent.generateQAReport);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      await generateQAReport();
    } finally {
      setIsGenerating(false);
    }
  };

  if (!reports) {
    return <div className="animate-pulse">Loading reports...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">QA Reports</h2>
          <p className="text-gray-600">AI-generated quality assurance reports and insights</p>
        </div>
        <button
          onClick={handleGenerateReport}
          disabled={isGenerating}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isGenerating ? "🤖 Generating..." : "🤖 Generate New Report"}
        </button>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Yet</h3>
          <p className="text-gray-600 mb-4">Generate your first AI-powered QA report to get insights.</p>
          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isGenerating ? "🤖 Generating..." : "🤖 Generate First Report"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report._id} className="bg-white p-6 rounded-lg shadow border">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{report.title}</h3>
                  <p className="text-sm text-gray-500">
                    Generated on {new Date(report.reportDate).toLocaleDateString()} by {report.generatedBy}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{report.coverage}%</div>
                  <div className="text-sm text-gray-500">Test Coverage</div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-xl font-semibold text-gray-900">{report.bugsFound}</div>
                  <div className="text-sm text-gray-600">Bugs Found</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-xl font-semibold text-gray-900">{report.testsRun}</div>
                  <div className="text-sm text-gray-600">Tests Run</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded">
                  <div className="text-xl font-semibold text-green-600">{report.testsPassed}</div>
                  <div className="text-sm text-gray-600">Tests Passed</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded">
                  <div className="text-xl font-semibold text-red-600">{report.testsFailed}</div>
                  <div className="text-sm text-gray-600">Tests Failed</div>
                </div>
              </div>

              {report.aiInsights && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
                  <h4 className="font-medium text-blue-900 mb-2">🤖 AI Insights</h4>
                  <div className="text-blue-800 text-sm whitespace-pre-wrap">{report.aiInsights}</div>
                </div>
              )}

              {report.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">📝 Recommendations</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    {report.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
