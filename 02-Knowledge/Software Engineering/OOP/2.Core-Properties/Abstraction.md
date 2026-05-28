---
title: Abstraction
summary: Abstraction means exposing only what is necessary to a caller and hiding the underlying complexity. It is realized in Java through abstract classes and interfaces, which define a contract without committing to any implementation.
tags:
  - oop
  - java
  - core-properties
created: 2026-05-28
---

## The Core Idea

Abstraction answers the question: what should a caller need to know in order to use this component? The answer should always be: as little as possible.

When you design a `PaymentService`, the caller should be able to say "charge this customer this amount" and get back a result. The caller should not need to know whether the charge is processed through Stripe, PayPal, or a bank transfer. That detail is an implementation concern. Abstraction hides that detail behind a stable interface.


## Abstract Class

An abstract class is a class that cannot be instantiated directly. It may contain a mix of abstract methods (declared but not implemented) and concrete methods (fully implemented). Subclasses must provide implementations for all abstract methods.

Abstract classes are appropriate when there is shared behavior across a family of related types, alongside some behavior that each type must implement differently.

```java
public abstract class NotificationSender {

    private final NotificationLogRepository logRepository;

    protected NotificationSender(NotificationLogRepository logRepository) {
        this.logRepository = logRepository;
    }

    // Template method — defines the overall algorithm
    public final void send(String recipientId, String message) {
        String formattedMessage = formatMessage(message);     // abstract
        DeliveryResult result = deliver(recipientId, formattedMessage); // abstract
        logResult(recipientId, message, result);               // concrete
    }

    // Abstract: each subclass implements the actual delivery mechanism
    protected abstract String formatMessage(String rawMessage);
    protected abstract DeliveryResult deliver(String recipientId, String message);

    // Concrete: shared logic that all senders use
    private void logResult(String recipientId, String message, DeliveryResult result) {
        NotificationLog log = new NotificationLog(
            UUID.randomUUID().toString(),
            recipientId,
            message,
            result.isSuccess(),
            Instant.now()
        );
        logRepository.save(log);
    }
}

public class EmailNotificationSender extends NotificationSender {

    private final EmailClient emailClient;
    private final UserRepository userRepository;

    public EmailNotificationSender(NotificationLogRepository logRepository,
                                   EmailClient emailClient,
                                   UserRepository userRepository) {
        super(logRepository);
        this.emailClient = emailClient;
        this.userRepository = userRepository;
    }

    @Override
    protected String formatMessage(String rawMessage) {
        return "<html><body>" + rawMessage + "</body></html>";
    }

    @Override
    protected DeliveryResult deliver(String recipientId, String message) {
        User user = userRepository.findById(recipientId)
            .orElseThrow(() -> new UserNotFoundException(recipientId));
        return emailClient.send(user.getEmail(), "Notification", message);
    }
}

public class SmsNotificationSender extends NotificationSender {

    private final SmsGatewayClient smsClient;
    private final UserRepository userRepository;

    public SmsNotificationSender(NotificationLogRepository logRepository,
                                  SmsGatewayClient smsClient,
                                  UserRepository userRepository) {
        super(logRepository);
        this.smsClient = smsClient;
        this.userRepository = userRepository;
    }

    @Override
    protected String formatMessage(String rawMessage) {
        // SMS has a character limit
        return rawMessage.length() > 160 ? rawMessage.substring(0, 157) + "..." : rawMessage;
    }

    @Override
    protected DeliveryResult deliver(String recipientId, String message) {
        User user = userRepository.findById(recipientId)
            .orElseThrow(() -> new UserNotFoundException(recipientId));
        return smsClient.send(user.getPhoneNumber(), message);
    }
}
```

The `send()` method is declared `final` to lock the overall algorithm in place. Subclasses customize only what they are supposed to customize: message formatting and delivery. The logging always happens and cannot be bypassed.


## Interface as Pure Abstraction

An interface defines only a contract — a set of method signatures that any implementing class must fulfill. It expresses capability without any implementation.

```java
public interface PaymentGateway {

    ChargeResult charge(String customerId, Money amount, String currency, PaymentMethod paymentMethod);

    RefundResult refund(String transactionId, Money amount);

    TransactionStatus getStatus(String transactionId);
}
```

This interface says: any class that is a `PaymentGateway` must be able to charge, refund, and look up a transaction. It says nothing about how these operations are carried out.

