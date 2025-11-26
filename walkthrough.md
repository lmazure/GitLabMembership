# Walkthrough - Single File Build System

I have successfully removed the dependency on a local HTTP server and implemented a build system that generates a single, standalone HTML file.

## Changes

### Build System
- **Created `bundle.js`**: A custom Node.js script that inlines `styles.css` and the compiled `script.js` into `index.html`.
- **Updated `package.json`**:
    - Removed `http-server` dependency.
    - Updated `build` script to run `tsc` followed by `node bundle.js`.
    - Removed `start` script as it's no longer needed.

### Documentation
- **Updated `README.md`**: Removed instructions for `npm start` and added instructions for `npm run build` and opening the generated file.
- **Updated `specification.md`**: Reflected the new build process and removal of the local server requirement.

## Verification Results

### Automated Build
Ran `wsl npm run build` successfully.
```text
> gitlabmembership@1.0.0 build
> node node_modules/typescript/bin/tsc && node bundle.js

Bundling...
Bundled to /mnt/g/Documents/repos/GitLabMembership/dist/index.html
```

### File Verification
Verified the output file `dist/index.html` exists and has the expected size (~16KB), confirming that content was inlined.
```text
-rwxrwxrwx 1 laurent laurent 16694 Nov 26 07:36 dist/index.html
```

## Next Steps
You can now simply run `npm run build` (or `wsl npm run build` if using WSL) and open `dist/index.html` in any browser to use the application.
