# TaskFlow Project Documentation Guide

This guide provides the necessary details to construct your project record diagrams (ERD, DFD, Use Case). It is based on the analysis of your Mongoose models in `taskflow-backend/src/models`.

---

## 1. Entity Relationship (ER) Diagram

The ER diagram represents the data structure. Here are your entities and their relationships.

### Core Entities & Attributes

| Entity | Attributes (Key Fields) |
| :--- | :--- |
| **User** | `_id`, `name`, `email`, `role` (customer/provider/admin), `phone`, `address`, `location` (GeoJSON), `passwordHash` |
| **Provider** | `_id`, `userId` (FK), `businessName`, `description`, `availability`, `ratingAvg`, `reviewCount`, `isVerified` |
| **Service** | `_id`, `providerId` (FK), `category` (FK), `title`, `description`, `price`, `durationMinutes`, `isActive` |
| **Category** | `_id`, `name`, `slug` |
| **Booking** | `_id`, `userId` (FK), `providerId` (FK), `serviceId` (FK), `scheduledAt`, `status`, `paymentStatus`, `totalPrice` |
| **Review** | `_id`, `userId` (FK), `providerId` (FK), `bookingId` (FK), `rating`, `comment` |
| **Chat** | `_id`, `participants` (Array of User FKs), `lastMessage` (FK) |
| **Message** | `_id`, `chatId` (FK), `sender` (FK), `content`, `readBy` |
| **Dispute** | `_id`, `bookingId` (FK), `raisedBy` (FK), `providerId` (FK), `reason`, `status`, `resolutionDate` |

### Relationships (Cardinality)

*   **User 1 -- 1 Provider**: A User with role 'provider' has exactly one technical Provider profile. (One-to-One)
*   **Provider 1 -- M Service**: A Provider offers multiple Services. (One-to-Many)
*   **Category 1 -- M Service**: A Category (e.g., Cleaning) contains many Services. (One-to-Many)
*   **User (Customer) 1 -- M Booking**: A Customer makes many Bookings. (One-to-Many)
*   **Provider 1 -- M Booking**: A Provider receives many Bookings. (One-to-Many)
*   **Booking 1 -- 1 Review**: A single Booking can have only one Review. (One-to-One / Zero-to-One)
*   **User 1 -- M Chat**: A User participates in many Chats. (One-to-Many)
*   **Chat 1 -- M Message**: A Chat contains many Messages. (One-to-Many)

---

## 2. Data Flow Diagram (DFD)

DFDs show how data moves through the system.

### Processes (Level 1 DFD Ideas)

1.  **Authentication Process**:
    *   **Input**: Login credentials (Email/Password)
    *   **Process**: Verify User, Generate Token
    *   **Output**: Auth Token, User Profile Data
    *   **Data Store**: `User`

2.  **Service Discovery**:
    *   **Input**: Search Query / Category Selection
    *   **Process**: Filter Services, Sort by Location/Rating
    *   **Output**: List of Services
    *   **Data Store**: `Service`, `Provider`, `Category`

3.  **Booking System**:
    *   **Input**: Booking Request (Service ID, Time)
    *   **Process**: Check Availability, Create Booking Record, Calculate Price
    *   **Output**: Booking Confirmation, Notification to Provider
    *   **Data Store**: `Booking`, `Provider` (Availability)

4.  **Feedback Loop**:
    *   **Input**: Rating & Comment
    *   **Process**: Validate Booking completion, Save Review, Update Provider Average
    *   **Output**: Updated Profile Stats
    *   **Data Store**: `Review`, `Provider`

---

## 3. Use Case Diagram

This diagram focuses on Actors and their Interactions.

### Actors

1.  **Customer**: The end-user seeking services.
2.  **Provider**: The professional offering services.
3.  **Admin**: The platform manager.

### Use Cases per Actor

#### **Customer**
*   Register / Login
*   Search for Services (by Category, Keyword)
*   View Provider Profiles & Reviews
*   **Book a Service**
*   Make Payment (Process Payment)
*   Chat with Provider
*   Rate & Review Provider
*   Raise a Dispute
*   Manage Profile (Address, Info)

#### **Provider**
*   Register / Login (as Provider)
*   **Manage Services** (Add, Edit, Delete)
*   Set Availability (Working days, hours)
*   **Manage Bookings** (Accept, Reject, Mark Completed)
*   View Earnings/Stats
*   Chat with Customer
*   Respond to Disputes

#### **Admin**
*   Login
*   **Manage Categories** (Add, Remove)
*   Verify Providers (Approve/Reject profiles)
*   Manage Users (Ban/Unban)
*   **Resolve Disputes**
*   View System Analytics

---

## 4. Database Schema Design (Table Details)

Detailed specification for each collection/table in the database.

