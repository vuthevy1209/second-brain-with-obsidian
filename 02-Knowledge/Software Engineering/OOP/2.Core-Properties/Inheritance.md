---
title: Inheritance
summary: Inheritance allows a subclass to acquire the fields and methods of a superclass, enabling code reuse and the establishment of an is-a relationship between types. It is the mechanism that makes runtime polymorphism possible.
tags:
  - oop
  - java
  - core-properties
created: 2026-05-28
---

## The Core Idea

Inheritance models an "is-a" relationship. `AdminUser` is a `User`. `SavingsAccount` is a `BankAccount`. `StripePaymentGateway` is a `PaymentGateway`. When this relationship is genuine, inheritance allows the subclass to reuse all behavior from the superclass and override or extend only what differs.

Inheritance should not be used simply to reuse code. If the relationship is "has-a" or "uses-a" rather than "is-a", Composition is the correct tool. See [[Composition]].


## Basic Inheritance

```java
public class User {

    private final String id;
    private String email;
    private String fullName;
    private boolean active;
    private final Instant createdAt;

    public User(String id, String email, String fullName) {
        this.id = id;
        this.email = email;
        this.fullName = fullName;
        this.active = true;
        this.createdAt = Instant.now();
    }

    public void deactivate() {
        this.active = false;
    }

    public boolean canLogin() {
        return active;
    }

    public String getId() { return id; }
    public String getEmail() { return email; }
    public String getFullName() { return fullName; }
    public boolean isActive() { return active; }
    public Instant getCreatedAt() { return createdAt; }
}

public class AdminUser extends User {

    private String department;
    private Set<String> permissions;

    public AdminUser(String id, String email, String fullName, String department) {
        super(id, email, fullName);   // Initialize User fields
        this.department = department;
        this.permissions = new HashSet<>();
    }

    public void grantPermission(String permission) {
        permissions.add(permission);
    }

    public void revokePermission(String permission) {
        permissions.remove(permission);
    }

    public boolean hasPermission(String permission) {
        return permissions.contains(permission);
    }

    public String getDepartment() { return department; }
    public Set<String> getPermissions() { return Collections.unmodifiableSet(permissions); }
}
```

`AdminUser` inherits `id`, `email`, `fullName`, `active`, `createdAt`, `deactivate()`, `canLogin()`, and all getters from `User`. It only adds the fields and methods that are specific to administrators.


## Method Overriding

Overriding replaces a superclass method with a different implementation in the subclass. It is the mechanism that drives runtime polymorphism.

```java
public class PremiumUser extends User {

    private int loyaltyPoints;
    private String subscriptionTier;

    public PremiumUser(String id, String email, String fullName, String subscriptionTier) {
        super(id, email, fullName);
        this.subscriptionTier = subscriptionTier;
        this.loyaltyPoints = 0;
    }

    @Override
    public boolean canLogin() {
        // Premium users can still log in even if temporarily suspended,
        // as long as their subscription is valid
        return isActive() || isSubscriptionValid();
    }

    private boolean isSubscriptionValid() {
        return subscriptionTier != null && !subscriptionTier.equals("EXPIRED");
    }

    public void addLoyaltyPoints(int points) {
        this.loyaltyPoints += points;
    }

    public int getLoyaltyPoints() { return loyaltyPoints; }
    public String getSubscriptionTier() { return subscriptionTier; }
}
```

`PremiumUser` overrides `canLogin()` with custom logic while inheriting everything else from `User`.


## Calling super Methods

A subclass can call the overridden method from the superclass using `super.methodName()`. This is useful when you want to extend rather than replace the superclass behavior.

```java
public class AuditedProductService extends ProductService {

    private final AuditLog auditLog;

    public AuditedProductService(ProductRepository productRepository,
                                  PricingEngine pricingEngine,
                                  EventPublisher eventPublisher,
                                  AuditLog auditLog) {
        super(productRepository, pricingEngine, eventPublisher);
        this.auditLog = auditLog;
    }

    @Override
    public Product createProduct(CreateProductRequest request) {
        auditLog.record("CREATE_PRODUCT_ATTEMPT", request.getName());
        Product created = super.createProduct(request);   // Delegate to parent
        auditLog.record("CREATE_PRODUCT_SUCCESS", created.getId());
        return created;
    }

    @Override
    public void deleteProduct(String productId) {
        auditLog.record("DELETE_PRODUCT_ATTEMPT", productId);
        super.deleteProduct(productId);
        auditLog.record("DELETE_PRODUCT_SUCCESS", productId);
    }
}
```

