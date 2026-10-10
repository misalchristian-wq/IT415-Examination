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

const pesoFormatter = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

function formatMoney(centavos) {
    return pesoFormatter.format(centavos / 100);
}

// UI: use textContent for catalog text instead of inserting HTML strings.
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

renderProducts();
document.getElementById("order-total").textContent = formatMoney(0);

// Stage 1 stops at the interface. Add, Pay, and New Transaction stay disabled
// until their handlers are implemented in the following stages.
