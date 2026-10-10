# Logic flow

## Transaction flow (Section IV, in order)
1. Browse products -> 2. Add to cart (adjust quantity) -> 3. Review order -> 4. Enter payment -> 5. Validate and compute -> 6. Confirm payment -> 7. Receipt / new transaction.

## Core functions (all pure, in the LOGIC block)
| Function | Responsibility |
|---|---|
| `addToCart(cart, product)` | add a line or increment qty (capped) |
| `changeQty(cart, id, delta)` | adjust qty, never below 1 or above the cap |
| `removeFromCart(cart, id)` | delete a line |
| `computeTotal(cart)` | sum of price x qty in centavos |
| `validatePayment(raw, total)` | returns `{ok, paid}` or `{ok:false, message}` |
| `computeChange(paid, total)` | `paid - total` |
| `buildReceipt(cart, paid, txnNo)` | snapshot of the sale |

## Rules that keep the flow correct
- Order inside payment handling: (1) cart not empty, (2) validate input, (3) compute change, (4) generate transaction number, (5) build receipt snapshot, (6) lock the cart, (7) render confirmation. Doing step 6 before 1-5 succeed would lock a failed sale.
- Totals are recomputed from the cart on every change; never keep a separately-updated total variable that can drift.
- After success the cart is **locked** (add/inc/dec/remove/pay disabled) so the receipt always matches what was paid. Only "Start New Transaction" unlocks.
- New transaction resets: cart, payment input, messages, confirmation, receipt. The transaction counter keeps increasing.
- Decrease stops at 1; deleting a line is the Remove button's job. Pick one behavior and be able to explain it.

## Worked example
2 x ₱65.00 + 1 x ₱15.00 + 1 x ₱20.00 = 16500 centavos = ₱165.00. Paid 20000 -> change 3500 = ₱35.00.