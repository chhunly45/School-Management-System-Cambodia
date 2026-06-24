# Konpuk PRD

## 1. Overview

Konpuk is a Cambodian online marketplace website inspired by Khmer24. The platform allows buyers and sellers to interact through listings, messaging, and user-managed profiles. It supports localized categories, search and filtering, mobile-responsive design, and administrative control for moderation and analytics.

### Goals

- Enable users to register, authenticate, and manage personal profiles.
- Allow sellers to post advertisements with category, price, images, and location details.
- Provide buyers with fast search, filter, and favorite capabilities.
- Support private chat between buyers and sellers.
- Offer an admin dashboard for moderation, user management, and content oversight.
- Optimize the platform for SEO and mobile usage.

### Target audience

- Cambodian individuals and small businesses buying and selling used goods, services, vehicles, property, and electronics.
- Mobile-first users in Cambodia who expect local-language support and fast browsing.
- Administrators and moderators responsible for safety and marketplace quality.

---

## 2. System Architecture

### 2.1 Architecture Overview

Konpuk uses a modular web architecture with three main layers:

- `Client` – a responsive frontend application built with React.js or Vue.js, providing search, browsing, posting, chat, and account management.
- `Server` – a RESTful API built with Node.js/Express, NestJS, or similar, handling authentication, listings, user actions, chat, and admin workflows.
- `Database` – a relational database such as PostgreSQL or MySQL to store users, listings, messages, categories, and audit data.

Additional services:

- CDN / object storage for image uploads.
- Redis for caching search results, sessions, and chat presence.
- Search engine index for fast full-text search (Elasticsearch, Meilisearch, or built-in DB search).
- SMTP or SMS gateway for email/SMS notifications.

### 2.2 Logical Components

- Authentication Service
- Advertisement Service
- Category and Taxonomy Service
- Search and Filter Service
- Profile Management Service
- Favorites Service
- Chat Service
- Admin and Moderation Service
- SEO and Content Rendering Service
- Analytics and Monitoring

### 2.3 Deployment Architecture

- Frontend deployed to a static hosting provider or server with CDN.
- Backend deployed as containerized microservices or monolith with API gateway.
- Database hosted in managed cloud service with backup and replication.
- Redis/Cache and search index hosted as managed services.
- Separate admin environment or admin path behind RBAC.

---

## 3. Database Schema

### 3.1 Entities

