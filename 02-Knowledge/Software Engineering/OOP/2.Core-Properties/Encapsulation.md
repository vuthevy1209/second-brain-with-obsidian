---
title: Encapsulation
summary: Encapsulation is the practice of bundling data and the methods that operate on that data into a single unit (a class), while restricting direct external access to the internal state. It protects object integrity by forcing all state changes to go through a controlled API.
tags:
  - oop
  - java
  - core-properties
created: 2026-05-28
---

## The Core Idea

A class should own its data completely. External code should never be able to put an object into an inconsistent or invalid state. The way to enforce this is to make all fields `private` and expose only the operations that the class intentionally supports through `public` or `protected` methods.

When you make a field `public`, any part of the codebase can assign any value to it — valid or not. There is no single place to put validation logic, no place to trigger side effects (like publishing an event or updating a cache), and no way to change the internal representation later without breaking every caller.


## Without Encapsulation

```java
// BAD: No encapsulation
public class Product {
    public String id;
    public String name;
    public double price;
    public int stockQuantity;
    public boolean active;
}

// Caller can break invariants freely:
Product p = new Product();
p.price = -500;          // Negative price — nonsensical
p.stockQuantity = -999;  // Negative stock — impossible
p.id = null;             // Null id — unusable in any repository
```

The object is structurally broken. Nothing prevents this from happening.


## With Encapsulation

```java
public class Product {

    private final String id;
    private String name;
    private double price;
    private int stockQuantity;
    private boolean active;

    public Product(String id, String name, double price, int stockQuantity) {
        if (id == null || id.isBlank()) throw new IllegalArgumentException("Product id is required");
        if (name == null || name.isBlank()) throw new IllegalArgumentException("Product name is required");
        if (price < 0) throw new IllegalArgumentException("Price cannot be negative");
        if (stockQuantity < 0) throw new IllegalArgumentException("Stock cannot be negative");

        this.id = id;
        this.name = name;
        this.price = price;
        this.stockQuantity = stockQuantity;
        this.active = true;
    }

    public void updatePrice(double newPrice) {
        if (newPrice < 0) throw new IllegalArgumentException("Price cannot be negative");
        this.price = newPrice;
    }

    public void restock(int quantity) {
        if (quantity <= 0) throw new IllegalArgumentException("Restock quantity must be positive");
        this.stockQuantity += quantity;
    }

    public void reduceStock(int quantity) {
        if (quantity <= 0) throw new IllegalArgumentException("Quantity must be positive");
        if (quantity > this.stockQuantity) throw new IllegalStateException("Insufficient stock");
        this.stockQuantity -= quantity;
    }

    public void deactivate() {
        this.active = false;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public double getPrice() { return price; }
    public int getStockQuantity() { return stockQuantity; }
    public boolean isActive() { return active; }
}
```

Now it is impossible to set a negative price. The only way to reduce stock is through `reduceStock()`, which enforces the constraint that you cannot reduce below zero. The business rules live inside the class, not scattered across every caller.


## Encapsulation in a Service Layer

Encapsulation is not only about data classes. Service classes also encapsulate their internal dependencies and logic.

