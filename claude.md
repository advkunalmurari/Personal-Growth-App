# PROJECT CONSTITUTION — Law. Schemas + rules

## Schema definitions

### Database Schema (Supabase PostgreSQL)

*See LOS_Master_Build_Prompt Section 2 for full details.*

### Core Principles

- LLMs are probabilistic. Business logic must be deterministic. The B.L.A.S.T. protocol exists to enforce that boundary. Reliability is non-negotiable. Never guess at business logic. When in doubt, halt and ask.
- Zero perceived loading: Use optimistic UI everywhere. Update local state immediately on user action. Sync to server in background. Roll back on error.
- All destructive actions require two-step confirmation. No undo after confirmation.
- Mobile-first layout, dark mode by default.

### Known Limitations

- None yet recorded.

### Maintenance Log

- Pending initial deployment.