`AuditedProductService` wraps the parent behavior with audit logging without duplicating the core business logic.


## Abstract Superclass

When there is shared behavior but no sensible default for some methods, the superclass can be abstract. This forces subclasses to provide concrete implementations.

```java
public abstract class ReportGenerator {

    private final ReportRepository reportRepository;

    protected ReportGenerator(ReportRepository reportRepository) {
        this.reportRepository = reportRepository;
    }

    public final Report generate(ReportRequest request) {
        validateRequest(request);
        List<ReportRow> rows = collectData(request);       // abstract
        String content = formatContent(rows, request);    // abstract
        Report report = new Report(UUID.randomUUID().toString(), content, Instant.now());
        reportRepository.save(report);
        return report;
    }

    protected abstract List<ReportRow> collectData(ReportRequest request);
    protected abstract String formatContent(List<ReportRow> rows, ReportRequest request);

    private void validateRequest(ReportRequest request) {
        if (request.getStartDate().isAfter(request.getEndDate())) {
            throw new IllegalArgumentException("Start date must be before end date");
        }
    }
}

public class SalesReportGenerator extends ReportGenerator {

    private final OrderRepository orderRepository;

    public SalesReportGenerator(ReportRepository reportRepository, OrderRepository orderRepository) {
        super(reportRepository);
        this.orderRepository = orderRepository;
    }

    @Override
    protected List<ReportRow> collectData(ReportRequest request) {
        return orderRepository.findByDateRange(request.getStartDate(), request.getEndDate())
            .stream()
            .map(order -> new ReportRow(
                order.getId(),
                order.getCustomerId(),
                order.getTotalAmount().toString(),
                order.getCreatedAt().toString()
            ))
            .collect(Collectors.toList());
    }

    @Override
    protected String formatContent(List<ReportRow> rows, ReportRequest request) {
        StringBuilder sb = new StringBuilder();
        sb.append("Sales Report: ").append(request.getStartDate()).append(" to ").append(request.getEndDate()).append("\n");
        rows.forEach(row -> sb.append(row.toString()).append("\n"));
        return sb.toString();
    }
}
```


## The Liskov Substitution Principle

A subclass should be substitutable for its superclass without altering the correctness of the program. If code works with a `User` reference, it should work equally well when given a `PremiumUser` or an `AdminUser`.

A common violation is when a subclass overrides a method and throws an exception for a case that the parent handles. If `User.canLogin()` always returns a boolean, a subclass that throws `UnsupportedOperationException` from `canLogin()` breaks substitutability.

```java
// GOOD: Works with any User subtype
public class LoginService {

    public AuthResult login(User user, String password) {
        if (!user.canLogin()) {    // Works for User, AdminUser, PremiumUser
            return AuthResult.denied("Account is not eligible for login");
        }
        boolean passwordMatch = verifyPassword(user, password);
        return passwordMatch ? AuthResult.success(user.getId()) : AuthResult.denied("Invalid credentials");
    }
}
```


## When Not to Use Inheritance

Inheritance is frequently overused. Prefer Composition when:

- The relationship is "has-a" or "uses-a" rather than "is-a"
- You want to reuse an implementation without committing to the type hierarchy
- You need behaviors from multiple unrelated sources (Java's single inheritance limit makes this problematic)
- The superclass is not designed for extension (it is not abstract and has no `protected` hooks)

See [[Composition]] and [[Composition-vs-Inheritance]] for detailed guidance.


## Related

- [[Polymorphism]] — Inheritance enables runtime polymorphism
- [[Abstraction]] — Abstract classes combine abstraction and inheritance
- [[Composition]] — The alternative to inheritance for code reuse
- [[SOLID-Principles]] — Liskov Substitution Principle and Open/Closed Principle
