---
title: SOLID Principles
summary: SOLID is a set of five design principles that guide the creation of software that is easy to maintain, extend, and test. Each principle addresses a specific type of design problem commonly encountered in object-oriented systems.
tags:
  - oop
  - java
  - advanced
  - solid
created: 2026-05-28
---

## S — Single Responsibility Principle

A class should have one, and only one, reason to change. "Reason to change" means responsibility — a class should be responsible for a single part of the system's functionality.

When a class has multiple responsibilities, a change to one responsibility risks breaking the others. It also makes the class harder to understand and test.

```java
// BAD: OrderService has too many responsibilities
public class OrderService {
    public Order placeOrder(PlaceOrderRequest request) { ... }
    public void sendOrderConfirmationEmail(Order order) { ... }   // notification responsibility
    public void generateInvoicePdf(Order order) { ... }           // invoice responsibility
    public void updateInventory(Order order) { ... }              // inventory responsibility
    public void writeOrderLog(Order order) { ... }                // logging responsibility
}

// GOOD: Each responsibility in its own class
public class OrderService {
    private final OrderRepository orderRepository;
    private final NotificationService notificationService;
    private final InventoryService inventoryService;

    public Order placeOrder(PlaceOrderRequest request) {
        Order order = buildOrder(request);
        inventoryService.reserve(order);
        orderRepository.save(order);
        notificationService.sendOrderConfirmation(order.getCustomerId(), order.getId());
        return order;
    }
}

public class NotificationService {
    public void sendOrderConfirmation(String customerId, String orderId) { ... }
}

public class InventoryService {
    public void reserve(Order order) { ... }
}
```


## O — Open/Closed Principle

A class should be open for extension but closed for modification. You should be able to add new behavior without changing existing, tested code.

```java
// BAD: Adding a new discount type requires modifying DiscountCalculator
public class DiscountCalculator {
    public double calculate(Order order, String discountType) {
        if (discountType.equals("PERCENTAGE")) {
            return order.getTotalAmount() * 0.1;
        } else if (discountType.equals("FLAT")) {
            return 50.0;
        } else if (discountType.equals("BUY_TWO_GET_ONE")) {   // added later — modifies existing class
            return order.getTotalAmount() / 3;
        }
        return 0;
    }
}

// GOOD: New discount types extend the system without touching existing code
public interface DiscountStrategy {
    double calculate(Order order);
}

public class PercentageDiscount implements DiscountStrategy {
    private final double rate;
    public PercentageDiscount(double rate) { this.rate = rate; }

    @Override
    public double calculate(Order order) {
        return order.getTotalAmount() * rate;
    }
}

public class FlatDiscount implements DiscountStrategy {
    private final double amount;
    public FlatDiscount(double amount) { this.amount = amount; }

    @Override
    public double calculate(Order order) { return amount; }
}

public class BuyTwoGetOneFreeDiscount implements DiscountStrategy {
    @Override
    public double calculate(Order order) {
        return order.getTotalAmount() / 3;
    }
}

public class OrderService {
    public double calculateFinalPrice(Order order, DiscountStrategy discount) {
        return order.getTotalAmount() - discount.calculate(order);
    }
}
```

Adding a new discount type is now a new class. Nothing existing changes.


## L — Liskov Substitution Principle

Objects of a subclass should be substitutable for objects of the superclass without altering the correctness of the program.

```java
// BAD: ReadOnlyUserRepository breaks the contract of UserRepository
public class UserRepository {
    public void save(User user) { ... }
    public Optional<User> findById(String id) { ... }
    public void delete(String id) { ... }
}

public class ReadOnlyUserRepository extends UserRepository {
    @Override
    public void save(User user) {
        throw new UnsupportedOperationException("Read-only repository cannot save");
    }

    @Override
    public void delete(String id) {
        throw new UnsupportedOperationException("Read-only repository cannot delete");
    }
}

// Code that accepts UserRepository breaks if given a ReadOnlyUserRepository:
public class UserService {
    private final UserRepository userRepository;

    public void createUser(User user) {
        userRepository.save(user);   // throws UnsupportedOperationException at runtime!
    }
}

// GOOD: Separate read and write capabilities
public interface UserReader {
    Optional<User> findById(String id);
    List<User> findAll();
}

public interface UserWriter {
    void save(User user);
    void delete(String id);
}

public class SqlUserRepository implements UserReader, UserWriter { ... }
public class ReadOnlyUserRepository implements UserReader { ... }  // No write methods at all
```


