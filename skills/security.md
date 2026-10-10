# Security (client-side POS)

No server, but the same habits apply and instructors can reward them.

1. **Escape output.** Product and receipt text inserted with `innerHTML` goes through `esc()`. Prefer `textContent` for single values. Prevents HTML/script injection if a name is ever edited.
2. **Prices come from the catalog, not the page.** Buttons carry only a product `id`; `addToCart` copies name/price from the frozen `PRODUCTS` array. Editing the DOM cannot change a price. `Object.freeze` the catalog.
3. **Strict payment parsing.** Accept only digits with an optional decimal of at most 2 places (a leading `₱` and commas are stripped). Reject everything else instead of letting `parseFloat` guess ("12abc" would parse as 12).
4. **Bounds.** Cap quantity per line (99) and payment (e.g. ₱100,000) so absurd values cannot overflow the layout or break totals. `maxlength` on the input.
5. **No dynamic code.** Never use `eval`, `new Function`, or inline user data in attributes without escaping.
6. **Content-Security-Policy meta tag** in the template blocks external scripts, remote requests, and framing.
7. **No sensitive data.** Cash only; do not store or log anything personal. No `localStorage` of transactions is needed.
8. **Integrity of the sale.** Cart locks after payment; the receipt is a snapshot object, not a live view of the cart.