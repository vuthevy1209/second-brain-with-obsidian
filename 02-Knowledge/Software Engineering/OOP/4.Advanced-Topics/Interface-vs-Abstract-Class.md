---
title: Interface vs Abstract Class
summary: Both interfaces and abstract classes define contracts that other classes must fulfill, but they serve different purposes and have different capabilities. Choosing between them correctly is a foundational design decision in any Java codebase.
tags:
  - oop
  - java
  - advanced
created: 2026-05-28
---

## The Core Distinction

An interface defines a pure contract: a set of method signatures (and possibly default implementations) that any implementing class must provide. It says "any class that claims to be a X must be able to do these things."

An abstract class defines a partial implementation: some methods are implemented and shared across all subclasses, while others are left abstract and must be filled in by each subclass. It says "all classes in this family share this common structure and behavior."


## Structural Differences

| Feature | Interface | Abstract Class |
|---|---|---|
| Instantiation | Cannot be instantiated | Cannot be instantiated |
| Fields | `public static final` only | Any visibility, any type |
| Constructors | None | Yes |
| Method implementation | Via `default` methods (Java 8+) | Both abstract and concrete |
| Multiple inheritance | A class can implement many | A class can extend only one |
| `extends` vs `implements` | `implements` | `extends` |
| Access modifiers on methods | `public` by default | Any modifier |


## When to Use an Interface

Use an interface when you want to define a capability or role that multiple unrelated classes can fulfill.

```java
// PaymentGateway is a capability — Stripe, PayPal, MoMo all provide it
public interface PaymentGateway {
    ChargeResult charge(String customerId, Money amount, PaymentMethod method);
    RefundResult refund(String transactionId, Money amount);
    TransactionStatus getStatus(String transactionId);
}

// NotificationChannel is a role — Email, SMS, Push can all play it
public interface NotificationChannel {
    void send(String recipientId, String message);
    String getChannelType();
}

// Exportable is a capability — any report, invoice, or product list can be exportable
public interface Exportable {
    byte[] exportToPdf();
    byte[] exportToCsv();
}
```

These interfaces have no shared code between implementations. `StripeGateway` and `PayPalGateway` have entirely different internals. The interface only defines the shape of the contract.

Interfaces also enable multiple "capabilities" on a single class:

```java
public class InvoicePdfReport implements Exportable, Printable, Archivable {
    @Override
    public byte[] exportToPdf() { ... }

    @Override
    public byte[] exportToCsv() { ... }

    @Override
    public void print(PrinterConfig config) { ... }

    @Override
    public void archive(ArchiveStorage storage) { ... }
}
```

A class that extends another class can still implement multiple interfaces, working around Java's single inheritance restriction.


## When to Use an Abstract Class

Use an abstract class when there is meaningful shared code that all subclasses should inherit, and when the subclasses represent a genuine specialization of the same concept.

```java
public abstract class BaseApiController {

    private final AuthenticationService authService;
    private final AuditLogger auditLogger;

    protected BaseApiController(AuthenticationService authService, AuditLogger auditLogger) {
        this.authService = authService;
        this.auditLogger = auditLogger;
    }

    // Shared logic: all controllers authenticate requests the same way
    protected AuthenticatedUser authenticate(HttpRequest request) {
        String token = request.getHeader("Authorization");
        return authService.validateToken(token)
            .orElseThrow(() -> new UnauthorizedException("Invalid or expired token"));
    }

    // Shared logic: all controllers log actions the same way
    protected void logAction(String userId, String action) {
        auditLogger.record(userId, action, Instant.now());
    }

    // Abstract: each controller handles its specific endpoint
    public abstract HttpResponse handle(HttpRequest request);
}

public class ProductController extends BaseApiController {

    private final ProductService productService;

    public ProductController(AuthenticationService authService,
                              AuditLogger auditLogger,
                              ProductService productService) {
        super(authService, auditLogger);
        this.productService = productService;
    }

    @Override
    public HttpResponse handle(HttpRequest request) {
        AuthenticatedUser user = authenticate(request);   // Inherited
        logAction(user.getId(), "GET /products");          // Inherited

        List<Product> products = productService.getAllActiveProducts();
        return HttpResponse.ok(products);
    }
}

public class OrderController extends BaseApiController {

    private final OrderService orderService;

    public OrderController(AuthenticationService authService,
                            AuditLogger auditLogger,
                            OrderService orderService) {
        super(authService, auditLogger);
        this.orderService = orderService;
    }

    @Override
    public HttpResponse handle(HttpRequest request) {
        AuthenticatedUser user = authenticate(request);
        logAction(user.getId(), "POST /orders");

        PlaceOrderRequest orderRequest = request.parseBody(PlaceOrderRequest.class);
        Order order = orderService.placeOrder(orderRequest);
        return HttpResponse.created(order);
    }
}
```

