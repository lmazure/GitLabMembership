# GitLab Membership Viewer Specification

## Overview
This application is a standalone HTML tool designed to visualize the membership hierarchy of GitLab groups and projects. It operates entirely on the client side without a backend server.

## User Inputs
The application will present a startup screen or a configuration header with the following inputs:
1.  **GitLab API Key**: A personal access token to authenticate with the GitLab API.
2.  **Start GitLab Group URL**: The full URL of the root group to inspect (e.g., `https://gitlab.com/my-org/my-group`).

## UI Layout
The main visualization is a **Matrix Table**.

### Rows (Hierarchy)
-   The rows represent the hierarchy of **Groups** and **Projects**.
-   **Structure**: Tree-grid structure.
    -   The "Start Group" is the root row.
    -   Sub-groups and Projects are child rows.
-   **Indentation**: Child items are indented relative to their parents to visually represent depth.
-   **Expand/Collapse**:
    -   Groups have an expand/collapse toggle (e.g., `[+]` / `[-]` icon).
    -   **Default State**: The Start Group is initially **collapsed**.
    -   Projects are leaf nodes and cannot be expanded.

### Columns (Members)
-   The columns represent individual **Members** found within the displayed groups and projects.
-   **Ordering**: Members are listed **alphabetically** by name or username.
-   **Dynamic Updates**:
    -   Initially, only members of the Start Group are shown.
    -   When a group is expanded, if its children (sub-groups/projects) introduce new members not yet visible, these members are added to the column list.
    -   Columns should be re-sorted alphabetically when new members are added.

### Cells (Roles)
-   The intersection of a Row (Group/Project) and a Column (Member) displays the **Role** of that member in that specific context.
-   Roles: `Guest`, `Reporter`, `Developer`, `Maintainer`, `Owner`, etc.
-   Empty cell indicates no membership.

### Header Styling
-   **Sticky Header**: The header row containing member names should remain visible at the top of the table when scrolling vertically.
-   **Rotated Headers**: Member names in the column headers should be rotated (e.g., vertical or angled) to conserve horizontal space and prevent truncation.

## Behavior & Logic

### Lazy Loading
-   **Trigger**: Fetching data happens only when a user expands a group.
-   **Process**:
    1.  User clicks "Expand" on Group A.
    2.  App checks if children of Group A are already loaded.
    3.  If not, App calls GitLab API to fetch:
        -   Sub-groups of Group A.
        -   Projects of Group A.
        -   Members of these new sub-groups and projects.
    4.  UI updates with new rows and potentially new columns.

### Data Fetching Strategy
-   **GitLab API**: Use the REST API.
-   **Endpoints**:
    -   Get Group Details: To resolve the initial URL to an ID.
    -   Get Sub-groups: `/groups/:id/subgroups`
    -   Get Projects: `/groups/:id/projects`
    -   Get Members: `/groups/:id/members` and `/projects/:id/members`.

## Technical Constraints
-   **Single File**: `index.html` containing HTML, CSS, and JS.
-   **No Server**: All logic runs in the browser.
-   **External Libraries**: Minimal. Vanilla JS preferred.

## Validation Steps
1.  User enters credentials.
2.  App verifies access by fetching the Start Group details.
3.  Table renders Root Group row.
4.  User expands Root Group.
5.  App fetches children and updates table.
