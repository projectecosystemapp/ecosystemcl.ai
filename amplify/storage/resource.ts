import { defineStorage } from '@aws-amplify/backend';

/**
 * ECOSYSTEMCL.AI Storage Configuration
 * S3 bucket for artifacts, logs, and workspace files
 */
export const storage = defineStorage({
  name: 'ecosystemStorage',
  access: (allow) => ({
    // Workspace files - private to workspace members
    'workspaces/{workspace_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete']),
      allow.groups(['admins']).to(['read', 'write', 'delete']),
    ],
    
    // Agent artifacts - read-only for users
    'artifacts/agents/*': [
      allow.authenticated.to(['read']),
      allow.groups(['admins']).to(['read', 'write', 'delete']),
    ],
    
    // User uploads - private per user
    'user-uploads/{user_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete']),
    ],
    
    // Execution logs - accessible to workspace members
    'logs/executions/{workspace_id}/*': [
      allow.authenticated.to(['read']),
      allow.groups(['admins']).to(['read', 'write']),
    ],
    
    // Public assets (documentation, templates)
    'public/*': [
      allow.guest.to(['read']),
      allow.authenticated.to(['read']),
    ],
    
    // Model outputs cache
    'cache/models/{workspace_id}/*': [
      allow.authenticated.to(['read', 'write']),
    ],
  }),
});