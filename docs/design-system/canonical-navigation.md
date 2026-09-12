# Canonical navigation and menus

Navigation communicates where a user is and how to get somewhere; actions change state. Keep those roles distinct so the URL, browser history, keyboard model, and spoken state remain predictable.

## Choosing a pattern

- Use `NavigationLink` for a destination that should work with the browser's link affordances and the application router. Set `current` for the active route and keep the `href` intact.
- Use `NavigationTabs` (`Tabs`) when one route contains related panels and changing the selection does not represent a new destination. Tabs use `role="tablist"`, a single roving tab stop, and Arrow/Home/End navigation.
- Use `NavigationAction` for an operation such as save, join, or delete. It is the Action family and keeps the 44px touch target and semantic variants.
- Use `OverflowMenu` for secondary actions that would otherwise crowd a row. The trigger has a required accessible label; Escape, outside click, and activation dismiss it and restore focus.
- Use `DropdownMenu` for a small secondary control surface such as settings. It is not a modal workflow; actions that need confirmation belong in an alert dialog.
- Use `ResponsiveNavigation` when desktop navigation and a mobile drawer have different information density. The consumer owns the drawer's focus trap, dismissal, and route-specific permissions.

## Responsive and content rules

Navigation labels may grow with localization. The family allows wrapping and horizontal tab scrolling; it does not hide or truncate the only copy for an action. Keep at least 44px touch targets, a visible `:focus-visible` ring, and an explicit text label for icon-only triggers. Permission-filtered items should be omitted from the item list, not rendered as unavailable destinations.

`NavigationLink` intentionally renders a native anchor. Consumers may intercept its click with `useNavigate` while preserving the `href`, so direct navigation, modifier-click, and server fallback behavior remain available.
