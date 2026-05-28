---
title: Dependency Injection
summary: Dependency Injection (DI) is a technique where an object's dependencies are provided from the outside rather than being created internally. It is the primary mechanism for achieving loose coupling, enabling testability and flexibility by separating the construction of objects from their usage.
tags:
  - oop
  - java
  - advanced
created: 2026-05-28
---

## The Problem DI Solves

When a class creates its own dependencies using `new`, it is tightly coupled to those concrete implementations. This makes it impossible to substitute different implementations in tests or different environments, and it puts configuration details (connection strings, API keys) inside business logic.

```java
// BAD: ProductService creates its own dependencies
public class ProductService {

    private final ProductRepository productRepository;
    private final PricingEngine pricingEngine;
    private final EventPublisher eventPublisher;

    public ProductService() {
        // Hard-coded concrete classes and configuration
        this.productRepository = new MySQLProductRepository("jdbc:mysql://prod-db:3306/products");
        this.pricingEngine = new RuleBasedPricingEngine("/etc/pricing-rules.json");
        this.eventPublisher = new KafkaEventPublisher("kafka-broker:9092", "product-events");
    }

    public Product createProduct(CreateProductRequest request) {
        Product product = new Product(UUID.randomUUID().toString(), request.getName(), request.getPrice(), 0);
        productRepository.save(product);
        eventPublisher.publish(new ProductCreatedEvent(product.getId()));
        return product;
    }
}
```

You cannot test `createProduct` without a live MySQL database and a live Kafka broker. You cannot run this in a test environment with a different database URL.


## Constructor Injection

The most common and recommended form of DI. Dependencies are passed through the constructor. Once the object is created, its dependencies are set and cannot change.

```java
// GOOD: Dependencies are declared as interfaces and injected
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

    public Product createProduct(CreateProductRequest request) {
        validateRequest(request);
        double finalPrice = pricingEngine.computeBasePrice(request.getPrice(), request.getCategoryId());
        Product product = new Product(UUID.randomUUID().toString(), request.getName(), finalPrice, 0);
        productRepository.save(product);
        eventPublisher.publish(new ProductCreatedEvent(product.getId()));
        return product;
    }

    private void validateRequest(CreateProductRequest request) {
        if (request.getName() == null || request.getName().isBlank()) {
            throw new IllegalArgumentException("Product name is required");
        }
        if (request.getPrice() < 0) {
            throw new IllegalArgumentException("Price cannot be negative");
        }
    }
}
```

Now the same `ProductService` class works with:

```java
// Production
ProductService productionService = new ProductService(
    new MySQLProductRepository(dataSource),
    new RuleBasedPricingEngine(pricingRulesPath),
    new KafkaEventPublisher(kafkaBroker, "product-events")
);

// Unit tests — no database, no Kafka
ProductService testService = new ProductService(
    new InMemoryProductRepository(),
    price -> price * 1.0,   // Lambda as simple PricingEngine implementation
    event -> {}             // No-op EventPublisher
);
```


## Method Injection

Dependencies can also be provided through method parameters. This is appropriate when the dependency varies per-call rather than being fixed for the lifetime of the object.

```java
public class ReportService {

    private final ReportRepository reportRepository;

    public ReportService(ReportRepository reportRepository) {
        this.reportRepository = reportRepository;
    }

    // Renderer is injected per-call because different callers may want PDF or CSV
    public Report generateReport(ReportRequest request, ReportRenderer renderer) {
        List<ReportRow> data = collectData(request);
        String content = renderer.render(data, request);
        Report report = new Report(UUID.randomUUID().toString(), content, Instant.now());
        return reportRepository.save(report);
    }

    private List<ReportRow> collectData(ReportRequest request) {
        // fetch data...
        return List.of();
    }
}

// Usage
reportService.generateReport(request, new PdfReportRenderer());
reportService.generateReport(request, new CsvReportRenderer());
reportService.generateReport(request, new ExcelReportRenderer());
```


