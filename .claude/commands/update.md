---
description: Update project documentation files
allowed-tools: Read(*), Glob(*), Edit(*), Bash(git diff:*), Bash(git log:*)
---

Review the codebase for recent changes and update the project documentation files to reflect the current state of the project:

1. **CLAUDE.md** - Update development guidelines, architecture, tools, and any new features or capabilities
2. **PROJECT_SUMMARY.md** - Update technical achievements, features, stack details, and learning outcomes
3. **README.md** - Update setup instructions, features list, and getting started guide

## Your Task:
1. **Analyze recent changes**: Use git diff, git log, glob for new files, and read key files to understand what's changed since the last documentation update
2. **Determine what to update**: Use your discretion to identify what information needs to be added or modified in each documentation file
3. **Make intelligent updates**: Edit each file to accurately reflect:
   - New dependencies or packages
   - New features or capabilities (e.g., Firecrawl MCP integration, agentic behavior)
   - Updated architecture or tools
   - New environment variables or configuration
   - Changes to commands or setup instructions
   - New API integrations or services

## Guidelines:
- Be comprehensive but concise
- Maintain the existing tone and structure of each file
- Don't remove important existing information - enhance and update it
- Focus on technical accuracy
- Ensure consistency across all three documentation files
- Update version numbers, package lists, and dependency information
- Highlight major architectural changes or new capabilities
- Add new features to the features list
- Update setup instructions if new environment variables or dependencies were added

After updating, provide a summary of what changes were made to each file.
