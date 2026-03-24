export const STORAGE_KEY = 'desk-clock-planner-state';
export const ACCESS_CODE_STORAGE_KEY = 'desk-clock-planner-access-code';
export const LAST_WORKSPACE_CODE_STORAGE_KEY = 'desk-clock-planner-workspace-code';
export const MIN_ACCESS_CODE_LENGTH = 8;

const runtimeConfig = window.WEB_CLOCK_CONFIG ?? {};

export const WORKSPACE_SYNC_CONFIG = {
    supabaseUrl: typeof runtimeConfig.supabaseUrl === 'string'
        ? runtimeConfig.supabaseUrl.replace(/\/+$/, '')
        : '',
    supabaseAnonKey: typeof runtimeConfig.supabaseAnonKey === 'string'
        ? runtimeConfig.supabaseAnonKey.trim()
        : '',
    tableName: typeof runtimeConfig.tableName === 'string' && runtimeConfig.tableName.trim()
        ? runtimeConfig.tableName.trim()
        : 'shared_workspaces'
};
