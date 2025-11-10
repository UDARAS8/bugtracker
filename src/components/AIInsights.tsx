import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

export function AIInsights() {
  const generateQAReport = useAction(api.aiAgent.generateQAReport);
  const suggestTestCases = useAction(api.aiAgent.suggestTestCases);
  
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isGeneratingTests, setIsGeneratingTests] = useState(false);
  const [reportResult, setReportResult] = useState<string | null>(null);
  const [testSuggestions, setTestSuggestions] = useState<any>(null);
  const [featureInput, setFeatureInput] = useState({
    feature: "",
    description: "",
  });

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const result = await generateQAReport();
      setReportResult(result.insights);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleSuggestTests = async () => {
    if (!featureInput.feature || !featureInput.description) return;
    
    setIsGeneratingTests(true);
    try {
      const result = await suggestTestCases(featureInput);
      setTestSuggestions(result);
    } finally {
      setIsGeneratingTests(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">AI-Powered QA Insights</h2>
        <p className="text-gray-600 mb-6">
          Get intelligent analysis and recommendations for your QA processes using AI.
        </p>
      </div>

      {/* Generate QA Report */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">📊 Generate QA Report</h3>
        <p className="text-gray-600 mb-4">
          Get an AI-generated analysis of your current QA status, including bug trends, test coverage, and recommendations.
        </p>
        <button
          onClick={handleGenerateReport}
          disabled={isGeneratingReport}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isGeneratingReport ? "🤖 Generating Report..." : "🤖 Generate QA Report"}
        </button>
        
        {reportResult && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">AI-Generated QA Report</h4>
            <div className="text-blue-800 text-sm whitespace-pre-wrap">{reportResult}</div>
          </div>
        )}
      </div>

      {/* Test Case Suggestions */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">🧪 AI Test Case Suggestions</h3>
        <p className="text-gray-600 mb-4">
          Describe a feature and get AI-generated test case suggestions covering various scenarios.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Feature Name
            </label>
            <input
              type="text"
              value={featureInput.feature}
              onChange={(e) => setFeatureInput(prev => ({ ...prev, feature: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., User Login, Shopping Cart, File Upload"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Feature Description
            </label>
            <textarea
              value={featureInput.description}
              onChange={(e) => setFeatureInput(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Describe the feature functionality, user interactions, and expected behavior..."
            />
          </div>
          
          <button
            onClick={handleSuggestTests}
            disabled={isGeneratingTests || !featureInput.feature || !featureInput.description}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {isGeneratingTests ? "🤖 Generating Suggestions..." : "🤖 Suggest Test Cases"}
          </button>
        </div>
        
        {testSuggestions && (
          <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h4 className="font-medium text-purple-900 mb-2">AI-Generated Test Case Suggestions</h4>
            {Array.isArray(testSuggestions) ? (
              <div className="space-y-3">
                {testSuggestions.map((test: any, index: number) => (
                  <div key={index} className="bg-white p-3 rounded border">
                    <h5 className="font-medium text-gray-900">{test.name}</h5>
                    <p className="text-sm text-gray-600 mb-2">{test.description}</p>
                    <div className="text-xs">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">
                        {test.priority} priority
                      </span>
                      <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                        {test.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-purple-800 text-sm whitespace-pre-wrap">
                {testSuggestions.rawSuggestions || JSON.stringify(testSuggestions, null, 2)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI Tips */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">💡 AI QA Tips</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p>• Use the AI analysis feature on critical bugs to get deeper insights and suggested fixes</p>
          <p>• Generate regular QA reports to track quality trends and identify improvement areas</p>
          <p>• Leverage AI test case suggestions when implementing new features</p>
          <p>• Review AI recommendations alongside your domain expertise for best results</p>
        </div>
      </div>
    </div>
  );
}
