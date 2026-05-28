---
title: Association
summary: Association is a relationship where one class uses or interacts with another class, without either class owning the other. It is the most general form of relationship between classes and covers any situation where objects of one type collaborate with objects of another type.
tags:
  - oop
  - java
  - class-relationships
created: 2026-05-28
---

## What Association Means

Association simply says "A knows about B" or "A uses B". There is no ownership implied. Both objects can exist independently of each other, and the relationship is formed through a reference — typically a field, a method parameter, or a return value.

Association is the broadest category of class relationships. Aggregation and Composition are both specialized forms of association that add ownership semantics. Dependency is a weaker, more transient form of association.


## Unidirectional Association

In a unidirectional association, only one class holds a reference to the other.

```java
public class OrderService {

    // OrderService knows about ProductRepository
    // ProductRepository does not know about OrderService
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;

    public OrderService(ProductRepository productRepository,
                        OrderRepository orderRepository,
                        CustomerRepository customerRepository) {
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.customerRepository = customerRepository;
    }

    public Order placeOrder(PlaceOrderRequest request) {
        Customer customer = customerRepository.findById(request.getCustomerId())
            .orElseThrow(() -> new CustomerNotFoundException(request.getCustomerId()));

        Product product = productRepository.findById(request.getProductId())
            .orElseThrow(() -> new ProductNotFoundException(request.getProductId()));

        if (!product.isAvailable()) {
            throw new OutOfStockException(request.getProductId());
        }

        product.reduceStock(request.getQuantity());
        productRepository.save(product);

        Order order = new Order(
            UUID.randomUUID().toString(),
            customer.getId(),
            product.getId(),
            request.getQuantity(),
            product.getPrice() * request.getQuantity()
        );
        return orderRepository.save(order);
    }
}
```

`OrderService` is associated with `ProductRepository`, `OrderRepository`, and `CustomerRepository`. None of those repositories know about `OrderService`. The relationship is directional.


## Bidirectional Association

In a bidirectional association, both classes hold references to each other. This is sometimes necessary for navigating in both directions, but it increases coupling and must be managed carefully to avoid inconsistency.

```java
public class Order {

    private final String id;
    private final String customerId;
    private List<OrderLineItem> lineItems;

    public Order(String id, String customerId) {
        this.id = id;
        this.customerId = customerId;
        this.lineItems = new ArrayList<>();
    }

    public void addLineItem(OrderLineItem item) {
        lineItems.add(item);
        item.setOrder(this);    // bidirectional link maintained here
    }

    public String getId() { return id; }
    public List<OrderLineItem> getLineItems() { return Collections.unmodifiableList(lineItems); }
}

public class OrderLineItem {

    private final String productId;
    private final int quantity;
    private final double unitPrice;
    private Order order;   // back-reference to the order

    public OrderLineItem(String productId, int quantity, double unitPrice) {
        this.productId = productId;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
    }

    void setOrder(Order order) {
        this.order = order;
    }

    public Order getOrder() { return order; }
    public String getProductId() { return productId; }
    public double getSubtotal() { return quantity * unitPrice; }
}
```

In this bidirectional design, `Order` manages the relationship. Adding a line item to an order automatically sets the back-reference on the `OrderLineItem`. This is important: when you have a bidirectional association, one side should own the relationship and be responsible for keeping both sides consistent.


## Association via Method Parameter

Association does not have to be a persistent field. A class can be associated with another class through method parameters — they collaborate within a method call and then go their separate ways.

```java
public class InvoiceGenerator {

    private final PdfRenderer pdfRenderer;
    private final InvoiceRepository invoiceRepository;

    public InvoiceGenerator(PdfRenderer pdfRenderer, InvoiceRepository invoiceRepository) {
        this.pdfRenderer = pdfRenderer;
        this.invoiceRepository = invoiceRepository;
    }

    // Order is passed as a parameter — InvoiceGenerator uses it temporarily
    public Invoice generateForOrder(Order order, Customer customer) {
        double totalAmount = order.getLineItems().stream()
            .mapToDouble(OrderLineItem::getSubtotal)
            .sum();

        String invoiceContent = pdfRenderer.render(
            customer.getFullName(),
            customer.getEmail(),
            order.getId(),
            order.getLineItems(),
            totalAmount
        );

        Invoice invoice = new Invoice(
            UUID.randomUUID().toString(),
            order.getId(),
            customer.getId(),
            totalAmount,
            invoiceContent
        );
        return invoiceRepository.save(invoice);
    }
}
```

`InvoiceGenerator` is associated with `Order` and `Customer` through method parameters. There is no persistent field for `Order` or `Customer` in `InvoiceGenerator`. This is the lightest form of association.


## Multiplicity

Association can be described in terms of how many objects participate:

| Multiplicity | Meaning | Example |
|---|---|---|
| One-to-one | One A is associated with one B | `Order` has one `Invoice` |
| One-to-many | One A is associated with many B | `Order` has many `OrderLineItem` |
| Many-to-many | Many A are associated with many B | `Product` belongs to many `Category` |

```java
// One-to-many: ProductService works with many products
public class ProductService {
    private final ProductRepository productRepository;

    public List<Product> findByCategory(String categoryId) {
        return productRepository.findByCategoryId(categoryId);
    }
}

// Many-to-many: A product can belong to multiple categories
public class Product {
    private final String id;
    private List<String> categoryIds;   // IDs of associated categories
}
```


## Association vs Composition vs Aggregation

| Relationship | Ownership | Lifetime | Example |
|---|---|---|---|
| Association | None | Independent | `OrderService` uses `ProductRepository` |
| Aggregation | Weak | Independent | `Department` has `Employee` objects |
| Composition | Strong | Dependent | `Order` owns its `LineItems` |

Association is the base case. See [[Aggregation]] and [[Composition]] for the ownership variants.


## Related

- [[Aggregation]] — Association with weak ownership
- [[Composition]] — Association with strong ownership and lifetime control
- [[Dependency]] — The most transient form of class interaction
- [[Coupling-And-Cohesion]] — Managing the strength of associations
