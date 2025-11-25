// Interfaces
interface Row {
    type: 'group' | 'project';
    id: number;
    name: string;
    full_path: string;
    path_with_namespace?: string;
    level: number;
    expanded: boolean;
    loaded: boolean;
    parentId: number | null;
    hasChildren: boolean;
    isLoading: boolean;
}

interface Column {
    id: number;
    name: string;
    username: string;
}

interface State {
    apiKey: string;
    baseUrl: string;
    rows: Row[];
    columns: Column[];
    memberships: Record<string, string>; // Key: rowId_colId, Value: role (string)
    loading: boolean;
}

interface GitLabGroup {
    id: number;
    name: string;
    full_path: string;
}

interface GitLabProject {
    id: number;
    name: string;
    full_path: string;
    path_with_namespace: string;
}

interface GitLabMember {
    id: number;
    name: string;
    username: string;
    access_level: number;
}

// State
export const state: State = {
    apiKey: '',
    baseUrl: '',
    rows: [],
    columns: [],
    memberships: {},
    loading: false
};

// DOM Elements Getter
function getEls() {
    return {
        apiKey: document.getElementById('apiKey') as HTMLInputElement,
        groupUrl: document.getElementById('groupUrl') as HTMLInputElement,
        loadBtn: document.getElementById('loadBtn') as HTMLButtonElement,
        errorMsg: document.getElementById('errorMsg') as HTMLElement,
        loading: document.querySelector('.loading') as HTMLElement,
        matrixContainer: document.getElementById('matrixContainer') as HTMLElement
    };
}

// Initialization
export function init(): void {
    const els = getEls();
    if (els.loadBtn) {
        els.loadBtn.addEventListener('click', () => initLoad());
    }
    // Expose to window for onclick in HTML
    (window as any).toggleGroup = toggleGroup;
}

export async function initLoad(): Promise<void> {
    const els = getEls();
    state.apiKey = els.apiKey.value.trim();
    const groupUrlStr = els.groupUrl.value.trim();

    if (!state.apiKey || !groupUrlStr) {
        showError('Please provide both API Key and Group URL');
        return;
    }

    showError('');
    setLoading(true);

    try {
        // Reset State
        state.rows = [];
        state.columns = [];
        state.memberships = {};

        // 1. Determine Base URL and Group Path
        const { baseUrl, groupPath } = parseGitLabUrl(groupUrlStr);
        state.baseUrl = baseUrl;

        // 2. Fetch Root Group
        const groupData = await fetchGitLab<GitLabGroup>(`groups/${encodeURIComponent(groupPath)}`);

        // 3. Initialize Root Row
        const rootRow: Row = {
            type: 'group',
            id: groupData.id,
            name: groupData.name,
            full_path: groupData.full_path,
            level: 0,
            expanded: false,
            loaded: false,
            parentId: null,
            hasChildren: true, // Assume root has children initially or we check later
            isLoading: false
        };
        state.rows.push(rootRow);

        // 4. Fetch Initial Members (Root Group)
        await fetchAndStoreMembers(rootRow);

        // 5. Render
        renderMatrix();
    } catch (err: any) {
        showError(err.message);
        console.error(err);
    } finally {
        setLoading(false);
    }
}

export function parseGitLabUrl(urlStr: string): { baseUrl: string; groupPath: string } {
    try {
        const url = new URL(urlStr);
        // Example: https://gitlab.com/my-org/group
        // Base API: https://gitlab.com/api/v4/
        const baseUrl = `${url.origin}/api/v4/`;
        const groupPath = url.pathname.substring(1); // Remove leading /
        return { baseUrl, groupPath };
    } catch (e) {
        throw new Error('Invalid URL format');
    }
}