## Setter Injection

Dependencies can be provided through setter methods after the object is constructed. This is less common than constructor injection because it allows the object to be used in a partially initialized state.

```java
public class OrderService {

    private OrderRepository orderRepository;
    private PaymentGateway paymentGateway;

    public void setOrderRepository(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    public void setPaymentGateway(PaymentGateway paymentGateway) {
        this.paymentGateway = paymentGateway;
    }

    public Order placeOrder(PlaceOrderRequest request) {
        if (orderRepository == null || paymentGateway == null) {
            throw new IllegalStateException("OrderService is not fully initialized");
        }
        // ...
    }
}
```

The risk here is that `placeOrder` can be called before all dependencies are set. Constructor injection avoids this risk entirely by making an incomplete object impossible to construct.


## DI Without a Framework (Manual Wiring)

In simple applications, you can wire dependencies manually in a composition root — a single place where all objects are constructed and connected.

```java
public class ApplicationConfig {

    public static OrderService createOrderService(DataSource dataSource, KafkaTemplate kafkaTemplate) {
        ProductRepository productRepository = new JpaProductRepository(dataSource);
        OrderRepository orderRepository = new JpaOrderRepository(dataSource);
        CustomerRepository customerRepository = new JpaCustomerRepository(dataSource);
        PaymentGateway paymentGateway = new StripePaymentGateway(System.getenv("STRIPE_API_KEY"));
        EventPublisher eventPublisher = new KafkaEventPublisher(kafkaTemplate);
        NotificationService notificationService = new EmailNotificationService(
            new SmtpEmailClient(System.getenv("SMTP_HOST"), Integer.parseInt(System.getenv("SMTP_PORT"))),
            customerRepository
        );

        return new OrderService(
            orderRepository,
            productRepository,
            customerRepository,
            paymentGateway,
            notificationService,
            eventPublisher
        );
    }
}
```

All `new` keywords live in the configuration class. The service classes themselves never use `new` for their dependencies.


## DI With Spring Framework

In a Spring application, the framework manages object creation and wiring. You declare what a class needs, and Spring provides it.

```java
@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final PricingEngine pricingEngine;
    private final EventPublisher eventPublisher;

    // Spring injects all three through constructor injection
    public ProductService(ProductRepository productRepository,
                          PricingEngine pricingEngine,
                          EventPublisher eventPublisher) {
        this.productRepository = productRepository;
        this.pricingEngine = pricingEngine;
        this.eventPublisher = eventPublisher;
    }
}

@Repository
public class JpaProductRepository implements ProductRepository {
    // Spring manages this as a bean
}

@Component
public class RuleBasedPricingEngine implements PricingEngine {
    // Spring manages this as a bean
}
```

Spring's `ApplicationContext` is the composition root. It scans for annotated classes, resolves all dependencies, and wires everything together at startup. If a dependency is missing or ambiguous, it fails fast at startup rather than at runtime during a user request.


## Benefits of Dependency Injection

**Testability**: You can inject test doubles (mocks, stubs, fakes) without modifying any production code. Unit tests become fast and isolated.

**Flexibility**: Swapping one implementation for another (e.g., switching payment gateways) is a configuration change, not a code change.

**Separation of construction and use**: Business logic never contains object wiring. Object wiring never contains business logic.

**Explicit dependencies**: A class's constructor signature documents exactly what it needs to function. There are no hidden dependencies through singletons or static state.


## Related

- [[Coupling-And-Cohesion]] — DI is the primary tool for reducing coupling
- [[SOLID-Principles]] — DI is motivated by the Dependency Inversion Principle
- [[Abstraction]] — DI only works well when dependencies are defined as interfaces
- [[Interface-vs-Abstract-Class]] — Interfaces are the natural type for injectable dependencies
- [[Design-Patterns]] — The Service Locator and Factory patterns are alternatives to DI
