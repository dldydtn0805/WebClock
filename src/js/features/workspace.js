import {
    ACCESS_CODE_STORAGE_KEY,
    LAST_WORKSPACE_CODE_STORAGE_KEY,
    MIN_ACCESS_CODE_LENGTH
} from '../config.js?v=20260325-53';
import { applySharedState, getSharedStateSnapshot } from '../state.js?v=20260325-53';
import {
    fetchSharedWorkspace,
    hasRemoteSyncConfig,
    pushSharedWorkspace
} from '../services/workspaceSync.js?v=20260325-53';

function normalizeAccessCode(value) {
    return String(value ?? '')
        .replace(/\D/g, '')
        .slice(0, 16);
}

function formatAccessCode(code) {
    if (code.length === 8) {
        return `${code.slice(0, 4)}-${code.slice(4)}`;
    }

    if (code.length === 10) {
        return `${code.slice(0, 3)}-${code.slice(3, 6)}-${code.slice(6)}`;
    }

    if (code.length === 11) {
        return `${code.slice(0, 3)}-${code.slice(3, 7)}-${code.slice(7)}`;
    }

    return code;
}

function getSnapshotKey(snapshot) {
    return JSON.stringify({
        focus: snapshot?.focus ?? '',
        music: snapshot?.music ?? null
    });
}

function hasMeaningfulSharedState(snapshot) {
    return Boolean(
        snapshot?.focus?.trim()
        || snapshot?.music?.url
        || snapshot?.music?.videoId
        || snapshot?.music?.title
        || snapshot?.music?.tracks?.length
    );
}

function getTimestampValue(value) {
    const timestamp = Date.parse(value ?? '');
    return Number.isFinite(timestamp) ? timestamp : 0;
}

function isRemoteSnapshotNewer(remoteSnapshot, localSnapshot) {
    return getTimestampValue(remoteSnapshot?.updatedAt) > getTimestampValue(localSnapshot?.updatedAt);
}

