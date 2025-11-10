import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function ExportTools() {
  const bugs = useQuery(api.bugs.listBugs, {});
  const testCases = useQuery(api.testCases.listTestCases, {});
  const reports = useQuery(api.reports.listReports);

  const exportToCSV = (data: any[], filename: string, headers: string[]) => {
    if (!data || data.length === 0) {
      alert("No data to export");
      return;
    }

    const csvContent = [
      headers.join(","),
      ...data.map(row => 
        headers.map(header => {
          const value = getNestedValue(row, header);
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(",")
      )
    ].join("\n");

    downloadFile(csvContent, `${filename}.csv`, "text/csv");
  };

  const exportToJSON = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      alert("No data to export");
      return;
    }

    const jsonContent = JSON.stringify(data, null, 2);
    downloadFile(jsonContent, `${filename}.json`, "application/json");
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  const bugHeaders = [
    "_id", "title", "description", "status", "severity", "priority", 
    "assignee", "reporter", "environment", "_creationTime"
  ];

  const testHeaders = [
    "_id", "name", "description", "category", "priority", "status", 
    "automated", "lastRun", "_creationTime"
  ];

  const reportHeaders = [
    "_id", "title", "bugsFound", "testsRun", "testsPassed", 
    "testsFailed", "coverage", "reportDate", "generatedBy"
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">📤 Export Tools</h3>
      <p className="text-gray-600 mb-4">
        Export your QA data for external analysis, reporting, or backup purposes.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Bugs Export */}
        <div className="p-4 border rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">🐛 Bugs</h4>
          <p className="text-sm text-gray-600 mb-3">
            Export all bug reports with details
          </p>
          <div className="space-y-2">
            <button
              onClick={() => exportToCSV(bugs || [], "bugs", bugHeaders)}
              className="w-full bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700"
            >
              Export as CSV
            </button>
            <button
              onClick={() => exportToJSON(bugs || [], "bugs")}
              className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
            >
              Export as JSON
            </button>
          </div>
        </div>

        {/* Test Cases Export */}
        <div className="p-4 border rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">🧪 Test Cases</h4>
          <p className="text-sm text-gray-600 mb-3">
            Export all test cases and results
          </p>
          <div className="space-y-2">
            <button
              onClick={() => exportToCSV(testCases || [], "test-cases", testHeaders)}
              className="w-full bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700"
            >
              Export as CSV
            </button>
            <button
              onClick={() => exportToJSON(testCases || [], "test-cases")}
              className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
            >
              Export as JSON
            </button>
          </div>
        </div>

        {/* Reports Export */}
        <div className="p-4 border rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">📋 QA Reports</h4>
          <p className="text-sm text-gray-600 mb-3">
            Export generated QA reports
          </p>
          <div className="space-y-2">
            <button
              onClick={() => exportToCSV(reports || [], "qa-reports", reportHeaders)}
              className="w-full bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700"
            >
              Export as CSV
            </button>
            <button
              onClick={() => exportToJSON(reports || [], "qa-reports")}
              className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
            >
              Export as JSON
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
        <p className="text-blue-800">
          <strong>💡 Tip:</strong> CSV files can be opened in Excel or Google Sheets. 
          JSON files are better for programmatic analysis or importing into other systems.
        </p>
      </div>
    </div>
  );
}
