---
title: Coupling and Cohesion
summary: Coupling measures how dependent classes are on each other. Cohesion measures how focused and related the responsibilities within a single class are. Good design aims for low coupling and high cohesion — classes that are internally unified and externally independent.
tags:
  - oop
  - java
  - advanced
created: 2026-05-28
---

## What Coupling Is

Coupling is the degree to which one class depends on another. When class A directly references class B's internal details — its concrete type, its fields, its implementation — a change in B will likely require a change in A. That is tight coupling.

Loose coupling means A knows as little about B as possible — typically only an interface — and the specific implementation of B can be swapped out or changed without touching A.


## Tight Coupling Example

```java
// TIGHT COUPLING: OrderService directly knows about MySQLOrderRepository
public class OrderService {

    private final MySQLOrderRepository orderRepository;   // concrete class
    private final SMTPEmailSender emailSender;            // concrete class
    private final StripePaymentGateway paymentGateway;    // concrete class

    public OrderService() {
        this.orderRepository = new MySQLOrderRepository("jdbc:mysql://localhost/orders");
        this.emailSender = new SMTPEmailSender("smtp.company.com", 587);
        this.paymentGateway = new StripePaymentGateway("sk_live_xxxx");
    }

    public Order placeOrder(PlaceOrderRequest request) {
        Order order = new Order(...);
        orderRepository.insertOrder(order);           // calling internal method name
        emailSender.sendHtml(request.getEmail(), "Order confirmed", buildHtml(order));
        paymentGateway.createCharge(order.getAmount(), "usd", request.getCardToken());
        return order;
    }
}
```

Problems with this design:
- You cannot test `OrderService` without a live MySQL database, a real SMTP server, and a real Stripe key.
- Switching from MySQL to PostgreSQL requires editing `OrderService`.
- Switching from Stripe to PayPal requires editing `OrderService`.
- The class is impossible to use in different environments (dev, staging, prod) without hard-coded configuration.


## Loose Coupling Example

```java
// LOOSE COUPLING: OrderService depends only on interfaces
public class OrderService {

    private final OrderRepository orderRepository;         // interface
    private final NotificationService notificationService; // interface
    private final PaymentGateway paymentGateway;           // interface

    public OrderService(OrderRepository orderRepository,
                        NotificationService notificationService,
                        PaymentGateway paymentGateway) {
        this.orderRepository = orderRepository;
        this.notificationService = notificationService;
        this.paymentGateway = paymentGateway;
    }

    public Order placeOrder(PlaceOrderRequest request) {
        Order order = buildOrder(request);
        paymentGateway.charge(request.getCustomerId(), order.getTotalAmount(), request.getPaymentMethod());
        orderRepository.save(order);
        notificationService.sendOrderConfirmation(request.getCustomerId(), order.getId());
        return order;
    }
}
```

Now `OrderService` knows nothing about MySQL, SMTP, or Stripe. You can inject:
- `InMemoryOrderRepository` in unit tests
- `MySQLOrderRepository` in production
- `FakeNotificationService` in integration tests
- `StripePaymentGateway` or `PayPalGateway` depending on the deployment config


## What Cohesion Is

Cohesion measures how closely related the responsibilities inside a single class are. A highly cohesive class does one thing and does it completely. A low-cohesion class is a grab-bag of unrelated functionality.

High cohesion makes a class easier to understand, easier to test, and safer to change. It is closely related to the Single Responsibility Principle.


## Low Cohesion Example

```java
// LOW COHESION: This class does too many unrelated things
public class OrderManager {

    public Order placeOrder(PlaceOrderRequest request) { ... }      // order management
    public void sendEmail(String to, String body) { ... }           // email sending
    public byte[] generatePdf(Order order) { ... }                  // PDF generation
    public void logToFile(String message) { ... }                   // file logging
    public String formatCurrency(double amount) { ... }             // formatting utility
    public boolean validateCreditCard(String cardNumber) { ... }    // payment validation
}
```

This class is a mess. A developer looking for email-sending logic, PDF generation, or card validation would not intuitively look in `OrderManager`. A change to PDF generation risks breaking order placement. Testing order placement requires understanding all the other unrelated methods.


## High Cohesion Example

```java
// HIGH COHESION: Each class has a single focused purpose
public class OrderService {
    public Order placeOrder(PlaceOrderRequest request) { ... }
    public Order cancelOrder(String orderId) { ... }
    public List<Order> getOrdersByCustomer(String customerId) { ... }
}

public class NotificationService {
    public void sendOrderConfirmation(String customerId, String orderId) { ... }
    public void sendShippingUpdate(String customerId, String trackingNumber) { ... }
    public void sendPaymentReceipt(String customerId, String paymentId) { ... }
}

public class InvoiceService {
    public Invoice generateInvoice(Order order) { ... }
    public byte[] renderInvoicePdf(Invoice invoice) { ... }
    public void emailInvoice(Invoice invoice, String customerEmail) { ... }
}

public class PaymentValidator {
    public ValidationResult validateCard(String cardNumber, String cvv) { ... }
    public ValidationResult validateAmount(Money amount) { ... }
    public ValidationResult validateCurrency(String currency) { ... }
}
```

Each class is responsible for exactly one area. You can read, understand, and test each one independently.


## Measuring and Improving Coupling

Coupling can be classified from tightest to loosest:

| Type | Description | Example |
|---|---|---|
| Content coupling | Class A accesses B's internal fields directly | `order.status = "CANCELLED"` |
| Common coupling | Both classes share a global mutable state | Static mutable field |
| Control coupling | A passes a flag that controls B's behavior | `process(order, true)` |
| Stamp coupling | A passes a whole object to B but B uses only part | `sendEmail(order)` when only email needed |
| Data coupling | A and B share only primitive/value data through parameters | `sendEmail(email, subject, body)` |
| Message coupling | A calls B through an interface with no shared data | `gateway.charge(request)` |

Message coupling is the loosest and most desirable form. Content coupling is the most dangerous and must be eliminated through encapsulation.


## The Coupling-Cohesion Trade-off

Trying to reduce coupling often means splitting classes, which creates more classes that need to interact. That interaction must be managed carefully. The goal is not zero coupling — that is impossible — but rather the right kind of coupling through well-defined, stable interfaces.

A class that is highly cohesive is easy to reason about in isolation. When two highly cohesive classes need to interact, they should do so through a minimal, stable interface. This combination — high cohesion inside classes, loose coupling between classes — is the ideal.


## Practical Checklist

For each class you write or review:

1. Can you describe what this class does in a single short sentence? If not, it may have low cohesion.
2. Does this class depend directly on concrete implementations of its collaborators? If so, introduce interfaces.
3. Does this class create its own dependencies with `new`? If so, consider injecting them.
4. If you change one method, do you expect to need to change methods that seem unrelated? If so, the class is doing too much.
5. Is this class easy to test without setting up a full system? If not, coupling is too tight.


## Related

- [[SOLID-Principles]] — SRP drives cohesion; DIP drives loose coupling
- [[Dependency-Injection]] — The primary technique for achieving loose coupling
- [[Association]] — Coupling is a property of associations between classes
- [[Composition]] — Composition tends to produce looser coupling than inheritance
- [[Design-Patterns]] — Strategy, Observer, and Facade patterns address coupling problems
