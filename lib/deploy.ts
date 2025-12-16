/**
 * AWS Deployment Commands via SSM
 * Natural language deployment interface
 */

export interface DeployConfig {
  awsRegion: string;
  instanceId: string;
  ecrRepo: string;
  accountId: string;
}

export interface DeployResult {
  success: boolean;
  action: string;
  commandId?: string;
  message: string;
  details?: Record<string, unknown>;
}

// Default configuration (can be overridden via environment)
export const defaultConfig: DeployConfig = {
  awsRegion: process.env.AWS_REGION || 'us-east-2',
  instanceId: process.env.EC2_INSTANCE_ID || 'i-006cd2a8477f36489',
  ecrRepo: process.env.ECR_REPO || 'rag-refresh-product-factory',
  accountId: process.env.AWS_ACCOUNT_ID || '860268930466',
};

// Intent patterns for natural language parsing
export const deploymentIntents = {
  redeploy: [
    /redeploy/i,
    /deploy.*docker/i,
    /deploy.*container/i,
    /push.*production/i,
    /update.*production/i,
    /deploy.*remote/i,
    /deploy.*ec2/i,
    /deploy.*aws/i,
    /ship.*it/i,
    /deploy.*app/i,
    /restart.*container/i,
    /refresh.*deployment/i,
  ],
  status: [
    /deploy.*status/i,
    /container.*status/i,
    /is.*running/i,
    /check.*deploy/i,
    /health.*check/i,
    /app.*status/i,
  ],
  logs: [
    /deploy.*logs/i,
    /container.*logs/i,
    /show.*logs/i,
    /check.*logs/i,
  ],
  terraform: [
    /terraform.*apply/i,
    /terraform.*plan/i,
    /update.*infra/i,
    /infrastructure.*update/i,
    /deploy.*terraform/i,
  ],
};

export type DeployIntent = keyof typeof deploymentIntents;

/**
 * Detect deployment intent from natural language
 */
export function detectDeployIntent(query: string): DeployIntent | null {
  for (const [intent, patterns] of Object.entries(deploymentIntents)) {
    for (const pattern of patterns) {
      if (pattern.test(query)) {
        return intent as DeployIntent;
      }
    }
  }
  return null;
}

/**
 * Generate human-readable response for deployment actions
 */
export function formatDeployResponse(result: DeployResult): string {
  if (!result.success) {
    return `❌ **Deployment Failed**: ${result.message}`;
  }

  switch (result.action) {
    case 'redeploy':
      return `🚀 **Deployment Initiated!**

The application is being redeployed to production.

- **Command ID**: \`${result.commandId}\`
- **Target**: EC2 instance via SSM
- **Image**: Latest from ECR

Check status at https://rag.pbradygeorgen.com in ~60 seconds.`;

    case 'status':
      return `📊 **Deployment Status**

${result.message}

${result.details ? JSON.stringify(result.details, null, 2) : ''}`;

    case 'logs':
      return `📋 **Container Logs**

\`\`\`
${result.message}
\`\`\``;

    case 'terraform':
      return `🏗️ **Infrastructure Update**

${result.message}

⚠️ Terraform operations require local execution with proper credentials.`;

    default:
      return result.message;
  }
}

/**
 * Get AWS credentials from environment
 */
export function getAWSCredentials(): { accessKeyId: string; secretAccessKey: string } | null {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  
  if (!accessKeyId || !secretAccessKey) {
    return null;
  }
  
  return { accessKeyId, secretAccessKey };
}
