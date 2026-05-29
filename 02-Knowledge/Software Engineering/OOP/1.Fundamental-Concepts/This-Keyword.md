---
title: This Keyword
summary: The `this` keyword is a reference to the current object instance. It is used to disambiguate fields from parameters, chain constructors, return the current object from a method, and pass the current object as an argument.
tags:
  - oop
  - java
  - fundamentals
created: 2026-05-28
---

## What `this` Refers To

Inside any instance method or constructor, `this` is an implicit reference to the object on which the method or constructor was invoked. You can think of it as the object's reference to itself.

`this` is only available in instance context. Static methods have no associated object, so `this` does not exist inside a static method.


## Disambiguating Fields from Parameters

The most common use of `this` is to distinguish between an instance field and a method or constructor parameter that shares the same name.

```java
public class Product {

    private String id;
    private String name;
    private double price;

    public Product(String id, String name, double price) {
        this.id = id;       // this.id → instance field, id → parameter
        this.name = name;
        this.price = price;
    }

    public void updatePrice(double price) {
        if (price < 0) {
            throw new IllegalArgumentException("Price cannot be negative");
        }
        this.price = price; // this.price → field, price → parameter
    }
}
```

Without `this.id = id`, the assignment would be `id = id`, which is a no-op — the parameter is being assigned to itself, and the field remains uninitialized.


## Constructor Chaining with `this()`

Inside a constructor, `this(...)` calls another constructor of the same class. This is called constructor chaining. It eliminates the need to duplicate initialization logic across multiple constructors.

`this(...)` must be the very first statement in the constructor body.

```java
public class OrderLineItem {

    private final String productId;
    private final int quantity;
    private final double unitPrice;
    private final double discount;  // percentage, e.g. 0.1 for 10%

    public OrderLineItem(String productId, int quantity, double unitPrice) {
        this(productId, quantity, unitPrice, 0.0);   // no discount by default
    }

    public OrderLineItem(String productId, int quantity, double unitPrice, double discount) {
        this.productId = productId;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.discount = discount;
    }

    public double calculateSubtotal() {
        double raw = quantity * unitPrice;
        return raw - (raw * discount);
    }
}
```

The first constructor delegates to the second, passing `0.0` as the default discount value. All field assignments happen in one place.


## Returning `this` for Method Chaining (Builder / Fluent API)

A method can return `this` to enable a fluent interface, where multiple method calls are chained on the same object. This pattern is central to the Builder design pattern.

```java
public class ProductQueryBuilder {

    private String categoryId;
    private Double minPrice;
    private Double maxPrice;
    private Boolean inStockOnly;
    private String sortBy;
    private int page = 0;
    private int pageSize = 20;

    public ProductQueryBuilder withCategory(String categoryId) {
        this.categoryId = categoryId;
        return this;   // returning this enables chaining
    }

    public ProductQueryBuilder withPriceRange(double min, double max) {
        this.minPrice = min;
        this.maxPrice = max;
        return this;
    }

    public ProductQueryBuilder inStockOnly() {
        this.inStockOnly = true;
        return this;
    }

    public ProductQueryBuilder sortBy(String field) {
        this.sortBy = field;
        return this;
    }

    public ProductQueryBuilder page(int page, int size) {
        this.page = page;
        this.pageSize = size;
        return this;
    }

    public ProductQuery build() {
        return new ProductQuery(categoryId, minPrice, maxPrice, inStockOnly, sortBy, page, pageSize);
    }
}

// Usage — chained calls read like a sentence
ProductQuery query = new ProductQueryBuilder()
    .withCategory("electronics")
    .withPriceRange(100.0, 2000.0)
    .inStockOnly()
    .sortBy("price")
    .page(0, 10)
    .build();
```

Each method returns `this`, which is the same `ProductQueryBuilder` object. This allows the next call to immediately follow without a temporary variable.


## Passing `this` as an Argument

You can pass `this` as an argument to another method or constructor, which passes the current object as a reference.

```java
public class OrderProcessor {

    private final PaymentService paymentService;
    private final NotificationService notificationService;
    private final AuditLogger auditLogger;

    public OrderProcessor(PaymentService paymentService,
                          NotificationService notificationService,
                          AuditLogger auditLogger) {
        this.paymentService = paymentService;
        this.notificationService = notificationService;
        this.auditLogger = auditLogger;
    }

    public void processOrder(Order order) {
        auditLogger.log(this, "Processing order: " + order.getId());
        // Passes `this` so the logger can record which processor handled it

        PaymentResult result = paymentService.charge(order.getTotalAmount(), order.getCustomerId());

        if (result.isSuccess()) {
            notificationService.sendConfirmation(order.getCustomerId(), order.getId());
            auditLogger.log(this, "Order processed successfully: " + order.getId());
        } else {
            auditLogger.log(this, "Payment failed for order: " + order.getId());
            throw new PaymentFailedException(order.getId(), result.getErrorMessage());
        }
    }
}
```

`auditLogger.log(this, ...)` passes the `OrderProcessor` instance to the logger so the audit trail records which component performed the operation.


## What `this` Cannot Do

- `this` cannot be used in a `static` method or `static` block. Static context has no associated object.
- `this(...)` must be the first statement in a constructor. You cannot put any logic before it.
- `this` cannot be reassigned. It is an implicit read-only reference.


## Related

- [[Class-And-Object]] — `this` always refers to the current object
- [[Constructor, Destructor]] — `this()` for constructor chaining, `super()` for parent constructor
- [[Static-vs-Instance]] — `this` is only available in instance context
- [[Design-Patterns]] — Fluent APIs and the Builder pattern use `return this`
