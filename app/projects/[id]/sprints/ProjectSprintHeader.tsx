'use client';

/**
 * Project Sprint Header Component
 * Client component to handle interactive elements in the header
 */

interface ProjectSprintHeaderProps {
  projectId: string;
}

export function ProjectSprintHeader({ projectId }: ProjectSprintHeaderProps) {
  const handleCreateSprint = () => {
    // TODO: Open create sprint modal
    console.log('Create sprint for project:', projectId);
  };

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            {/* Breadcrumb */}
            <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
              <a href="/projects" className="hover:text-blue-600">
                All Projects
              </a>
              <span>/</span>
              <span className="text-gray-900 font-medium">{projectId}</span>
              <span>/</span>
              <span className="text-gray-900 font-medium">Sprints</span>
            </nav>

            <h1 className="text-3xl font-bold text-gray-900">
              🎯 {projectId} - Sprints
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Sprint timeline and story management
            </p>
          </div>

          <div className="flex gap-2">
            <a
              href={`/api/sprints?project_id=${projectId}&include_stories=true`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
            >
              View API Data
            </a>

            <button
              onClick={handleCreateSprint}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              + New Sprint
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
