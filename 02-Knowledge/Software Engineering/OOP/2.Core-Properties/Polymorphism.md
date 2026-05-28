---
title: Polymorphism
summary: Polymorphism means that a single interface or method name can refer to different implementations depending on the actual type of the object at runtime. It is the mechanism that allows code to work with abstractions rather than concrete types, enabling flexible and extensible systems.
tags:
  - oop
  - java
  - core-properties
created: 2026-05-28
---

## Two Forms of Polymorphism

Java supports two distinct forms of polymorphism:

1. Compile-time polymorphism (method overloading) — the compiler selects the correct method at compile time based on the argument types.
2. Runtime polymorphism (method overriding) — the JVM selects the correct method at runtime based on the actual type of the object.

Runtime polymorphism is the more powerful and architecturally significant form. It is what allows you to write code against an interface and have the correct implementation called automatically.


## Compile-Time Polymorphism: Method Overloading

Overloading means defining multiple methods with the same name but different parameter lists in the same class.

```java
public class OrderService {

    public Order createOrder(String customerId, String productId, int quantity) {
        // Create order with default currency and no discount
        return createOrder(customerId, productId, quantity, "USD", 0.0);
    }

    public Order createOrder(String customerId, String productId, int quantity, String currency) {
        return createOrder(customerId, productId, quantity, currency, 0.0);
    }

    public Order createOrder(String customerId, String productId,
                              int quantity, String currency, double discountRate) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new ProductNotFoundException(productId));
        double basePrice = product.getPrice() * quantity;
        double finalPrice = basePrice * (1 - discountRate);
        Order order = new Order(UUID.randomUUID().toString(), customerId, productId, quantity, finalPrice, currency);
        return orderRepository.save(order);
    }
}

// The compiler picks the right version based on argument count and types
orderService.createOrder("C001", "P001", 2);
orderService.createOrder("C002", "P002", 1, "EUR");
orderService.createOrder("C003", "P003", 5, "USD", 0.10);
```


## Runtime Polymorphism: Method Overriding

This is the heart of OOP design. When a reference variable of a parent type holds an object of a child type, calling a method on that reference invokes the child's overriding implementation.

```java
public interface PaymentGateway {
    ChargeResult charge(PaymentRequest request);
    RefundResult refund(String transactionId, Money amount);
}

public class StripeGateway implements PaymentGateway {

    private final StripeClient client;

    public StripeGateway(StripeClient client) { this.client = client; }

    @Override
    public ChargeResult charge(PaymentRequest request) {
        System.out.println("Processing charge through Stripe");
        StripeResponse response = client.createCharge(request.getAmount(), request.getCurrency(), request.getToken());
        return ChargeResult.from(response);
    }

    @Override
    public RefundResult refund(String transactionId, Money amount) {
        StripeResponse response = client.refund(transactionId, amount.getAmountInCents());
        return RefundResult.from(response);
    }
}

public class PayPalGateway implements PaymentGateway {

    private final PayPalClient client;

    public PayPalGateway(PayPalClient client) { this.client = client; }

    @Override
    public ChargeResult charge(PaymentRequest request) {
        System.out.println("Processing charge through PayPal");
        PayPalOrderResponse response = client.createAndCaptureOrder(request.getAmount(), request.getCurrency());
        return ChargeResult.from(response);
    }

    @Override
    public RefundResult refund(String transactionId, Money amount) {
        PayPalRefundResponse response = client.refundCapture(transactionId, amount.getAmount());
        return RefundResult.from(response);
    }
}

public class MoMoGateway implements PaymentGateway {

    private final MoMoClient client;

    public MoMoGateway(MoMoClient client) { this.client = client; }

    @Override
    public ChargeResult charge(PaymentRequest request) {
        System.out.println("Processing charge through MoMo");
        MoMoResponse response = client.requestPayment(request.getPhoneNumber(), request.getAmount());
        return ChargeResult.from(response);
    }

    @Override
    public RefundResult refund(String transactionId, Money amount) {
        MoMoResponse response = client.refund(transactionId, amount.getAmountInCents());
        return RefundResult.from(response);
    }
}
```

