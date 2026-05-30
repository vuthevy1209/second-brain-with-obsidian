---
title: Composition
summary: Composition is a "has-a" relationship where one class creates and owns the objects of another class, and those contained objects cannot exist meaningfully outside of their owner. It is the strongest form of aggregation, with the container fully controlling the lifecycle of its parts.
tags:
  - oop
  - java
  - class-relationships
created: 2026-05-28
---

## What Composition Means

In composition, the contained objects are created by the container, belong exclusively to it, and are destroyed when the container is destroyed. The parts do not have an independent meaningful existence outside of their whole.

This is the key difference from aggregation: in aggregation, the parts can live independently and be shared. In composition, the parts are private implementation details of the whole.

The recommendation "favor composition over inheritance" refers to this relationship. Rather than inheriting behavior from a parent class, a class can compose smaller, focused objects to build up its capabilities.


## Example: Order and OrderLineItems

An `Order` is made of `OrderLineItem` objects. An `OrderLineItem` makes no sense without the `Order` it belongs to. If the order is cancelled and deleted, its line items have no reason to exist.

```java
public class OrderLineItem {

    private final String productId;
    private final String productName;
    private final int quantity;
    private final double unitPrice;

    OrderLineItem(String productId, String productName, int quantity, double unitPrice) {
        if (quantity <= 0) throw new IllegalArgumentException("Quantity must be positive");
        if (unitPrice < 0) throw new IllegalArgumentException("Unit price cannot be negative");
        this.productId = productId;
        this.productName = productName;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
    }

    double getSubtotal() { return quantity * unitPrice; }
    public String getProductId() { return productId; }
    public String getProductName() { return productName; }
    public int getQuantity() { return quantity; }
    public double getUnitPrice() { return unitPrice; }
}

public class Order {

    private final String id;
    private final String customerId;
    private final List<OrderLineItem> lineItems;   // Composed parts
    private OrderStatus status;
    private final Instant createdAt;

    public Order(String id, String customerId) {
        this.id = id;
        this.customerId = customerId;
        this.lineItems = new ArrayList<>();        // Created internally
        this.status = OrderStatus.PENDING;
        this.createdAt = Instant.now();
    }

    public void addItem(String productId, String productName, int quantity, double unitPrice) {
        // The Order creates its own OrderLineItem — caller never constructs one directly
        OrderLineItem item = new OrderLineItem(productId, productName, quantity, unitPrice);
        lineItems.add(item);
    }

    public void removeItem(String productId) {
        lineItems.removeIf(item -> item.getProductId().equals(productId));
    }

    public double getTotalAmount() {
        return lineItems.stream().mapToDouble(OrderLineItem::getSubtotal).sum();
    }

    public void confirm() {
        if (lineItems.isEmpty()) throw new IllegalStateException("Cannot confirm an empty order");
        this.status = OrderStatus.CONFIRMED;
    }

    public void cancel() {
        if (status == OrderStatus.SHIPPED || status == OrderStatus.DELIVERED) {
            throw new IllegalStateException("Cannot cancel an order that has already shipped");
        }
        this.status = OrderStatus.CANCELLED;
    }

    public String getId() { return id; }
    public String getCustomerId() { return customerId; }
    public OrderStatus getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public List<OrderLineItem> getLineItems() { return Collections.unmodifiableList(lineItems); }
}
```

`OrderLineItem` has a package-private constructor. It cannot be instantiated from outside the `Order` package directly. The `Order` class is the only entity that creates `OrderLineItem` instances. This is a strong encapsulation of the composition relationship.

```java
Order order = new Order("ORD-001", "CUST-001");
order.addItem("P001", "Laptop Pro 15", 1, 1299.99);
order.addItem("P002", "Laptop Bag", 1, 49.99);

System.out.println(order.getTotalAmount()); // 1349.98
order.confirm();
```

The caller never creates an `OrderLineItem`. They call `order.addItem(...)` and the `Order` manages its own internal structure.


## Example: PaymentRequest and PaymentDetails

