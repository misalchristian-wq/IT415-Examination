# Milk Tea and Beverage Shop POS

Individual IT 415 practical exam, Scenario 3. Built with HTML, CSS, and plain JavaScript. No database, dependencies, login, or external services.

## Current progress: Stage 2 — ordering and calculations

Stage 1 is complete. The six required products keep their exact prices and the four interface sections. Stage 2 enables adding drinks, changing quantities, removing lines, live subtotals/totals, cash payment, change, confirmation, receipt generation, and New Transaction. Basic payment checks protect the sale now; Stage 3 is reserved for validation edge cases, error recovery, and final improvements.

| File | Purpose |
| --- | --- |
| `index.html` | Four interface sections, reusable product card template, and local asset security policy. |
| `style.css` | Desktop layout, quantity controls, receipt styling, keyboard focus, and visible states. |
| `app.js` | Catalog, pure calculation functions, in-memory transaction state, rendering, and event handlers. |
| `scripts/test_logic.js` | Dependency-free checks of the actual cart, payment, and receipt logic. |
| `skills/` | Existing examination guidance, retained as supplied. |

All prices use integer centavos: ₱59.00 is stored as `5900`. Products are defined once in `app.js`; buttons carry product IDs and calculations use catalog prices. Text is rendered using `textContent`. Transaction state stays in JavaScript memory and resets on page reload. Cash uses a text field with a decimal input mode so validation can inspect the full entry, including nonnumeric mistakes.

## How the code works

- `addToCart`, `changeQty`, and `removeFromCart` return new cart data. Repeated additions combine into one line; quantities stay between 1 and 99. Decrease stops at 1; use Remove to delete a line.
- `computeTotal` adds every price × quantity whenever the cart changes. The app does not maintain a separate running total.
- `validatePayment` accepts plain digits with up to two decimal places. Blank, nonnumeric, negative, excessive, and insufficient entries cannot complete a sale. The payment limit is ₱100,000.00.
- `computeChange` subtracts the total from the amount paid. `buildReceipt` freezes a snapshot of the purchased items, totals, payment, change, and reference.
- A successful sale changes the phase from `ORDERING` to `COMPLETED` and locks the cart/payment controls. A second payment cannot create another receipt.
- New Transaction clears the cart, cash, messages, confirmation, and receipt, unlocks controls, and focuses cash entry. The reference counter advances only on successful sales. References contain a session prefix and counter; reloading starts a new session.

## Run locally

Double-click `index.html` in the project folder, or use your browser's Open File command to select `D:\School\App Dev\TestExam\index.html`. Keep `style.css` and `app.js` alongside it. Enable JavaScript in your browser.

No PHP installation, XAMPP, server, build command, or internet connection is required. You can also use an existing editor's local static preview if preferred.

## Stage 2 manual tests

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

## Automated logic checks

If Node.js is installed, run from the project directory:

```powershell
node --check app.js
node scripts/test_logic.js
```

These checks use Node's built-in modules only. They exercise the actual pure logic in `app.js`, including catalog price integrity, quantity limits, exact centavo arithmetic, and frozen receipt snapshots. They do not replace the browser checks for controls, focus, locking, and reset. Node is not required to run the POS.

## Remaining stage — implement only after review

**Stage 3: validation and final improvements.** Review the payment validation matrix and formatted-input edge cases, add visible recovery for unexpected errors, check repeat submissions and reset behavior through the UI, and finish accessibility/layout checks. Keep the working cart and receipt behavior. Pause for final review and commit.

## Review and commit Stage 2

After running the manual checks and reviewing the code:

```powershell
git add index.html style.css app.js scripts/test_logic.js README.md
git commit -m "Stage 2: add ordering calculations and receipt flow"
```

No commit is created automatically. Continue to Stage 3 when you are ready.
