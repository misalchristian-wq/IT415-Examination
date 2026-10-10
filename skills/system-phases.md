# System phases

## A. Development phases (150-minute plan)
| Phase | Minutes | Output |
|---|---|---|
| 1. Requirements | 0-10 | Read Sections IV-V, confirm scenario, list the 12 features |
| 2. Design | 10-20 | Sketch 4 sections, name the LOGIC functions, choose the stack |
| 3. Implementation: basic interface | 20-50 | Products rendered, layout in place |
| 4. Implementation: core logic | 50-90 | Cart, totals, change, receipt |
| 5. Validation and error handling | 90-115 | All payment cases, empty cart, locking |
| 6. Testing | 115-135 | `scripts/test_logic.js` plus the manual script |
| 7. Polish and handover | 135-150 | Design tidy-up, final check of all 12 features |
Reserve the last 15 minutes for checks; do not start new features there.

## B. Runtime phases of the app
`ORDERING` (browse, add, adjust, review, enter payment) -> `COMPLETED` (payment confirmed, receipt shown, cart locked) -> back to `ORDERING` via New Transaction.
The stepper maps these onto: Browse -> Cart -> Payment -> Confirm -> Receipt. A phase change happens only through a successful action, never directly from a failed one.