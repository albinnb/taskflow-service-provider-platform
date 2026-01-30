# TaskFlow Entity Relationship Diagram

This document contains the Entity Relationship (ER) Diagram for the TaskFlow platform, designed for academic submission.

## ER Diagram (Mermaid)

```mermaid
erDiagram
    %% ENTITIES
    USER {
        ObjectId _id PK
        string name
        string email UK
        string passwordHash
        enum role "customer, provider, admin"
        string phone
        GeoJSON location
        boolean isBanned
    }

    PROVIDER {
        ObjectId _id PK
        ObjectId userId FK
        string businessName
        boolean isVerified
        string availability
        float ratingAvg
    }

    CATEGORY {
        ObjectId _id PK
        string name
        string slug
    }

    SERVICE {
        ObjectId _id PK
        ObjectId providerId FK
        ObjectId categoryId FK
        string title
        float price
        boolean isActive
    }

    BOOKING {
        ObjectId _id PK
        ObjectId userId FK
        ObjectId serviceId FK
        datetime scheduledAt
        float totalPrice
        enum status "pending, confirmed, completed"
    }

    REVIEW {
        ObjectId _id PK
        ObjectId userId FK
        ObjectId providerId FK
        ObjectId bookingId FK "Unique"
        int rating
        string comment
    }

    DISPUTE {
        ObjectId _id PK
        ObjectId bookingId FK
        ObjectId raisedBy FK
        string reason
        enum status "open, resolved, refunded"
        string adminNotes
    }

    %% RELATIONSHIPS

    %% A USER can become ONE PROVIDER (1:1 Specialization)
    USER ||--o| PROVIDER : "becomes (1:1)"

    %% ONE PROVIDER offers MANY SERVICES (1:N)
    PROVIDER ||--o{ SERVICE : "offers (1:N)"

    %% ONE CATEGORY contains MANY SERVICES (1:N)
    CATEGORY ||--o{ SERVICE : "contains (1:N)"

    %% ONE USER can make MANY BOOKINGS (1:N)
    USER ||--o{ BOOKING : "makes (1:N)"

    %% ONE SERVICE can have MANY BOOKINGS (1:N)
    SERVICE ||--o{ BOOKING : "has (1:N)"

    %% ONE USER can write MANY REVIEWS (1:N)
    USER ||--o{ REVIEW : "writes (1:N)"

    %% ONE PROVIDER can receive MANY REVIEWS (1:N)
    PROVIDER ||--o{ REVIEW : "receives (1:N)"

    %% ONE BOOKING can have ONLY ONE REVIEW (1:1)
    BOOKING ||--o| REVIEW : "has (1:1)"

    %% ONE BOOKING can have ZERO or ONE DISPUTE (1:1 optional)
    BOOKING ||--o| DISPUTE : "has (1:0..1)"

    %% ONE USER can raise MANY DISPUTES (1:N)
    USER ||--o{ DISPUTE : "raises (1:N)"
```

## Entity Details & Relationships

### 1. USER
*   **_id** (PK): Unique Identifier.
*   **email**: Unique.
*   **Attributes**: name, passwordHash, role, phone, location, isBanned.
*   **Relationships**:
    *   1:1 with **PROVIDER** (optional, as User *becomes* Provider).
    *   1:N with **BOOKING** (Customer makes bookings).
    *   1:N with **REVIEW** (User writes reviews).
    *   1:N with **DISPUTE** (User raises disputes).

### 2. PROVIDER
*   **_id** (PK): Unique Identifier.
*   **userId** (FK): References `USER._id`.
*   **Attributes**: businessName, isVerified, availability, ratingAvg.
*   **Relationships**:
    *   1:N with **SERVICE** (Provider offers services).
    *   1:N with **REVIEW** (Provider receives reviews).

### 3. CATEGORY
*   **_id** (PK): Unique Identifier.
*   **Attributes**: name, slug.
*   **Relationships**:
    *   1:N with **SERVICE** (Category contains services).

### 4. SERVICE
*   **_id** (PK): Unique Identifier.
*   **providerId** (FK): References `PROVIDER._id`.
*   **categoryId** (FK): References `CATEGORY._id`.
*   **Attributes**: title, price, isActive.
*   **Relationships**:
    *   1:N with **BOOKING** (Service has bookings).

### 5. BOOKING
*   **_id** (PK): Unique Identifier.
*   **userId** (FK): References `USER._id`.
*   **serviceId** (FK): References `SERVICE._id`.
*   **Attributes**: scheduledAt, totalPrice, status.
*   **Relationships**:
    *   1:1 with **REVIEW** (Booking has max one review).
    *   1:0..1 with **DISPUTE** (Booking has optional dispute).

### 6. REVIEW
*   **_id** (PK): Unique Identifier.
*   **userId** (FK): References `USER._id`.
*   **providerId** (FK): References `PROVIDER._id`.
*   **bookingId** (FK): References `BOOKING._id` (Unique).
*   **Attributes**: rating, comment.

### 7. DISPUTE
*   **_id** (PK): Unique Identifier.
*   **bookingId** (FK): References `BOOKING._id`.
*   **raisedBy** (FK): References `USER._id`.
*   **Attributes**: reason, status, adminNotes.