#### `users`
- `id` (UUID)
- `email` (string, unique)
- `password_hash` (string)
- `phone_number` (string, nullable)
- `display_name` (string)
- `role` (enum: `user`, `seller`, `admin`, `moderator`)
- `profile_image_url` (string, nullable)
- `bio` (text, nullable)
- `location` (string, nullable)
- `verified` (boolean)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `categories`
- `id` (UUID)
- `name` (string)
- `slug` (string, unique)
- `parent_id` (UUID, nullable)
- `description` (text, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `listings`
- `id` (UUID)
- `user_id` (UUID, foreign key -> users.id)
- `category_id` (UUID, foreign key -> categories.id)
- `title` (string)
- `slug` (string, unique)
- `description` (text)
- `price` (decimal)
- `currency` (string, default `KHR`)
- `condition` (enum: `new`, `used`, `refurbished`)
- `location` (string)
- `status` (enum: `draft`, `published`, `sold`, `archived`, `flagged`)
- `views_count` (int)
- `is_featured` (boolean)
- `meta_title` (string, nullable)
- `meta_description` (string, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `listing_images`
- `id` (UUID)
- `listing_id` (UUID, foreign key -> listings.id)
- `image_url` (string)
- `sort_order` (int)
- `created_at` (timestamp)

#### `favorites`
- `id` (UUID)
- `user_id` (UUID, foreign key -> users.id)
- `listing_id` (UUID, foreign key -> listings.id)
- `created_at` (timestamp)

#### `messages`
- `id` (UUID)
- `conversation_id` (UUID, foreign key -> conversations.id)
- `sender_id` (UUID, foreign key -> users.id)
- `content` (text)
- `attachment_url` (string, nullable)
- `read_at` (timestamp, nullable)
- `created_at` (timestamp)

#### `conversations`
- `id` (UUID)
- `listing_id` (UUID, foreign key -> listings.id)
- `buyer_id` (UUID, foreign key -> users.id)
- `seller_id` (UUID, foreign key -> users.id)
- `last_message_at` (timestamp)
- `status` (enum: `active`, `closed`, `blocked`)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `search_queries`
- `id` (UUID)
- `user_id` (UUID, nullable)
- `query_text` (string)
- `filters` (json)
- `results_count` (int)
- `created_at` (timestamp)

#### `admin_actions`
- `id` (UUID)
- `admin_id` (UUID, foreign key -> users.id)
- `action_type` (string)
- `target_type` (string)
- `target_id` (UUID)
- `notes` (text, nullable)
- `created_at` (timestamp)

#### `seo_pages`
- `id` (UUID)
- `page_type` (enum: `category`, `listing`, `homepage`, `static`)
- `slug` (string, unique)
- `title` (string)
- `description` (text)
- `keywords` (string, nullable)
- `content` (text, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### 3.2 Relationships

- Users can create many listings.
- Listings belong to one category and one seller.
- Listings can have multiple images.
- Users can favorite multiple listings.
- Conversations link buyers and sellers around a listing.
- Messages belong to a conversation.
- Admin actions are logged for moderation accountability.

---

## 4. API Endpoints

### 4.1 Authentication

- `POST /api/auth/register`
  - Request: `{ email, password, display_name, phone_number? }`
  - Response: `{ user, token }`

- `POST /api/auth/login`
  - Request: `{ email, password }`
  - Response: `{ user, token }`

- `POST /api/auth/logout`
  - Requires auth token
  - Response: `{ success: true }`

- `POST /api/auth/refresh`
  - Request: `{ refresh_token }`
  - Response: `{ token }`

- `POST /api/auth/password-reset`
  - Request: `{ email }`
  - Response: `{ success: true }`

### 4.2 Users and Profiles

- `GET /api/users/me`
  - Requires auth
  - Response: current user profile

- `PUT /api/users/me`
  - Requires auth
  - Request: `{ display_name?, bio?, location?, profile_image_url?, phone_number? }`
  - Response: updated profile

- `GET /api/users/:userId`
  - Public user profile view

### 4.3 Listings

- `GET /api/listings`
  - Query: `category`, `q`, `location`, `min_price`, `max_price`, `condition`, `sort`, `page`, `per_page`
  - Response: listing collection with pagination

- `GET /api/listings/:listingId`
  - Response: listing details including images, seller info, category

- `POST /api/listings`
  - Requires auth
  - Request: `{ title, description, price, currency, condition, category_id, location, images[], meta_title?, meta_description?, tags? }`
  - Response: created listing

- `PUT /api/listings/:listingId`
  - Requires auth, owner only
  - Request: fields to update
  - Response: updated listing

- `DELETE /api/listings/:listingId`
  - Requires auth, owner or admin
  - Response: `{ success: true }`

- `POST /api/listings/:listingId/images`
  - Requires auth, owner only
  - Request: image files or `image_url`
  - Response: added image objects

- `DELETE /api/listings/:listingId/images/:imageId`
  - Requires auth, owner only

### 4.4 Categories

- `GET /api/categories`
  - Response: category tree for navigation

- `GET /api/categories/:categoryId`
  - Response: category detail and breadcrumb data

### 4.5 Favorites

- `GET /api/favorites`
  - Requires auth
  - Response: user favorites list

- `POST /api/favorites`
  - Requires auth
  - Request: `{ listing_id }`
  - Response: created favorite entry

- `DELETE /api/favorites/:favoriteId`
  - Requires auth

### 4.6 Chat

- `GET /api/conversations`
  - Requires auth
  - Response: conversations for current user

- `GET /api/conversations/:conversationId`
  - Requires auth
  - Response: conversation details and messages

- `POST /api/conversations`
  - Requires auth
  - Request: `{ listing_id, buyer_id, seller_id, initial_message }`
  - Response: created conversation

- `POST /api/conversations/:conversationId/messages`
  - Requires auth
  - Request: `{ content, attachment_url? }`
  - Response: created message

- `PATCH /api/conversations/:conversationId/read`
  - Requires auth
  - Response: message read status update

### 4.7 Search and Filters

- `GET /api/search`
  - Query: `q`, `category_id`, `location`, `min_price`, `max_price`, `condition`, `sort`, `page`, `per_page`, `has_images`, `seller_type`
  - Response: filtered listing results

- `GET /api/search/suggestions`
  - Query: `q`
  - Response: autocomplete suggestions and popular keywords

### 4.8 Admin Dashboard

- `GET /api/admin/overview`
  - Requires admin role
  - Response: summary metrics, recent listings, user stats

- `GET /api/admin/users`
  - Requires admin role
  - Response: list of users and search parameters

- `PATCH /api/admin/users/:userId/status`
  - Requires admin role
  - Request: `{ role?, verified?, is_active? }`

- `GET /api/admin/listings`
  - Requires admin role
  - Response: flagged and pending listings

- `PATCH /api/admin/listings/:listingId/status`
  - Requires admin role
  - Request: `{ status, notes? }`

- `GET /api/admin/conversations`
  - Requires admin role
  - Response: flagged chats and moderation queue

- `GET /api/admin/audit-log`
  - Requires admin role
  - Response: admin action entries

### 4.9 SEO

- `GET /api/seo/pages/:slug`
  - Response: SEO metadata, static page content, and structured data

- `GET /api/seo/sitemap.xml`
  - Response: sitemap for listings, categories, and static pages

- `GET /api/seo/robots.txt`
  - Response: robots directives

---

## 5. Folder Structure

### Recommended repository layout

```
Konpuk/
├── client/
│   ├── public/
│   │   ├── index.html
│   │   ├── favicon.ico
│   │   └── robots.txt
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   ├── listings/
│   │   │   ├── chat/
│   │   │   ├── profile/
│   │   │   ├── admin/
│   │   │   └── shared/
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   ├── CategoryPage.tsx
│   │   │   ├── ListingPage.tsx
│   │   │   ├── SearchPage.tsx
│   │   │   ├── ProfilePage.tsx
│   │   │   ├── FavoritesPage.tsx
│   │   │   ├── MessagesPage.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   └── SeoPage.tsx
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── routes/
│   │   ├── store/
│   │   ├── styles/
│   │   ├── utils/
│   │   └── App.tsx
│   ├── package.json
│   └── tsconfig.json
├── server/
│   ├── src/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── listings/
│   │   │   ├── categories/
│   │   │   ├── favorites/
│   │   │   ├── chat/
│   │   │   ├── search/
│   │   │   ├── admin/
│   │   │   └── seo/
│   │   ├── config/
│   │   ├── database/
│   │   ├── migrations/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── jobs/
│   │   ├── notifications/
│   │   └── app.ts
│   ├── package.json
│   └── tsconfig.json
├── database/
│   ├── migrations/
│   ├── seeds/
│   ├── schema.sql
│   ├── prisma/  # optional
│   └── docker-compose.yml
├── docs/
│   ├── PRD.md
│   └── README.md
├── scripts/
│   ├── seed-db.js
│   └── deploy.sh
├── .env.example
├── docker-compose.yml
└── README.md
```

### Client structure details

- `components/auth` – login, registration, password reset
- `components/listings` – listing cards, creation wizard, preview gallery
- `components/chat` – conversation list, message view, input bar
- `components/profile` – profile editor, review history, seller info
- `components/admin` – dashboard widgets, moderation panels, reports
- `services/api.ts` – API client and auth token management
- `services/seo.ts` – metadata handler for title and meta tags
- `routes/` – page routing configuration
- `styles/` – responsive layout, theme tokens, mobile-first utilities

### Server structure details

- `api/` – route handlers by domain
- `models/` – ORM definitions for users, listings, categories, messages
- `repositories/` – data access logic and query composition
- `services/` – business logic and orchestration
- `middleware/` – auth, validation, rate limiting, request logging
- `jobs/` – background tasks for notifications, cleanup, and search indexing
- `notifications/` – email/SMS and push notification integration

---

## 6. Development Roadmap

### Phase 1: Foundation (Weeks 1-3)

- Project kickoff and architecture validation
- Set up repository, codebase, and CI/CD scaffolding
- Implement authentication and account management
- Build category taxonomy and listing data model
- Create listing creation, editing, and detail pages
- Establish responsive UI layout and core design system

### Phase 2: Marketplace Core (Weeks 4-6)

- Add searchable listings with filters
- Develop product category browse and navigation
- Implement favorites and saved listings
- Build user profiles and seller detail pages
- Integrate image upload workflow and listing media gallery
- Create SEO metadata support and sitemap generation

### Phase 3: Messaging and Admin (Weeks 7-9)

- Implement chat system and conversation inbox
- Add notifications for new messages and listing activity
- Build admin dashboard for user and listing moderation
- Implement reporting/flagging for listings and messages
- Add role-based access control for admin and moderators

### Phase 4: Polish and Launch (Weeks 10-12)

- Optimize UX for mobile devices and progressive performance
- Conduct SEO review, structured data, and analytics setup
- Perform security audit, load testing, and accessibility checks
- Finalize translations/localization for Khmer and English
- Launch beta with selected users and iterate on feedback

### Ongoing Enhancements

- Add premium listing promotions and paid advertising
- Introduce advanced recommendation and personalization
- Support additional payment and delivery workflows
- Expand search relevance with recommendations and autocomplete
- Add native mobile apps or PWA capabilities

---

## 7. Non-functional Requirements

- Mobile-first responsive design for smartphones and tablets.
- Strong security for user authentication and data protection.
- High availability with scalable backend and database.
- Fast search and content load times.
- SEO-friendly page structure and metadata.
- Compliance with Cambodian marketplace norms and privacy expectations.

---

## 8. SEO and Performance Considerations

- Use server-side rendering or prerendered pages for listing and category pages.
- Generate unique title, description, and canonical tags for listings and categories.
- Add structured data markup for products, offers, and local business info.
- Provide a dynamic sitemap and robots.txt.
- Optimize images and use lazy loading for listing galleries.
- Support fast mobile-first load times and Core Web Vitals.

---

## 9. Analytics and Monitoring

- Track user behavior for searches, listings views, conversions, and chat interactions.
- Monitor backend performance, API latency, and error rates.
- Log admin actions, moderation events, and content changes.
- Use dashboards in the admin portal for active listings, top categories, and engagement metrics.

---

## 10. Glossary

- `Listing` — a product or service advertisement posted by a seller.
- `Conversation` — a chat thread between buyer and seller regarding a listing.
- `Favorites` — saved listings a user can access later.
- `Admin dashboard` — control panel for moderation, content review, and analytics.
- `SEO` — search engine optimization to improve discoverability.

---

## 11. Success Metrics

- User registration and active seller growth
- Number of listings posted per day
- Search completion and filter usage
- Messages exchanged between buyers and sellers
- Percentage of listings favorited
- Admin response time for flagged content
- Mobile conversion and engagement rates