export function createWorkspaceFeature({
    state,
    elements,
    persistLocalState,
    onSharedStateChange
}) {
    let currentAccessCode = '';
    let pendingSyncTimerId = 0;
    let syncPromise = null;
    let lastSyncedSnapshotKey = getSnapshotKey(getSharedStateSnapshot(state));

    function renderWorkspaceHeader(code = currentAccessCode) {
        if (elements.workspaceCodeDisplay) {
            elements.workspaceCodeDisplay.textContent = code ? formatAccessCode(code) : '번호 미연결';
        }

        if (elements.workspaceResetButton) {
            elements.workspaceResetButton.disabled = !code;
        }
    }

    function renderStatus(message, stateName = 'idle') {
        if (!elements.workspaceStatus) {
            return;
        }

        elements.workspaceStatus.textContent = message;
        elements.workspaceStatus.dataset.state = stateName;
    }

    function renderGateError(message = '') {
        if (!elements.workspaceGateError) {
            return;
        }

        elements.workspaceGateError.textContent = message;
        elements.workspaceGateError.hidden = !message;
    }

    function setBusy(isBusy) {
        if (elements.workspaceCodeInput) {
            elements.workspaceCodeInput.disabled = isBusy;
        }

        if (elements.workspaceGateSubmitButton) {
            elements.workspaceGateSubmitButton.disabled = isBusy;
            elements.workspaceGateSubmitButton.textContent = isBusy ? '연결 중...' : '입장하기';
        }
    }

    function lockWorkspace() {
        elements.body.classList.add('is-workspace-locked');

        if (elements.workspaceGate) {
            elements.workspaceGate.hidden = false;
        }

        renderWorkspaceHeader('');
        renderStatus('번호를 연결하면 여러 기기에서 재생목록을 이어서 쓸 수 있어요.', 'locked');

        window.setTimeout(() => {
            elements.workspaceCodeInput?.focus();
        }, 0);
    }

    function unlockWorkspace() {
        elements.body.classList.remove('is-workspace-locked');

        if (elements.workspaceGate) {
            elements.workspaceGate.hidden = true;
        }

        renderWorkspaceHeader(currentAccessCode);
    }

    function updateLocalSyncTimestamp(updatedAt) {
        if (typeof updatedAt !== 'string' || !updatedAt) {
            return;
        }

        state.updatedAt = updatedAt;
        persistLocalState({ touch: false });
    }

    async function syncNow() {
        if (!currentAccessCode || !hasRemoteSyncConfig()) {
            return;
        }

        if (pendingSyncTimerId) {
            window.clearTimeout(pendingSyncTimerId);
            pendingSyncTimerId = 0;
        }

        const snapshot = getSharedStateSnapshot(state);
        const nextSnapshotKey = getSnapshotKey(snapshot);

        if (!hasMeaningfulSharedState(snapshot)) {
            renderStatus('번호는 연결됐어요. 저장할 내용이 생기면 자동으로 동기화해요.', 'synced');
            return;
        }

        if (nextSnapshotKey === lastSyncedSnapshotKey) {
            renderStatus('이 기기와 서버 상태가 이미 맞춰져 있어요.', 'synced');
            return;
        }

        if (syncPromise) {
            return syncPromise;
        }

        renderStatus('변경 내용을 서버에 저장하는 중이에요.', 'syncing');

        syncPromise = pushSharedWorkspace(currentAccessCode, snapshot)
            .then((savedSnapshot) => {
                lastSyncedSnapshotKey = getSnapshotKey(savedSnapshot);
                updateLocalSyncTimestamp(savedSnapshot.updatedAt);
                renderStatus('여러 기기에서 바로 이어쓸 수 있게 저장했어요.', 'synced');
            })
            .catch((error) => {
                console.error('Workspace sync failed.', error);
                renderStatus('서버 동기화가 잠시 실패했어요. 이 기기 저장은 유지되고 있어요.', 'error');
            })
            .finally(() => {
                syncPromise = null;
            });

        return syncPromise;
    }

    async function connectWorkspace(rawCode) {
        const nextAccessCode = normalizeAccessCode(rawCode);

        if (nextAccessCode.length < MIN_ACCESS_CODE_LENGTH) {
            renderGateError(`번호는 숫자 ${MIN_ACCESS_CODE_LENGTH}자리 이상으로 넣어 주세요.`);
            lockWorkspace();
            return false;
        }

        const previousWorkspaceCode = localStorage.getItem(LAST_WORKSPACE_CODE_STORAGE_KEY) ?? '';
        const isWorkspaceSwitch = Boolean(previousWorkspaceCode && previousWorkspaceCode !== nextAccessCode);

        currentAccessCode = nextAccessCode;
        localStorage.setItem(ACCESS_CODE_STORAGE_KEY, nextAccessCode);
        renderGateError('');
        renderWorkspaceHeader(nextAccessCode);
        setBusy(true);
        unlockWorkspace();

        try {
            if (!hasRemoteSyncConfig()) {
                renderStatus('서버 설정 전이라 지금은 이 기기 저장만 사용 중이에요.', 'local');
                localStorage.setItem(LAST_WORKSPACE_CODE_STORAGE_KEY, nextAccessCode);
                return true;
            }

            renderStatus('서버 작업공간을 연결하는 중이에요.', 'syncing');

            const remoteSnapshot = await fetchSharedWorkspace(nextAccessCode);
            const localSnapshot = getSharedStateSnapshot(state);

            if (remoteSnapshot && (isWorkspaceSwitch || isRemoteSnapshotNewer(remoteSnapshot, localSnapshot))) {
                applySharedState(state, remoteSnapshot);
                persistLocalState({ touch: false });
                lastSyncedSnapshotKey = getSnapshotKey(remoteSnapshot);
                onSharedStateChange?.();
                renderStatus('다른 기기에서 쓰던 재생목록을 불러왔어요.', 'synced');
            } else if (!isWorkspaceSwitch && hasMeaningfulSharedState(localSnapshot)) {
                const savedSnapshot = await pushSharedWorkspace(nextAccessCode, localSnapshot);
                lastSyncedSnapshotKey = getSnapshotKey(savedSnapshot);
                updateLocalSyncTimestamp(savedSnapshot.updatedAt);
                renderStatus(
                    remoteSnapshot
                        ? '현재 기기 상태로 서버를 최신화했어요.'
                        : '현재 기기 상태를 새 작업공간에 저장했어요.',
                    'synced'
                );
            } else {
                lastSyncedSnapshotKey = getSnapshotKey(localSnapshot);
                renderStatus(
                    remoteSnapshot
                        ? '서버 작업공간에 연결됐어요.'
                        : '새 번호로 연결됐어요. 다음 변경부터 서버에 저장할게요.',
                    'synced'
                );
            }

            localStorage.setItem(LAST_WORKSPACE_CODE_STORAGE_KEY, nextAccessCode);
            return true;
        } catch (error) {
            console.error('Workspace connection failed.', error);
            renderStatus('서버 연결이 잠시 실패했어요. 이 기기 저장은 계속 사용할 수 있어요.', 'error');
            return true;
        } finally {
            setBusy(false);
        }
    }

    function scheduleSync() {
        if (!currentAccessCode || !hasRemoteSyncConfig()) {
            return;
        }

        if (pendingSyncTimerId) {
            window.clearTimeout(pendingSyncTimerId);
        }

        renderStatus('변경 내용을 정리한 뒤 서버에 보낼 준비를 하고 있어요.', 'syncing');
        pendingSyncTimerId = window.setTimeout(() => {
            void syncNow();
        }, 800);
    }

    async function initialize() {
        const savedAccessCode = normalizeAccessCode(localStorage.getItem(ACCESS_CODE_STORAGE_KEY) ?? '');

        renderWorkspaceHeader(savedAccessCode);

        if (!savedAccessCode) {
            lockWorkspace();
            return;
        }

        if (elements.workspaceCodeInput) {
            elements.workspaceCodeInput.value = savedAccessCode;
        }

        await connectWorkspace(savedAccessCode);
    }

    function bindEvents() {
        elements.workspaceGateForm?.addEventListener('submit', async (event) => {
            event.preventDefault();
            await connectWorkspace(elements.workspaceCodeInput?.value ?? '');
        });

        elements.workspaceCodeInput?.addEventListener('input', () => {
            const normalized = normalizeAccessCode(elements.workspaceCodeInput.value);
            elements.workspaceCodeInput.value = normalized;

            if (elements.workspaceGateError && !elements.workspaceGateError.hidden) {
                renderGateError('');
            }
        });

        elements.workspaceResetButton?.addEventListener('click', () => {
            currentAccessCode = '';
            localStorage.removeItem(ACCESS_CODE_STORAGE_KEY);

            if (pendingSyncTimerId) {
                window.clearTimeout(pendingSyncTimerId);
                pendingSyncTimerId = 0;
            }

            renderGateError('');

            if (elements.workspaceCodeInput) {
                elements.workspaceCodeInput.value = '';
            }

            lockWorkspace();
        });
    }

    return {
        bindEvents,
        initialize,
        scheduleSync,
        syncNow
    };
}
