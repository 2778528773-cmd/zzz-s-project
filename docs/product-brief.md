# Product Brief

## Product Shape

Donezo should feel like a small daily desktop tool, not a heavy project management system. The design direction is calm, precise, and light: soft gray and white liquid-glass surfaces, restrained contrast, and simple navigation.

## Core Workflow

- Add a task quickly from the top input module.
- Optionally assign a project.
- Pick a date from the custom rounded calendar.
- Mark whether the task is important and/or urgent.
- View tasks as a normal list or as a four-quadrant board.
- Track completion as either global completion or today's completion.

## Navigation Decision

The left tab bar stays flat:

- All
- Today
- In progress
- Completed

We deliberately avoided nested navigation such as `All > Completed / Open` and `Today > Completed / Open` because this app should stay fast and lightweight. More advanced filtering can be added in the main content area later if the product grows.

## Priority Model

Priority is modeled as a four-quadrant combination:

- Important and urgent
- Important, not urgent
- Not important, urgent
- Not important, not urgent

The add form exposes this as two switches: `Important` and `Urgent`.

Legacy values are still mapped in code:

- `high` -> q1
- `medium` / `normal` -> q2
- `low` -> q4

## Display Modes

The task area supports two display modes:

- List: horizontal row-by-row task cards.
- Quadrant: a 2x2 board grouped by four-quadrant priority.

The selected mode is stored in `localStorage` and restored on next launch.

## Completion Summary

The sidebar summary is intentionally compact:

```text
Completion 1/1 (100%)
```

It supports two scopes:

- All
- Today

The selected scope is stored in `localStorage`.

## Encouragement

When today's tasks exist and all of them are completed, the app shows:

```text
今天的任务都完成了，做得很稳。
```

This is intentionally lightweight and only appears when it is truly relevant.

