/**
 * Project-Specific Sprint Page
 *
 * Shows sprint timeline for a single project.
 * Accessed from "All Projects" when clicking on a project.
 */

import SprintTimeline from '@/components/SprintTimeline';
import { ProjectSprintHeader } from './ProjectSprintHeader';

interface ProjectSprintsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: ProjectSprintsPageProps) {
  const { id } = await params;
  return {
    title: `Sprints - ${id} | Alex AI`,
    description: `Sprint timeline for ${id}`
  };
}

export default async function ProjectSprintsPage({ params }: ProjectSprintsPageProps) {
  const { id: projectId } = await params;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <ProjectSprintHeader projectId={projectId} />

      {/* Sprint Timeline */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SprintTimeline
          projectId={projectId}
          viewMode="full"
          showFilters={true}
        />
      </div>

      {/* Project Sprint Stats */}
      <ProjectSprintStats projectId={projectId} />
    </div>
  );
}

// Project Sprint Stats
interface ProjectSprintStatsProps {
  projectId: string;
}

function ProjectSprintStats({ projectId }: ProjectSprintStatsProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sprint Velocity Chart */}
        <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Sprint Velocity Trend</h3>
          <div className="h-48 flex items-center justify-center text-gray-400">
            Velocity chart coming soon...
          </div>
        </div>

        {/* Crew Workload */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Crew Capacity</h3>
          <div className="space-y-2">
            <div className="text-sm text-gray-600">
              Current sprint workload distribution
            </div>
            <div className="h-32 flex items-center justify-center text-gray-400">
              Workload chart coming soon...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
