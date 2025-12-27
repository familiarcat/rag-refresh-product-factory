# Role-Based Access Control (RBAC) Architecture
## Alex AI System - Multi-Tier Authorization & VSCode-Web Sync

**Version:** 1.0.0
**Date:** 2025-12-26
**Status:** Design Document

---

## Table of Contents

1. [Overview](#overview)
2. [Role Hierarchy](#role-hierarchy)
3. [Database Schema](#database-schema)
4. [Permission Model](#permission-model)
5. [VSCode-Web Sync Mechanism](#vscode-web-sync-mechanism)
6. [Authentication Abstraction Layer](#authentication-abstraction-layer)
7. [Mock Roles & Test Cases](#mock-roles--test-cases)
8. [Implementation Roadmap](#implementation-roadmap)

---

## Overview

### Goals

1. **Three-tier hierarchy**: Administrator => Project Owner => Developer
2. **VSCode as "Developer" interface**: Code-first, file operations, crew assistance
3. **Web Dashboard as "Owner/Admin" interface**: Project management, crew coordination, oversight
4. **Flexible authentication**: Support multiple providers (Supabase Auth, AWS Cognito, Auth0, OAuth2, etc.)
5. **Multi-project access**: Users can have different roles across different projects
6. **Test-driven security**: Control cases for absolute access vs minimal access

### Principles

- **Least Privilege**: Users get minimal permissions needed for their role
- **Defense in Depth**: Multiple layers of authorization checks
- **Auditability**: All permission grants/denials logged
- **Extensibility**: Easy to add new roles, permissions, providers

---

## Role Hierarchy

### Tier 1: Administrator (System-Wide)

**Scope**: Entire Alex AI system

**Capabilities**:
- ✅ Manage all users and their roles
- ✅ Create, read, update, delete ANY project
- ✅ View all crew activities and memories
- ✅ Configure system settings (API keys, integrations, etc.)
- ✅ Access all features in both VSCode and Web
- ✅ Grant/revoke permissions
- ✅ View audit logs
- ✅ Manage billing and quotas
- ✅ Deploy infrastructure changes

**Use Cases**:
- Platform owner
- DevOps engineer
- Security auditor

**Example Users** (mock):
- `admin@alex-ai.dev` - Full system admin
- `devops@alex-ai.dev` - Infrastructure admin

---

### Tier 2: Project Owner (Project-Scoped)

**Scope**: Specific projects (can own multiple projects)

**Capabilities**:
- ✅ Create, read, update, delete THEIR projects
- ✅ Invite/remove developers to their projects
- ✅ Configure project settings (crew assignments, sprint goals, etc.)
- ✅ View project-specific crew memories
- ✅ Approve developer code changes (if approval workflow enabled)
- ✅ Manage project milestones and roadmap
- ✅ View project analytics and metrics
- ✅ Access web dashboard (primary interface)
- ❌ Cannot access other owners' projects (unless invited)
- ❌ Cannot manage system-level settings
- ❌ Cannot view other projects' audit logs

**Use Cases**:
- Product manager
- Tech lead
- Freelance client

**Example Users** (mock):
- `owner1@example.com` - Owns "E-commerce Platform" project
- `owner2@example.com` - Owns "Blog CMS" and "Mobile App" projects

---

### Tier 3: Developer (Project-Scoped)

**Scope**: Projects they're invited to (read/write code, limited project management)

**Capabilities**:
- ✅ Read project information
- ✅ Write code (file operations via VSCode extension)
- ✅ Chat with crew members
- ✅ Create/update tasks and stories
- ✅ View sprint status
- ✅ Commit code changes
- ✅ View project-specific memories
- ✅ Access VSCode extension (primary interface)
- ✅ Limited web dashboard access (view-only for most settings)
- ❌ Cannot change project settings
- ❌ Cannot invite other users
- ❌ Cannot delete project
- ❌ Cannot view sensitive project data (API keys, billing, etc.)

**Use Cases**:
- Software engineer
- Contractor
- Junior developer

**Example Users** (mock):
- `dev1@example.com` - Developer on "E-commerce Platform"
- `dev2@example.com` - Developer on multiple projects

---

### Tier 4: Viewer (Project-Scoped) - Optional

**Scope**: Read-only access to specific projects

**Capabilities**:
- ✅ View project information
- ✅ View code (read-only)
- ✅ View sprint status
- ✅ View project documentation
- ❌ Cannot write code
- ❌ Cannot chat with crew
- ❌ Cannot modify anything

**Use Cases**:
- Stakeholder
- Designer (viewing code structure)
- Auditor

---

## Database Schema

### Supabase Tables

```sql
-- ============================================================================
-- USERS TABLE (Supabase Auth users reference)
-- ============================================================================

CREATE TABLE auth_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  system_role TEXT DEFAULT 'developer' CHECK (system_role IN ('admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Index for fast email lookups
CREATE INDEX idx_auth_profiles_email ON auth_profiles(email);
CREATE INDEX idx_auth_profiles_system_role ON auth_profiles(system_role);

-- ============================================================================
-- PROJECTS TABLE
-- ============================================================================

CREATE TABLE projects (
  id TEXT PRIMARY KEY, -- e.g., "proj_1234567890_abc123"
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth_profiles(id) ON DELETE CASCADE,

  -- Project metadata
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  category TEXT, -- From categories.ts

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- JSON data (for compatibility with existing system)
  data JSONB DEFAULT '{}'::jsonb,

  -- Full-text search
  search_vector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, ''))
  ) STORED
);

-- Indexes
CREATE INDEX idx_projects_owner_id ON projects(owner_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_search_vector ON projects USING GIN(search_vector);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);

-- ============================================================================
-- ROLES TABLE (Defines available roles)
-- ============================================================================

CREATE TABLE roles (
  id TEXT PRIMARY KEY, -- e.g., "admin", "owner", "developer", "viewer"
  name TEXT NOT NULL,
  description TEXT,

  -- Hierarchy level (lower = more powerful)
  hierarchy_level INTEGER NOT NULL,

  -- Capabilities (JSON array of permission IDs)
  capabilities JSONB DEFAULT '[]'::jsonb,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Seed data
INSERT INTO roles (id, name, description, hierarchy_level, capabilities) VALUES
  ('admin', 'Administrator', 'Full system access', 0, '["*"]'::jsonb),
  ('owner', 'Project Owner', 'Manage own projects', 1, '["project:create", "project:read", "project:update", "project:delete", "project:invite", "project:settings", "crew:view", "sprint:manage"]'::jsonb),
  ('developer', 'Developer', 'Write code, chat with crew', 2, '["project:read", "code:write", "crew:chat", "sprint:view", "task:create", "task:update"]'::jsonb),
  ('viewer', 'Viewer', 'Read-only access', 3, '["project:read", "code:read", "sprint:view"]'::jsonb);

-- ============================================================================
-- PROJECT_MEMBERS TABLE (User-Project-Role junction)
-- ============================================================================

CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth_profiles(id) ON DELETE CASCADE,
  role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,

  -- Invitation metadata
  invited_by UUID REFERENCES auth_profiles(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'removed')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Metadata (custom permissions, overrides, etc.)
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Ensure one role per user per project
  UNIQUE(project_id, user_id)
);

-- Indexes
CREATE INDEX idx_project_members_project_id ON project_members(project_id);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);
CREATE INDEX idx_project_members_role_id ON project_members(role_id);
CREATE INDEX idx_project_members_status ON project_members(status);

-- ============================================================================
-- PERMISSIONS TABLE (Granular permissions)
-- ============================================================================

CREATE TABLE permissions (
  id TEXT PRIMARY KEY, -- e.g., "project:read", "code:write", "crew:chat"
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- e.g., "project", "code", "crew", "sprint"

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed permissions
INSERT INTO permissions (id, name, description, category) VALUES
  -- System-level
  ('*', 'All Permissions', 'Administrator wildcard', 'system'),
  ('system:manage', 'Manage System', 'System configuration', 'system'),
  ('users:manage', 'Manage Users', 'Create/delete users', 'system'),

  -- Project-level
  ('project:create', 'Create Projects', 'Create new projects', 'project'),
  ('project:read', 'Read Projects', 'View project details', 'project'),
  ('project:update', 'Update Projects', 'Edit project settings', 'project'),
  ('project:delete', 'Delete Projects', 'Delete projects', 'project'),
  ('project:invite', 'Invite Users', 'Add users to project', 'project'),
  ('project:settings', 'Manage Settings', 'Configure project settings', 'project'),

  -- Code-level
  ('code:read', 'Read Code', 'View source code', 'code'),
  ('code:write', 'Write Code', 'Edit source code', 'code'),
  ('code:delete', 'Delete Code', 'Delete files', 'code'),

  -- Crew-level
  ('crew:chat', 'Chat with Crew', 'Interact with AI crew', 'crew'),
  ('crew:view', 'View Crew Activities', 'See crew memories and logs', 'crew'),
  ('crew:configure', 'Configure Crew', 'Assign crew members', 'crew'),

  -- Sprint-level
  ('sprint:view', 'View Sprints', 'See sprint status', 'sprint'),
  ('sprint:manage', 'Manage Sprints', 'Create/edit sprints', 'sprint'),

  -- Task-level
  ('task:create', 'Create Tasks', 'Add new tasks', 'task'),
  ('task:update', 'Update Tasks', 'Edit task status', 'task'),
  ('task:delete', 'Delete Tasks', 'Remove tasks', 'task');

-- ============================================================================
-- AUDIT_LOG TABLE (Track all permission checks and actions)
-- ============================================================================

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth_profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- e.g., "project:read", "code:write", "crew:chat"
  resource_type TEXT, -- e.g., "project", "file", "crew_member"
  resource_id TEXT, -- e.g., project_id, file_path, crew_member_id

  -- Result
  allowed BOOLEAN NOT NULL,
  reason TEXT, -- Why allowed/denied

  -- Context
  ip_address TEXT,
  user_agent TEXT,
  source TEXT, -- "vscode-extension", "web-dashboard", "api"

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for audit queries
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_resource_type ON audit_log(resource_type);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX idx_audit_log_allowed ON audit_log(allowed);

-- ============================================================================
-- API_KEYS TABLE (For VSCode extension authentication)
-- ============================================================================

CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth_profiles(id) ON DELETE CASCADE,

  -- Key data
  key_hash TEXT NOT NULL UNIQUE, -- SHA-256 hash of the actual key
  key_prefix TEXT NOT NULL, -- First 8 chars for identification (e.g., "sk_live_abc12345")

  -- Metadata
  name TEXT, -- User-friendly name (e.g., "VSCode Extension - MacBook Pro")
  scopes JSONB DEFAULT '[]'::jsonb, -- Allowed permissions

  -- Expiration
  expires_at TIMESTAMPTZ,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_is_active ON api_keys(is_active);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE auth_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read their own profile, admins can read all
CREATE POLICY "Users can view own profile"
  ON auth_profiles FOR SELECT
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM auth_profiles WHERE id = auth.uid() AND system_role = 'admin'
  ));

CREATE POLICY "Users can update own profile"
  ON auth_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Projects: Users can see projects they're members of or own
CREATE POLICY "Users can view projects they have access to"
  ON projects FOR SELECT
  USING (
    -- Is owner
    owner_id = auth.uid()
    -- OR is member
    OR EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = projects.id
      AND user_id = auth.uid()
      AND status = 'active'
    )
    -- OR is admin
    OR EXISTS (
      SELECT 1 FROM auth_profiles
      WHERE id = auth.uid()
      AND system_role = 'admin'
    )
  );

CREATE POLICY "Owners can update their projects"
  ON projects FOR UPDATE
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM auth_profiles
      WHERE id = auth.uid()
      AND system_role = 'admin'
    )
  );

CREATE POLICY "Users with project:create permission can create projects"
  ON projects FOR INSERT
  WITH CHECK (
    owner_id = auth.uid()
    AND (
      -- Has project:create permission
      EXISTS (
        SELECT 1 FROM auth_profiles
        WHERE id = auth.uid()
      )
    )
  );

-- Project Members: Can view members of projects they belong to
CREATE POLICY "Users can view project members"
  ON project_members FOR SELECT
  USING (
    -- Is the member
    user_id = auth.uid()
    -- OR is owner of the project
    OR EXISTS (
      SELECT 1 FROM projects
      WHERE id = project_members.project_id
      AND owner_id = auth.uid()
    )
    -- OR is admin
    OR EXISTS (
      SELECT 1 FROM auth_profiles
      WHERE id = auth.uid()
      AND system_role = 'admin'
    )
  );

-- Audit Log: Users can view their own actions, admins can view all
CREATE POLICY "Users can view own audit logs"
  ON audit_log FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM auth_profiles
      WHERE id = auth.uid()
      AND system_role = 'admin'
    )
  );

-- API Keys: Users can manage their own keys
CREATE POLICY "Users can manage own API keys"
  ON api_keys FOR ALL
  USING (user_id = auth.uid());
```

---

## Permission Model

### Permission Check Flow

```typescript
// Pseudo-code for permission checking
async function checkPermission(
  userId: string,
  action: string, // e.g., "code:write"
  resourceType: string, // e.g., "project"
  resourceId: string // e.g., "proj_123"
): Promise<{ allowed: boolean; reason: string }> {

  // 1. Check if user is system admin (wildcard permission)
  const profile = await getProfile(userId);
  if (profile.system_role === 'admin') {
    return { allowed: true, reason: 'System administrator' };
  }

  // 2. Get user's role for this project
  const membership = await getProjectMembership(userId, resourceId);
  if (!membership) {
    return { allowed: false, reason: 'Not a project member' };
  }

  // 3. Check if role has required permission
  const role = await getRole(membership.role_id);
  const hasPermission = role.capabilities.includes(action)
    || role.capabilities.includes('*');

  if (!hasPermission) {
    return { allowed: false, reason: `Role '${role.name}' lacks '${action}' permission` };
  }

  // 4. Log the check
  await logAuditEvent({
    userId,
    action,
    resourceType,
    resourceId,
    allowed: true,
    reason: `Granted via role '${role.name}'`
  });

  return { allowed: true, reason: `Granted via role '${role.name}'` };
}
```

### Permission Matrix

| Permission | Admin | Owner | Developer | Viewer |
|------------|-------|-------|-----------|--------|
| `system:manage` | ✅ | ❌ | ❌ | ❌ |
| `users:manage` | ✅ | ❌ | ❌ | ❌ |
| `project:create` | ✅ | ✅ | ❌ | ❌ |
| `project:read` | ✅ | ✅ | ✅ | ✅ |
| `project:update` | ✅ | ✅ | ❌ | ❌ |
| `project:delete` | ✅ | ✅ | ❌ | ❌ |
| `project:invite` | ✅ | ✅ | ❌ | ❌ |
| `project:settings` | ✅ | ✅ | ❌ | ❌ |
| `code:read` | ✅ | ✅ | ✅ | ✅ |
| `code:write` | ✅ | ✅ | ✅ | ❌ |
| `code:delete` | ✅ | ✅ | ✅ | ❌ |
| `crew:chat` | ✅ | ✅ | ✅ | ❌ |
| `crew:view` | ✅ | ✅ | ✅ | ✅ |
| `crew:configure` | ✅ | ✅ | ❌ | ❌ |
| `sprint:view` | ✅ | ✅ | ✅ | ✅ |
| `sprint:manage` | ✅ | ✅ | ❌ | ❌ |
| `task:create` | ✅ | ✅ | ✅ | ❌ |
| `task:update` | ✅ | ✅ | ✅ | ❌ |
| `task:delete` | ✅ | ✅ | ❌ | ❌ |

---

## VSCode-Web Sync Mechanism

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      SHARED API LAYER                        │
│           (Next.js API Routes + Supabase RLS)                │
└─────────────────────────────────────────────────────────────┘
                         ▲              ▲
                         │              │
          ┌──────────────┘              └──────────────┐
          │                                            │
          │                                            │
┌─────────┴────────────┐                   ┌───────────┴──────────┐
│  VSCode Extension     │                   │   Web Dashboard      │
│  (Developer UI)       │                   │   (Owner/Admin UI)   │
│                       │                   │                      │
│  - File operations    │                   │  - Project mgmt      │
│  - Crew chat          │                   │  - User mgmt         │
│  - Code writing       │                   │  - Crew oversight    │
│  - Task updates       │                   │  - Analytics         │
│                       │                   │  - Settings          │
│  Auth: API Key        │                   │  Auth: Session       │
└───────────────────────┘                   └──────────────────────┘
```

### Sync Points

#### 1. Authentication

**VSCode Extension:**
```typescript
// Use API key for machine-to-machine auth
const apiKey = await getStoredApiKey();
const headers = {
  'Authorization': `Bearer ${apiKey}`,
  'X-Client-Type': 'vscode-extension'
};
```

**Web Dashboard:**
```typescript
// Use Supabase session (cookie-based)
const session = await supabase.auth.getSession();
const headers = {
  'Authorization': `Bearer ${session.access_token}`,
  'X-Client-Type': 'web-dashboard'
};
```

#### 2. Project State

**Both clients fetch from same API:**
```typescript
// GET /api/projects/{projectId}
// Returns unified project state with RLS filtering
{
  id: "proj_123",
  name: "E-commerce Platform",
  owner: { id: "...", email: "..." },
  members: [{ user: {...}, role: "developer" }],
  sprints: [...],
  // ... other data
}
```

**Updates propagate via API:**
```typescript
// PUT /api/projects/{projectId}
// Both VSCode and Web can update (if authorized)
await fetch(`/api/projects/${projectId}`, {
  method: 'PUT',
  headers: { ...authHeaders },
  body: JSON.stringify({ name: "New Name" })
});
```

#### 3. Real-Time Sync (Optional - Future)

**Using Supabase Realtime:**
```typescript
// Both clients subscribe to same channels
const channel = supabase
  .channel(`project:${projectId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'projects',
    filter: `id=eq.${projectId}`
  }, (payload) => {
    // Update local state
    refreshProject();
  })
  .subscribe();
```

#### 4. Crew Chat Sync

**Shared conversation log:**
```sql
CREATE TABLE crew_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id),
  user_id UUID REFERENCES auth_profiles(id),
  crew_member_id TEXT,
  message TEXT,
  response TEXT,
  source TEXT, -- 'vscode-extension' or 'web-dashboard'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Both clients read/write:**
```typescript
// VSCode Extension
await fetch('/api/crew/chat', {
  method: 'POST',
  body: JSON.stringify({
    projectId,
    crewMember: 'riker',
    message: 'What should I do?',
    source: 'vscode-extension'
  })
});

// Web Dashboard shows same conversation
const conversations = await fetch(`/api/crew/conversations?projectId=${projectId}`);
```

---

## Authentication Abstraction Layer

### Provider-Agnostic Interface

```typescript
// src/auth/IAuthProvider.ts

export interface IAuthProvider {
  // Authentication
  signIn(credentials: SignInCredentials): Promise<AuthResult>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<User | null>;

  // Authorization
  checkPermission(
    userId: string,
    permission: string,
    resourceId?: string
  ): Promise<PermissionResult>;

  // Token management
  getAccessToken(): Promise<string | null>;
  refreshToken(): Promise<string | null>;

  // Profile
  getProfile(userId: string): Promise<UserProfile>;
  updateProfile(userId: string, data: Partial<UserProfile>): Promise<void>;
}

export interface SignInCredentials {
  email?: string;
  password?: string;
  apiKey?: string;
  oauthToken?: string;
  provider?: 'email' | 'google' | 'github' | 'aws-cognito' | 'auth0';
}

export interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export interface PermissionResult {
  allowed: boolean;
  reason: string;
  metadata?: Record<string, any>;
}

export interface User {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  systemRole: 'admin' | 'user';
  metadata?: Record<string, any>;
}

export interface UserProfile extends User {
  createdAt: Date;
  updatedAt: Date;
  projects: UserProject[];
}

export interface UserProject {
  projectId: string;
  role: 'owner' | 'developer' | 'viewer';
  joinedAt: Date;
}
```

### Implementation Examples

#### 1. Supabase Provider

```typescript
// src/auth/providers/SupabaseAuthProvider.ts

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IAuthProvider, SignInCredentials, AuthResult } from '../IAuthProvider';

export class SupabaseAuthProvider implements IAuthProvider {
  private client: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.client = createClient(supabaseUrl, supabaseKey);
  }

  async signIn(credentials: SignInCredentials): Promise<AuthResult> {
    if (credentials.apiKey) {
      // API key authentication
      return this.signInWithApiKey(credentials.apiKey);
    }

    // Email/password authentication
    const { data, error } = await this.client.auth.signInWithPassword({
      email: credentials.email!,
      password: credentials.password!
    });

    if (error) throw new Error(error.message);

    return {
      user: {
        id: data.user.id,
        email: data.user.email!,
        systemRole: 'user'
      },
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: new Date(data.session.expires_at! * 1000)
    };
  }

  async signInWithApiKey(apiKey: string): Promise<AuthResult> {
    // Hash the API key
    const keyHash = await this.hashApiKey(apiKey);

    // Look up API key in database
    const { data, error } = await this.client
      .from('api_keys')
      .select('user_id, is_active, expires_at')
      .eq('key_hash', keyHash)
      .single();

    if (error || !data || !data.is_active) {
      throw new Error('Invalid API key');
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      throw new Error('API key expired');
    }

    // Get user profile
    const { data: profile } = await this.client
      .from('auth_profiles')
      .select('*')
      .eq('id', data.user_id)
      .single();

    // Update last_used_at
    await this.client
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('key_hash', keyHash);

    return {
      user: {
        id: profile.id,
        email: profile.email,
        systemRole: profile.system_role,
        fullName: profile.full_name
      },
      accessToken: apiKey, // API key acts as access token
    };
  }

  async checkPermission(
    userId: string,
    permission: string,
    resourceId?: string
  ): Promise<PermissionResult> {
    // Call stored procedure or implement permission logic
    const { data, error } = await this.client.rpc('check_permission', {
      p_user_id: userId,
      p_permission: permission,
      p_resource_id: resourceId
    });

    return {
      allowed: data?.allowed || false,
      reason: data?.reason || 'Permission denied'
    };
  }

  private async hashApiKey(apiKey: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}
```

#### 2. AWS Cognito Provider

```typescript
// src/auth/providers/CognitoAuthProvider.ts

import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  GetUserCommand
} from '@aws-sdk/client-cognito-identity-provider';
import { IAuthProvider, SignInCredentials, AuthResult } from '../IAuthProvider';

export class CognitoAuthProvider implements IAuthProvider {
  private client: CognitoIdentityProviderClient;
  private userPoolId: string;
  private clientId: string;

  constructor(region: string, userPoolId: string, clientId: string) {
    this.client = new CognitoIdentityProviderClient({ region });
    this.userPoolId = userPoolId;
    this.clientId = clientId;
  }

  async signIn(credentials: SignInCredentials): Promise<AuthResult> {
    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: this.clientId,
      AuthParameters: {
        USERNAME: credentials.email!,
        PASSWORD: credentials.password!
      }
    });

    const response = await this.client.send(command);

    // Map Cognito user to our User interface
    // Fetch additional profile data from our database

    return {
      user: {
        id: response.AuthenticationResult!.AccessToken!,
        email: credentials.email!,
        systemRole: 'user'
      },
      accessToken: response.AuthenticationResult!.AccessToken!,
      refreshToken: response.AuthenticationResult!.RefreshToken,
      expiresAt: new Date(Date.now() + response.AuthenticationResult!.ExpiresIn! * 1000)
    };
  }

  async checkPermission(...args): Promise<PermissionResult> {
    // Implement permission checking against Cognito groups or our database
    throw new Error('Not implemented');
  }
}
```

#### 3. Auth0 Provider

```typescript
// src/auth/providers/Auth0Provider.ts

import { IAuthProvider } from '../IAuthProvider';

export class Auth0Provider implements IAuthProvider {
  private domain: string;
  private clientId: string;
  private clientSecret: string;

  constructor(domain: string, clientId: string, clientSecret: string) {
    this.domain = domain;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  async signIn(credentials: SignInCredentials): Promise<AuthResult> {
    const response = await fetch(`https://${this.domain}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'password',
        username: credentials.email,
        password: credentials.password,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        audience: `https://${this.domain}/api/v2/`,
        scope: 'openid profile email'
      })
    });

    const data = await response.json();

    // Get user info
    const userInfoResponse = await fetch(`https://${this.domain}/userinfo`, {
      headers: { 'Authorization': `Bearer ${data.access_token}` }
    });

    const userInfo = await userInfoResponse.json();

    return {
      user: {
        id: userInfo.sub,
        email: userInfo.email,
        fullName: userInfo.name,
        avatarUrl: userInfo.picture,
        systemRole: 'user'
      },
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000)
    };
  }

  async checkPermission(...args): Promise<PermissionResult> {
    // Implement using Auth0 Authorization Extension or our database
    throw new Error('Not implemented');
  }
}
```

### Provider Factory

```typescript
// src/auth/AuthProviderFactory.ts

import { IAuthProvider } from './IAuthProvider';
import { SupabaseAuthProvider } from './providers/SupabaseAuthProvider';
import { CognitoAuthProvider } from './providers/CognitoAuthProvider';
import { Auth0Provider } from './providers/Auth0Provider';

export type AuthProviderType = 'supabase' | 'cognito' | 'auth0' | 'custom';

export interface AuthConfig {
  provider: AuthProviderType;
  config: Record<string, string>;
}

export class AuthProviderFactory {
  static create(config: AuthConfig): IAuthProvider {
    switch (config.provider) {
      case 'supabase':
        return new SupabaseAuthProvider(
          config.config.supabaseUrl,
          config.config.supabaseKey
        );

      case 'cognito':
        return new CognitoAuthProvider(
          config.config.region,
          config.config.userPoolId,
          config.config.clientId
        );

      case 'auth0':
        return new Auth0Provider(
          config.config.domain,
          config.config.clientId,
          config.config.clientSecret
        );

      default:
        throw new Error(`Unknown auth provider: ${config.provider}`);
    }
  }

  static fromEnvironment(): IAuthProvider {
    const provider = process.env.AUTH_PROVIDER as AuthProviderType || 'supabase';

    const config: AuthConfig = {
      provider,
      config: {}
    };

    // Load provider-specific config from environment
    if (provider === 'supabase') {
      config.config.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      config.config.supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    } else if (provider === 'cognito') {
      config.config.region = process.env.AWS_REGION!;
      config.config.userPoolId = process.env.COGNITO_USER_POOL_ID!;
      config.config.clientId = process.env.COGNITO_CLIENT_ID!;
    } else if (provider === 'auth0') {
      config.config.domain = process.env.AUTH0_DOMAIN!;
      config.config.clientId = process.env.AUTH0_CLIENT_ID!;
      config.config.clientSecret = process.env.AUTH0_CLIENT_SECRET!;
    }

    return AuthProviderFactory.create(config);
  }
}
```

### Usage in Next.js API Routes

```typescript
// app/api/projects/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { AuthProviderFactory } from '@/auth/AuthProviderFactory';

const authProvider = AuthProviderFactory.fromEnvironment();

export async function GET(request: NextRequest) {
  // Extract token from Authorization header
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Authenticate user (works with any provider)
    const user = await authProvider.getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check permission
    const permission = await authProvider.checkPermission(
      user.id,
      'project:read'
    );

    if (!permission.allowed) {
      return NextResponse.json({
        error: 'Forbidden',
        reason: permission.reason
      }, { status: 403 });
    }

    // Fetch projects (RLS will filter based on user)
    const projects = await getProjects(user.id);

    return NextResponse.json({ projects });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

---

## Mock Roles & Test Cases

### Seed Data for Testing

```sql
-- ============================================================================
-- TEST USERS
-- ============================================================================

-- Mock users (insert after Supabase Auth user creation)
INSERT INTO auth_profiles (id, email, full_name, system_role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin@alex-ai.dev', 'System Administrator', 'admin'),
  ('22222222-2222-2222-2222-222222222222', 'devops@alex-ai.dev', 'DevOps Engineer', 'admin'),
  ('33333333-3333-3333-3333-333333333333', 'owner1@example.com', 'Alice Owner', 'user'),
  ('44444444-4444-4444-4444-444444444444', 'owner2@example.com', 'Bob Owner', 'user'),
  ('55555555-5555-5555-5555-555555555555', 'dev1@example.com', 'Charlie Developer', 'user'),
  ('66666666-6666-6666-6666-666666666666', 'dev2@example.com', 'Diana Developer', 'user'),
  ('77777777-7777-7777-7777-777777777777', 'viewer1@example.com', 'Eve Viewer', 'user'),
  ('88888888-8888-8888-8888-888888888888', 'minimal@example.com', 'Frank Minimal (No Access)', 'user'),
  ('99999999-9999-9999-9999-999999999999', 'superdev@example.com', 'Grace Super Developer (Multi-Project)', 'user');

-- ============================================================================
-- TEST PROJECTS
-- ============================================================================

INSERT INTO projects (id, name, description, owner_id, category, status) VALUES
  ('proj_ecommerce', 'E-commerce Platform', 'Online store with cart and checkout', '33333333-3333-3333-3333-333333333333', 'ddd-web-architecture', 'active'),
  ('proj_blog', 'Blog CMS', 'Content management system for blogging', '44444444-4444-4444-4444-444444444444', 'ddd-web-architecture', 'active'),
  ('proj_mobile', 'Mobile App', 'React Native mobile application', '44444444-4444-4444-4444-444444444444', 'ddd-web-architecture', 'active'),
  ('proj_internal', 'Internal Tool', 'Admin-only internal tool', '11111111-1111-1111-1111-111111111111', 'ai-observability-diagnostics', 'active');

-- ============================================================================
-- TEST PROJECT MEMBERSHIPS
-- ============================================================================

INSERT INTO project_members (project_id, user_id, role_id, invited_by, status) VALUES
  -- E-commerce Platform (owner: Alice)
  ('proj_ecommerce', '33333333-3333-3333-3333-333333333333', 'owner', NULL, 'active'), -- Alice is owner
  ('proj_ecommerce', '55555555-5555-5555-5555-555555555555', 'developer', '33333333-3333-3333-3333-333333333333', 'active'), -- Charlie is developer
  ('proj_ecommerce', '77777777-7777-7777-7777-777777777777', 'viewer', '33333333-3333-3333-3333-333333333333', 'active'), -- Eve is viewer
  ('proj_ecommerce', '99999999-9999-9999-9999-999999999999', 'developer', '33333333-3333-3333-3333-333333333333', 'active'), -- Grace is developer

  -- Blog CMS (owner: Bob)
  ('proj_blog', '44444444-4444-4444-4444-444444444444', 'owner', NULL, 'active'), -- Bob is owner
  ('proj_blog', '66666666-6666-6666-6666-666666666666', 'developer', '44444444-4444-4444-4444-444444444444', 'active'), -- Diana is developer
  ('proj_blog', '99999999-9999-9999-9999-999999999999', 'developer', '44444444-4444-4444-4444-444444444444', 'active'), -- Grace is developer (multi-project)

  -- Mobile App (owner: Bob)
  ('proj_mobile', '44444444-4444-4444-4444-444444444444', 'owner', NULL, 'active'), -- Bob is owner
  ('proj_mobile', '55555555-5555-5555-5555-555555555555', 'developer', '44444444-4444-4444-4444-444444444444', 'active'), -- Charlie is developer

  -- Internal Tool (admin-only, owner: System Admin)
  ('proj_internal', '11111111-1111-1111-1111-111111111111', 'owner', NULL, 'active'); -- Admin is owner

-- ============================================================================
-- TEST API KEYS
-- ============================================================================

-- Hash of 'sk_test_charlie_vscode_key_12345' (for Charlie)
INSERT INTO api_keys (user_id, key_hash, key_prefix, name, scopes, is_active) VALUES
  ('55555555-5555-5555-5555-555555555555',
   '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', -- Dummy hash
   'sk_test_',
   'Charlie VSCode Extension - MacBook Pro',
   '["project:read", "code:write", "crew:chat", "sprint:view", "task:create", "task:update"]'::jsonb,
   TRUE);

-- Hash of 'sk_test_grace_vscode_key_67890' (for Grace, multi-project developer)
INSERT INTO api_keys (user_id, key_hash, key_prefix, name, scopes, is_active) VALUES
  ('99999999-9999-9999-9999-999999999999',
   '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', -- Dummy hash
   'sk_test_',
   'Grace VSCode Extension - Windows Desktop',
   '["project:read", "code:write", "crew:chat", "sprint:view", "task:create", "task:update"]'::jsonb,
   TRUE);
```

### Test Cases

#### Control Case 1: Absolute Access (Admin)

**User:** `admin@alex-ai.dev`
**Expected Permissions:**
- ✅ Can view ALL projects (including `proj_internal`)
- ✅ Can create new projects
- ✅ Can delete ANY project
- ✅ Can manage ALL users
- ✅ Can view ALL audit logs
- ✅ Can access system settings

**Test:**
```typescript
const admin = await authProvider.signIn({
  email: 'admin@alex-ai.dev',
  password: 'test_password'
});

// Should succeed
await checkPermission(admin.user.id, 'project:read', 'proj_ecommerce'); // ✅
await checkPermission(admin.user.id, 'project:delete', 'proj_blog'); // ✅
await checkPermission(admin.user.id, 'users:manage'); // ✅
await checkPermission(admin.user.id, 'system:manage'); // ✅
```

#### Control Case 2: Absolute Minimal Access (No Projects)

**User:** `minimal@example.com`
**Expected Permissions:**
- ❌ Cannot view ANY project (not a member)
- ❌ Cannot create projects (no permission)
- ❌ Cannot chat with crew
- ❌ Cannot write code
- ❌ Can only view their own profile

**Test:**
```typescript
const minimal = await authProvider.signIn({
  email: 'minimal@example.com',
  password: 'test_password'
});

// Should fail
await checkPermission(minimal.user.id, 'project:read', 'proj_ecommerce'); // ❌
await checkPermission(minimal.user.id, 'code:write', 'proj_blog'); // ❌
await checkPermission(minimal.user.id, 'crew:chat', 'proj_mobile'); // ❌
await checkPermission(minimal.user.id, 'project:create'); // ❌
```

#### Test Case 3: Project Owner (Multi-Project)

**User:** `owner2@example.com` (Bob)
**Projects Owned:** `proj_blog`, `proj_mobile`
**Expected Permissions:**
- ✅ Can manage `proj_blog` and `proj_mobile`
- ✅ Can invite developers to HIS projects
- ✅ Can configure crew for HIS projects
- ❌ Cannot access `proj_ecommerce` (not a member)
- ❌ Cannot access `proj_internal` (admin-only)

**Test:**
```typescript
const bob = await authProvider.signIn({
  email: 'owner2@example.com',
  password: 'test_password'
});

// Should succeed
await checkPermission(bob.user.id, 'project:read', 'proj_blog'); // ✅
await checkPermission(bob.user.id, 'project:update', 'proj_mobile'); // ✅
await checkPermission(bob.user.id, 'project:invite', 'proj_blog'); // ✅

// Should fail
await checkPermission(bob.user.id, 'project:read', 'proj_ecommerce'); // ❌ (not a member)
await checkPermission(bob.user.id, 'project:read', 'proj_internal'); // ❌ (admin-only)
```

#### Test Case 4: Developer (Single Project)

**User:** `dev1@example.com` (Charlie)
**Projects Assigned:** `proj_ecommerce`, `proj_mobile`
**Role:** Developer
**Expected Permissions:**
- ✅ Can read/write code in `proj_ecommerce` and `proj_mobile`
- ✅ Can chat with crew
- ✅ Can create/update tasks
- ❌ Cannot invite other developers
- ❌ Cannot change project settings
- ❌ Cannot access `proj_blog` (not a member)

**Test:**
```typescript
const charlie = await authProvider.signIn({
  email: 'dev1@example.com',
  password: 'test_password'
});

// Should succeed
await checkPermission(charlie.user.id, 'code:write', 'proj_ecommerce'); // ✅
await checkPermission(charlie.user.id, 'crew:chat', 'proj_ecommerce'); // ✅
await checkPermission(charlie.user.id, 'task:create', 'proj_mobile'); // ✅

// Should fail
await checkPermission(charlie.user.id, 'project:invite', 'proj_ecommerce'); // ❌
await checkPermission(charlie.user.id, 'project:settings', 'proj_ecommerce'); // ❌
await checkPermission(charlie.user.id, 'project:read', 'proj_blog'); // ❌ (not a member)
```

#### Test Case 5: Developer (Multi-Project)

**User:** `superdev@example.com` (Grace)
**Projects Assigned:** `proj_ecommerce`, `proj_blog`
**Role:** Developer (on both)
**Expected Permissions:**
- ✅ Can work on BOTH projects simultaneously
- ✅ Can switch context between projects in VSCode
- ✅ Crew chat history is project-specific
- ✅ API key works for both projects

**Test:**
```typescript
const grace = await authProvider.signIn({
  apiKey: 'sk_test_grace_vscode_key_67890'
});

// Should succeed on both projects
await checkPermission(grace.user.id, 'code:write', 'proj_ecommerce'); // ✅
await checkPermission(grace.user.id, 'code:write', 'proj_blog'); // ✅
await checkPermission(grace.user.id, 'crew:chat', 'proj_ecommerce'); // ✅
await checkPermission(grace.user.id, 'crew:chat', 'proj_blog'); // ✅

// Should fail
await checkPermission(grace.user.id, 'project:invite', 'proj_ecommerce'); // ❌
await checkPermission(grace.user.id, 'code:write', 'proj_mobile'); // ❌ (not a member)
```

#### Test Case 6: Viewer (Read-Only)

**User:** `viewer1@example.com` (Eve)
**Projects Assigned:** `proj_ecommerce`
**Role:** Viewer
**Expected Permissions:**
- ✅ Can view project information
- ✅ Can view code (read-only)
- ✅ Can view sprint status
- ❌ Cannot write code
- ❌ Cannot chat with crew
- ❌ Cannot create tasks

**Test:**
```typescript
const eve = await authProvider.signIn({
  email: 'viewer1@example.com',
  password: 'test_password'
});

// Should succeed
await checkPermission(eve.user.id, 'project:read', 'proj_ecommerce'); // ✅
await checkPermission(eve.user.id, 'code:read', 'proj_ecommerce'); // ✅
await checkPermission(eve.user.id, 'sprint:view', 'proj_ecommerce'); // ✅

// Should fail
await checkPermission(eve.user.id, 'code:write', 'proj_ecommerce'); // ❌
await checkPermission(eve.user.id, 'crew:chat', 'proj_ecommerce'); // ❌
await checkPermission(eve.user.id, 'task:create', 'proj_ecommerce'); // ❌
```

---

## Implementation Roadmap

### Phase 1: Database Schema (Week 1)

- [ ] Create Supabase project (if new) or add tables to existing
- [ ] Run migration SQL to create all tables
- [ ] Enable Row Level Security policies
- [ ] Seed test data (users, projects, memberships)
- [ ] Test RLS policies with Supabase client

**Deliverable:** Working Supabase database with RBAC schema

### Phase 2: Authentication Abstraction Layer (Week 1-2)

- [ ] Create `IAuthProvider` interface
- [ ] Implement `SupabaseAuthProvider`
- [ ] Implement API key authentication
- [ ] Create `AuthProviderFactory`
- [ ] Add tests for authentication flows

**Deliverable:** Provider-agnostic auth system

### Phase 3: Permission Checking System (Week 2)

- [ ] Create `checkPermission()` function
- [ ] Implement Supabase RPC for permission checks
- [ ] Add audit logging
- [ ] Create permission middleware for Next.js API routes
- [ ] Add tests for all permission scenarios

**Deliverable:** Working permission system with audit trail

### Phase 4: VSCode Extension Integration (Week 2-3)

- [ ] Update VSCode extension to use API keys
- [ ] Implement API key storage in VSCode secrets
- [ ] Add permission checks before file operations
- [ ] Show user role in status bar
- [ ] Handle permission errors gracefully

**Deliverable:** VSCode extension with RBAC

### Phase 5: Web Dashboard Integration (Week 3)

- [ ] Add Supabase Auth UI components
- [ ] Implement session-based authentication
- [ ] Add role-based UI (hide/show features based on role)
- [ ] Create user management page (admin only)
- [ ] Create project invitation flow

**Deliverable:** Web dashboard with RBAC UI

### Phase 6: Sync Mechanism (Week 3-4)

- [ ] Implement shared API routes
- [ ] Add Supabase Realtime subscriptions
- [ ] Test VSCode ↔ Web data sync
- [ ] Add conflict resolution
- [ ] Handle offline scenarios

**Deliverable:** Real-time sync between clients

### Phase 7: Testing (Week 4)

- [ ] Test all 6 control cases
- [ ] End-to-end testing (VSCode + Web)
- [ ] Load testing (1000+ concurrent users)
- [ ] Security audit
- [ ] Penetration testing

**Deliverable:** Comprehensive test suite

### Phase 8: Documentation & Deployment (Week 4-5)

- [ ] Document API for developers
- [ ] Create admin guide
- [ ] Create user onboarding flow
- [ ] Deploy to production
- [ ] Monitor for issues

**Deliverable:** Production-ready RBAC system

---

## Security Considerations

### API Key Management

**Generation:**
```typescript
// Generate cryptographically secure API key
const apiKey = `sk_live_${randomBytes(32).toString('hex')}`;
const keyHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(apiKey));
```

**Storage:**
- VSCode: Encrypted secrets API
- Web: Never store API keys (use sessions)
- Database: Hash only (SHA-256)

**Rotation:**
- Users can generate multiple API keys
- Old keys can be revoked
- Keys have expiration dates (optional)

### Row Level Security

**Why:** Prevents direct database queries from bypassing permissions
**How:** Supabase RLS policies enforce rules at PostgreSQL level
**Benefit:** Even if API is compromised, data is still protected

### Audit Logging

**What to log:**
- All permission checks (success/failure)
- All authentication attempts
- All data modifications
- All API requests

**Retention:** 90 days (configurable)
**Purpose:** Security incident investigation, compliance

---

## Next Steps

1. **Review this design** with stakeholders
2. **Approve database schema** and make adjustments
3. **Begin Phase 1** - Create Supabase tables
4. **Test with mock data** - Validate permission logic
5. **Implement Phase 2** - Auth abstraction layer
6. **Iterate** based on feedback

---

**Version:** 1.0.0
**Status:** Design Complete - Ready for Implementation
**Author:** Claude Code (Alex AI System)
**Approved By:** Pending review

---

**Questions or feedback?**
Contact the Alex AI crew via Observation Lounge or file an issue.
