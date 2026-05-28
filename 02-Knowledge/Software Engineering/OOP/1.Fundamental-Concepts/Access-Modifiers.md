---
title: Access Modifiers
summary: Access modifiers control which parts of the codebase can see and interact with a class, field, method, or constructor. They are the primary mechanism for enforcing encapsulation boundaries.
tags:
  - oop
  - java
  - fundamentals
created: 2026-05-28
---

## Overview

Java provides four access levels, from most restrictive to least:

| Modifier | Same Class | Same Package | Subclass | Everywhere |
|---|:---:|:---:|:---:|:---:|
| `private` | Yes | No | No | No |
| (package-private) | Yes | Yes | No | No |
| `protected` | Yes | Yes | Yes | No |
| `public` | Yes | Yes | Yes | Yes |

The right access modifier signals to other developers (and enforces in the compiler) the intended usage boundary of each member. Choosing the wrong modifier — especially defaulting everything to `public` — removes the protection that encapsulation provides.


## private

`private` members are visible only within the class in which they are declared. This is the correct default for all instance fields. It prevents any external code from reading or modifying state directly, forcing all interaction to go through the class's public API.

```java
public class ProductService {

    private final ProductRepository productRepository;
    private final InventoryClient inventoryClient;
    private final EventPublisher eventPublisher;

    public ProductService(ProductRepository productRepository,
                          InventoryClient inventoryClient,
                          EventPublisher eventPublisher) {
        this.productRepository = productRepository;
        this.inventoryClient = inventoryClient;
        this.eventPublisher = eventPublisher;
    }

    public Product createProduct(CreateProductRequest request) {
        validateRequest(request);                    // private helper
        Product product = buildProduct(request);     // private helper
        Product saved = productRepository.save(product);
        eventPublisher.publish(new ProductCreatedEvent(saved.getId()));
        return saved;
    }

    private void validateRequest(CreateProductRequest request) {
        if (request.getPrice() < 0) {
            throw new IllegalArgumentException("Price must be non-negative");
        }
        if (request.getName() == null || request.getName().isBlank()) {
            throw new IllegalArgumentException("Product name is required");
        }
    }

    private Product buildProduct(CreateProductRequest request) {
        return new Product(
            UUID.randomUUID().toString(),
            request.getName(),
            request.getPrice(),
            request.getStockQuantity()
        );
    }
}
```

`productRepository`, `inventoryClient`, `eventPublisher`, `validateRequest`, and `buildProduct` are all `private`. They are implementation details. Callers of `ProductService` only need `createProduct`.


## Package-Private (Default)

If you write no modifier keyword at all, the member is visible to all classes in the same package. This is sometimes used for internal utility classes or helpers that should not be part of the public API but need to be shared across a few classes within the same module.

```java
// Inside package com.example.payment
class PaymentGatewayConfig {    // no modifier — package-private
    static final String API_BASE_URL = "https://api.payment-gateway.com/v2";
    static final int TIMEOUT_SECONDS = 30;
}
```

`PaymentGatewayConfig` is accessible to all classes in `com.example.payment` but invisible to code outside of that package.


## protected

`protected` members are visible within the same package and in all subclasses, regardless of what package the subclass is in. It is the access level designed for inheritance relationships.

```java
public abstract class BaseRepository<T, ID> {

    protected final JdbcTemplate jdbcTemplate;
    protected final String tableName;

    protected BaseRepository(JdbcTemplate jdbcTemplate, String tableName) {
        this.jdbcTemplate = jdbcTemplate;
        this.tableName = tableName;
    }

    public Optional<T> findById(ID id) {
        String sql = buildFindByIdSql(id);       // private
        List<T> results = jdbcTemplate.query(sql, getRowMapper());
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    protected abstract RowMapper<T> getRowMapper();

    private String buildFindByIdSql(ID id) {
        return "SELECT * FROM " + tableName + " WHERE id = '" + id + "'";
    }
}

public class ProductRepository extends BaseRepository<Product, String> {

    public ProductRepository(JdbcTemplate jdbcTemplate) {
        super(jdbcTemplate, "products");
    }

    @Override
    protected RowMapper<Product> getRowMapper() {
        return (rs, rowNum) -> new Product(
            rs.getString("id"),
            rs.getString("name"),
            rs.getDouble("price"),
            rs.getInt("stock_quantity")
        );
    }

    public List<Product> findByCategory(String categoryId) {
        String sql = "SELECT * FROM " + tableName + " WHERE category_id = ?";
        return jdbcTemplate.query(sql, getRowMapper(), categoryId);
    }
}
```

`jdbcTemplate` and `tableName` are `protected` so that `ProductRepository` can use them. `getRowMapper()` is `protected abstract`, meaning every subclass must implement it. Callers outside the hierarchy never see any of these.


## public

`public` members form the published API of a class — the contract that all external callers depend on. Once you make a method `public`, you are committing to keeping its signature stable, because changing it is a breaking change for all callers.

```java
public class OrderService {

    // These are public because they form the service's API
    public Order placeOrder(PlaceOrderRequest request) { ... }
    public Order cancelOrder(String orderId) { ... }
    public List<Order> getOrdersByCustomer(String customerId) { ... }
    public Order getOrderById(String orderId) { ... }
}
```

Keep the `public` surface of a class as small as possible. Everything that does not need to be public should be `private` or `protected`.


## Practical Design Rules

1. Start with `private`. Only widen the access level when there is a concrete reason.
2. Never make a field `public`. Expose data through getter methods so you can add validation or lazy-loading later.
3. Use `protected` only for members explicitly designed for subclass use. Overusing `protected` creates hidden dependencies between a parent and its subclasses.
4. `public` methods and constructors constitute the class contract. Document them thoroughly with Javadoc.


## Common Mistake: Making Everything Public

```java
// BAD: No information hiding
public class PaymentProcessor {
    public String apiKey;            // Secret key exposed to the entire codebase
    public HttpClient httpClient;    // Internal detail, unnecessary to expose
    public String gatewayUrl;        // Configuration that callers should not touch

    public String encryptPayload(String payload) { ... }   // Internal helper exposed
    public String buildRequestBody(Payment payment) { ... } // Internal helper exposed
    public void logTransaction(String txId) { ... }         // Internal helper exposed
}
```

When every member is `public`, there is no boundary between implementation and interface. Any caller can start depending on internal details, making future refactoring almost impossible without breaking the entire system.


## Related

- [[Encapsulation]] — Access modifiers are the tools that enable encapsulation
- [[Inheritance]] — How `protected` is used across class hierarchies
- [[Class-And-Object]] — Access modifiers are declared at the class level
