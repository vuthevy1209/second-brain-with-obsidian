---
title: Dependency
summary: Dependency is a relationship where one class temporarily uses another class, typically through a method parameter, a local variable, or a return type. It is the most transient and loosest form of class relationship — Class A depends on Class B only for the duration of a method call.
tags:
  - oop
  - java
  - class-relationships
created: 2026-05-28
---

## What Dependency Means

A dependency (in the UML sense) exists when a change to one class might require a change to another class. In practice, this most commonly appears when:

- A class is passed as a method parameter
- A class is instantiated as a local variable inside a method
- A class is a return type of a method
- A class is thrown or caught as an exception

Dependency is different from association in that there is no persistent field holding the reference. The relationship exists only for the duration of the method call.

Note: The term "dependency" in "dependency injection" has a broader meaning — it refers to any collaborator that a class needs, including field-level associations. This note focuses on the narrower UML sense.


## Dependency via Method Parameter

The most common form. A class receives an object of another type in a method call and uses it locally.

```java
public class PaymentService {

    private final PaymentGateway paymentGateway;
    private final PaymentRepository paymentRepository;

    public PaymentService(PaymentGateway paymentGateway, PaymentRepository paymentRepository) {
        this.paymentGateway = paymentGateway;
        this.paymentRepository = paymentRepository;
    }

    // Order is a dependency via parameter — PaymentService has no field for Order
    public PaymentResult processOrderPayment(Order order, PaymentMethod paymentMethod) {
        Money totalAmount = Money.of(order.getTotalAmount(), order.getCurrency());

        ChargeResult charge = paymentGateway.charge(order.getCustomerId(), totalAmount, paymentMethod);

        if (!charge.isSuccess()) {
            throw new PaymentFailedException(order.getId(), charge.getErrorMessage());
        }

        Payment payment = new Payment(
            UUID.randomUUID().toString(),
            order.getId(),
            order.getCustomerId(),
            totalAmount,
            PaymentStatus.COMPLETED,
            charge.getTransactionId()
        );
        paymentRepository.save(payment);

        return PaymentResult.success(payment.getId(), charge.getTransactionId());
    }
}
```

`PaymentService` depends on `Order` and `PaymentMethod` but does not hold a persistent reference to them. They are used within the scope of `processOrderPayment` and then released.


## Dependency via Local Variable

When a class creates a local instance of another class inside a method, it has a dependency on that class. This is a tight form of dependency because the class directly instantiates a concrete type.

```java
public class ProductImportService {

    private final ProductRepository productRepository;

    public ProductImportService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public ImportResult importFromCsv(String csvFilePath) {
        CsvParser parser = new CsvParser(csvFilePath);   // local dependency on CsvParser
        List<CsvRow> rows = parser.parseAll();

        int successCount = 0;
        int failureCount = 0;

        for (CsvRow row : rows) {
            try {
                Product product = new Product(
                    UUID.randomUUID().toString(),
                    row.get("name"),
                    Double.parseDouble(row.get("price")),
                    Integer.parseInt(row.get("stock"))
                );
                productRepository.save(product);
                successCount++;
            } catch (Exception e) {
                failureCount++;
            }
        }

        return new ImportResult(successCount, failureCount);
    }
}
```

`ProductImportService` depends on `CsvParser` because it creates an instance of it. If `CsvParser` changes its constructor signature, `ProductImportService` must also change. This tight dependency can be reduced by injecting the parser as a parameter:

```java
// Improved: parser injected — dependency loosened
public ImportResult importFromCsv(String csvFilePath, RecordParser parser) {
    List<Map<String, String>> rows = parser.parse(csvFilePath);
    // ... same logic
}
```

Now `ProductImportService` depends on the `RecordParser` interface, not the concrete `CsvParser`. You can pass in a JSON parser, an XML parser, or a test stub without changing the import service.


## Dependency via Return Type

A method that returns an object of another type creates a dependency between the caller and that type.

```java
public class OrderService {

    private final OrderRepository orderRepository;

    public OrderService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    // Caller depends on Order as a return type
    public Order getOrderById(String orderId) {
        return orderRepository.findById(orderId)
            .orElseThrow(() -> new OrderNotFoundException(orderId));
    }

    // Returning a DTO reduces dependency — caller does not need to know about Order internals
    public OrderSummary getOrderSummary(String orderId) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new OrderNotFoundException(orderId));
        return new OrderSummary(order.getId(), order.getStatus(), order.getTotalAmount());
    }
}
```

Returning an `Order` directly creates a dependency between every caller and the `Order` class. Returning an `OrderSummary` DTO is a deliberate choice to reduce that dependency — callers only see what they need.


## Dependency via Exception

When a method throws or catches a specific exception type, there is a dependency on that exception class.

```java
public class InventoryService {

    private final ProductRepository productRepository;

    public InventoryService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    // Callers depend on InsufficientStockException
    public void reserveStock(String productId, int quantity) throws InsufficientStockException {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new ProductNotFoundException(productId));

        if (product.getStockQuantity() < quantity) {
            throw new InsufficientStockException(productId, quantity, product.getStockQuantity());
        }

        product.reduceStock(quantity);
        productRepository.save(product);
    }
}
```

Any class that calls `reserveStock` and handles `InsufficientStockException` has a dependency on that exception class.


## Managing Dependency Strength

The tighter the dependency, the harder the code is to test and change. Here are strategies to reduce dependency strength:

1. Depend on abstractions (interfaces) rather than concrete classes. Instead of `CsvParser`, depend on `RecordParser`.
2. Accept dependencies as method parameters rather than creating them internally.
3. Return DTOs or value objects rather than domain entities to limit what callers know about your internals.
4. Use a dependency injection framework (Spring, Guice) to wire up components so that dependencies are declared but not hardcoded.


## Dependency vs. Association

| Aspect | Dependency | Association |
|---|---|---|
| Duration | Temporary (method scope) | Persistent (field) |
| Strength | Can be weaker | Typically stronger |
| Storage | Local variable / parameter | Instance field |
| Example | `processOrderPayment(Order order)` | `private final OrderRepository repo` |


## Related

- [[Association]] — Persistent structural relationships between classes
- [[Aggregation]] — Structural relationship with independent lifetimes
- [[Composition]] — Structural relationship with dependent lifetimes
- [[Coupling-And-Cohesion]] — Dependency is a form of coupling
- [[Dependency-Injection]] — Technique for managing dependencies at scale
