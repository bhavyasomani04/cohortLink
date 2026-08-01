---
name: update-history
description: Triggers at the end of a session or when asked to update project history. Analyzes the recent conversation to extract new best practices and updates history.md and the project status.
---

# Update History Skill

When this skill is triggered (either requested by the user or as a wrap-up to a complex session), follow these steps to ensure the project's institutional memory is preserved:

1. **Review Recent Work:**
   - Reflect on the tasks you just completed during this session.
   - Identify any recurring bugs, architectural decisions, or new best practices that were established (e.g., specific ways of handling state, styling, or routing).

2. **Update `history.md`:**
   - Open the `history.md` file at the root of the project.
   - If there are new rules, append a new entry detailing the newly discovered best practices. Include the Date, Context, Issue, and the Best Practice/Rule.
   - Update or add a **Project Status** section at the top (or bottom) of `history.md` to briefly summarize the current state of development based on what was just completed.

3. **Update `AGENTS.md`:**
   - If a new rule is strict and needs to be enforced for all future AI agents, append it to the `AGENTS.md` file located in `.agents/AGENTS.md`.

4. **Summarize:**
   - Let the user know what new rules were added and what the current project status is.
