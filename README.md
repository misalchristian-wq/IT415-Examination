# Milk Tea and Beverage Shop POS

Individual IT 415 practical exam, Scenario 3. Built with HTML, CSS, and plain JavaScript. No database, dependencies, login, or external services.

## Current progress: Stage 3 — validation and final improvements

All three implementation stages are complete and ready for final review. The POS supports all six drinks, cart editing, automatic calculations, order review, cash validation, change, payment confirmation, digital receipts, and New Transaction. It also rejects malformed cash amounts, protects completed receipts, and provides a visible reset path after unexpected errors.

| File | Purpose |
| --- | --- |
| `index.html` | Four interface sections, reusable product card template, and local asset security policy. |
| `style.css` | Desktop layout, quantity controls, receipt styling, keyboard focus, and visible states. |
| `app.js` | Catalog, pure calculation functions, in-memory transaction state, rendering, and event handlers. |
| `scripts/test_logic.js` | Dependency-free checks of the actual cart, payment, and receipt logic. |
| `scripts/test_ui.js` | Optional headless browser checks using an existing Playwright installation. |
| `.gitignore` | Keeps generated browser screenshots in `test-results/` out of commits. |
| `skills/` | Existing examination guidance, retained as supplied. |

All prices use integer centavos: ₱59.00 is stored as `5900`. Products are defined once in `app.js`; buttons carry product IDs and calculations use catalog prices. Text is rendered using `textContent`. Transaction state stays in JavaScript memory and resets on page reload. Cash uses a text field with a decimal input mode so validation can inspect the full entry, including nonnumeric mistakes.

## How the code works

- `addToCart`, `changeQty`, and `removeFromCart` return new cart data. Repeated additions combine into one line; quantities stay between 1 and 99. Decrease stops at 1; use Remove to delete a line.
- `computeTotal` adds every price × quantity whenever the cart changes. The app does not maintain a separate running total.
- `validatePayment` accepts digits with up to two decimal places, an optional leading `₱`, and correctly grouped thousands commas. For example, `200.00` and `₱1,000.00` are valid formats; `1,00`, `12a`, and `1.234` are rejected. Cash is parsed into integer centavos. The payment limit is ₱100,000.00.
- `computeChange` subtracts the total from the amount paid. `buildReceipt` freezes a snapshot of the purchased items, totals, payment, change, and reference.
- A successful sale changes the phase from `ORDERING` to `COMPLETED` and locks the cart/payment controls. A second payment cannot create another receipt.
- New Transaction clears the cart, cash, messages, confirmation, and receipt, unlocks controls, and focuses cash entry. The reference counter advances only on successful sales. References contain a session prefix and counter; reloading starts a new session.
- `safe()` catches errors inside handlers and startup. Global `error` and `unhandledrejection` listeners show the same recovery banner and disable sales until New Transaction. A completed receipt remains intact until that explicit reset.

## Run locally

Double-click `index.html` in the project folder, or use your browser's Open File command to select `D:\School\App Dev\TestExam\index.html`. Keep `style.css` and `app.js` alongside it. Enable JavaScript in your browser.

No PHP installation, XAMPP, server, build command, or internet connection is required. You can also use an existing editor's local static preview if preferred.

## Final manual tests

1. Load the page and confirm all six names and prices:

   | Product | Price |
   | --- | --- |
   | Classic Milk Tea (Regular) | ₱59.00 |
   | Wintermelon Milk Tea (Regular) | ₱65.00 |
   | Taro Milk Tea (Regular) | ₱65.00 |
   | Fruit Tea — Lychee (Regular) | ₱55.00 |
   | Brown Sugar Milk Tea (Regular) | ₱69.00 |
   | Bottled Water | ₱20.00 |

2. Confirm the empty order shows `0 items` and `₱0.00`, and the receipt explains when it will appear.
3. Add Classic Milk Tea twice, then Lychee Fruit Tea once. Expect two lines, 3 items, subtotals ₱118.00 and ₱55.00, and total ₱173.00.
4. Increase Classic to 3: its subtotal becomes ₱177.00 and the total ₱232.00. Decrease back to 2: total ₱173.00. Decrease to 1 and confirm the minus button is disabled; increase back to 2.
5. Add Bottled Water: total ₱193.00. Remove it: total returns to ₱173.00. Removing all lines should show the empty state and ₱0.00; recreate the order in step 3.
6. Try blank cash, `abc`, `-50`, and `100`. Each must show an error without a receipt or locked order. Enter `200.00` and press Enter: expect payment confirmation and ₱27.00 change.
7. Check the receipt: the two lines and quantities, subtotals ₱118.00/₱55.00, total ₱173.00, paid ₱200.00, change ₱27.00, and a transaction reference ending in `0001` for the first sale. Cart editing, adding products, cash, and Pay should now be disabled.
8. Select New Transaction. Expect an empty cart, blank cash, no confirmation/receipt/error, enabled controls, and focus in cash entry. Add Bottled Water and pay `20.00`: expect change ₱0.00 and a reference ending in `0002`.
9. Select New Transaction and cancel an unpaid order the same way. Confirm all transaction fields clear. Try Pay on the empty cart: expect a visible error and no receipt.
10. Check a desktop or laptop window, then reduce the width below 860px. Sections should stack and text should remain readable. Check the console for JavaScript errors.

