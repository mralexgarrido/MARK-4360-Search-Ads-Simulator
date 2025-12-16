## 2024-05-24 - Accessible Icon Buttons
**Learning:** Icon-only buttons are invisible to screen reader users without proper labeling.
**Action:** Always add `aria-label` (and `title` for mouse hover) to icon-only buttons. Dynamic labels (e.g., "Remove [Item Name]") are better than generic ones.

## 2025-12-16 - Keyboard Accessible Tooltips
**Learning:** Hover-only tooltips exclude keyboard users and mobile users who cannot easily "hover".
**Action:** Wrap tooltips in a `<button type="button">` with `aria-label` and use `group-focus:opacity-100` to reveal content on focus. Ensure the tooltip content is a `<span>` to maintain valid HTML.
