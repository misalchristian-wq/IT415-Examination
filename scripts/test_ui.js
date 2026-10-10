"use strict";

// Optional browser regression checks. Playwright is a test tool, not an app dependency.
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require(process.env.POS_PLAYWRIGHT_PATH || "playwright");

async function main() {
    const root = path.join(__dirname, "..");
    const output = path.join(root, "test-results");
    await fs.mkdir(output, { recursive: true });
    const browser = await chromium.launch({
        channel: process.env.POS_BROWSER_CHANNEL || "msedge",
        headless: true,
    });
    try {
        const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
        page.setDefaultTimeout(5000);
        const errors = [];
        const requests = [];
        page.on("pageerror", (error) => errors.push(error.message));
        page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
        page.on("requestfailed", (request) => errors.push(request.url()));
        page.on("request", (request) => requests.push(request.url()));
        await page.goto(pathToFileURL(path.join(root, "index.html")).href);

        const total = () => page.locator("#order-total").textContent();
        const add = (id) => page.locator(`#product-grid button[data-product-id="${id}"]`).click();
        const control = (id, action) => page.locator(`#cart-items button[data-product-id="${id}"][data-action="${action}"]`);
        const reset = () => page.locator("#new-transaction").click();
        const cash = page.locator("#cash-amount");
        const pay = page.locator("#pay-button");
        const error = page.locator("#error-message");

        assert.equal(await page.locator(".product-card").count(), 6);
        assert.deepEqual(await page.locator(".product-price").allTextContents(),
            ["₱59.00", "₱65.00", "₱65.00", "₱55.00", "₱69.00", "₱20.00"]);
        assert.equal(await total(), "₱0.00");
        assert.equal(await page.locator("#transaction-state").textContent(), "Ready for new order");
        await pay.click();
        assert.equal(await error.textContent(), "Your cart is empty. Please add at least one product before paying.");
        assert.equal(await cash.getAttribute("aria-invalid"), null);
        assert.equal(await page.locator(".receipt-sheet").count(), 0);

        // DOM edits cannot turn an unknown product or a displayed price into a sale.
        await page.evaluate(() => {
            const button = document.querySelector(".add-product");
            button.dataset.productId = "999";
            button.click();
            button.dataset.productId = "1";
            document.querySelector(".product-price").textContent = "₱0.01";
        });
        assert.equal(await total(), "₱0.00");
        await add(1);
        assert.equal(await total(), "₱59.00");
        await page.evaluate(() => { document.querySelector(".product-price").textContent = "₱59.00"; });
        assert.equal(await error.isHidden(), true);
        assert.equal(await control(1, "decrease").isDisabled(), true);
        await add(1);
        await add(4);
        assert.equal(await total(), "₱173.00");
        assert.equal(await page.locator("#transaction-state").textContent(), "Order in progress");
        assert.equal(await page.locator("#item-count").textContent(), "3 items");
        await control(1, "increase").click();
        assert.equal(await total(), "₱232.00");
        await control(1, "decrease").click();
        assert.equal(await total(), "₱173.00");

        for (const amount of ["", "   ", "abc", "12a", "-50", "1.234", "2e2", "1,00", "0", "100000.01", "100"]) {
            await cash.fill(amount);
            await pay.click();
            assert.equal(await error.isVisible(), true, `Visible error for ${JSON.stringify(amount)}`);
            assert.equal(await cash.isEnabled(), true);
            assert.equal(await cash.getAttribute("aria-invalid"), "true");
            assert.equal(await page.locator(".receipt-sheet").count(), 0);
            assert.equal(await total(), "₱173.00");
        }
        assert.equal(await error.textContent(), "Insufficient payment. Please enter at least ₱173.00.");
        await page.screenshot({ path: path.join(output, "payment-error.png"), fullPage: true, animations: "disabled" });
        await add(6);
        assert.equal(await error.isHidden(), true);
        assert.equal(await cash.getAttribute("aria-invalid"), null);
        await control(6, "remove").click();
        assert.equal(await total(), "₱173.00");

        await cash.fill("200.00");
        await cash.press("Enter");
        assert.equal(await page.locator("#payment-confirmation").textContent(), "Payment successful. Paid ₱200.00 · Change ₱27.00.");
        assert.deepEqual(await page.locator(".receipt-table tbody .money").allTextContents(), ["₱118.00", "₱55.00"]);
        assert.deepEqual(await page.locator(".receipt-totals dd").allTextContents(), ["₱173.00", "₱200.00", "₱27.00"]);
        const firstReference = await page.locator(".receipt-reference").textContent();
        assert.match(firstReference, /-0001$/);
        assert.equal(await cash.isDisabled(), true);
        assert.equal(await page.locator("#transaction-state").textContent(), "Payment completed");
        assert.equal(await pay.isDisabled(), true);
        assert.equal(await page.locator(".add-product:enabled, #cart-items button:enabled").count(), 0);
        await page.screenshot({ path: path.join(output, "paid-receipt.png"), fullPage: true, animations: "disabled" });

        // Bypass disabled DOM controls to exercise the transaction phase guard.
        await page.evaluate(() => {
            document.getElementById("payment-form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
            const button = document.querySelector(".add-product");
            button.disabled = false;
            button.click();
            button.disabled = true;
        });
        assert.equal(await page.locator(".receipt-reference").textContent(), firstReference);
        assert.equal(await total(), "₱173.00");

        // A global error preserves the completed receipt and offers an explicit reset.
        await page.evaluate(() => window.dispatchEvent(new ErrorEvent("error", { message: "Test failure" })));
        assert.equal(await error.textContent(), "Something went wrong. Please start a new transaction.");
        assert.equal(await page.locator("#transaction-state").textContent(), "Reset required");
        assert.equal(await page.locator(".receipt-reference").textContent(), firstReference);
        await reset();
        assert.equal(await total(), "₱0.00");
        assert.equal(await cash.inputValue(), "");
        assert.equal(await error.isHidden(), true);
        assert.equal(await page.locator("#status-message").isHidden(), true);
        assert.equal(await page.locator("#payment-confirmation").isHidden(), true);
        assert.equal(await page.locator(".receipt-sheet").count(), 0);
        assert.equal(await cash.evaluate((input) => document.activeElement === input), true);

        await add(6);
        await page.evaluate(() => {
            const button = document.querySelector('#product-grid button[data-product-id="6"]');
            for (let i = 0; i < 120; i++) button.click();
        });
        assert.equal(await total(), "₱1,980.00");
        assert.equal(await control(6, "increase").isDisabled(), true);
        assert.equal(await page.locator('#product-grid button[data-product-id="6"]').isDisabled(), true);
        await reset();

        // Force a rendering exception inside an event, then restore the code and reset.
        await page.evaluate(() => {
            window.originalRenderCartForTest = renderCart;
            renderCart = () => { throw new Error("Injected render failure"); };
        });
        await add(1);
        assert.equal(await error.textContent(), "Something went wrong. Please start a new transaction.");
        assert.equal(await pay.isDisabled(), true);
        await page.evaluate(() => {
            renderCart = window.originalRenderCartForTest;
            delete window.originalRenderCartForTest;
        });
        await reset();
        await page.evaluate(() => window.dispatchEvent(new PromiseRejectionEvent("unhandledrejection", {
            promise: Promise.resolve(), reason: new Error("Test rejection"),
        })));
        assert.equal(await error.isVisible(), true);
        await reset();

        await add(6);
        await cash.fill("20.00");
        await pay.click();
        assert.deepEqual(await page.locator(".receipt-totals dd").allTextContents(), ["₱20.00", "₱20.00", "₱0.00"]);
        assert.match(await page.locator(".receipt-reference").textContent(), /-0002$/);
        await reset();
        await add(6);
        await cash.fill("12");
        await reset(); // Cancelled orders must not consume a reference number.
        await add(6);
        await cash.fill("₱1,000.00");
        await cash.press("Enter");
        assert.match(await page.locator(".receipt-reference").textContent(), /-0003$/);
        assert.deepEqual(await page.locator(".receipt-totals dd").allTextContents(), ["₱20.00", "₱1,000.00", "₱980.00"]);

        await page.reload();
        assert.equal(await total(), "₱0.00");
        assert.equal(await page.locator(".receipt-sheet").count(), 0);
        await page.setViewportSize({ width: 390, height: 844 });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        await page.screenshot({ path: path.join(output, "narrow-layout.png"), fullPage: true, animations: "disabled" });
        assert.deepEqual(errors, [], "No unexpected browser errors or missing assets.");
        assert.ok(requests.every((url) => url.startsWith("file:")), "The app must load only local files.");
        console.log("Browser checks passed: offline loading, cart, validation, payment, locking, receipt, reset, recovery, and narrow layout.");
        console.log(`Screenshots: ${output}`);
    } finally {
        await browser.close();
    }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
