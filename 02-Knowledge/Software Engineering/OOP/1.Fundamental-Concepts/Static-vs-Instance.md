---
title: Static vs Instance
summary: Instance members belong to individual objects and hold per-object state. Static members belong to the class itself and are shared across all instances. Understanding the distinction is critical for correct memory usage and thread safety.
tags:
  - oop
  - java
  - fundamentals
created: 2026-05-28
---

## Instance Members

An instance field holds data that is specific to one object. Every time you create a new object, each of its instance fields gets its own memory slot. Modifying a field on one object has zero effect on any other object of the same class.

An instance method operates on the state of the specific object it is called on. It has access to `this`, which refers to the current object.

```java
public class ProductService {

    private final ProductRepository productRepository;
    private final PricingEngine pricingEngine;
    private final EventPublisher eventPublisher;

    public ProductService(ProductRepository productRepository,
                          PricingEngine pricingEngine,
                          EventPublisher eventPublisher) {
        this.productRepository = productRepository;
        this.pricingEngine = pricingEngine;
        this.eventPublisher = eventPublisher;
    }

    public Product getProduct(String id) {
        return productRepository.findById(id)
            .orElseThrow(() -> new ProductNotFoundException(id));
    }

    public double calculateFinalPrice(String productId, String customerId) {
        Product product = getProduct(productId);
        return pricingEngine.compute(product, customerId);
    }
}
```

`productRepository`, `pricingEngine`, and `eventPublisher` are instance fields. Two different `ProductService` instances could theoretically hold different repositories or different pricing engines. Each instance manages its own collaboration objects.


## Static Members

A `static` field belongs to the class, not to any individual instance. There is exactly one copy of a `static` field, shared by all objects of that class. A `static` method cannot access `this` or any instance fields — it only operates on static fields or on data passed as arguments.

```java
public class PaymentValidator {

    private static final int CVV_LENGTH = 3;
    private static final int CARD_NUMBER_LENGTH = 16;
    private static final double MAX_TRANSACTION_AMOUNT = 50000.0;
    private static int totalValidationsPerformed = 0;   // shared counter

    public static ValidationResult validateCard(String cardNumber, String cvv) {
        totalValidationsPerformed++;

        if (cardNumber == null || cardNumber.length() != CARD_NUMBER_LENGTH) {
            return ValidationResult.failure("Card number must be 16 digits");
        }
        if (cvv == null || cvv.length() != CVV_LENGTH) {
            return ValidationResult.failure("CVV must be 3 digits");
        }
        return ValidationResult.success();
    }

    public static ValidationResult validateAmount(double amount) {
        totalValidationsPerformed++;

        if (amount <= 0) {
            return ValidationResult.failure("Amount must be positive");
        }
        if (amount > MAX_TRANSACTION_AMOUNT) {
            return ValidationResult.failure("Amount exceeds maximum limit of " + MAX_TRANSACTION_AMOUNT);
        }
        return ValidationResult.success();
    }

    public static int getTotalValidationsPerformed() {
        return totalValidationsPerformed;
    }
}

// Usage — called on the class, not on an instance
ValidationResult result = PaymentValidator.validateCard("4111111111111111", "123");
ValidationResult amountResult = PaymentValidator.validateAmount(299.99);
System.out.println(PaymentValidator.getTotalValidationsPerformed()); // 2
```

`CVV_LENGTH`, `CARD_NUMBER_LENGTH`, and `MAX_TRANSACTION_AMOUNT` are constants — declared `static final`. `validateCard` and `validateAmount` are pure utility functions that do not need any object state. This is the appropriate use of `static`.


## Static Constants

`public static final` is the standard way to define a named constant in Java. The value is computed once and shared everywhere.

```java
public class OrderStatus {

    public static final String PENDING = "PENDING";
    public static final String CONFIRMED = "CONFIRMED";
    public static final String PROCESSING = "PROCESSING";
    public static final String SHIPPED = "SHIPPED";
    public static final String DELIVERED = "DELIVERED";
    public static final String CANCELLED = "CANCELLED";
    public static final String REFUNDED = "REFUNDED";

    private OrderStatus() {
        // Prevent instantiation — this class is a namespace for constants only
    }
}

// Usage
if (order.getStatus().equals(OrderStatus.PENDING)) {
    order.confirm();
}
```

In modern Java, an `enum` is often a better choice than a class of string constants because the compiler enforces that only valid values are used.


## Static Factory Methods

Static methods are commonly used as named constructors — they clarify what kind of object is being created without requiring the caller to know all the constructor parameters.

```java
public class Money {

    private final long amountInCents;
    private final String currency;

    private Money(long amountInCents, String currency) {
        this.amountInCents = amountInCents;
        this.currency = currency;
    }

    public static Money of(double amount, String currency) {
        long cents = Math.round(amount * 100);
        return new Money(cents, currency);
    }

    public static Money zero(String currency) {
        return new Money(0, currency);
    }

    public static Money ofCents(long cents, String currency) {
        return new Money(cents, currency);
    }

    public Money add(Money other) {
        if (!this.currency.equals(other.currency)) {
            throw new IllegalArgumentException("Cannot add money of different currencies");
        }
        return new Money(this.amountInCents + other.amountInCents, this.currency);
    }

    public double getAmount() { return amountInCents / 100.0; }
    public String getCurrency() { return currency; }
}

// Usage
Money price = Money.of(29.99, "USD");
Money discount = Money.of(5.00, "USD");
Money finalPrice = price.add(discount.negate());
```


## Static Initializer Block

If a `static` field requires complex initialization logic that cannot be expressed in a single expression, use a static initializer block. It runs exactly once when the class is first loaded by the JVM.

```java
public class CountryCodeRegistry {

    private static final Map<String, String> COUNTRY_DIAL_CODES;

    static {
        Map<String, String> map = new HashMap<>();
        map.put("VN", "+84");
        map.put("US", "+1");
        map.put("UK", "+44");
        map.put("JP", "+81");
        map.put("SG", "+65");
        COUNTRY_DIAL_CODES = Collections.unmodifiableMap(map);
    }

    public static String getDialCode(String countryCode) {
        return COUNTRY_DIAL_CODES.getOrDefault(countryCode, "Unknown");
    }
}
```


## Thread Safety Considerations

Static fields are shared across all threads. If multiple threads can modify a static field concurrently, you must synchronize access.

```java
public class RequestCounter {

    private static final AtomicLong requestCount = new AtomicLong(0);

    public static void increment() {
        requestCount.incrementAndGet();
    }

    public static long get() {
        return requestCount.get();
    }
}
```

Using `AtomicLong` instead of a plain `long` ensures that increment and read operations are thread-safe without explicit `synchronized` blocks.

Instance fields, by contrast, are typically not shared between threads because each thread works with its own object. This is one reason why stateless service objects (where all state comes from method parameters) are inherently thread-safe.


## Decision Guide

| Question | Answer | Implication |
|---|---|---|
| Does each object need its own value? | Yes | Instance field |
| Is this a shared configuration or constant? | Yes | Static final field |
| Does the method need `this`? | Yes | Instance method |
| Is it a pure utility / factory / constant accessor? | Yes | Static method |
| Is it related to the Singleton pattern? | Yes | Static field + private constructor |


## Related

- [[Class-And-Object]] — Objects are the context in which instance members live
- [[This-Keyword]] — `this` is only available in instance context
- [[Encapsulation]] — Instance fields should always be private
- [[Design-Patterns]] — Singleton is built on a static field