export async function fetchGitLab<T>(endpoint: string): Promise<T> {
    const url = `${state.baseUrl}${endpoint}`;
    const response = await fetch(url, {
        headers: {
            'PRIVATE-TOKEN': state.apiKey
        }
    });

    if (!response.ok) {
        if (response.status === 401) throw new Error('Unauthorized: Check your API Key');
        if (response.status === 404) throw new Error('Not Found: Check URL or Permissions');
        throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
}

export async function fetchAndStoreMembers(row: Row): Promise<void> {
    const endpoint = row.type === 'group'
        ? `groups/${row.id}/members`
        : `projects/${row.id}/members`;

    const members = await fetchGitLab<GitLabMember[]>(endpoint);

    let newColumns = false;
    members.forEach(m => {
        // Add to columns if not exists
        if (!state.columns.find(c => c.id === m.id)) {
            state.columns.push({
                id: m.id,
                name: m.name,
                username: m.username
            });
            newColumns = true;
        }

        // Store Membership
        // AccessLevel is numeric, we might want string representation
        // 10: Guest, 20: Reporter, 30: Developer, 40: Maintainer, 50: Owner
        const roleName = getRoleName(m.access_level);
        state.memberships[`${row.id}_${m.id}`] = roleName;
    });

    if (newColumns) {
        state.columns.sort((a, b) => a.name.localeCompare(b.name));
    }
}

export function getRoleName(level: number): string {
    const roles: Record<number, string> = {
        10: 'Guest',
        15: 'Planner',
        20: 'Reporter',
        30: 'Developer',
        40: 'Maintainer',
        50: 'Owner'
    };
    return roles[level] || level.toString();
}

export async function toggleGroup(rowId: number): Promise<void> {
    const row = state.rows.find(r => r.id === rowId);
    if (!row) return;

    if (row.expanded) {
        // Collapse: Hide children
        row.expanded = false;
        renderMatrix();
    } else {
        // Expand
        row.expanded = true;
        if (!row.loaded) {
            // Row-inline loading
            row.isLoading = true;
            renderMatrix(); // Update UI to show spinner

            try {
                await loadChildren(row);
                row.loaded = true;
            } catch (e: any) {
                showError(e.message);
                row.expanded = false; // Revert expansion on error
            } finally {
                row.isLoading = false;
            }
        }
        renderMatrix();
    }
}

export async function loadChildren(parentRow: Row): Promise<void> {
    // Fetch Subgroups
    const subgroups = await fetchGitLab<GitLabGroup[]>(`groups/${parentRow.id}/subgroups`);
    // Fetch Projects
    const projects = await fetchGitLab<GitLabProject[]>(`groups/${parentRow.id}/projects`);

    // Create new row objects
    const newRows: Row[] = [];

    subgroups.forEach(g => {
        newRows.push({
            type: 'group',
            id: g.id,
            name: g.name,
            full_path: g.full_path,
            level: parentRow.level + 1,
            expanded: false,
            loaded: false,
            parentId: parentRow.id,
            hasChildren: true,
            isLoading: false
        });
    });

    projects.forEach(p => {
        newRows.push({
            type: 'project',
            id: p.id,
            name: p.name,
            full_path: p.full_path,
            path_with_namespace: p.path_with_namespace,
            level: parentRow.level + 1,
            expanded: false, // Projects don't expand
            loaded: true, // Nothing to load for projects (except members which we do next)
            parentId: parentRow.id,
            hasChildren: false,
            isLoading: false
        });
    });

    // Insert new rows after parent
    const parentIndex = state.rows.findIndex(r => r.id === parentRow.id);
    state.rows.splice(parentIndex + 1, 0, ...newRows);

    // Fetch members for all new rows
    // Parallelize for performance?
    const promises = newRows.map(r => fetchAndStoreMembers(r));
    await Promise.all(promises);
}

function getVisibleRows(): Row[] {
    // Flatten list is already in order.
    // We just need to skip rows whose parents are collapsed.
    const visible: Row[] = [];
    // We can track "current visibility scope"
    // But simpler: check if all ancestors are expanded.
    // Optimization: Iterate and maintain a "skip until level X" flag?

    // Better: Recursive check or map of expanded IDs.
    // Since it's a flat list in tree order:
    // If a parent is collapsed, skip all its descendants.

    let skipUntilLevel: number | null = null;

    for (const row of state.rows) {
        if (skipUntilLevel !== null) {
            if (row.level > skipUntilLevel) {
                continue; // Skip descendant
            } else {
                skipUntilLevel = null; // End of skipped block
            }
        }

        visible.push(row);

        if (row.type === 'group' && !row.expanded) {
            skipUntilLevel = row.level;
        }
    }
    return visible;
}

function renderMatrix(): void {
    const els = getEls();
    const visibleRows = getVisibleRows();
    // const totalCols = state.columns.length + 1; // +1 for Row Header

    // Update Grid Template
    // First col auto (or fixed width), others auto
    els.matrixContainer.style.gridTemplateColumns = `300px repeat(${state.columns.length}, minmax(40px, auto))`;

    let html = '<div class="matrix-table" style="grid-template-columns: 300px repeat(' + state.columns.length + ', minmax(40px, 1fr));">';

    // 1. Header Row
    // Top-Left Corner
    html += '<div class="header-cell row-header" style="z-index:20">Hierarchy</div>';
    // Member Columns
    state.columns.forEach(col => {
        html += `<div class="header-cell">
        <div class="header-content">${col.name}</div>
    </div>`;
    });

    // 2. Data Rows
    visibleRows.forEach(row => {
        // Row Header
        const indent = row.level * 20;

        let toggle = '';
        if (row.type === 'group') {
            if (row.isLoading) {
                toggle = `<span class="loading-spinner"></span>`;
            } else {
                toggle = `<span class="expand-toggle" onclick="toggleGroup(${row.id})">${row.expanded ? '[-]' : '[+]'}</span>`;
            }
        } else {
            toggle = `<span class="indent"></span>`;
        }

        const icon = row.type === 'group' ? '📂' : '📄';

        // Build member page URL
        // Extract origin from baseUrl (e.g., https://gitlab.com from https://gitlab.com/api/v4/)
        const urlObj = new URL(state.baseUrl);
        const origin = urlObj.origin; // e.g., https://gitlab.com

        const memberPageUrl = row.type === 'group'
            ? `${origin}/groups/${row.full_path}/-/group_members`
            : `${origin}/${row.path_with_namespace || row.full_path}/-/project_members`;

        html += `<div class="cell row-header" style="padding-left: ${10 + indent}px">
        ${toggle} ${icon} ${row.name} <a href="${memberPageUrl}" target="_blank" class="member-link" title="Open member page">👥</a>
    </div>`;

        // Member Cells
        state.columns.forEach(col => {
            const role = state.memberships[`${row.id}_${col.id}`] || '';
            const roleClass = role ? `role-${role.toLowerCase()}` : '';
            // Use first letter for compact view if needed, or full role
            // For rotated headers, cells are usually narrow. 
            // Let's keep full role for now but maybe abbreviate if requested later.
            html += `<div class="cell ${roleClass}" title="${role}">${role}</div>`;
        });
    });

    html += '</div>';
    els.matrixContainer.innerHTML = html;
}

function setLoading(isLoading: boolean): void {
    const els = getEls();
    state.loading = isLoading;
    els.loading.style.display = isLoading ? 'block' : 'none';
    els.loadBtn.disabled = isLoading;
}

function showError(msg: string): void {
    const els = getEls();
    els.errorMsg.textContent = msg;
}