A `PaymentRequest` composes a `PaymentDetails` object that carries the card or wallet data. The details are meaningless without the context of the request.

```java
public class CardDetails {

    private final String cardNumberMask;  // last 4 digits only, never store full number
    private final String cardholderName;
    private final String expiryMonth;
    private final String expiryYear;
    private final String paymentToken;    // tokenized by gateway SDK

    CardDetails(String cardNumberMask, String cardholderName,
                String expiryMonth, String expiryYear, String paymentToken) {
        this.cardNumberMask = cardNumberMask;
        this.cardholderName = cardholderName;
        this.expiryMonth = expiryMonth;
        this.expiryYear = expiryYear;
        this.paymentToken = paymentToken;
    }

    public String getPaymentToken() { return paymentToken; }
    public String getCardholderName() { return cardholderName; }
    public String getCardNumberMask() { return cardNumberMask; }
}

public class PaymentRequest {

    private final String customerId;
    private final String orderId;
    private final Money amount;
    private final CardDetails cardDetails;   // Composed — created and owned by PaymentRequest

    public PaymentRequest(String customerId, String orderId, Money amount,
                          String cardToken, String cardholderName,
                          String last4Digits, String expiryMonth, String expiryYear) {
        this.customerId = customerId;
        this.orderId = orderId;
        this.amount = amount;
        // PaymentRequest creates its own CardDetails internally
        this.cardDetails = new CardDetails(last4Digits, cardholderName, expiryMonth, expiryYear, cardToken);
    }

    public String getCustomerId() { return customerId; }
    public String getOrderId() { return orderId; }
    public Money getAmount() { return amount; }
    public CardDetails getCardDetails() { return cardDetails; }
}
```


## Composition over Inheritance

The phrase "favor composition over inheritance" means: when you want to reuse behavior from another class, prefer to hold an instance of that class rather than extending it.

```java
// BAD: Using inheritance to reuse notification logic
public class OrderService extends NotificationSender {
    // OrderService is NOT a NotificationSender — this is wrong
}

// GOOD: Using composition
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final NotificationService notificationService;  // Composed
    private final PaymentService paymentService;            // Composed

    public OrderService(OrderRepository orderRepository,
                        ProductRepository productRepository,
                        NotificationService notificationService,
                        PaymentService paymentService) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.notificationService = notificationService;
        this.paymentService = paymentService;
    }

    public Order placeOrder(PlaceOrderRequest request) {
        Product product = productRepository.findById(request.getProductId())
            .orElseThrow(() -> new ProductNotFoundException(request.getProductId()));

        product.reduceStock(request.getQuantity());
        productRepository.save(product);

        Order order = new Order(UUID.randomUUID().toString(), request.getCustomerId());
        order.addItem(product.getId(), product.getName(), request.getQuantity(), product.getPrice());
        order.confirm();
        orderRepository.save(order);

        // Delegate to the composed notification component
        notificationService.sendOrderConfirmation(request.getCustomerId(), order.getId());

        // Delegate to the composed payment component
        paymentService.charge(request.getCustomerId(), Money.of(order.getTotalAmount(), "USD"), request.getPaymentMethod());

        return order;
    }
}
```

`OrderService` composes `NotificationService` and `PaymentService`. It does not inherit from either. It delegates work to them. This gives you flexibility: you can swap in a different `PaymentService` implementation without changing `OrderService`.


## How to Identify Composition

Ask these questions:
1. If the container is deleted, does it make sense for the contained objects to also be deleted? If yes, it is composition.
2. Are the contained objects created inside the container (e.g., in the constructor or in a method), rather than being passed in? If yes, it leans toward composition.
3. Is there any scenario where the contained object should be shared with another container? If no, it is composition.


## Related

- [[Aggregation]] — The weaker form where the parts exist independently
- [[Association]] — The general form of class relationships
- [[2.Inheritance]] — Composition is often recommended as an alternative
- [[Coupling-And-Cohesion]] — Composition tends to produce lower coupling than inheritance
- [[Design-Patterns]] — Strategy, Decorator, and Composite patterns are all built on composition
