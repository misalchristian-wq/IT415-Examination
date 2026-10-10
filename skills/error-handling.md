# Error handling

## Payment validation (exact messages from the exam)
| Input | Result |
|---|---|
| blank / spaces | `Please enter a valid payment amount.` |
| non-numeric (`abc`, `12a`, `1.234`) | `Please enter a valid payment amount.` |
| negative (`-50`) | `Please enter a valid payment amount.` |
| below total | `Insufficient payment. Please enter at least ₱<total>.` (the live total) |
| exactly the total | success, change ₱0.00 |
| above total | success, change = paid - total |

## Other cases to handle
- **Empty cart + Pay:** show "Your cart is empty. Please add at least one product before paying." No crash, no receipt.
- **Double submit:** after success the Pay button and input are disabled, so a second click cannot create a second transaction.
- **Unexpected exceptions:** wrap handlers in `safe()` and register `window.onerror` / `unhandledrejection` to show a visible banner ("Something went wrong. Please start a new transaction.") instead of a silent failure.
- **Unknown product id / missing cart line:** functions return the cart unchanged rather than throwing.
- **Messages are shown on screen** (an element with `role="alert"`), never only with `alert()` or `console.log`.
- Clear stale errors when the situation changes (adding an item clears the payment error).

## Manual test script (screenshot the error states)
1. Add 2 Fried Chicken, 1 Rice, 1 Iced Tea -> total ₱165.00.
2. Pay: blank, `abc`, `-50`, `100`, then `200` -> only the last succeeds, change ₱35.00.
3. Try add/remove after payment -> disabled.
4. Start New Transaction -> everything cleared, next transaction number increments.
5. Pay with an empty cart -> clear message.