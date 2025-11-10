import { useState } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

export function AIScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<any>(null);
  
  const duplicates = useQuery(api.bugs.detectDuplicates);
  const scanAllBugs = useAction(api.aiAgent.scanAllBugs);

  const handleScanAllBugs = async () => {
    setIsScanning(true);
    try {
      const results = await scanAllBugs();
      setScanResults(results);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">AI Bug Scanner</h2>
        <p className="text-gray-600 mb-6">
          Comprehensive AI-powered analysis to detect issues, duplicates, and provide recommendations for your bug reports.
        </p>
      </div>

      {/* Scan Controls */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Full Bug Analysis</h3>
            <p className="text-gray-600 text-sm">
              Scan all bugs for missing information, duplicates, and get AI recommendations
            </p>
          </div>
          <button
            onClick={handleScanAllBugs}
            disabled={isScanning}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {isScanning ? "🔍 Scanning..." : "🔍 Run Full Scan"}
          </button>
        </div>
      </div>

      {/* Duplicate Detection Results */}
      {duplicates && duplicates.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🔍 Duplicate Detection ({duplicates.length} found)
          </h3>
          <div className="space-y-4">
            {duplicates.map((duplicate, index) => (
              <div key={index} className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                <div className="flex items-center mb-2">
                  <span className="font-medium text-yellow-800">
                    {duplicate.type === "title" ? "📝 Duplicate Titles" : "📄 Similar Descriptions"}
                  </span>
                  {duplicate.similarity && (
                    <span className="ml-2 text-sm text-yellow-600">
                      ({Math.round(duplicate.similarity * 100)}% similar)
                    </span>
                  )}
                </div>
                <div className="text-sm text-yellow-700 mb-2">
                  Pattern: "{duplicate.value}"
                </div>
                <div className="space-y-1">
                  {duplicate.bugs.map((bug: any, bugIndex: number) => (
                    <div key={bugIndex} className="text-sm text-gray-700">
                      • {bug.title} (ID: {bug.id})
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scan Results */}
      {scanResults && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Scan Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded">
                <div className="text-2xl font-bold text-blue-600">{scanResults.totalBugs}</div>
                <div className="text-sm text-gray-600">Total Bugs</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded">
                <div className="text-2xl font-bold text-red-600">{scanResults.summary.totalIssues}</div>
                <div className="text-sm text-gray-600">Issues Found</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded">
                <div className="text-2xl font-bold text-yellow-600">{scanResults.summary.duplicateCount}</div>
                <div className="text-sm text-gray-600">Duplicates</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded">
                <div className="text-2xl font-bold text-orange-600">{scanResults.summary.unassignedCount}</div>
                <div className="text-sm text-gray-600">Unassigned</div>
              </div>
            </div>
          </div>

          {/* Issues Found */}
          {scanResults.issues.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                ⚠️ Validation Issues ({scanResults.issues.length})
              </h3>
              <div className="space-y-3">
                {scanResults.issues.map((issue: any, index: number) => (
                  <div key={index} className="p-3 bg-red-50 border border-red-200 rounded">
                    <div className="font-medium text-red-800 mb-1">{issue.title}</div>
                    <div className="text-sm text-red-700">
                      Issues: {issue.issues.join(", ")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Recommendations */}
          {scanResults.aiRecommendations && (
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🤖 AI Recommendations</h3>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                <div className="text-blue-800 text-sm whitespace-pre-wrap">
                  {scanResults.aiRecommendations}
                </div>
              </div>
            </div>
          )}

          {/* Duplicates from Scan */}
          {scanResults.duplicates.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                🔍 Detected Duplicates ({scanResults.duplicates.length})
              </h3>
              <div className="space-y-3">
                {scanResults.duplicates.map((duplicate: any, index: number) => (
                  <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <div className="font-medium text-yellow-800 mb-1">
                      {duplicate.type === "title" ? "Duplicate Titles" : "Similar Descriptions"}
                    </div>
                    <div className="text-sm text-yellow-700">
                      Pattern: "{duplicate.value}"
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Affects {duplicate.bugs.length} bugs
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tips */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">💡 AI Scanner Tips</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p>• Run regular scans to maintain bug report quality</p>
          <p>• Address validation issues to improve team efficiency</p>
          <p>• Review duplicate suggestions to consolidate similar bugs</p>
          <p>• Use AI recommendations to improve your QA processes</p>
          <p>• Export scan results for team reviews and process improvements</p>
        </div>
      </div>
    </div>
  );
}
