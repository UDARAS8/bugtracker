import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface TestCaseListProps {
  limit?: number;
}

export function TestCaseList({ limit }: TestCaseListProps) {
  const testCases = useQuery(api.testCases.listTestCases, {});
  const updateTestStatus = useMutation(api.testCases.updateTestStatus);

  const displayTests = limit ? testCases?.slice(0, limit) : testCases;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pass": return "bg-green-100 text-green-800";
      case "fail": return "bg-red-100 text-red-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleStatusChange = async (testId: Id<"testCases">, newStatus: "pass" | "fail" | "pending") => {
    await updateTestStatus({ id: testId, status: newStatus });
  };

  if (!testCases) {
    return <div className="animate-pulse">Loading test cases...</div>;
  }

  if (testCases.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No test cases created yet. Start by creating your first test case!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {displayTests?.map((test) => (
        <div key={test._id} className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">{test.name}</h3>
              <p className="text-gray-600 text-sm mb-2">{test.description}</p>
              <div className="flex flex-wrap gap-2 mb-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(test.status)}`}>
                  {test.status}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(test.priority)}`}>
                  {test.priority} priority
                </span>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {test.category}
                </span>
                {test.automated && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Automated
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2 ml-4">
              <select
                value={test.status}
                onChange={(e) => handleStatusChange(test._id, e.target.value as any)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="pending">Pending</option>
                <option value="pass">Pass</option>
                <option value="fail">Fail</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-2">
            <div>
              <h4 className="font-medium text-gray-700 text-sm">Steps:</h4>
              <ol className="list-decimal list-inside text-sm text-gray-600 ml-2">
                {test.steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 text-sm">Expected Result:</h4>
              <p className="text-sm text-gray-600 ml-2">{test.expectedResult}</p>
            </div>
          </div>
          
          <div className="text-xs text-gray-500 mt-2">
            {test.lastRun && `Last run: ${new Date(test.lastRun).toLocaleDateString()}`}
            {!test.lastRun && "Never run"}
          </div>
        </div>
      ))}
    </div>
  );
}
