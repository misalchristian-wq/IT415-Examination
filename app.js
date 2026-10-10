"use strict";

// SETUP: a single hard-coded catalog, with prices stored in integer centavos.
// Freeze the array and each entry; buttons carry only product IDs.
const PRODUCTS = Object.freeze(
    [
        { id: 1, name: "Classic Milk Tea (Regular)", price: 5900, category: "Milk tea" },
        { id: 2, name: "Wintermelon Milk Tea (Regular)", price: 6500, category: "Milk tea" },
        { id: 3, name: "Taro Milk Tea (Regular)", price: 6500, category: "Milk tea" },
        { id: 4, name: "Fruit Tea — Lychee (Regular)", price: 5500, category: "Fruit tea" },
        { id: 5, name: "Brown Sugar Milk Tea (Regular)", price: 6900, category: "Milk tea" },
        { id: 6, name: "Bottled Water", price: 2000, category: "Water" },
    ].map((product) => Object.freeze(product))
);

const MAX_QUANTITY = 99;
const MAX_PAYMENT = 10000000; // ₱100,000.00, in centavos.
const SESSION_REFERENCE = Date.now().toString(36).toUpperCase();

const pesoFormatter = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

function formatMoney(centavos) {
    return pesoFormatter.format(centavos / 100);
}

// LOGIC: pure functions return new data without changing the previous cart.
function addToCart(cart, product) {
    // Always take the price/name from the catalog, not a button or caller.
    const catalogProduct = PRODUCTS.find((entry) => entry.id === product?.id);
    if (!catalogProduct) return cart;

    const line = cart.find((entry) => entry.id === catalogProduct.id);
    if (line) return changeQty(cart, line.id, 1);
    return [...cart, { ...catalogProduct, qty: 1 }];
}

function changeQty(cart, id, delta) {
    if ((delta !== 1 && delta !== -1) || !cart.some((line) => line.id === id)) return cart;
    return cart.map((line) => line.id === id
        ? { ...line, qty: Math.max(1, Math.min(MAX_QUANTITY, line.qty + delta)) }
        : line);
}

function removeFromCart(cart, id) {
    if (!cart.some((line) => line.id === id)) return cart;
    return cart.filter((line) => line.id !== id);
}

function computeTotal(cart) {
    return cart.reduce((total, line) => total + line.price * line.qty, 0);
}

function validatePayment(raw, total) {
    // A leading peso sign and correctly grouped commas are optional.
    const amount = typeof raw === "string" ? raw.trim().replace(/^₱\s*/, "") : "";
    // Validate BEFORE stripping commas: "1,00" must never become "100".
    if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(amount)) {
        return { ok: false, message: "Please enter a valid payment amount." };
    }

    // Parse pesos and cents separately so payment arithmetic stays integer-based.
    const [pesos, cents = ""] = amount.replaceAll(",", "").split(".");
    const paid = Number(pesos) * 100 + Number(cents.padEnd(2, "0"));
    if (!Number.isSafeInteger(paid) || paid > MAX_PAYMENT) {
        return { ok: false, message: "Payment cannot exceed ₱100,000.00." };
    }
    if (paid < total) {
        return { ok: false, message: `Insufficient payment. Please enter at least ${formatMoney(total)}.` };
    }
    return { ok: true, paid };
}

function computeChange(paid, total) {
    return paid - total;
}

function buildReceipt(cart, paid, txnNo) {
    const total = computeTotal(cart);
    // A frozen snapshot preserves what was paid even after a new transaction.
    const items = Object.freeze(cart.map((line) => Object.freeze({
        ...line,
        subtotal: line.price * line.qty,
    })));
    return Object.freeze({
        reference: `MT-${SESSION_REFERENCE}-${String(txnNo).padStart(4, "0")}`,
        items,
        total,
        paid,
        change: computeChange(paid, total),
    });
}

// UI: transaction state lives only in memory; reload starts a fresh session.
let cart = [];
let receipt = null;
let phase = "ORDERING";
let transactionNumber = 0;
let faulted = false;

const ui = {
    state: document.getElementById("transaction-state"),
    products: document.getElementById("product-grid"),
    cart: document.getElementById("cart-items"),
    total: document.getElementById("order-total"),
    count: document.getElementById("item-count"),
    form: document.getElementById("payment-form"),
    cash: document.getElementById("cash-amount"),
    pay: document.getElementById("pay-button"),
    confirmation: document.getElementById("payment-confirmation"),
    receipt: document.getElementById("receipt-content"),
    newTransaction: document.getElementById("new-transaction"),
    error: document.getElementById("error-message"),
    status: document.getElementById("status-message"),
};

// Use textContent for all product, payment, and receipt text.
function element(tag, className = "", text = "") {
    const node = document.createElement(tag);
    node.className = className;
    node.textContent = text;
    return node;
}