```java
public class PaymentService {

    private final PaymentGatewayClient gatewayClient;
    private final PaymentRepository paymentRepository;
    private final FraudDetector fraudDetector;
    private final EventPublisher eventPublisher;

    public PaymentService(PaymentGatewayClient gatewayClient,
                          PaymentRepository paymentRepository,
                          FraudDetector fraudDetector,
                          EventPublisher eventPublisher) {
        this.gatewayClient = gatewayClient;
        this.paymentRepository = paymentRepository;
        this.fraudDetector = fraudDetector;
        this.eventPublisher = eventPublisher;
    }

    public PaymentResult processPayment(PaymentRequest request) {
        validateRequest(request);
        checkForFraud(request);
        GatewayResponse response = gatewayClient.charge(request);
        Payment payment = recordPayment(request, response);
        notifyResult(payment);
        return PaymentResult.from(payment);
    }

    private void validateRequest(PaymentRequest request) {
        if (request.getAmount() <= 0) throw new IllegalArgumentException("Amount must be positive");
        if (request.getCurrency() == null) throw new IllegalArgumentException("Currency is required");
    }

    private void checkForFraud(PaymentRequest request) {
        FraudScore score = fraudDetector.evaluate(request);
        if (score.isHighRisk()) {
            throw new FraudSuspectedException(request.getCustomerId(), score.getValue());
        }
    }

    private Payment recordPayment(PaymentRequest request, GatewayResponse response) {
        Payment payment = new Payment(
            UUID.randomUUID().toString(),
            request.getOrderId(),
            request.getAmount(),
            request.getCurrency(),
            response.getTransactionId(),
            response.isSuccess() ? PaymentStatus.COMPLETED : PaymentStatus.FAILED
        );
        return paymentRepository.save(payment);
    }

    private void notifyResult(Payment payment) {
        eventPublisher.publish(new PaymentProcessedEvent(payment.getId(), payment.getStatus()));
    }
}
```

The caller of `PaymentService.processPayment()` does not know — and does not need to know — that fraud detection, gateway communication, database persistence, and event publishing are all happening internally. The internal complexity is hidden. The public API is a single method with a clear name and a clear purpose.


## Immutable Classes as the Strongest Form of Encapsulation

When an object's state never changes after construction, encapsulation is total. No setter, no mutation method — the object is always in the exact state it was created in.

```java
public final class Money {

    private final long amountInCents;
    private final String currency;

    public Money(long amountInCents, String currency) {
        if (amountInCents < 0) throw new IllegalArgumentException("Amount cannot be negative");
        if (currency == null || currency.length() != 3) throw new IllegalArgumentException("Invalid currency code");
        this.amountInCents = amountInCents;
        this.currency = currency;
    }

    public static Money of(double amount, String currency) {
        return new Money(Math.round(amount * 100), currency);
    }

    public Money add(Money other) {
        if (!this.currency.equals(other.currency)) {
            throw new IllegalArgumentException("Currency mismatch: " + this.currency + " vs " + other.currency);
        }
        return new Money(this.amountInCents + other.amountInCents, this.currency);
    }

    public Money subtract(Money other) {
        if (!this.currency.equals(other.currency)) {
            throw new IllegalArgumentException("Currency mismatch");
        }
        if (other.amountInCents > this.amountInCents) {
            throw new IllegalStateException("Result would be negative");
        }
        return new Money(this.amountInCents - other.amountInCents, this.currency);
    }

    public double getAmount() { return amountInCents / 100.0; }
    public String getCurrency() { return currency; }

    @Override
    public String toString() { return String.format("%.2f %s", getAmount(), currency); }
}
```

`Money` is immutable. `add()` and `subtract()` return new `Money` objects rather than modifying `this`. It is inherently thread-safe and can be freely shared across threads without synchronization.


## Benefits

Encapsulation provides several concrete engineering benefits:

**1. Invariant enforcement**: The class itself is the only place that enforces its rules. You do not have to track down all callers to find where an invalid state was introduced.

**2. Freedom to refactor internals**: If you change the internal representation — say, storing `amountInCents` as a `BigDecimal` instead of a `long` — you only need to update the class itself. All callers continue to work unchanged.

**3. Controlled side effects**: When state changes only through methods, you can trigger events, update caches, or log changes in a single place.

**4. Better testability**: You test the public API, not the internals. Internal helpers that are `private` are tested indirectly through the public API.


## Related

- [[Access-Modifiers]] — The Java keywords that implement access control
- [[Class-And-Object]] — Objects are the units of encapsulation
- [[Abstraction]] — Hiding complexity at a higher level
- [[SOLID-Principles]] — The Single Responsibility Principle reinforces encapsulation
