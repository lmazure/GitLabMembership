import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, 'dist');
const INDEX_HTML = path.join(__dirname, 'index.html');
const STYLES_CSS = path.join(__dirname, 'styles.css');
const SCRIPT_JS = path.join(DIST_DIR, 'script.js');
const OUTPUT_HTML = path.join(DIST_DIR, 'index.html');

function bundle() {
    console.log('Bundling...');

    if (!fs.existsSync(DIST_DIR)) {
        fs.mkdirSync(DIST_DIR);
    }

    let html = fs.readFileSync(INDEX_HTML, 'utf8');
    const css = fs.readFileSync(STYLES_CSS, 'utf8');
    const js = fs.readFileSync(SCRIPT_JS, 'utf8');

    // Inline CSS
    html = html.replace(
        '<link rel="stylesheet" href="styles.css">',
        `<style>\n${css}\n</style>`
    );

    // Inline JS
    // We replace the entire script module block
    const scriptReplacement = `<script type="module">\n${js}\n\ninit();\n</script>`;

    // Regex to match the existing script block
    // Matches <script type="module"> ... </script>
    // We assume there is only one such block as per the current index.html
    const scriptRegex = /<script type="module">[\s\S]*?<\/script>/;

    if (scriptRegex.test(html)) {
        html = html.replace(scriptRegex, scriptReplacement);
    } else {
        console.error('Could not find script tag to replace');
        process.exit(1);
    }

    fs.writeFileSync(OUTPUT_HTML, html);
    console.log(`Bundled to ${OUTPUT_HTML}`);
}

bundle();