The `PaymentService` does not know or care which gateway it is using at the time it was written:

```java
public class PaymentService {

    private final PaymentGateway gateway;   // polymorphic reference
    private final PaymentRepository repository;

    public PaymentService(PaymentGateway gateway, PaymentRepository repository) {
        this.gateway = gateway;
        this.repository = repository;
    }

    public PaymentResult processPayment(PaymentRequest request) {
        ChargeResult charge = gateway.charge(request);   // runtime dispatch
        if (!charge.isSuccess()) {
            throw new PaymentFailedException(charge.getErrorMessage());
        }
        Payment payment = new Payment(charge.getTransactionId(), request.getCustomerId(),
                                      request.getAmount(), PaymentStatus.COMPLETED);
        repository.save(payment);
        return PaymentResult.success(payment.getId());
    }
}
```

You can inject any gateway at construction time and `processPayment` works correctly for all of them without modification.


## Polymorphism with Collections

Polymorphism becomes especially powerful when working with collections of a common type.

```java
public class NotificationDispatcher {

    private final List<NotificationChannel> channels;

    public NotificationDispatcher(List<NotificationChannel> channels) {
        this.channels = channels;
    }

    public void dispatch(String userId, String message, Set<String> preferredChannels) {
        channels.stream()
            .filter(channel -> preferredChannels.contains(channel.getChannelType()))
            .forEach(channel -> channel.send(userId, message));  // polymorphic call
    }
}

// Registration
NotificationDispatcher dispatcher = new NotificationDispatcher(List.of(
    new EmailChannel(emailClient, userRepository),
    new SmsChannel(smsGateway, userRepository),
    new PushChannel(firebaseClient, deviceRegistry),
    new InAppChannel(websocketManager)
));

// Send via email and SMS only
dispatcher.dispatch("U001", "Your order has shipped", Set.of("EMAIL", "SMS"));
```

Each `channel.send()` call resolves to the correct implementation at runtime. Adding a new notification channel (e.g., WhatsApp) requires adding one new class and registering it — no change to `NotificationDispatcher`.


## Upcasting and Downcasting

Upcasting is assigning a subtype to a supertype reference. It is always safe and happens implicitly.

Downcasting is casting back to a more specific type. It requires an explicit cast and can throw `ClassCastException` at runtime if the actual type does not match. Use the `instanceof` pattern match to make this safe.

```java
PaymentGateway gateway = new StripeGateway(stripeClient);  // upcast — implicit

// Safe downcast using pattern matching (Java 16+)
if (gateway instanceof StripeGateway stripe) {
    stripe.configureWebhook("https://api.example.com/webhooks/stripe");
}

// Old style
if (gateway instanceof StripeGateway) {
    StripeGateway stripe = (StripeGateway) gateway;
    stripe.configureWebhook("https://api.example.com/webhooks/stripe");
}
```


## The Open/Closed Principle in Action

Polymorphism directly enables the Open/Closed Principle: classes should be open for extension but closed for modification. Adding a new payment gateway means creating a new class. The `PaymentService`, `PaymentGateway` interface, and all existing gateway implementations stay unchanged.

```java
// Adding MoMo gateway
public class MoMoGateway implements PaymentGateway { ... }

// Wire it up in configuration
PaymentService paymentService = new PaymentService(new MoMoGateway(moMoClient), paymentRepository);
// Zero changes to existing code
```


## Related

- [[Abstraction]] — Interfaces and abstract classes define the types that polymorphism operates on
- [[Inheritance]] — Runtime polymorphism is enabled through method overriding
- [[Interface-vs-Abstract-Class]] — Choosing the right abstraction type
- [[SOLID-Principles]] — Open/Closed and Liskov Substitution Principles
- [[Design-Patterns]] — Strategy, Template Method, Observer — all rely on polymorphism
