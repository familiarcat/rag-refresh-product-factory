# VS Code Chat File Tools

The AlexAI VS Code extension can apply filesystem operations proposed by chat responses.

## Enablement
Settings:
- `alexAi.enableChatFileTools` (default: true)
- `alexAi.autoApproveFileEdits` (default: false)

When `autoApproveFileEdits` is true, changes are applied without a confirmation dialog.

## Response Format
The assistant can include an `alexfs` fenced block in its message:

```alexfs
[
  { "op": "writeFile", "filePath": "src/example.ts", "content": "export const x = 1;\n", "createDirs": true },
  { "op": "applyPatch", "filePath": "src/app.ts", "edits": [ { "startLine": 10, "endLine": 12, "text": "new lines\nmore" } ] }
]
```

Supported ops:
- `writeFile`
- `applyPatch`
- `replaceSnippet`