### Payment validation matrix

Start a new transaction and recreate the ₱173.00 order. For each rejected input, confirm that the order remains editable, no receipt is generated, and no transaction reference is consumed. Successful payments require a new transaction before the next case.

| Cash input | Expected result |
| --- | --- |
| Blank or spaces | `Please enter a valid payment amount.` |
| `abc`, `12a` | `Please enter a valid payment amount.` |
| `-50` | `Please enter a valid payment amount.` |
| `1.234`, `2e2`, `1,00`, `₱₱200` | `Please enter a valid payment amount.` |
| `0`, `100`, `172.99` | `Insufficient payment. Please enter at least ₱173.00.` |
| `173.00` | Payment successful; change ₱0.00. |
| `200.00` | Payment successful; change ₱27.00. |
| `199.05` | Payment successful; change ₱26.05. |
| `₱1,000.00` | Payment successful; change ₱827.00. |
| `100000.01` | `Payment cannot exceed ₱100,000.00.` |
| `100000.00` | Payment successful; change ₱99,827.00. |

Additional checks:

- After a failed payment, edit the cash or change the cart; the stale error must clear. Confirm that a new insufficient-payment error uses the new total.
- Double-click Pay or press Enter repeatedly after payment. The receipt and reference must remain unchanged; product and quantity editing must stay locked.
- Increase a product to 99. Its Add and plus buttons should disable. Decreasing allows adding again; quantity never falls below 1.
- Use Tab, Shift+Tab, and Enter through the real buttons and cash field. Check visible focus, focus after quantity edits, and cash focus after New Transaction.
- Reload the page. Cart, cash, and receipt should clear because transaction data lives only in memory.
- Unexpected-error recovery is covered by the browser test, which injects a temporary rendering failure and global error events. It checks the banner, blocked payment, preserved completed receipt, and successful reset.

## Automated checks

If Node.js is installed, run from the project directory:

```powershell
node --check app.js
node scripts/test_logic.js
```

The logic checks use Node's built-in modules only. They exercise the actual pure logic in `app.js`, including catalog price integrity, quantity limits, strict cash parsing, exact centavo arithmetic, and frozen receipt snapshots. Node is not required to run the POS.

For optional browser checks, an existing Playwright installation and Microsoft Edge are required:

```powershell
node scripts/test_ui.js
```

If Playwright is outside Node's usual module search path, set `POS_PLAYWRIGHT_PATH` to its package directory before running. To use Chrome instead of Edge, set `POS_BROWSER_CHANNEL` to `chrome`. These are test-only settings; no library is loaded by the POS page.

The browser checks open `index.html` directly, cover cart controls, invalid payments, Enter-to-pay, change, receipts, locking, duplicate submissions, quantity bounds, resets, injected-error recovery, and narrow layout. Screenshots are written to ignored `test-results/`.

Stage 3 verification completed with the bundled Playwright library and installed Edge: logic checks and browser checks passed, no unexpected browser errors or missing assets were reported, and desktop/error/receipt/narrow screenshots were visually reviewed. Repeat the manual checks in your own examination browser before committing.

## Completed stages

1. **Setup and interface:** catalog, four sections, desktop/responsive layout, empty states.
2. **Ordering and calculations:** cart controls, automatic totals, payment/change, confirmation, receipt snapshot, reset.
3. **Validation and final improvements:** strict formatted cash parsing, validation matrix, error recovery, accessible states/focus, and browser regression checks.

No database, login, inventory, payment gateway, QR/card payment, or deployment has been added. Transactions are temporary; save your examination screenshots before reloading if you need evidence of a sale.

## Review and commit Stage 3

After running the manual checks and reviewing the code:

```powershell
git add index.html style.css app.js scripts/test_logic.js scripts/test_ui.js README.md .gitignore
git commit -m "Stage 3: finish validation recovery and final checks"
```

No commit is created automatically. Implementation is paused here for your final review, testing, and actual progress commit.
