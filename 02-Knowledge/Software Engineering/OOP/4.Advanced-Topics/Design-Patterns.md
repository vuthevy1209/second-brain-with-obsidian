---
title: Design Patterns
summary: Design patterns are reusable solutions to common software design problems. They are not code to copy, but proven approaches to structuring object interactions. Knowing when and why to apply a pattern is more important than memorizing its structure.
tags:
  - oop
  - java
  - advanced
  - design-patterns
created: 2026-05-28
---

## Creational Patterns

Creational patterns deal with object creation, making the system independent of how objects are created and composed.


### Singleton

Ensures a class has only one instance and provides a global access point to it.

```java
public class ApplicationConfig {

    private static volatile ApplicationConfig instance;

    private final String databaseUrl;
    private final String apiKey;
    private final int maxPoolSize;

    private ApplicationConfig() {
        this.databaseUrl = System.getenv("DB_URL");
        this.apiKey = System.getenv("PAYMENT_API_KEY");
        this.maxPoolSize = Integer.parseInt(System.getenv().getOrDefault("DB_POOL_SIZE", "10"));
    }

    public static ApplicationConfig getInstance() {
        if (instance == null) {
            synchronized (ApplicationConfig.class) {
                if (instance == null) {
                    instance = new ApplicationConfig();
                }
            }
        }
        return instance;
    }

    public String getDatabaseUrl() { return databaseUrl; }
    public String getApiKey() { return apiKey; }
    public int getMaxPoolSize() { return maxPoolSize; }
}
```

Use carefully — Singleton introduces global state and makes unit testing harder. In Spring applications, the framework manages Singleton beans, so explicit Singleton implementation is rarely needed.


### Factory Method

Defines an interface for creating an object but lets subclasses decide which class to instantiate.

```java
public interface PaymentGateway {
    ChargeResult charge(PaymentRequest request);
    RefundResult refund(String transactionId, Money amount);
}

public abstract class PaymentGatewayFactory {
    public abstract PaymentGateway create();

    // Factory method — subclasses override to provide specific gateway
    public PaymentGateway createForRegion(String countryCode) {
        return create();  // Default; subclasses can override for region logic
    }
}

public class StripeGatewayFactory extends PaymentGatewayFactory {
    private final String apiKey;

    public StripeGatewayFactory(String apiKey) { this.apiKey = apiKey; }

    @Override
    public PaymentGateway create() {
        StripeClient client = new StripeClient(apiKey);
        return new StripeGateway(client);
    }
}

public class PayPalGatewayFactory extends PaymentGatewayFactory {
    private final String clientId;
    private final String clientSecret;

    public PayPalGatewayFactory(String clientId, String clientSecret) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }

    @Override
    public PaymentGateway create() {
        PayPalClient client = new PayPalClient(clientId, clientSecret);
        return new PayPalGateway(client);
    }
}
```

A simpler and more common variant is a static factory method:

```java
public class PaymentGatewayRegistry {

    public static PaymentGateway create(String provider, Map<String, String> config) {
        return switch (provider) {
            case "STRIPE" -> new StripeGateway(new StripeClient(config.get("apiKey")));
            case "PAYPAL" -> new PayPalGateway(new PayPalClient(config.get("clientId"), config.get("clientSecret")));
            case "MOMO" -> new MoMoGateway(new MoMoClient(config.get("partnerCode"), config.get("accessKey")));
            default -> throw new IllegalArgumentException("Unknown payment provider: " + provider);
        };
    }
}
```


## Structural Patterns

Structural patterns deal with class composition — how classes and objects are assembled into larger structures.


### Decorator

Adds behavior to an object dynamically without changing its class. Wraps the original object with additional logic.

```java
// Base interface
public interface ProductRepository {
    Optional<Product> findById(String id);
    Product save(Product product);
    List<Product> findAll();
}

// Real implementation
public class JpaProductRepository implements ProductRepository {
    @Override
    public Optional<Product> findById(String id) {
        // actual JPA query
        return Optional.empty();
    }

    @Override
    public Product save(Product product) {
        // actual JPA save
        return product;
    }

    @Override
    public List<Product> findAll() {
        return List.of();
    }
}

// Decorator: adds caching on top of any ProductRepository
public class CachingProductRepository implements ProductRepository {

    private final ProductRepository delegate;
    private final Map<String, Product> cache;

    public CachingProductRepository(ProductRepository delegate) {
        this.delegate = delegate;
        this.cache = new ConcurrentHashMap<>();
    }

    @Override
    public Optional<Product> findById(String id) {
        if (cache.containsKey(id)) {
            return Optional.of(cache.get(id));
        }
        Optional<Product> product = delegate.findById(id);
        product.ifPresent(p -> cache.put(id, p));
        return product;
    }

    @Override
    public Product save(Product product) {
        Product saved = delegate.save(product);
        cache.put(saved.getId(), saved);  // update cache on save
        return saved;
    }

    @Override
    public List<Product> findAll() {
        return delegate.findAll();
    }
}

// Decorator: adds logging on top
public class LoggingProductRepository implements ProductRepository {

    private final ProductRepository delegate;
    private final Logger logger;

    public LoggingProductRepository(ProductRepository delegate, Logger logger) {
        this.delegate = delegate;
        this.logger = logger;
    }

    @Override
    public Optional<Product> findById(String id) {
        logger.info("Finding product by id: " + id);
        Optional<Product> result = delegate.findById(id);
        logger.info("FindById result for " + id + ": " + (result.isPresent() ? "found" : "not found"));
        return result;
    }

    @Override
    public Product save(Product product) {
        logger.info("Saving product: " + product.getId());
        Product saved = delegate.save(product);
        logger.info("Product saved: " + saved.getId());
        return saved;
    }

    @Override
    public List<Product> findAll() {
        return delegate.findAll();
    }
}

// Stacking decorators
ProductRepository repository =
    new LoggingProductRepository(
        new CachingProductRepository(
            new JpaProductRepository(dataSource)
        ),
        logger
    );
```


