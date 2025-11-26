# GitLab Membership Viewer

A standalone HTML/TypeScript application to visualize the membership hierarchy of GitLab groups and projects in a matrix view.

## Purpose
This tool allows users to explore the hierarchy of a GitLab group (including subgroups and projects) and view the members and their roles at each level. It provides a clear, matrix-style visualization of who has access to what.

## Setup and Usage

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Build the Application**:
    ```bash
    npm run build
    ```
    This command compiles the TypeScript code and bundles everything into a single file at `dist/index.html`.

3.  **Run**:
    Open the generated `dist/index.html` file directly in your web browser.

## How to Run Tests
This project uses **Jest** with **ts-jest** for automated unit testing.

To run the tests:
```bash
npm test
```
