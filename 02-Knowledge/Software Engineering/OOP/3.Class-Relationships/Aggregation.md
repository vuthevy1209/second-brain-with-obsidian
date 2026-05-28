---
title: Aggregation
summary: Aggregation is a "has-a" relationship where one class contains references to objects of another class, but those contained objects can exist independently and may be shared across multiple containers. It models a whole-part relationship where the parts have an independent lifecycle.
tags:
  - oop
  - java
  - class-relationships
created: 2026-05-28
---

## What Aggregation Means

Aggregation is association with a directional ownership implication: the containing class (the whole) holds references to the contained class (the parts), but the contained objects do not depend on the container for their existence. If the container is destroyed, the contained objects continue to exist.

This is the key difference from Composition: in Composition, the contained objects cannot exist without their container. In Aggregation, they can.


## Example: Department and Employees

A `Department` has `Employee` objects, but an `Employee` does not cease to exist if the department is dissolved. The employee might be reassigned to another department or remain in the system as unassigned.

```java
public class Employee {

    private final String id;
    private String fullName;
    private String email;
    private String jobTitle;

    public Employee(String id, String fullName, String email, String jobTitle) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.jobTitle = jobTitle;
    }

    public String getId() { return id; }
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
    public String getJobTitle() { return jobTitle; }
}

public class Department {

    private final String id;
    private String name;
    private final List<Employee> members;    // Aggregation: holds references, not ownership

    public Department(String id, String name) {
        this.id = id;
        this.name = name;
        this.members = new ArrayList<>();
    }

    public void addMember(Employee employee) {
        if (!members.contains(employee)) {
            members.add(employee);
        }
    }

    public void removeMember(Employee employee) {
        members.remove(employee);
    }

    public List<Employee> getMembers() {
        return Collections.unmodifiableList(members);
    }

    public int getHeadCount() { return members.size(); }
    public String getId() { return id; }
    public String getName() { return name; }
}
```

`Department` holds a list of `Employee` objects, but the `Employee` objects are created independently and passed in. Removing an employee from the department does not delete the employee from the system.

```java
Employee alice = new Employee("E001", "Alice Nguyen", "alice@company.com", "Software Engineer");
Employee bob = new Employee("E002", "Bob Tran", "bob@company.com", "Product Manager");

Department engineering = new Department("D001", "Engineering");
Department product = new Department("D002", "Product");

engineering.addMember(alice);
product.addMember(bob);

// Alice can be temporarily assigned to product as well
product.addMember(alice);

System.out.println(engineering.getHeadCount());  // 1
System.out.println(product.getHeadCount());       // 2

engineering.removeMember(alice);  // Alice still exists, just not in this department
System.out.println(engineering.getHeadCount());  // 0
// alice object is still alive and intact
```


## Example: ProductCatalog and Products

A product catalog aggregates products. Products can appear in multiple catalogs, and they exist in the system as independent entities regardless of which catalog references them.

```java
public class ProductCatalog {

    private final String id;
    private String name;
    private final List<Product> products;    // Aggregation

    public ProductCatalog(String id, String name) {
        this.id = id;
        this.name = name;
        this.products = new ArrayList<>();
    }

    public void addProduct(Product product) {
        products.add(product);
    }

    public void removeProduct(String productId) {
        products.removeIf(p -> p.getId().equals(productId));
    }

    public List<Product> getProducts() {
        return Collections.unmodifiableList(products);
    }

    public Optional<Product> findProductById(String productId) {
        return products.stream()
            .filter(p -> p.getId().equals(productId))
            .findFirst();
    }

    public List<Product> getAvailableProducts() {
        return products.stream()
            .filter(Product::isAvailable)
            .collect(Collectors.toList());
    }
}
```

```java
Product laptop = new Product("P001", "Laptop Pro 15", 1299.99, 50);
Product headphones = new Product("P002", "Noise Cancelling Headphones", 299.99, 120);
Product monitor = new Product("P003", "4K Monitor 27-inch", 699.99, 30);

ProductCatalog techCatalog = new ProductCatalog("CAT001", "Technology");
ProductCatalog premiumCatalog = new ProductCatalog("CAT002", "Premium Selection");

techCatalog.addProduct(laptop);
techCatalog.addProduct(headphones);
techCatalog.addProduct(monitor);

premiumCatalog.addProduct(laptop);    // laptop appears in both catalogs
premiumCatalog.addProduct(monitor);

techCatalog.removeProduct("P001");    // removes laptop from techCatalog only
// laptop Product object is still referenced by premiumCatalog
```


## Shared References

A defining characteristic of aggregation is that the same object can be referenced by multiple containers simultaneously. This is not possible in composition, where each part belongs to exactly one whole.

```java
public class ProjectTeam {

    private final String projectId;
    private final List<Employee> teamMembers;

    public ProjectTeam(String projectId) {
        this.projectId = projectId;
        this.teamMembers = new ArrayList<>();
    }

    public void assign(Employee employee) {
        teamMembers.add(employee);
    }

    public void release(Employee employee) {
        teamMembers.remove(employee);
    }
}

// Alice works on two projects simultaneously
Employee alice = employeeRepository.findById("E001");

ProjectTeam projectAlpha = new ProjectTeam("PROJECT-ALPHA");
ProjectTeam projectBeta = new ProjectTeam("PROJECT-BETA");

projectAlpha.assign(alice);
projectBeta.assign(alice);  // Same alice reference in two teams — valid aggregation
```


## How to Recognize Aggregation

Ask these questions:
1. If the container is deleted, should the contained objects also be deleted? If no, it is aggregation. If yes, it is composition.
2. Can the same object be in multiple containers at once? If yes, it must be aggregation.
3. Are the contained objects created inside the constructor of the container, or passed in? Aggregation typically involves passing objects in (injected), while composition often involves creating them internally.


## Aggregation in Service Design

Service classes often aggregate repository and client dependencies. These dependencies are created externally and passed in, and they exist beyond the service's lifecycle.

```java
public class ReportService {

    private final OrderRepository orderRepository;        // aggregated
    private final CustomerRepository customerRepository;  // aggregated
    private final ProductRepository productRepository;    // aggregated
    private final ReportRenderer reportRenderer;          // aggregated

    public ReportService(OrderRepository orderRepository,
                         CustomerRepository customerRepository,
                         ProductRepository productRepository,
                         ReportRenderer reportRenderer) {
        this.orderRepository = orderRepository;
        this.customerRepository = customerRepository;
        this.productRepository = productRepository;
        this.reportRenderer = reportRenderer;
    }
}
```

All four dependencies are aggregated. They are created outside `ReportService` (typically by a dependency injection container) and passed in. They will continue to exist after `ReportService` is garbage collected.


## Related

- [[Association]] — The general form that aggregation specializes
- [[Composition]] — The stronger form where the container owns the parts' lifecycle
- [[Dependency-Injection]] — Injecting aggregated dependencies from the outside
- [[Coupling-And-Cohesion]] — Aggregation is a relatively loose coupling form