## I — Interface Segregation Principle

A class should not be forced to implement methods it does not use. Prefer small, focused interfaces over large general-purpose ones.

```java
// BAD: One massive interface forces irrelevant methods on every implementor
public interface PaymentProcessor {
    void processCard(CardDetails card, Money amount);
    void processWallet(String walletId, Money amount);
    void processBankTransfer(BankAccount account, Money amount);
    void processCrypto(String walletAddress, Money amount);
    void refundCard(String transactionId, Money amount);
    void refundWallet(String transactionId, Money amount);
    void generateMonthlyStatement(String accountId);
    void exportTransactionHistory(String accountId, LocalDate from, LocalDate to);
}

// GOOD: Split into focused interfaces
public interface CardPaymentProcessor {
    ChargeResult processCard(CardDetails card, Money amount);
    RefundResult refundCard(String transactionId, Money amount);
}

public interface WalletPaymentProcessor {
    ChargeResult processWallet(String walletId, Money amount);
    RefundResult refundWallet(String transactionId, Money amount);
}

public interface StatementGenerator {
    Statement generateMonthlyStatement(String accountId);
}

public interface TransactionExporter {
    byte[] exportTransactionHistory(String accountId, LocalDate from, LocalDate to);
}

// StripeGateway only needs to implement what it supports
public class StripeGateway implements CardPaymentProcessor {
    @Override
    public ChargeResult processCard(CardDetails card, Money amount) { ... }

    @Override
    public RefundResult refundCard(String transactionId, Money amount) { ... }
}
```


## D — Dependency Inversion Principle

High-level modules should not depend on low-level modules. Both should depend on abstractions. Abstractions should not depend on details. Details should depend on abstractions.

```java
// BAD: High-level ProductService depends directly on a low-level concrete class
public class ProductService {
    private final MySQLProductRepository repository;   // concrete, low-level class

    public ProductService() {
        this.repository = new MySQLProductRepository("jdbc:mysql://localhost/mydb");
    }

    public Product getProduct(String id) {
        return repository.findById(id).orElseThrow();
    }
}

// GOOD: Both ProductService and MySQLProductRepository depend on an abstraction
public interface ProductRepository {
    Optional<Product> findById(String id);
    Product save(Product product);
    void delete(String id);
}

public class ProductService {
    private final ProductRepository productRepository;   // abstraction

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public Product getProduct(String id) {
        return productRepository.findById(id)
            .orElseThrow(() -> new ProductNotFoundException(id));
    }
}

public class MySQLProductRepository implements ProductRepository {
    @Override
    public Optional<Product> findById(String id) { ... }

    @Override
    public Product save(Product product) { ... }

    @Override
    public void delete(String id) { ... }
}

// Can now swap in any other repository — PostgreSQL, in-memory for tests, etc.
ProductService service = new ProductService(new MySQLProductRepository(dataSource));
ProductService testService = new ProductService(new InMemoryProductRepository());
```


## SOLID in Practice

The five principles reinforce each other:

- SRP keeps classes small and focused, making them easier to test in isolation.
- OCP allows the system to grow through new classes, not through editing existing ones.
- LSP ensures that polymorphism works reliably — any subtype can replace its parent without surprises.
- ISP prevents bloated interfaces that force unnecessary implementations.
- DIP decouples high-level logic from low-level details through abstractions, making both sides independently changeable and testable.

A codebase that follows SOLID tends to be one where individual components can be understood, tested, and modified without needing to understand the whole system.


## Related

- [[Encapsulation]] — SRP is an extension of encapsulation at a higher level
- [[Polymorphism]] — OCP and LSP are built on polymorphism
- [[Abstraction]] — DIP and ISP are about designing the right abstractions
- [[Dependency-Injection]] — DIP motivates DI
- [[Coupling-And-Cohesion]] — SOLID principles drive toward low coupling and high cohesion
