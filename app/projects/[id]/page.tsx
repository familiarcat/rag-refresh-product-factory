"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Project,
  ProjectDomain,
  getScoreColor,
  getScoreLabel,
  getStatusColor,
  getStatusIcon,
  ProjectStatus,
} from "../../../lib/projects";
import { categories } from "../../../lib/categories";
import {
  DomainStatusBar,
  ScoreBar,
  DomainProgressList,
  DomainSummaryStrip,
} from "../../../components/DomainStatusBar";
import { SprintBoard } from "../../../components/SprintBoard";
import { SprintIndicator } from "../../../components/SprintIndicator";

export default function ProjectDashboard() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "sprints" | "domains" | "crew" | "settings"
  >("overview");

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  async function loadProject() {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects?id=${projectId}`);
      const data = await res.json();
      if (data.project) {
        setProject(data.project);
      }
    } catch (error) {
      console.error("Failed to load project:", error);
    } finally {
      setLoading(false);
    }
  }

  async function updateProject(updates: Partial<Project>) {
    if (!project) return;

    setSaving(true);
    try {
      const res = await fetch("/api/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: project.id, ...updates }),
      });
      const data = await res.json();
      if (data.project) {
        setProject(data.project);
      }
    } catch (error) {
      console.error("Failed to update project:", error);
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(status: ProjectStatus) {
    await updateProject({ status });
  }

  function getCategoryDetails() {
    if (!project) return null;
    return categories.find((c) => c.slug === project.primaryCategory);
  }

  if (loading) {
    return (
      <div className="card" style={{ textAlign: "center", padding: 48 }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
        <p style={{ color: "var(--muted)" }}>Loading project...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="card" style={{ textAlign: "center", padding: 48 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>❓</div>
        <h2>Project Not Found</h2>
        <Link href="/projects">
          <button
            style={{
              marginTop: 16,
              padding: "12px 24px",
              background: "var(--accent)",
              border: "none",
              borderRadius: 8,
              color: "white",
              cursor: "pointer",
            }}
          >
            ← Back to Projects
          </button>
        </Link>
      </div>
    );
  }

  const category = getCategoryDetails();

  function ScoreCard({
    label,
    value,
    description,
  }: {
    label: string;
    value: number;
    description?: string;
  }) {
    return (
      <div className="card" style={{ textAlign: "center", padding: 16 }}>
        <div
          style={{
            fontSize: 32,
            fontWeight: "bold",
            color: getScoreColor(value),
            marginBottom: 4,
          }}
        >
          {value}
        </div>
        <div style={{ fontSize: 12, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>
          {getScoreLabel(value)}
        </div>
        {description && (
          <div
            style={{
              fontSize: 10,
              color: "var(--muted)",
              marginTop: 8,
              opacity: 0.7,
            }}
          >
            {description}
          </div>
        )}
      </div>
    );
  }

  function DomainCard({
    domain,
    onUpdate,
  }: {
    domain: ProjectDomain;
    onUpdate: (d: ProjectDomain) => void;
  }) {
    const [editing, setEditing] = useState(false);

    return (
      <div
        className="card"
        style={{
          borderLeft: `3px solid ${getScoreColor(domain.scores.demand)}`,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 16 }}>{domain.name}</h3>
            <p
              className="small"
              style={{ margin: "4px 0", color: "var(--muted)" }}
            >
              {domain.description}
            </p>
          </div>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: 4,
              fontSize: 11,
              background:
                domain.status === "completed"
                  ? "#10b98120"
                  : domain.status === "in-progress"
                  ? "#3b82f620"
                  : "#6b728020",
              color:
                domain.status === "completed"
                  ? "#10b981"
                  : domain.status === "in-progress"
                  ? "#3b82f6"
                  : "#6b7280",
              textTransform: "capitalize",
            }}
          >
            {domain.status}
          </span>
        </div>

        {/* Progress */}
        <div style={{ margin: "12px 0" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 11,
              marginBottom: 4,
            }}
          >
            <span style={{ color: "var(--muted)" }}>Progress</span>
            <span>{domain.progress}%</span>
          </div>
          <div
            style={{
              height: 6,
              background: "var(--surface)",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${domain.progress}%`,
                height: "100%",
                background: "var(--accent)",
                borderRadius: 3,
              }}
            />
          </div>
        </div>

        {/* Scores Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: 8,
            fontSize: 11,
            textAlign: "center",
          }}
        >
          {Object.entries(domain.scores).map(([key, value]) => (
            <div key={key}>
              <div style={{ color: getScoreColor(value), fontWeight: "bold" }}>
                {value}
              </div>
              <div
                style={{ color: "var(--muted)", textTransform: "capitalize" }}
              >
                {key.slice(0, 3)}
              </div>
            </div>
          ))}
        </div>

        {/* Features */}
        {domain.features.length > 0 && (
          <div
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: "1px solid var(--border)",
            }}
          >
            <div
              style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}
            >
              Features:
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {domain.features.map((f, i) => (
                <span
                  key={i}
                  style={{
                    padding: "2px 6px",
                    background: "var(--surface)",
                    borderRadius: 4,
                    fontSize: 10,
                  }}
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div
        className="card"
        style={{
          background: `linear-gradient(135deg, var(--surface) 0%, ${getStatusColor(
            project.status
          )}15 100%)`,
          borderLeft: `4px solid ${getStatusColor(project.status)}`,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 8,
              }}
            >
              <Link
                href="/projects"
                style={{ color: "var(--muted)", fontSize: 12 }}
              >
                ← Projects
              </Link>
            </div>
            <h1
              style={{
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              {getStatusIcon(project.status)} {project.name}
              {saving && (
                <span style={{ fontSize: 12, color: "var(--muted)" }}>
                  Saving...
                </span>
              )}
            </h1>
            <p
              style={{
                margin: "8px 0 0",
                color: "var(--muted)",
                maxWidth: 600,
              }}
            >
              {project.tagline}
            </p>
            {category && (
              <div
                style={{
                  marginTop: 12,
                  padding: "4px 8px",
                  background: "var(--surface)",
                  borderRadius: 4,
                  display: "inline-block",
                  fontSize: 12,
                }}
              >
                🏷️ {category.name}
              </div>
            )}
            {/* Active Sprint Indicator */}
            <div style={{ marginTop: 12 }}>
              <SprintIndicator
                projectId={project.id}
                onClick={() => setActiveTab("sprints")}
              />
            </div>
          </div>

          {/* Status Controls */}
          <div style={{ display: "flex", gap: 8 }}>
            {(
              ["draft", "active", "paused", "completed"] as ProjectStatus[]
            ).map((status) => (
              <button
                key={status}
                onClick={() => updateStatus(status)}
                disabled={saving}
                style={{
                  padding: "6px 12px",
                  border:
                    project.status === status
                      ? `2px solid ${getStatusColor(status)}`
                      : "2px solid transparent",
                  borderRadius: 6,
                  background:
                    project.status === status
                      ? `${getStatusColor(status)}20`
                      : "var(--surface)",
                  color:
                    project.status === status
                      ? getStatusColor(status)
                      : "var(--muted)",
                  cursor: "pointer",
                  fontSize: 11,
                  textTransform: "capitalize",
                }}
              >
                {getStatusIcon(status)} {status}
              </button>
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              marginBottom: 4,
            }}
          >
            <span>Overall Progress</span>
            <span style={{ fontWeight: "bold" }}>{project.progress}%</span>
          </div>
          <div
            style={{
              height: 8,
              background: "var(--surface)",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${project.progress}%`,
                height: "100%",
                background: `linear-gradient(90deg, ${getStatusColor(
                  project.status
                )}, var(--accent))`,
                borderRadius: 4,
              }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 4,
          borderBottom: "1px solid var(--border)",
          paddingBottom: 8,
        }}
      >
        {(["overview", "sprints", "domains", "crew", "settings"] as const).map(
          (tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "8px 16px",
                border: "none",
                borderRadius: "6px 6px 0 0",
                background: activeTab === tab ? "var(--accent)" : "transparent",
                color: activeTab === tab ? "white" : "var(--muted)",
                cursor: "pointer",
                fontSize: 13,
                textTransform: "capitalize",
              }}
            >
              {tab === "overview" && "📊"}
              {tab === "sprints" && "🏃"}
              {tab === "domains" && "🏗️"}
              {tab === "crew" && "👥"}
              {tab === "settings" && "⚙️"} {tab}
            </button>
          )
        )}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <>
          {/* Domain Status Overview - Horizontal Bar */}
          {project.domains.length > 0 && (
            <div className="card">
              <h2
                style={{
                  margin: "0 0 16px",
                  fontSize: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                🏗️ Domain Status Overview
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: "normal",
                    padding: "2px 8px",
                    background: "var(--surface)",
                    borderRadius: 4,
                  }}
                >
                  {project.domains.length} domains
                </span>
              </h2>
              <DomainStatusBar domains={project.domains} height={48} />

              {/* Domain Summary Strip */}
              <div
                style={{
                  marginTop: 16,
                  paddingTop: 16,
                  borderTop: "1px solid var(--border)",
                }}
              >
                <DomainSummaryStrip domains={project.domains} />
              </div>
            </div>
          )}

          {/* Scorecard with Horizontal Bars */}
          <div className="card">
            <h2 style={{ margin: "0 0 16px", fontSize: 16 }}>
              📊 Project Scorecard
            </h2>
            <ScoreBar scores={project.scores} />
          </div>

          {/* Legacy Grid Scorecard (compact) */}
          <div className="card">
            <h3
              style={{
                margin: "0 0 12px",
                fontSize: 14,
                color: "var(--muted)",
              }}
            >
              Score Summary
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: 12,
              }}
            >
              <ScoreCard
                label="Demand"
                value={project.scores.demand}
                description="Market need"
              />
              <ScoreCard
                label="Effort"
                value={project.scores.effort}
                description="Build complexity"
              />
              <ScoreCard
                label="Monetization"
                value={project.scores.monetization}
                description="Revenue potential"
              />
              <ScoreCard
                label="Differentiation"
                value={project.scores.differentiation}
                description="Competitive edge"
              />
              <ScoreCard
                label="Risk"
                value={project.scores.risk}
                description="Uncertainty level"
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 12,
            }}
          >
            <div className="card" style={{ textAlign: "center", padding: 16 }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>🏗️</div>
              <div style={{ fontSize: 20, fontWeight: "bold" }}>
                {project.domains.length}
              </div>
              <div className="small" style={{ color: "var(--muted)" }}>
                Domains
              </div>
            </div>
            <div className="card" style={{ textAlign: "center", padding: 16 }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>✅</div>
              <div style={{ fontSize: 20, fontWeight: "bold" }}>
                {project.completedFeatures.length}
              </div>
              <div className="small" style={{ color: "var(--muted)" }}>
                Completed
              </div>
            </div>
            <div className="card" style={{ textAlign: "center", padding: 16 }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>🎯</div>
              <div style={{ fontSize: 20, fontWeight: "bold" }}>
                {project.mvpFeatures.length}
              </div>
              <div className="small" style={{ color: "var(--muted)" }}>
                MVP Features
              </div>
            </div>
            <div className="card" style={{ textAlign: "center", padding: 16 }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>👥</div>
              <div style={{ fontSize: 20, fontWeight: "bold" }}>
                {project.crew.length}
              </div>
              <div className="small" style={{ color: "var(--muted)" }}>
                Crew
              </div>
            </div>
          </div>

          {/* Tech Stack & Monetization */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div className="card">
              <h3 style={{ margin: "0 0 12px", fontSize: 14 }}>
                🛠️ Tech Stack
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {Object.entries(project.techStack).map(
                  ([category, items]) =>
                    (items as string[]).length > 0 && (
                      <div key={category}>
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--muted)",
                            textTransform: "capitalize",
                            marginBottom: 4,
                          }}
                        >
                          {category}
                        </div>
                        <div
                          style={{ display: "flex", flexWrap: "wrap", gap: 4 }}
                        >
                          {(items as string[]).map((item, i) => (
                            <span
                              key={i}
                              style={{
                                padding: "2px 8px",
                                background: "var(--surface)",
                                borderRadius: 4,
                                fontSize: 11,
                              }}
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                )}
              </div>
            </div>

            <div className="card">
              <h3 style={{ margin: "0 0 12px", fontSize: 14 }}>
                💰 Monetization
              </h3>
              <div style={{ fontSize: 13 }}>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: "var(--muted)" }}>Model: </span>
                  <span style={{ textTransform: "capitalize" }}>
                    {project.monetization.model}
                  </span>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: "var(--muted)" }}>Target Price: </span>
                  {project.monetization.targetPrice}
                </div>
                {project.monetization.revenueStreams.length > 0 && (
                  <div>
                    <div style={{ color: "var(--muted)", marginBottom: 4 }}>
                      Revenue Streams:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12 }}>
                      {project.monetization.revenueStreams.map((stream, i) => (
                        <li key={i}>{stream}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {project.description && (
            <div className="card">
              <h3 style={{ margin: "0 0 12px", fontSize: 14 }}>
                📝 Description
              </h3>
              <p
                style={{
                  margin: 0,
                  color: "var(--muted)",
                  whiteSpace: "pre-wrap",
                }}
              >
                {project.description}
              </p>
            </div>
          )}
        </>
      )}

      {activeTab === "sprints" && (
        <SprintBoard
          projectId={project.id}
          theme={{ accent: getStatusColor(project.status) }}
        />
      )}

      {activeTab === "domains" && (
        <div style={{ display: "grid", gap: 16 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2 style={{ margin: 0, fontSize: 16 }}>🏗️ Project Domains</h2>
            <div style={{ display: "flex", gap: 8 }}>
              <Link href={`/projects/${project.id}/domains`}>
                <button
                  style={{
                    padding: "8px 16px",
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    color: "inherit",
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  🌳 Full View
                </button>
              </Link>
              <button
                style={{
                  padding: "8px 16px",
                  background: "var(--accent)",
                  border: "none",
                  borderRadius: 6,
                  color: "white",
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                ➕ Add Domain
              </button>
            </div>
          </div>

          {/* Domain Status Bar at top */}
          {project.domains.length > 0 && (
            <DomainStatusBar domains={project.domains} height={40} />
          )}

          {project.domains.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: 32 }}>
              <p style={{ color: "var(--muted)" }}>
                No domains defined yet. Add domains to track progress by area.
              </p>
            </div>
          ) : (
            <DomainProgressList
              domains={project.domains}
              onDomainClick={(domain) => {
                // Could open a modal or navigate to domain detail
                console.log("Clicked domain:", domain.slug);
              }}
            />
          )}
        </div>
      )}

      {activeTab === "crew" && (
        <div className="card">
          <h2 style={{ margin: "0 0 16px", fontSize: 16 }}>
            👥 Crew Assignments
          </h2>
          {project.crew.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>
              No crew members assigned yet.
            </p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {project.crew.map((member, i) => (
                <div
                  key={i}
                  style={{
                    padding: 12,
                    background: "var(--surface)",
                    borderRadius: 8,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500 }}>{member.crewMemberId}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>
                      {member.role}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>
                    {member.contributions?.length || 0} contributions
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "settings" && (
        <div className="card">
          <h2 style={{ margin: "0 0 16px", fontSize: 16 }}>
            ⚙️ Project Settings
          </h2>

          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  color: "var(--muted)",
                  marginBottom: 4,
                }}
              >
                Project Name
              </label>
              <input
                type="text"
                value={project.name}
                onChange={(e) => updateProject({ name: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  color: "inherit",
                  fontSize: 14,
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  color: "var(--muted)",
                  marginBottom: 4,
                }}
              >
                Tagline
              </label>
              <input
                type="text"
                value={project.tagline}
                onChange={(e) => updateProject({ tagline: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  color: "inherit",
                  fontSize: 14,
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  color: "var(--muted)",
                  marginBottom: 4,
                }}
              >
                Description
              </label>
              <textarea
                value={project.description}
                onChange={(e) => updateProject({ description: e.target.value })}
                rows={4}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  color: "inherit",
                  fontSize: 14,
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              <button
                onClick={() => router.push("/projects")}
                style={{
                  padding: "10px 20px",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  color: "inherit",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                ← Back to Projects
              </button>
              <button
                onClick={() => updateProject({ status: "archived" })}
                style={{
                  padding: "10px 20px",
                  background: "#ef444420",
                  border: "1px solid #ef4444",
                  borderRadius: 6,
                  color: "#ef4444",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                🗑️ Archive Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Metadata Footer */}
      <div className="card" style={{ padding: 12 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 11,
            color: "var(--muted)",
          }}
        >
          <span>ID: {project.id}</span>
          <span>Created: {new Date(project.createdAt).toLocaleString()}</span>
          <span>Updated: {new Date(project.updatedAt).toLocaleString()}</span>
          <span>Source: {project.source}</span>
        </div>
      </div>
    </div>
  );
}


