# Design Notes

## Visual Direction

The current direction is soft liquid glass, not pure black and white. Pure black/white felt too rigid for a daily Todo app, so the palette now uses:

- Soft gray background.
- White translucent panels.
- Gentle gray-blue shadows.
- Muted text contrast.
- Unified soft selected states.

Dark mode avoids pure black and uses charcoal gray instead.

## Selected State

Selected states should be visually unified across:

- Left tabs.
- List/quadrant display toggle.
- Completion scope toggle.
- Calendar selected day.
- Important/urgent switches.

The current selected state uses soft translucent gray glass rather than high-contrast black.

The main `+ New` action remains more strongly emphasized.

## macOS Window Safety

The page uses internal scrolling rather than full-body scrolling. This prevents scrollable content from visually conflicting with macOS traffic-light buttons.

Implementation principle:

- `body` does not scroll.
- `.app` fills `100vh`.
- `.sidebar` and `.content` scroll internally.
- Top padding leaves room for the hidden inset title bar.

## Calendar

The date picker is custom because the native date picker could not be visually matched to the app. It uses:

- Rounded glass popover.
- Month navigation.
- Today and clear actions.
- Soft selected day state.
- Click outside to close.
- Enter/Space to open from the date field.
- Escape to close.

Known limitation: arrow-key day navigation is not implemented yet.

## Responsive Notes

The add form uses a grid and collapses:

- Desktop: title, project, time, quadrant switches, add button.
- Medium width: two columns.
- Narrow width: one column.

The quadrant board uses a 2x2 layout on desktop. On narrow screens it becomes one column.

