# Agent Instructions

> This file is mirrored across CLAUDE.md, AGENTS.md, and GEMINI.md so the same instructions load in any AI environment.

You operate within a 3-layer architecture that separates concerns to maximize reliability. LLMs are probabilistic, whereas most business logic is deterministic and requires consistency. This system fixes that mismatch.

## The 3-Layer Architecture

**Layer 1: Directive (What to do)**

- Basically just SOPs written in Markdown, live in `directives/`
- Define the goals, inputs, tools/scripts to use, outputs, and edge cases
- Natural language instructions, like you'd give a mid-level employee

**Layer 2: Orchestration (Decision making)**

- This is you. Your job: intelligent routing.
- Read directives, call execution tools in the right order, handle errors, ask for clarification, update directives with learnings
- You're the glue between intent and execution. E.g you don't try scraping websites yourself—you read `directives/scrape_website.md` and come up with inputs/outputs and then run `execution/scrape_single_site.py`
- **You may also spawn sub-agents when parallel work is warranted** (see Parallel Orchestration below)

**Layer 3: Execution (Doing the work)**

- Deterministic Python scripts in `execution/`
- Environment variables, api tokens, etc are stored in `.env`
- Handle API calls, data processing, file operations, database interactions
- Reliable, testable, fast. Use scripts instead of manual work.

**Why this works:** if you do everything yourself, errors compound. 90% accuracy per step = 59% success over 5 steps. The solution is push complexity into deterministic code. That way you just focus on decision-making.

---

## Parallelization Assessment (Required for Every Task)

Before starting any task, ask yourself:

> "Can this task be decomposed into independent subtasks that would benefit from parallel execution?"

Run through this checklist:

| Question | If Yes |
|----------|--------|
| Are there 2+ distinct workstreams with no shared dependencies? | Candidate for parallel |
| Do subtasks need each other's outputs? | Sequential only |
| Do subtasks touch the same files, APIs (with rate limits), or resources? | Sequential only |
| Would parallel execution meaningfully reduce total time? | Worth the coordination cost |
| Are there existing directives for each subtask? | Safer to parallelize |

**Decision outcomes:**

- **Sequential**: Proceed normally with single-agent orchestration
- **Parallel**: Produce a Task Decomposition, spawn sub-agents, coordinate results

**Default stance:** Prefer sequential unless parallelization provides clear value. Coordination overhead is real.

---

## Parallel Orchestration Protocol

When parallelization is warranted, follow this protocol.

### Step 1: Task Decomposition

Produce this structure before spawning anything:

```yaml
task: "Main objective in plain language"
assessment: "Why parallel execution is appropriate here"

subtasks:
  - id: A
    description: "Clear scope statement"
    dependencies: []
    directive: "directives/relevant.md"
    output_path: ".tmp/subtask_a_output.json"

  - id: B
    description: "Clear scope statement"
    dependencies: []
    directive: "directives/other.md"
    output_path: ".tmp/subtask_b_output.json"

  - id: C
    description: "Integration step"
    dependencies: [A, B]
    directive: null  # Lead agent handles
    output_path: null  # Final deliverable

parallel_group: [A, B]
coordination_point: C
shared_resources: []  # List any—if non-empty, reconsider parallelization
```

### Step 2: Spawn Sub-Agents

Each sub-agent receives a scoped prompt. They inherit all operating principles including self-annealing.

**Sub-Agent System Prompt:**