```java
public class StripePaymentGateway implements PaymentGateway {

    private final StripeClient stripeClient;

    public StripePaymentGateway(StripeClient stripeClient) {
        this.stripeClient = stripeClient;
    }

    @Override
    public ChargeResult charge(String customerId, Money amount, String currency, PaymentMethod paymentMethod) {
        StripeChargeRequest request = StripeChargeRequest.builder()
            .amount(amount.getAmountInCents())
            .currency(currency)
            .customerId(customerId)
            .source(paymentMethod.getToken())
            .build();
        StripeResponse response = stripeClient.createCharge(request);
        return new ChargeResult(response.getId(), response.isSucceeded(), response.getErrorMessage());
    }

    @Override
    public RefundResult refund(String transactionId, Money amount) {
        StripeRefundRequest request = StripeRefundRequest.of(transactionId, amount.getAmountInCents());
        StripeResponse response = stripeClient.createRefund(request);
        return new RefundResult(response.getId(), response.isSucceeded());
    }

    @Override
    public TransactionStatus getStatus(String transactionId) {
        StripeTransaction tx = stripeClient.retrieveCharge(transactionId);
        return TransactionStatus.from(tx.getStatus());
    }
}

public class PayPalPaymentGateway implements PaymentGateway {

    private final PayPalHttpClient payPalClient;

    public PayPalPaymentGateway(PayPalHttpClient payPalClient) {
        this.payPalClient = payPalClient;
    }

    @Override
    public ChargeResult charge(String customerId, Money amount, String currency, PaymentMethod paymentMethod) {
        // PayPal-specific HTTP call
        PayPalOrderRequest order = new PayPalOrderRequest(amount.getAmount(), currency, customerId);
        PayPalOrderResponse response = payPalClient.createOrder(order);
        return new ChargeResult(response.getOrderId(), response.isApproved(), response.getFailureReason());
    }

    @Override
    public RefundResult refund(String transactionId, Money amount) {
        PayPalRefundResponse response = payPalClient.refundCapture(transactionId, amount.getAmount());
        return new RefundResult(response.getRefundId(), response.isCompleted());
    }

    @Override
    public TransactionStatus getStatus(String transactionId) {
        PayPalOrderDetails details = payPalClient.getOrderDetails(transactionId);
        return TransactionStatus.from(details.getStatus());
    }
}
```

Now the `PaymentService` depends only on the `PaymentGateway` interface:

```java
public class PaymentService {

    private final PaymentGateway paymentGateway;    // The abstraction
    private final PaymentRepository paymentRepository;

    public PaymentService(PaymentGateway paymentGateway, PaymentRepository paymentRepository) {
        this.paymentGateway = paymentGateway;
        this.paymentRepository = paymentRepository;
    }

    public PaymentResult processPayment(String customerId, Money amount, PaymentMethod method) {
        ChargeResult charge = paymentGateway.charge(customerId, amount, amount.getCurrency(), method);

        if (!charge.isSuccess()) {
            throw new PaymentFailedException(charge.getErrorMessage());
        }

        Payment payment = new Payment(charge.getTransactionId(), customerId, amount, PaymentStatus.COMPLETED);
        paymentRepository.save(payment);
        return PaymentResult.success(payment.getId());
    }
}
```

Switching from Stripe to PayPal requires changing exactly one line — the line where `PaymentService` is constructed. The `PaymentService` class itself does not change at all.


## Abstract Class vs Interface at a Glance

| Characteristic | Abstract Class | Interface |
|---|---|---|
| Can have fields | Yes | Only `static final` |
| Can have constructors | Yes | No |
| Can have concrete methods | Yes | Yes (via `default`) |
| Multiple inheritance | No | Yes |
| Use when | Shared code + partial implementation | Contract only |

The rule of thumb: if you have shared code to distribute across a family of classes, consider an abstract class. If you only need to define a contract, use an interface.


## Related

- [[Interface-vs-Abstract-Class]] — Detailed comparison and decision guide
- [[Encapsulation]] — Abstraction and encapsulation work together
- [[Polymorphism]] — Abstraction enables polymorphic behavior
- [[SOLID-Principles]] — Dependency Inversion Principle is built on abstraction
- [[Dependency-Injection]] — DI relies on abstracting dependencies behind interfaces
