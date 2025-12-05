# Backend with Scalable MongoDB Architecture for a clothing business API

## Badges

![Node.js](https://img.shields.io/badge/Node.js-18.x-green?logo=node.js)
![Express](https://img.shields.io/badge/Express.js-Backend-black?logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-NoSQL-brightgreen?logo=mongodb)
![Mongoose](https://img.shields.io/badge/Mongoose-ODM-red?logo=mongoose)
![Vitest](https://img.shields.io/badge/Vitest-Testing-yellow?logo=vitest)
![Supertest](https://img.shields.io/badge/Supertest-API%20Testing-blue)
![In--Memory%20DB](https://img.shields.io/badge/MongoDB--Memory--Server-Fast%20Tests-orange)
![JWT](https://img.shields.io/badge/JWT-Authentication-purple?logo=jsonwebtokens)
![RBAC](https://img.shields.io/badge/Security-RBAC-important)


A production-oriented backend system designed for a clothing e-commerce platform.  
This project emphasizes **clean architecture**, **scalable MongoDB data modeling**,  
**RBAC-driven authorization**, and **a comprehensive automated testing setup** using  
`mongodb-memory-server`, `vitest`, and `supertest`.

This repository highlights my work on the database system, schema design, validation rules,
and backend structure required for real-world e-commerce inventory, user management, and
product workflows.

---

## System Architecture Diagram

Below is a high-level view of how major components interact within the backend:

``` mermaid
graph TD
    A[Client App / Postman] -->|HTTP Requests| B(Express API - app.js / routes);
    B -->|Routing & Middleware| C(Controllers);
    C -->|Business Logic| D(Models - Mongoose Schemas);
    D -->|ODM Operations| E[MongoDB];
    
    %% Styling for clarity
    style A fill:#e0e0e0,stroke:#333
    style B fill:#f9f,stroke:#333
    style C fill:#fcc,stroke:#333
    style D fill:#ccf,stroke:#333
    style E fill:#cfc,stroke:#333
```

## Testing Architecture Overview

This diagram showcases how your test system works using an in-memory MongoDB instance.

``` mermaid
graph TD
    A[Vitest - Test Runner Engine] --> B(Supertest - API Request Testing);
    B --> C[Express App];
    C --> D(MongoDB-Memory-Server - In-memory Isolated Database);
    
    style A fill:#ffc,stroke:#333
    style B fill:#ddf,stroke:#333
    style D fill:#fcc,stroke:#333

```

### Why this matters:
- Zero external dependencies  
- Fully isolated environments  
- Higher test reliability  
- Extremely fast execution


---

## Features Overview

### ** Advanced MongoDB Schema Architecture**
The system uses a modular and scalable schema layout supporting:

- Products, Categories, Users, Reviews
- Embedded + referenced document patterns  
- Schema-level validation rules  
- Schema inheritance for product subtypes  
- Timestamps, indexes & lifecycle hooks

---

## **Database Design — Key Highlights**

### **1. Hierarchical Product Modeling**
Products share a **base schema**, while specialized product types extend it:

- **Top-wear**  
- **Bottom-wear**

Each subtype inherits common product fields and adds category-specific attributes.
Examples include:

- *Top-wear*: sleeve, neckline
- *Bottom-wear*: length, rise

This structure supports rich filtering and scalable product categorization.

### **2. Rich Variant & Sizing Structure**
Each product supports:

- Multiple variants (e.g., colors)  
- Dynamic size arrays  
- Stock tracking per size  
- Style objects per product type

### **3. User Model With Production-Grade Features**

The User schema includes:

- **Secure password hashing**
- **Token rotation system**
- **Multiple addresses per user**
- **Data sanitization**
- **Schema-level validation rules**
- **Role-based access control (RBAC)**

Admin and customer roles enforce access boundaries throughout the application.

### **4. Category-Level Organization**
Categories are stored as separate documents, enabling structured filtering and  
category-specific product queries.

### **5. Data Integrity Controls**
Across the schemas:

- JSON schema validation for required fields
- Email pattern matching
- Minimum password length enforcement
- Enum restrictions for user roles
- Automatic timestamps
- Optional indexing for performance

---

## **RBAC — Role-Based Access Control**

The system uses a clean RBAC structure:

- **Admin Users**: Can create, update, and manage products & categories  
- **Customers**: Can register, log in, manage addresses, and purchase items  

Authorization logic is tied directly to user roles in the database, ensuring strong separation of privileges.

---

## **Automated Testing System**

The project includes a dedicated **/tests** folder covering:

- Authentication & token rotation  
- RBAC access control  
- Product and category endpoint behavior  
- Validation errors & edge cases  
- CRUD operations with in-memory MongoDB

### **Tech Stack for Testing**
| Tool | Purpose |
|------|---------|
| `vitest` | Test runner |
| `supertest` | HTTP endpoint testing |
| `mongodb-memory-server` | In-memory database instance for isolated, fast testing |

### **Why this matters**
- No external DB required to run tests  
- Tests run in milliseconds  
- Ensures consistent, repeatable results  
- Suitable for CI/CD integration  

The current test suite covers **96 passing tests**, ensuring stability and confidence in core functionality.

---

## **Tech Stack**

- **Node.js**, Express  
- **MongoDB**, Mongoose  
- **Vitest**, Supertest  
- **mongodb-memory-server**  
- **JSON Schema Validation**  
- JWT-based token and refresh-token strategy  

---

## Folder Structure (Simplified)

```
./
├── logs/
    └── error.log
├── src/
    ├── config/
    ├── controllers/
    ├── errors/
    ├── middleware/
    ├── models/
    ├── routes/
    ├── utils/
    ├── validators/
    ├── app.js
    └── server.js
├── tests/
    ├── auth.test.js
    ├── product.test.js
    ├── category.test.js
    ├── review.test.js
    └── user.test.js
├── .env
├── .gitignore
└── package.json
```

---

## Current Focus

This ReadMe highlights the engineering work that went into building:

- A clean, scalable MongoDB data model  
- Security-aware authorization systems  
- A reliable, high-coverage automated testing environment  
