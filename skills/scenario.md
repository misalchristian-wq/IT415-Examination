# Scenario product lists (prices in Philippine pesos, ₱)

Names may be adjusted slightly; keep at least 5 priced products.

## Scenario 1 - Campus Cafeteria POS
Walk-up cafeteria counter; student assistants take lunch orders.
| Product | Price |
|---|---|
| Rice (Plain) | 15.00 |
| Fried Chicken (1 pc) | 65.00 |
| Pork Adobo | 60.00 |
| Vegetable Side Dish | 35.00 |
| Iced Tea (cup) | 20.00 |
| Bottled Water | 20.00 |

## Scenario 2 - Campus Bakery POS
| Product | Price |
|---|---|
| Pandesal (pack of 5) | 25.00 |
| Ensaymada | 20.00 |
| Spanish Bread | 15.00 |
| Chocolate Cupcake | 30.00 |
| Loaf Bread | 55.00 |
| Brewed Coffee (cup) | 25.00 |

## Scenario 3 - Milk Tea and Beverage Shop POS
| Product | Price |
|---|---|
| Classic Milk Tea (Regular) | 59.00 |
| Wintermelon Milk Tea (Regular) | 65.00 |
| Taro Milk Tea (Regular) | 65.00 |
| Fruit Tea - Lychee (Regular) | 55.00 |
| Brown Sugar Milk Tea (Regular) | 69.00 |
| Bottled Water | 20.00 |

## Scenario 4 - Campus Snack Bar POS
| Product | Price |
|---|---|
| Classic Burger | 55.00 |
| Cheeseburger | 65.00 |
| Ham Sandwich | 40.00 |
| French Fries (Regular) | 45.00 |
| Nachos | 50.00 |
| Soda (Can) | 25.00 |

## Scenario 5 - Campus Convenience Store POS
| Product | Price |
|---|---|
| Instant Noodles | 18.00 |
| Potato Chips | 25.00 |
| Soft Drink (Can) | 25.00 |
| Bottled Water | 20.00 |
| Ballpen (piece) | 12.00 |
| Notebook (piece) | 35.00 |

## JS snippet for the template (swap in the chosen scenario)
Prices are stored in centavos.
```js
// Scenario 1 example
const STORE_NAME = "Campus Cafeteria POS";
const PRODUCTS = [
  { id: 1, name: "Rice (Plain)", price: 1500 },
  { id: 2, name: "Fried Chicken (1 pc)", price: 6500 },
  { id: 3, name: "Pork Adobo", price: 6000 },
  { id: 4, name: "Vegetable Side Dish", price: 3500 },
  { id: 5, name: "Iced Tea (cup)", price: 2000 },
  { id: 6, name: "Bottled Water", price: 2000 },
];
```