import Link from "next/link";
import { RecentProjects, ProjectStats } from "../components/RecentProjects";
import { getPageTheme, getPageGradientStyle } from "@/lib/pageTheme";

export default function Home() {
  const theme = getPageTheme("home");

  return (
    <div className="grid">
      {/* Hero Section */}
      <div
        className="card span-12"
        style={getPageGradientStyle(theme, "large")}
      >
        <h1 style={{ marginTop: 0, color: theme.accent }}>🏠 Home</h1>
        <p className="small">
          This app is the "product spine": a review-pack you can read, plus a
          working RAG endpoint and a safe self-learning loop (save structured
          notes → notes become searchable).
        </p>
        <div
          style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}
        >
          <span className="badge good">Opportunity</span>
          <span className="badge warn">Tradeoffs</span>
          <span className="badge risk">Risk</span>
        </div>
      </div>

      {/* Recent Projects - Main Focus */}
      <div
        className="card span-8"
        style={getPageGradientStyle(theme, "medium")}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <div>
            <div
              className="small"
              style={{ marginBottom: 4, color: theme.accent }}
            >
              Recently Updated
            </div>
            <h2 style={{ margin: 0, color: theme.accent }}>
              📦 Active Projects
            </h2>
          </div>
          <Link
            href="/projects"
            style={{
              padding: "8px 16px",
              background: `${theme.accent}20`,
              border: `1px solid ${theme.accent}40`,
              borderRadius: 8,
              color: theme.accent,
              textDecoration: "none",
              fontSize: 13,
              fontWeight: 500,
              transition: "all 0.2s",
            }}
          >
            View All Projects →
          </Link>
        </div>

        {/* Project Stats */}
        <div style={{ marginBottom: 16 }}>
          <ProjectStats theme={theme} />
        </div>

        {/* Recent Projects Grid */}
        <RecentProjects theme={theme} limit={4} />
      </div>

      {/* Quick Actions Sidebar */}
      <div className="card span-4" style={getPageGradientStyle(theme, "small")}>
        <div className="small" style={{ marginBottom: 8, color: theme.accent }}>
          CTAs
        </div>
        <h2 style={{ marginTop: 0, color: theme.accent }}>🚀 Start here</h2>

        <p className="small">
          <b>1) Create a Project</b>
          <br />
          Generate a new DDD-structured project with domains.
        </p>
        <p>
          <Link href="/create" style={{ color: "#00c2ff" }}>
            Go to Create →
          </Link>
        </p>

        <p className="small">
          <b>2) Browse Categories</b>
          <br />
          Pick a monetization lane and see the cost/benefit analysis.
        </p>
        <p>
          <Link href="/categories" style={{ color: theme.accent }}>
            Open Categories →
          </Link>
        </p>

        <p className="small">
          <b>3) Try Ask</b>
          <br />
          See citations + trace.
        </p>
        <p>
          <Link href="/ask" style={{ color: "#ff5c93" }}>
            Go to Ask →
          </Link>
        </p>

        <p className="small">
          <b>4) Read the overview</b>
        </p>
        <p>
          <Link href="/docs/overview" style={{ color: "#0077b6" }}>
            Open Overview →
          </Link>
        </p>
      </div>

      {/* Portfolio Quick View */}
      <div
        className="card span-6"
        style={getPageGradientStyle(theme, "medium")}
      >
        <div className="small" style={{ marginBottom: 8, color: theme.accent }}>
          Portfolio
        </div>
        <h2 style={{ marginTop: 0, color: theme.accent }}>
          🎯 Domain-Driven Design
        </h2>
        <p className="small">
          Each project is organized into <b>bounded contexts</b> (domains)
          following DDD principles. Domains have independent scores, progress
          tracking, and feature lists.
        </p>
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginTop: 12,
            marginBottom: 12,
          }}
        >
          <span
            style={{
              padding: "4px 10px",
              background: "#10b98115",
              border: "1px solid #10b98140",
              borderRadius: 12,
              fontSize: 11,
            }}
          >
            🟢 Completed
          </span>
          <span
            style={{
              padding: "4px 10px",
              background: "#3b82f615",
              border: "1px solid #3b82f640",
              borderRadius: 12,
              fontSize: 11,
            }}
          >
            🔵 In Progress
          </span>
          <span
            style={{
              padding: "4px 10px",
              background: "#6b728015",
              border: "1px solid #6b728040",
              borderRadius: 12,
              fontSize: 11,
            }}
          >
            ⚪ Planned
          </span>
        </div>
        <Link href="/portfolio" style={{ color: theme.accent }}>
          View Portfolio →
        </Link>
      </div>

      {/* Crew & Collaboration */}
      <div
        className="card span-6"
        style={getPageGradientStyle(theme, "medium")}
      >
        <div className="small" style={{ marginBottom: 8, color: theme.accent }}>
          Alex AI
        </div>
        <h2 style={{ marginTop: 0, color: theme.accent }}>
          👥 Crew Collaboration
        </h2>
        <p className="small">
          The Alex AI crew system assigns specialized personas to each project.
          From Captain Picard&apos;s strategic vision to Commander Data&apos;s
          technical analysis.
        </p>
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginTop: 12,
            marginBottom: 12,
          }}
        >
          <span
            style={{
              padding: "4px 10px",
              background: "#f59e0b15",
              border: "1px solid #f59e0b40",
              borderRadius: 12,
              fontSize: 11,
            }}
          >
            🎖️ Command
          </span>
          <span
            style={{
              padding: "4px 10px",
              background: "#ef444415",
              border: "1px solid #ef444440",
              borderRadius: 12,
              fontSize: 11,
            }}
          >
            🔧 Engineering
          </span>
          <span
            style={{
              padding: "4px 10px",
              background: "#8b5cf615",
              border: "1px solid #8b5cf640",
              borderRadius: 12,
              fontSize: 11,
            }}
          >
            💭 Advisory
          </span>
        </div>
        <Link href="/observation-lounge" style={{ color: theme.accent }}>
          Visit Observation Lounge →
        </Link>
      </div>

      {/* Factory Self-Reference */}
      <div
        className="card span-12"
        style={{
          ...getPageGradientStyle(theme, "large"),
          borderLeft: `3px solid ${theme.accent}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <div style={{ fontSize: 32 }}>🏭</div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: "0 0 8px", color: theme.accent }}>
              Product Factory
            </h3>
            <p className="small" style={{ margin: 0, color: "var(--muted)" }}>
              This meta-application generates and manages domain-driven
              projects. Each project inherits the same dashboard structure,
              enabling consistent architecture across your portfolio. The
              factory itself is a project, enabling recursive self-improvement.
            </p>
          </div>
          <Link
            href="/projects"
            style={{
              padding: "10px 20px",
              background: theme.accent,
              borderRadius: 8,
              color: "white",
              textDecoration: "none",
              fontSize: 13,
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            Browse All Projects
          </Link>
        </div>
      </div>
    </div>
  );
}