function renderProducts() {
    const grid = document.getElementById("product-grid");
    const template = document.getElementById("product-template");
    const cards = document.createDocumentFragment();

    for (const product of PRODUCTS) {
        const card = template.content.cloneNode(true);
        card.querySelector(".product-category").textContent = product.category;
        card.querySelector("h3").textContent = product.name;
        card.querySelector(".product-price").textContent = formatMoney(product.price);

        const button = card.querySelector(".add-product");
        button.dataset.productId = String(product.id);
        button.setAttribute("aria-label", `Add ${product.name} to cart`);
        cards.append(card);
    }

    grid.replaceChildren(cards);
}

function cartButton(line, action, text, disabled) {
    const button = element("button", action === "remove"
        ? "button button-danger remove-item" : "button quantity-button", text);
    button.type = "button";
    button.dataset.productId = String(line.id);
    button.dataset.action = action;
    const label = action === "increase" ? "Increase quantity of"
        : action === "decrease" ? "Decrease quantity of" : "Remove";
    button.setAttribute("aria-label", `${label} ${line.name}`);
    button.disabled = disabled;
    return button;
}

function renderCart() {
    const rows = document.createDocumentFragment();
    const locked = phase === "COMPLETED";
    for (const line of cart) {
        const row = element("tr");
        const item = element("td", "cart-item");
        item.append(element("strong", "", line.name),
            element("span", "unit-price", `${formatMoney(line.price)} each`),
            cartButton(line, "remove", "Remove", locked));

        const quantity = element("td", "quantity-column");
        const controls = element("div", "quantity-controls");
        controls.append(cartButton(line, "decrease", "−", locked || line.qty === 1),
            element("span", "quantity-value", String(line.qty)),
            cartButton(line, "increase", "+", locked || line.qty === MAX_QUANTITY));
        quantity.append(controls);
        row.append(item, quantity, element("td", "money", formatMoney(line.price * line.qty)));
        rows.append(row);
    }

    if (!cart.length) {
        const row = element("tr", "empty-row");
        const cell = element("td", "", "Your order is empty.");
        cell.colSpan = 3;
        cell.append(element("br"), element("span", "muted", "Add a drink from the menu to get started."));
        row.append(cell);
        rows.append(row);
    }
    ui.cart.replaceChildren(rows);
    ui.total.textContent = formatMoney(computeTotal(cart));
    const count = cart.reduce((sum, line) => sum + line.qty, 0);
    ui.count.textContent = `${count} ${count === 1 ? "item" : "items"}`;
}

function setProgress(activeIndex) {
    document.querySelectorAll(".workflow li").forEach((step, index) => {
        if (index === activeIndex) step.setAttribute("aria-current", "step");
        else step.removeAttribute("aria-current");
        step.classList.toggle("step-complete", index < activeIndex);
    });
}

function renderControls() {
    const locked = phase === "COMPLETED" || faulted;
    ui.state.textContent = faulted ? "Reset required" : phase === "COMPLETED"
        ? "Payment completed" : cart.length ? "Order in progress" : "Ready for new order";
    ui.products.querySelectorAll(".add-product").forEach((button) => {
        const line = cart.find((entry) => entry.id === Number(button.dataset.productId));
        button.disabled = locked || line?.qty === MAX_QUANTITY;
        button.title = locked ? "Start a new transaction to add drinks."
            : line?.qty === MAX_QUANTITY ? `Maximum quantity of ${MAX_QUANTITY} reached.` : "";
    });
    ui.cash.disabled = locked;
    ui.pay.disabled = locked;
    ui.newTransaction.disabled = false;
    setProgress(phase === "COMPLETED" ? 4 : cart.length ? 1 : 0);
}

function renderReceipt() {
    ui.receipt.replaceChildren();
    ui.confirmation.hidden = !receipt;
    if (!receipt) {
        ui.confirmation.textContent = "";
        ui.receipt.append(element("p", "muted", "Your receipt will appear after a successful payment, with the items, quantities, subtotals, total, amount paid, change, and transaction reference."));
        return;
    }

    ui.confirmation.textContent = `Payment successful. Paid ${formatMoney(receipt.paid)} · Change ${formatMoney(receipt.change)}.`;
    const sheet = element("div", "receipt-sheet");
    sheet.append(element("h3", "", "Milk Tea & Beverage Shop"),
        element("p", "receipt-reference", `Transaction: ${receipt.reference}`));
    const wrapper = element("div", "table-wrapper");
    const table = element("table", "receipt-table");
    table.append(element("caption", "sr-only", "Paid drinks, quantities, and subtotals"));
    const head = element("thead");
    const headings = element("tr");
    for (const [text, className] of [["Item", ""], ["Qty", "quantity-column"], ["Subtotal", "money"]]) {
        const heading = element("th", className, text);
        heading.scope = "col";
        headings.append(heading);
    }
    head.append(headings);
    const body = element("tbody");
    for (const line of receipt.items) {
        const row = element("tr");
        row.append(element("td", "", line.name), element("td", "quantity-column", String(line.qty)),
            element("td", "money", formatMoney(line.subtotal)));
        body.append(row);
    }
    table.append(head, body);
    wrapper.append(table);
    sheet.append(wrapper);
    const totals = element("dl", "receipt-totals");
    for (const [label, amount] of [["Total", receipt.total], ["Amount paid", receipt.paid], ["Change", receipt.change]]) {
        totals.append(element("dt", "", label), element("dd", "money", formatMoney(amount)));
    }
    sheet.append(totals);
    ui.receipt.append(sheet);
}

