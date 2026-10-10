# Interface guidelines (Section VI)

- Built for **mouse + keyboard on a laptop/desktop**; no touch or kiosk gestures needed.
- Keep **product list, cart/order summary, payment entry, and receipt** clearly distinguishable: four titled sections (or tabs/screens).
- **Feedback for success and errors:** "X added to cart", "Item removed", "Payment successful", and the validation messages. Errors are red with text; success is green.
- **Keyboard:** all controls are real `<button>`/`<input>` elements, so Tab and Enter work; Enter in the payment field submits; focus returns to the payment field after New Transaction.
- **Labels and states:** visible label on the payment input, `aria-label` on the +/- buttons, disabled buttons look disabled, `role="alert"` on error messages, `role="status"` on success.
- **Readable money:** peso sign, two decimals, right-aligned amounts in the cart and receipt.
- **Empty states:** the cart and receipt say what will appear and when.
- **Plain beats fancy:** do not reproduce the sample UI exactly; it is not graded. Clarity and correctness are.