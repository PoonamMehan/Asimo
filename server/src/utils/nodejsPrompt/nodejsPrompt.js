export const nodejsPrompt = "index.js:\n```\n// run `node index.js` in the terminal\n\nconsole.log(`Hello Node.js v${process.versions.node}!`);\n\n```\n\npackage.json:\n```\n{\n  \"name\": \"node-starter\",\n  \"private\": true,\n  \"scripts\": {\n    \"test\": \"echo \\\"Error: no test specified\\\" && exit 1\"\n  }\n}\n\n```"

export const initialNodeJSFoldersAndFiles = {
    ".gitignore": "node_modules\n",
    "index.js": "// run `node index.js` in the terminal\n\nconsole.log(`Hello Node.js v${process.versions.node}!`);\n",
    "package.json": "{\n  \"name\": \"node-starter\",\n  \"private\": true,\n  \"scripts\": {\n    \"test\": \"echo \\\"Error: no test specified\\\" && exit 1\"\n  }\n}\n"
}