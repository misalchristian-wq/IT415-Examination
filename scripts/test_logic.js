"use strict";

// Run with: node scripts/test_logic.js (Node is only needed for these checks).
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

// Load the actual pure logic without starting the browser's UI section.
const source = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const boundary = source.indexOf("// UI: transaction state");
assert.ok(boundary > 0, "The pure logic must precede the UI section.");
const logic = vm.runInNewContext(source.slice(0, boundary) + `
    ({ PRODUCTS, MAX_QUANTITY, addToCart, changeQty, removeFromCart,
       computeTotal, validatePayment, computeChange, buildReceipt, formatMoney })
`);

assert.equal(logic.PRODUCTS.length, 6);
assert.equal(logic.PRODUCTS.map((product) => product.price).join(","), "5900,6500,6500,5500,6900,2000");
assert.ok(Object.isFrozen(logic.PRODUCTS));
assert.ok(logic.PRODUCTS.every(Object.isFrozen));

let cart = [];
cart = logic.addToCart(cart, logic.PRODUCTS[0]);
const previousCart = cart;
cart = logic.addToCart(cart, logic.PRODUCTS[0]);
assert.equal(previousCart[0].qty, 1, "Adding must not mutate the previous cart.");
assert.equal(cart.length, 1, "Repeated adds must combine into one line.");
assert.equal(cart[0].qty, 2);
cart = logic.addToCart(cart, logic.PRODUCTS[3]);
assert.equal(logic.computeTotal(cart), 17300);
assert.equal(logic.computeTotal(logic.changeQty(cart, 1, 1)), 23200);
assert.equal(logic.computeTotal(logic.changeQty(cart, 1, -1)), 11400);
assert.equal(logic.computeTotal(logic.removeFromCart(cart, 1)), 5500);
assert.equal(logic.computeTotal(logic.removeFromCart(logic.removeFromCart(cart, 1), 4)), 0);

assert.equal(logic.addToCart(cart, { id: 999 }), cart);
assert.equal(logic.computeTotal(logic.changeQty(cart, 999, 1)), 17300);
assert.equal(logic.computeTotal(logic.removeFromCart(cart, 999)), 17300);
assert.equal(logic.changeQty(cart, 999, 1), cart);
assert.equal(logic.removeFromCart(cart, 999), cart);
const spoofed = logic.addToCart([], { id: 1, price: 1, name: "Altered" });
assert.equal(spoofed[0].price, 5900, "Catalog prices must override caller data.");
assert.equal(spoofed[0].name, "Classic Milk Tea (Regular)");
assert.equal(logic.changeQty(spoofed, 1, -1)[0].qty, 1);
let capped = spoofed;
for (let i = 0; i < 120; i++) capped = logic.addToCart(capped, logic.PRODUCTS[0]);
assert.equal(capped[0].qty, logic.MAX_QUANTITY);

assert.equal(logic.validatePayment("200", 17300).paid, 20000);
assert.equal(logic.validatePayment(" 200.00 ", 17300).paid, 20000);
assert.equal(logic.validatePayment("173.00", 17300).ok, true);
assert.equal(logic.validatePayment("199.05", 17300).paid, 19905);
assert.equal(logic.validatePayment("0.1", 10).paid, 10);
for (const raw of ["₱1,000.00", "1,000", " ₱ 1,000.00 "]) {
    assert.equal(logic.validatePayment(raw, 17300).paid, 100000);
}
assert.equal(logic.validatePayment("000173.00", 17300).paid, 17300);
assert.equal(logic.computeChange(20000, 17300), 2700);
assert.equal(logic.computeChange(17300, 17300), 0);
for (const raw of ["", "   ", "abc", "12a", "-50", "1.234", "2e2", "Infinity", "100", "100000.01",
    "1,00", "1,,000", ",200", "200,", "200.", ".50", "+200", "₱₱200", "200₱", "20 0", "0xC8", null, undefined]) {
    assert.equal(logic.validatePayment(raw, 17300).ok, false, `Must reject ${JSON.stringify(raw)}`);
}
assert.equal(logic.validatePayment("100", 17300).message,
    "Insufficient payment. Please enter at least ₱173.00.");
assert.equal(logic.validatePayment("100000.00", 17300).ok, true);
assert.equal(logic.validatePayment("₱100,000.00", 17300).paid, 10000000);
assert.equal(logic.validatePayment("₱100,000.01", 17300).ok, false);
assert.equal(logic.validatePayment("99999999999999999999", 17300).ok, false);
for (const raw of ["", "   ", "abc", "12a", "-50", "1.234"]) {
    assert.equal(logic.validatePayment(raw, 17300).message, "Please enter a valid payment amount.");
}
// All six products at their quantity cap remain within the payment bound.
let fullCart = [];
for (const product of logic.PRODUCTS) {
    for (let i = 0; i < logic.MAX_QUANTITY; i++) fullCart = logic.addToCart(fullCart, product);
}
assert.equal(logic.computeTotal(fullCart), 3296700);
assert.equal(logic.validatePayment("32967.00", logic.computeTotal(fullCart)).ok, true);

const receipt = logic.buildReceipt(cart, 20000, 1);
assert.equal(receipt.items.length, 2);
assert.equal(receipt.items[0].subtotal, 11800);
assert.equal(receipt.items[1].subtotal, 5500);
assert.equal(receipt.total, 17300);
assert.equal(receipt.paid, 20000);
assert.equal(receipt.change, 2700);
assert.match(receipt.reference, /^MT-[A-Z0-9]+-0001$/);
assert.ok(Object.isFrozen(receipt) && Object.isFrozen(receipt.items));
assert.ok(receipt.items.every(Object.isFrozen));
cart[0].qty = 9;
assert.equal(receipt.items[0].qty, 2, "Receipt must retain the purchased quantity.");
assert.equal(receipt.total, 17300);
assert.match(logic.buildReceipt([], 0, 2).reference, /-0002$/);
assert.equal(logic.formatMoney(2700), "₱27.00");

console.log("Final logic checks passed: catalog, cart, bounds, strict cash validation, change, and receipt snapshots.");