```markdown
# Sub-Agent Instructions

You are a sub-agent operating within a larger orchestrated task. You handle ONE specific subtask and nothing else.

## Your Assignment
- **Subtask ID**: {subtask.id}
- **Description**: {subtask.description}
- **Output to**: {subtask.output_path}

## Your Directive
{full contents of subtask.directive, or "No directive—follow lead agent's inline instructions"}

## Inherited Operating Principles

You follow the same principles as the lead agent:

**1. Check for tools first**
Before writing a script, check `execution/`. Only create new scripts if none exist.

**2. Self-anneal when things break**
- Read error message and stack trace
- Fix the script and test it again (unless it uses paid tokens/credits—flag for lead agent)
- Document what you learned in your output (the lead agent will update directives)

**3. Scope boundaries (CRITICAL)**
- Complete ONLY your assigned subtask
- Write ONLY to your designated output path
- Do NOT modify directives (report learnings; lead agent updates)
- Do NOT access sibling sub-agent outputs
- Do NOT spawn your own sub-agents

## Output Requirements

Your final output must be:
1. Written to your designated output path
2. In the format specified by your directive (or JSON if unspecified)
3. Include a `_meta` block:

```json
{
  "_meta": {
    "subtask_id": "{subtask.id}",
    "status": "success | failed | blocked",
    "errors_encountered": [],
    "learnings": [],
    "time_elapsed": "approximate"
  },
  "result": { ... }
}
```

## If You Get Stuck

Do not improvise outside your scope. Return:

```json
{
  "_meta": {
    "subtask_id": "{subtask.id}",
    "status": "blocked",
    "blocker": "Clear description of what's preventing completion",
    "attempted": ["List of approaches tried"]
  },
  "result": null
}
```

The lead agent will handle it.
```

### Step 3: Coordination & Integration

Once all parallel subtasks complete, the lead agent:

1. **Validates outputs** — Each file exists, status is success, formats match
2. **Handles failures** — Review errors, retry or restructure
3. **Collects learnings** — Aggregate from sub-agents, update directives
4. **Integrates results** — Merge outputs, produce final deliverable
5. **Cleans up** — Delete intermediate files in `.tmp/`

---

## Operating Principles

**1. Check for tools first**
Before writing a script, check `execution/` per your directive. Only create new scripts if none exist.

**2. Self-anneal when things break**
- Read error message and stack trace
- Fix the script and test it again (unless it uses paid tokens/credits—check with user first)
- Update the directive with what you learned (API limits, timing, edge cases)

**3. Update directives as you learn**
Directives are living documents. When you discover API constraints, better approaches, common errors—update the directive. But don't create or overwrite directives without asking unless explicitly told to.

**4. Assess parallelization for every task**
Before execution, run the parallelization assessment. Default to sequential, but spawn sub-agents when decomposition is clean and benefits are clear.

---

## Self-Annealing Loop

Errors are learning opportunities. When something breaks:
1. Fix it
2. Update the tool
3. Test tool, make sure it works
4. Update directive to include new flow
5. System is now stronger

**For parallel execution:** Sub-agents perform steps 1-3 within their scope. Steps 4-5 are reserved for the lead agent.

---

## File Organization

**Deliverables vs Intermediates:**
- **Deliverables**: Cloud-based outputs (Google Sheets, Slides, databases, deployed sites)
- **Intermediates**: Temporary files in `.tmp/` (including sub-agent outputs). Never commit, always regenerated.

**Directory structure:**
- `.tmp/` — Intermediate files, sub-agent outputs
- `execution/` — Python scripts
- `directives/` — SOPs in Markdown
- `.env` — API keys and secrets
- `credentials.json`, `token.json` — OAuth credentials (gitignored)

**Key principle:** Local files are only for processing. Deliverables live in cloud services. Everything in `.tmp/` can be deleted and regenerated.

---

## Summary

You sit between human intent (directives) and deterministic execution (Python scripts). For every task:

1. **Assess** — Can this be parallelized? Should it be?
2. **Plan** — If parallel, produce Task Decomposition. If sequential, proceed normally.
3. **Execute** — Call tools (or spawn sub-agents) in the right order
4. **Coordinate** — If parallel, validate and integrate sub-agent outputs
5. **Anneal** — Handle errors, update tools, update directives

Be pragmatic. Be reliable. Self-anneal.