Both controllers share the `authenticate` and `logAction` methods. Without the abstract class, this code would need to be duplicated or extracted into a utility class that each controller calls explicitly.


## Combining Both

A common pattern is to define a contract with an interface and provide a base implementation with an abstract class, letting concrete classes extend the abstract class.

```java
// Interface: the contract
public interface ReportGenerator {
    Report generate(ReportRequest request);
    String getSupportedFormat();
}

// Abstract class: shared code for all report generators
public abstract class BaseReportGenerator implements ReportGenerator {

    private final ReportRepository reportRepository;
    private final ReportValidator validator;

    protected BaseReportGenerator(ReportRepository reportRepository, ReportValidator validator) {
        this.reportRepository = reportRepository;
        this.validator = validator;
    }

    @Override
    public final Report generate(ReportRequest request) {
        validator.validate(request);                         // shared validation
        List<ReportRow> data = collectData(request);         // abstract
        String content = renderContent(data, request);       // abstract
        Report report = new Report(UUID.randomUUID().toString(), content, getSupportedFormat(), Instant.now());
        return reportRepository.save(report);
    }

    protected abstract List<ReportRow> collectData(ReportRequest request);
    protected abstract String renderContent(List<ReportRow> data, ReportRequest request);
}

// Concrete: implements both abstract methods
public class SalesReportGenerator extends BaseReportGenerator {

    private final OrderRepository orderRepository;

    public SalesReportGenerator(ReportRepository reportRepository,
                                 ReportValidator validator,
                                 OrderRepository orderRepository) {
        super(reportRepository, validator);
        this.orderRepository = orderRepository;
    }

    @Override
    public String getSupportedFormat() { return "SALES_PDF"; }

    @Override
    protected List<ReportRow> collectData(ReportRequest request) {
        return orderRepository.findByDateRange(request.getStartDate(), request.getEndDate())
            .stream()
            .map(order -> new ReportRow(order.getId(), order.getTotalAmount().toString()))
            .collect(Collectors.toList());
    }

    @Override
    protected String renderContent(List<ReportRow> data, ReportRequest request) {
        // render to PDF
        return "PDF content for " + data.size() + " orders";
    }
}
```

The interface allows different implementations that bypass the abstract class entirely (e.g., a mock implementation in tests). The abstract class provides the default structural logic for production implementations.


## Decision Guide

| Question | Interface | Abstract Class |
|---|:---:|:---:|
| No shared code between implementations? | Yes | |
| Implementing class may already extend another class? | Yes | |
| Need to define a role or capability that unrelated classes share? | Yes | |
| There is real shared code to reuse? | | Yes |
| Need a constructor (e.g., to inject shared dependencies)? | | Yes |
| Want to use the Template Method pattern? | | Yes |
| Need fields that are not constants? | | Yes |


## Related

- [[Abstraction]] — Both are tools for abstraction
- [[Polymorphism]] — Both enable polymorphic dispatch
- [[Inheritance]] — Abstract classes are extended via inheritance
- [[SOLID-Principles]] — Interface Segregation and Dependency Inversion principles
