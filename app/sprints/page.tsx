/**
 * All Active Sprints Page
 *
 * Global view of all active sprints across all projects.
 * Shows horizontal timeline with filtering and real-time updates.
 */

import SprintTimeline from '@/components/SprintTimeline';

export const metadata = {
  title: 'All Active Sprints | Alex AI',
  description: 'View and manage all active sprints across your projects'
};

export default function SprintsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🚀 All Active Sprints
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                View and manage sprints across all your projects
              </p>
            </div>

            <a
              href="/api/sprints?status=active&include_stories=true"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
            >
              View API Data
            </a>
          </div>
        </div>
      </div>

      {/* Sprint Timeline */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SprintTimeline
          viewMode="full"
          showFilters={true}
        />
      </div>

      {/* Quick Stats */}
      <QuickStats />
    </div>
  );
}

// Quick Stats Component
function QuickStats() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Sprint Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            label="Active Sprints"
            value="--"
            color="blue"
          />
          <StatCard
            label="Total Story Points"
            value="--"
            color="green"
          />
          <StatCard
            label="Completed Points"
            value="--"
            color="purple"
          />
          <StatCard
            label="Avg Velocity"
            value="--"
            color="orange"
          />
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

function StatCard({ label, value, color }: StatCardProps) {
  const colors = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    purple: 'bg-purple-100 text-purple-800',
    orange: 'bg-orange-100 text-orange-800'
  };

  return (
    <div className={`rounded-lg p-4 ${colors[color]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm">{label}</div>
    </div>
  );
}