### Table: Users
| Field Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | PK, Auto | Unique Identifier |
| `name` | String | Trim | User's full name |
| `email` | String | Required, Unique, Lowercase | User's email address (Login ID) |
| `passwordHash` | String | Required | Bcrypt hashed password |
| `role` | String | Enum ['customer', 'provider', 'admin'], Default: 'customer' | Access level of the user |
| `phone` | String | 10 digits regex | Mobile number |
| `address` | Object | - | Embedded object containing house, street, city, state, pin |
| `location` | GeoJSON | Index: 2dsphere | Geospatial coordinates [long, lat] for map search |
| `ratingAvg` | Number | Min: 0, Max: 5, Default: 0 | Aggregate rating from reviews (if provider) |
| `isBanned` | Boolean | Default: false | Admin ban status |
| `createdAt` | Date | Auto | Creation timestamp |

### Table: Providers
| Field Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | PK, Auto | Unique Identifier |
| `userId` | ObjectId | FK (User), Unique, Required | Link to the main User account |
| `businessName` | String | Required, Unique | Brand or Business Name |
| `description` | String | Required, Max: 500 | Business bio/description |
| `categories` | Array[ObjectId] | Ref: Category | List of service categories offered |
| `services` | Array[ObjectId] | Ref: Service | List of specific services offered |
| `images` | Array[Object] | - | Portfolio images (URL, PublicID) |
| `isVerified` | Boolean | Default: false | Admin verification status |
| `availability` | Object | - | Complex object defining weekly slots & buffer time |
| `ratingAvg` | Number | Min: 0, Max: 5 | Cached average rating for performance |
| `reviewCount` | Number | Default: 0 | Total number of reviews received |

### Table: Services
| Field Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | PK, Auto | Unique Identifier |
| `providerId` | ObjectId | FK (Provider), Required | The provider offering this service |
| `title` | String | Required, Text Index | Name of the service |
| `description` | String | Required, Text Index | Detailed explanation of what's included |
| `category` | ObjectId | FK (Category), Required | Classification of the service |
| `price` | Number | Required, Min: 0 | Cost of the service |
| `durationMinutes` | Number | Required, Min: 10 | Estimated time to complete |
| `isActive` | Boolean | Default: true | Visibility toggle |
| `approvalStatus`| String | Enum ['pending', 'approved', 'rejected'] | Admin moderation status |

### Table: Bookings
| Field Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | PK, Auto | Unique transaction ID |
| `userId` | ObjectId | FK (User), Required | Customer who booked |
| `providerId` | ObjectId | FK (Provider), Required | Provider who is booked |
| `serviceId` | ObjectId | FK (Service), Required | Specific service booked |
| `scheduledAt` | Date | Required | Start time of the job |
| `durationMinutes`| Number | Required | Expected duration |
| `totalPrice` | Number | Required | Final calculated price |
| `status` | String | Enum ['pending', 'confirmed', 'completed', 'cancelled', 'rescheduled'] | Current state of booking |
| `paymentStatus` | String | Default: 'unpaid' | e.g., 'paid', 'unpaid' |
| `meta` | Object | - | Extra details (notes, payment intent ID) |

### Table: Reviews
| Field Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | PK, Auto | Unique ID |
| `userId` | ObjectId | FK (User), Required | Author of the review |
| `providerId` | ObjectId | FK (Provider), Required | Subject of the review |
| `bookingId` | ObjectId | FK (Booking), Unique | Associated transaction |
| `rating` | Number | Required, Min: 1, Max: 5 | Star rating |
| `comment` | String | Max: 500 | Textual feedback |

### Table: Categories
| Field Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | PK, Auto | Unique ID |
| `name` | String | Required, Unique | Display name (e.g. "Plumbing") |
| `slug` | String | Required, Unique | URL-friendly name (e.g. "plumbing") |

### Table: Chats
| Field Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | PK, Auto | Unique conversation ID |
| `participants` | Array[ObjectId] | Ref: User | List of users in chat (usually 2) |
| `lastMessage` | ObjectId | Ref: Message | Link to most recent message for preview |

### Table: Messages
| Field Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | PK, Auto | Unique message ID |
| `chatId` | ObjectId | FK (Chat), Required | The conversation this belongs to |
| `sender` | ObjectId | FK (User), Required | Who sent the message |
| `content` | String | Required | Message body |
| `readBy` | Array[ObjectId] | Ref: User | Read receipts |

### Table: Disputes
| Field Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | PK, Auto | Unique Dispute ID |
| `bookingId` | ObjectId | FK (Booking), Required | Context of the dispute |
| `raisedBy` | ObjectId | FK (User), Required | Complainant |
| `providerId` | ObjectId | FK (Provider), Required | Respondent |
| `reason` | String | Required | Explanation of issue |
| `status` | String | Enum ['open', 'resolved', 'refunded', ...], Default: 'open' | Current case status |
| `adminNotes` | String | - | Internal notes by admin |

### Table: Notifications
| Field Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | PK, Auto | Unique ID |
| `recipient` | ObjectId | FK (User), Required | Who sees this notification |
| `message` | String | Required | Display text |
| `type` | String | Enum ['system', 'booking', 'account'] | Category for icon/logic |
| `relatedId` | ObjectId | - | ID of Booking/Service for redirection |
| `isRead` | Boolean | Default: false | Read status |