## Behavioral Patterns

Behavioral patterns deal with algorithms and the assignment of responsibilities between objects.


### Strategy

Defines a family of algorithms, encapsulates each one, and makes them interchangeable. The strategy can be changed at runtime.

```java
public interface ShippingStrategy {
    Money calculateShippingCost(Order order, String destinationCountry);
    String getEstimatedDeliveryDays(String destinationCountry);
}

public class StandardShipping implements ShippingStrategy {
    @Override
    public Money calculateShippingCost(Order order, String destinationCountry) {
        double baseRate = destinationCountry.equals("VN") ? 2.0 : 15.0;
        return Money.of(baseRate + (order.getTotalAmount() * 0.01), "USD");
    }

    @Override
    public String getEstimatedDeliveryDays(String destinationCountry) {
        return destinationCountry.equals("VN") ? "3-5 days" : "10-15 days";
    }
}

public class ExpressShipping implements ShippingStrategy {
    @Override
    public Money calculateShippingCost(Order order, String destinationCountry) {
        double baseRate = destinationCountry.equals("VN") ? 10.0 : 35.0;
        return Money.of(baseRate, "USD");
    }

    @Override
    public String getEstimatedDeliveryDays(String destinationCountry) {
        return destinationCountry.equals("VN") ? "1 day" : "3-5 days";
    }
}

public class FreeShipping implements ShippingStrategy {
    @Override
    public Money calculateShippingCost(Order order, String destinationCountry) {
        return Money.zero("USD");
    }

    @Override
    public String getEstimatedDeliveryDays(String destinationCountry) {
        return "5-7 days";
    }
}

public class CheckoutService {

    public CheckoutSummary calculateCheckout(Order order, String destinationCountry,
                                              ShippingStrategy shippingStrategy) {
        Money shippingCost = shippingStrategy.calculateShippingCost(order, destinationCountry);
        String delivery = shippingStrategy.getEstimatedDeliveryDays(destinationCountry);
        Money total = Money.of(order.getTotalAmount(), "USD").add(shippingCost);
        return new CheckoutSummary(total, shippingCost, delivery);
    }
}

// Usage
CheckoutService checkout = new CheckoutService();
ShippingStrategy strategy = order.getTotalAmount() >= 100 ? new FreeShipping() : new StandardShipping();
CheckoutSummary summary = checkout.calculateCheckout(order, "VN", strategy);
```


### Observer

Defines a one-to-many dependency. When one object (the subject) changes state, all its registered dependents (observers) are notified automatically.

```java
public interface OrderEventListener {
    void onOrderPlaced(Order order);
}

public class OrderService {

    private final OrderRepository orderRepository;
    private final List<OrderEventListener> listeners = new ArrayList<>();

    public OrderService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    public void registerListener(OrderEventListener listener) {
        listeners.add(listener);
    }

    public Order placeOrder(PlaceOrderRequest request) {
        Order order = buildOrder(request);
        orderRepository.save(order);
        listeners.forEach(listener -> listener.onOrderPlaced(order));  // notify all observers
        return order;
    }
}

public class InventoryReductionListener implements OrderEventListener {
    private final InventoryService inventoryService;

    public InventoryReductionListener(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @Override
    public void onOrderPlaced(Order order) {
        order.getLineItems().forEach(item ->
            inventoryService.reduce(item.getProductId(), item.getQuantity())
        );
    }
}

public class OrderConfirmationEmailListener implements OrderEventListener {
    private final NotificationService notificationService;

    public OrderConfirmationEmailListener(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @Override
    public void onOrderPlaced(Order order) {
        notificationService.sendOrderConfirmation(order.getCustomerId(), order.getId());
    }
}

// Wire up observers
OrderService orderService = new OrderService(orderRepository);
orderService.registerListener(new InventoryReductionListener(inventoryService));
orderService.registerListener(new OrderConfirmationEmailListener(notificationService));
```

Adding a new reaction to order placement (e.g., fraud detection, loyalty points) means adding a new listener class and registering it. The `OrderService` itself never changes.


## Pattern Selection Guide

| Problem | Pattern |
|---|---|
| Need exactly one instance | Singleton |
| Need to decouple object creation from usage | Factory Method |
| Need to add responsibilities to objects dynamically | Decorator |
| Need to swap algorithms at runtime | Strategy |
| Need to notify multiple objects when state changes | Observer |
| Need to wrap a complex subsystem with a simple API | Facade |
| Need objects to share data through a central hub | Mediator |


## Related

- [[Polymorphism]] — Strategy and Observer are built entirely on polymorphism
- [[Abstraction]] — Patterns rely on abstractions (interfaces) for flexibility
- [[Composition]] — Decorator and Strategy use composition over inheritance
- [[SOLID-Principles]] — OCP is achieved through patterns like Strategy and Observer
- [[Dependency-Injection]] — Patterns often work with DI to wire up their components
