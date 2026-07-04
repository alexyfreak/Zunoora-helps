<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Zunoora Development Rules

### Error Detection & Auto-Fix
- After every file view/edit/write, always call the `diagnostics` tool to check for TypeScript errors
- Use the MCP `eslint` tool `fixAll` to auto-fix ESLint issues before finishing a task
- Before marking any task complete, run: `npm run lint` and `npx tsc --noEmit` to verify zero errors
- If diagnostics show errors, fix them immediately in the same turn before moving on
