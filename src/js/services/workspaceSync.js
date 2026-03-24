import { WORKSPACE_SYNC_CONFIG } from '../config.js?v=20260325-53';

function getRequestHeaders(preferValue = '') {
    const headers = {
        apikey: WORKSPACE_SYNC_CONFIG.supabaseAnonKey,
        Authorization: `Bearer ${WORKSPACE_SYNC_CONFIG.supabaseAnonKey}`,
        'Content-Type': 'application/json'
    };

    if (preferValue) {
        headers.Prefer = preferValue;
    }

    return headers;
}

async function requestWorkspace(path, { method = 'GET', body, prefer = '' } = {}) {
    const response = await fetch(
        `${WORKSPACE_SYNC_CONFIG.supabaseUrl}/rest/v1/${WORKSPACE_SYNC_CONFIG.tableName}${path}`,
        {
            method,
            headers: getRequestHeaders(prefer),
            body: body ? JSON.stringify(body) : undefined
        }
    );

    if (!response.ok) {
        throw new Error(`Workspace sync failed with status ${response.status}`);
    }

    if (response.status === 204) {
        return null;
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
}

export function hasRemoteSyncConfig() {
    return Boolean(
        WORKSPACE_SYNC_CONFIG.supabaseUrl
        && WORKSPACE_SYNC_CONFIG.supabaseAnonKey
        && WORKSPACE_SYNC_CONFIG.tableName
    );
}

export async function fetchSharedWorkspace(accessCode) {
    if (!hasRemoteSyncConfig()) {
        return null;
    }

    const data = await requestWorkspace(
        `?select=payload,updated_at&access_code=eq.${encodeURIComponent(accessCode)}&limit=1`
    );
    const row = Array.isArray(data) ? data[0] : null;

    if (!row?.payload) {
        return null;
    }

    return {
        ...row.payload,
        updatedAt: typeof row.payload.updatedAt === 'string'
            ? row.payload.updatedAt
            : (typeof row.updated_at === 'string' ? row.updated_at : '')
    };
}

export async function pushSharedWorkspace(accessCode, snapshot) {
    if (!hasRemoteSyncConfig()) {
        return snapshot;
    }

    const updatedAt = typeof snapshot?.updatedAt === 'string' && snapshot.updatedAt
        ? snapshot.updatedAt
        : new Date().toISOString();
    const payload = {
        focus: typeof snapshot?.focus === 'string' ? snapshot.focus : '',
        music: snapshot?.music ?? null,
        updatedAt
    };
    const data = await requestWorkspace('?on_conflict=access_code', {
        method: 'POST',
        prefer: 'resolution=merge-duplicates,return=representation',
        body: [{
            access_code: accessCode,
            payload,
            updated_at: updatedAt
        }]
    });
    const row = Array.isArray(data) ? data[0] : null;

    return {
        ...payload,
        updatedAt: typeof row?.updated_at === 'string' ? row.updated_at : updatedAt
    };
}
