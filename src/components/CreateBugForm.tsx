import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface CreateBugFormProps {
  onClose: () => void;
}

export function CreateBugForm({ onClose }: CreateBugFormProps) {
  const createBug = useMutation(api.bugs.createBug);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    severity: "medium" as "low" | "medium" | "high" | "critical",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    environment: "",
    steps: [""],
    expectedResult: "",
    actualResult: "",
    tags: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const steps = formData.steps.filter(step => step.trim() !== "");
    const tags = formData.tags.split(",").map(tag => tag.trim()).filter(tag => tag !== "");
    
    await createBug({
      ...formData,
      steps,
      tags,
    });
    
    onClose();
  };

  const addStep = () => {
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, ""]
    }));
  };

  const updateStep = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.map((step, i) => i === index ? value : step)
    }));
  };

  const removeStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Report New Bug</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief description of the bug"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Detailed description of the bug"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Severity *
              </label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData(prev => ({ ...prev, severity: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority *
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Environment *
            </label>
            <input
              type="text"
              required
              value={formData.environment}
              onChange={(e) => setFormData(prev => ({ ...prev, environment: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Chrome 120, Windows 11, Production"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Steps to Reproduce *
            </label>
            {formData.steps.map((step, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={step}
                  onChange={(e) => updateStep(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`Step ${index + 1}`}
                />
                {formData.steps.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeStep(index)}
                    className="px-3 py-2 text-red-600 hover:text-red-800"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addStep}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              + Add Step
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expected Result *
            </label>
            <textarea
              required
              value={formData.expectedResult}
              onChange={(e) => setFormData(prev => ({ ...prev, expectedResult: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="What should happen"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Actual Result *
            </label>
            <textarea
              required
              value={formData.actualResult}
              onChange={(e) => setFormData(prev => ({ ...prev, actualResult: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="What actually happens"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ui, login, payment (comma-separated)"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Report Bug
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