function clearMessages() {
    ui.error.hidden = true;
    ui.error.textContent = "";
    ui.status.hidden = true;
    ui.status.textContent = "";
    ui.cash.removeAttribute("aria-invalid");
}

function showStatus(message) {
    clearMessages();
    ui.status.textContent = message;
    ui.status.hidden = false;
}

function showPaymentError(message, invalidAmount = true) {
    clearMessages();
    ui.error.textContent = message;
    ui.error.hidden = false;
    if (invalidAmount) {
        ui.cash.setAttribute("aria-invalid", "true");
        ui.cash.focus();
    } else {
        ui.products.querySelector("button:enabled")?.focus();
    }
}

// Unexpected errors stop further sales until the user explicitly resets.
// Keep an already completed receipt intact; never silently retry a payment.
function showUnexpectedError() {
    faulted = true;
    ui.state.textContent = "Reset required";
    ui.status.hidden = true;
    ui.status.textContent = "";
    ui.error.textContent = "Something went wrong. Please start a new transaction.";
    ui.error.hidden = false;
    ui.cash.disabled = true;
    ui.pay.disabled = true;
    document.querySelectorAll(".add-product, #cart-items button").forEach((button) => {
        button.disabled = true;
    });
    ui.newTransaction.disabled = false;
    ui.newTransaction.focus();
}

function safe(handler) {
    return (...args) => {
        try {
            return handler(...args);
        } catch {
            showUnexpectedError();
        }
    };
}

window.addEventListener("error", showUnexpectedError);
window.addEventListener("unhandledrejection", showUnexpectedError);

// EVENTS: delegated handlers also handle cart rows recreated after quantity edits.
ui.products.addEventListener("click", safe((event) => {
    const button = event.target.closest(".add-product");
    if (!button || button.disabled || phase !== "ORDERING" || faulted) return;
    const product = PRODUCTS.find((entry) => entry.id === Number(button.dataset.productId));
    if (!product) return;
    cart = addToCart(cart, product);
    renderCart();
    renderControls();
    showStatus(`${product.name} added to cart.`);
}));

ui.cart.addEventListener("click", safe((event) => {
    const button = event.target.closest("button[data-action]");
    if (!button || button.disabled || phase !== "ORDERING" || faulted) return;
    const id = Number(button.dataset.productId);
    const action = button.dataset.action;
    if (!cart.some((line) => line.id === id)) return;
    if (action === "remove") cart = removeFromCart(cart, id);
    else if (action === "increase" || action === "decrease") {
        cart = changeQty(cart, id, action === "increase" ? 1 : -1);
    } else return;
    renderCart();
    renderControls();
    const line = cart.find((entry) => entry.id === id);
    showStatus(action === "remove" ? "Item removed."
        : line.qty === MAX_QUANTITY ? `Quantity updated. Maximum of ${MAX_QUANTITY} reached.` : "Quantity updated.");
    // Keep keyboard focus usable when the clicked row has just been rebuilt.
    const replacement = ui.cart.querySelector(`button[data-product-id="${id}"][data-action="${action}"]:enabled`)
        || ui.cart.querySelector(`button[data-product-id="${id}"]:enabled`)
        || ui.cart.querySelector("button:enabled") || ui.products.querySelector("button:enabled");
    replacement?.focus();
}));

ui.form.addEventListener("submit", safe((event) => {
    event.preventDefault();
    if (phase !== "ORDERING" || faulted) return;
    if (!cart.length) {
        showPaymentError("Your cart is empty. Please add at least one product before paying.", false);
        return;
    }
    const result = validatePayment(ui.cash.value, computeTotal(cart));
    if (!result.ok) {
        showPaymentError(result.message);
        return;
    }

    // Commit the sale only after validation and the receipt snapshot succeed.
    const nextNumber = transactionNumber + 1;
    const nextReceipt = buildReceipt(cart, result.paid, nextNumber);
    transactionNumber = nextNumber;
    receipt = nextReceipt;
    phase = "COMPLETED";
    clearMessages();
    renderCart();
    renderControls();
    renderReceipt();
    ui.newTransaction.focus();
}));

ui.cash.addEventListener("input", safe(() => {
    if (phase === "ORDERING" && !faulted) clearMessages();
}));
ui.cash.addEventListener("focus", safe(() => {
    if (phase === "ORDERING" && cart.length && !faulted) setProgress(2);
}));

ui.newTransaction.addEventListener("click", safe(() => {
    cart = [];
    receipt = null;
    phase = "ORDERING";
    faulted = false;
    ui.cash.value = "";
    clearMessages();
    renderProducts();
    renderCart();
    renderControls();
    renderReceipt();
    ui.cash.focus();
}));

// Startup failures get the same visible recovery banner as event failures.
safe(() => {
    renderProducts();
    renderCart();
    renderControls();
    renderReceipt();
})();
