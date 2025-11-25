# GitLab Membership Viewer

A standalone HTML/TypeScript application to visualize the membership hierarchy of GitLab groups and projects in a matrix view.

## Purpose
This tool allows users to explore the hierarchy of a GitLab group (including subgroups and projects) and view the members and their roles at each level. It provides a clear, matrix-style visualization of who has access to what.

## How to Run
Due to security restrictions with ES Modules (CORS), this application cannot be run directly by opening `index.html` in a browser. It requires a local web server.

1.  **Install Dependencies** (if not already done):
    ```bash
    npm install
    ```

2.  **Build the Application**:
    ```bash
    npm run build
    ```
    This compiles the TypeScript source files to JavaScript in the `dist/` directory.

3.  **Start the Application**:
    ```bash
    npm start
    ```
    This will build the project and start a local server (usually at `http://127.0.0.1:8080`).

4.  **Open in Browser**:
    Click the link provided in the terminal (e.g., `http://127.0.0.1:8080`) to use the application.

## How to Run Tests
This project uses **Jest** with **ts-jest** for automated unit testing.

To run the tests:
```bash
npm test
```
