# Modern design

Modern here means clean and consistent, never at the expense of working features.

- **Design tokens:** CSS variables for color, radius, shadow, spacing. One brand color (the template uses DNSC green) plus neutral grays; red only for errors.
- **Cards:** each stage is a white card with 12-16px radius, soft shadow, generous padding (16-20px).
- **Typography:** system font stack (`system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`), clear hierarchy: one page title, section titles, body at 15-16px, monospace only for the receipt.
- **Progress stepper** at the top shows the current phase (Browse, Cart, Payment, Confirm, Receipt) so the flow is obvious.
- **Buttons:** one primary style, one secondary (outline), one danger (red outline). Visible hover and `:focus-visible` states.
- **Micro-feedback:** a short toast or inline message for add/remove/pay. Transitions 120-200ms, and honor `prefers-reduced-motion`.
- **Responsive:** two-column grid on laptops, one column below ~860px.
- **Contrast:** text/background at least 4.5:1; never rely on color alone (errors also carry text).
- **Restraint:** no gradients-on-everything, no animations that delay actions, no external fonts or libraries (they break offline use and the CSP).