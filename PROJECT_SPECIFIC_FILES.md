# Project-Specific Files Report

Files that are **tightly coupled** to the SMS marketplace domain and must be completely rewritten for a different project like a School Management System.

**Total Count:** ~120 files  
**Effort to Reuse:** Complete replacement needed (100% domain-specific rewrite)

---

## Core Domain Models (Marketplace)

| File | Type | Purpose | Why Project-Specific |
|------|------|---------|----------------------|
| `server/models/Product.js` | Model | Marketplace product schema | Defines: seller, price, condition, images, featured status - all marketplace-specific |
| `server/models/Category.js` | Model | Product category hierarchy | Marketplace categories (electronics, furniture, etc.) |
| `server/models/Banner.js` | Model | Promotional banner management | Marketplace banner/ad system |
| `server/models/Promotion.js` | Model | Product promotion rules | Marketplace deal/promotion engine |
| `server/models/Review.js` | Model | Product reviews/ratings | Buyer review system for marketplace |
| `server/models/Favorite.js` | Model | User wishlist/favorites | Save products feature |
| `server/models/Message.js` | Model | Product inquiry messages | Buyer-seller communication |
| `server/models/Chat.js` | Model | Chat conversation threading | Messaging between marketplace users |
| `server/models/Visitor.js` | Model | Anonymous visitor tracking | Marketplace visitor analytics |
| `server/models/PageView.js` | Model | Page view analytics | Marketplace page view tracking |
| `server/models/Search.js` | Model | Search query analytics | Marketplace search behavior tracking |
| `server/models/Image.js` | Model | Product image storage | Image associations with products |

---

## Marketplace Controllers

| File | Type | Purpose | Why Project-Specific |
|------|------|---------|----------------------|
| `server/controllers/product.controller.js` | Controller | Product CRUD operations | All endpoints for product listing, creation, editing |
| `server/controllers/category.controller.js` | Controller | Category management | Marketplace category endpoints |
| `server/controllers/banner.controller.js` | Controller | Banner/promotion display | Marketplace advertising system |
| `server/controllers/promotion.controller.js` | Controller | Promotion campaigns | Deal/promotion management |
| `server/controllers/review.controller.js` | Controller | Review management | Buyer review endpoints |
| `server/controllers/favorite.controller.js` | Controller | Wishlist/favorites | User bookmark features |
| `server/controllers/chat.controller.js` | Controller | Messaging | Buyer-seller communication |
| `server/controllers/seller-analytics.controller.js` | Controller | Seller dashboard metrics | Seller-specific analytics |
| `server/controllers/traffic-analytics.controller.js` | Controller | Traffic analytics | Marketplace traffic insights |
| `server/controllers/report.controller.js` | Controller | Report handling | Reporting listings/users |

---

## Marketplace Services

| File | Type | Purpose | Why Project-Specific |
|------|------|---------|----------------------|
| `server/services/product.service.js` | Service | Product business logic | Handles product creation, search, filtering, status management |
| `server/services/category.service.js` | Service | Category operations | Category hierarchy and management |
| `server/services/banner.service.js` | Service | Banner display logic | Promotional banner display rules |
| `server/services/promotion.service.js` | Service | Promotion engine | Deal calculation and management |
| `server/services/review.service.js` | Service | Review processing | Rating aggregation, review moderation |
| `server/services/favorite.service.js` | Service | Wishlist logic | Add/remove favorites business logic |
| `server/services/chat.service.js` | Service | Chat operations | Message threading, user pairing |
| `server/services/seller-analytics.service.js` | Service | Seller metrics | Seller dashboard calculations |
| `server/services/traffic-analytics.service.js` | Service | Traffic analysis | Visitor and pageview analytics |
| `server/services/revenue.service.js` | Service | Revenue calculations | Marketplace commission/revenue tracking |
| `server/services/report.service.js` | Service | Report processing | Report handling and management |

---

## Marketplace Routes

| File | Type | Purpose | Why Project-Specific |
|------|------|---------|----------------------|
| `server/routes/product.routes.js` | Routes | Product endpoints | GET /products, POST /products, etc. |
| `server/routes/category.routes.js` | Routes | Category endpoints | GET /categories, etc. |
| `server/routes/banner.routes.js` | Routes | Banner endpoints | Promotional banner APIs |
| `server/routes/promotions.routes.js` | Routes | Promotion endpoints | Deal endpoints |
| `server/routes/review.routes.js` | Routes | Review endpoints | Review submission APIs |
| `server/routes/favorite.routes.js` | Routes | Favorite endpoints | Wishlist APIs |
| `server/routes/chat.routes.js` | Routes | Chat endpoints | Messaging APIs |
| `server/routes/seller-analytics.routes.js` | Routes | Seller analytics endpoints | Seller dashboard APIs |
| `server/routes/traffic-analytics.routes.js` | Routes | Traffic analytics endpoints | Analytics APIs |
| `server/routes/report.routes.js` | Routes | Report endpoints | Report filing APIs |

---

## Configuration (Marketplace-Specific)

| File | Type | Purpose | Why Project-Specific |
|------|------|---------|----------------------|
| `server/config/categories.js` | Config | Marketplace categories | Hardcoded marketplace categories (Electronics, Furniture, etc.) |
| `server/config/provinces.js` | Config | Cambodian provinces | Geographic data for marketplace locations |

---

## Frontend Pages (Marketplace UI)

| File | Type | Purpose | Why Project-Specific |
|------|------|---------|----------------------|
| `client/src/pages/ProductDetailPage.tsx` | Page | Product detail view | Marketplace product display |
| `client/src/pages/ProductListPage.tsx` | Page | Product listing | Marketplace product catalog |
| `client/src/pages/PostProductPage.tsx` | Page | Create/edit product | Seller listing creation |
| `client/src/pages/SellerPromotionsPage.tsx` | Page | Seller promotions | Seller promotion management |
| `client/src/pages/SellerAnalyticsPage.tsx` | Page | Seller dashboard | Seller metrics and insights |
| `client/src/pages/FavoritesPage.tsx` | Page | Wishlist | User saved products |
| `client/src/pages/HomePage.tsx` | Page | Marketplace homepage | Product showcase and featured items |
| `client/src/pages/NotificationsPage.tsx` | Page | User notifications | Notification inbox (marketplace-specific content) |

---

## Frontend Components (Marketplace UI)

| File | Type | Purpose | Why Project-Specific |
|------|------|---------|----------------------|
| `client/src/components/marketplace/ProductCard.tsx` | Component | Product card display | Marketplace product preview |
| `client/src/components/marketplace/CategoriesGrid.tsx` | Component | Category grid | Marketplace category navigation |
| `client/src/components/marketplace/FeaturedSection.tsx` | Component | Featured products | Highlighted marketplace listings |
| `client/src/components/marketplace/SellerContactCard.tsx` | Component | Seller contact info | Seller information display |
| `client/src/components/marketplace/SearchBar.tsx` | Component | Search interface | Marketplace search functionality |
| `client/src/components/marketplace/TopAdBanner.tsx` | Component | Top advertisement | Featured ad banner |

---

## Frontend API Services (Marketplace Endpoints)

| File | Type | Purpose | Why Project-Specific |
|------|------|---------|----------------------|
| `client/src/services/product.api.ts` | Service | Product API calls | Fetch products, create listings |
| `client/src/services/category.api.ts` | Service | Category API calls | Fetch categories |
| `client/src/services/banner.api.ts` | Service | Banner API calls | Fetch promotional banners |
| `client/src/services/promotion.api.ts` | Service | Promotion API calls | Fetch deals and promotions |
| `client/src/services/review.api.ts` | Service | Review API calls | Submit and fetch reviews |
| `client/src/services/favorites.api.ts` | Service | Favorites API calls | Manage wishlist |
| `client/src/services/chat.api.ts` | Service | Chat API calls | Messaging endpoints |
| `client/src/services/seller-analytics.api.ts` | Service | Seller analytics API | Fetch seller metrics |
| `client/src/services/traffic-analytics.api.ts` | Service | Traffic analytics API | Fetch traffic data |

---

## Testing (Marketplace-Specific Tests)

| File | Type | Purpose | Why Project-Specific |
|------|------|---------|----------------------|
| `client/src/__tests__/ProductDetailPage.test.tsx` | Test | Product detail tests | UI tests for product page |
| `client/src/__tests__/ProductListPage.test.tsx` | Test | Product listing tests | UI tests for product list |
| `client/src/__tests__/ProductCard.test.tsx` | Test | Product card tests | Component tests |
| `client/src/__tests__/product.api.test.ts` | Test | Product API tests | Product endpoint tests |
| `client/src/__tests__/review.api.test.ts` | Test | Review API tests | Review endpoint tests |
| `client/src/__tests__/favorites.api.test.ts` | Test | Favorites API tests | Wishlist endpoint tests |
| `client/src/__tests__/chat.api.test.tsx` | Test | Chat API tests | Messaging tests |
| `client/src/__tests__/promotion.api.test.ts` | Test | Promotion tests | Promotion endpoint tests |
| `server/__tests__/chat.model.test.js` | Test | Chat model tests | Chat data model tests |
| `server/__tests__/chat.service.test.js` | Test | Chat service tests | Chat logic tests |
| `client/src/__tests__/CategoriesGrid.test.tsx` | Test | Categories component test | Component test |
| `client/src/__tests__/SellerContactCard.test.tsx` | Test | Seller card test | Component test |
| `client/src/__tests__/SearchBar.test.tsx` | Test | Search bar test | Component test |
| `client/src/__tests__/FeaturedSection.test.tsx` | Test | Featured section test | Component test |

---

## Utilities (Marketplace-Specific)

| File | Type | Purpose | Why Project-Specific |
|------|------|---------|----------------------|
| `client/src/utils/product.ts` | Utility | Product-related helpers | Product filtering, sorting, display logic |
| `client/src/utils/category.ts` | Utility | Category helpers | Category organization and filtering |
| `server/utils/phone.js` | Utility | Phone number validation | Specific to marketplace seller/buyer communication |
| `server/scripts/normalize-phone-numbers.js` | Script | Phone data migration | Marketplace user phone normalization |

---

## Server Application Setup

| File | Type | Purpose | Why Project-Specific |
|------|------|---------|----------------------|
| `server/app.js` | App | Express app initialization | Marketplace-specific middleware order and setup |
| `server/server.js` | App | Server startup | Marketplace server configuration |

---

## Routing

| File | Type | Purpose | Why Project-Specific |
|------|------|---------|----------------------|
| `server/routes/index.js` | Routes | Route aggregation | All marketplace routes combined |
| `server/routes/admin.routes.js` | Routes | Admin endpoints | Marketplace admin functions |
| `server/routes/user.routes.js` | Routes | User endpoints | User management for marketplace |
| `server/routes/notification.routes.js` | Routes | Notification endpoints | Marketplace notification APIs |
| `server/routes/location.routes.js` | Routes | Location endpoints | Marketplace location services |
| `server/routes/sitemap.routes.js` | Routes | Sitemap endpoint | Marketplace sitemap generation |
| `server/routes/verification.routes.js` | Routes | Seller verification | Marketplace seller verification flow |

---

## Client Application & Pages

| File | Type | Purpose | Why Project-Specific |
|------|------|---------|----------------------|
| `client/src/App.tsx` | App | Main app component | Marketplace routing and layout |
| `client/src/main.tsx` | App | Entry point | Marketplace app initialization |
| `client/src/index.css` | Style | Global styles | Marketplace color scheme and styling |
| `client/src/pages/DashboardPage.tsx` | Page | User dashboard | Marketplace user area |
| `client/src/pages/AccountSettingsPage.tsx` | Page | Account settings | Marketplace account management |
| `client/src/pages/GuidePage.tsx` | Page | Usage guide | Marketplace user guide |
| `client/src/pages/HelpPage.tsx` | Page | Help/FAQ | Marketplace support page |
| `client/src/pages/AboutPage.tsx` | Page | About page | Marketplace information |
| `client/src/pages/ChatPage.tsx` | Page | Chat interface | Marketplace messaging UI |

---

## Admin/Analytics Pages

| File | Type | Purpose | Why Project-Specific |
|------|------|---------|----------------------|
| `client/src/pages/AdminDashboardPage.tsx` | Page | Admin dashboard | Marketplace admin overview |
| `client/src/pages/AdminBannersPage.tsx` | Page | Banner management | Promotional banner admin |
| `client/src/pages/AdminPromotionsPage.tsx` | Page | Promotion admin | Deal management admin UI |
| `client/src/pages/AdminVerificationReviewPage.tsx` | Page | Seller verification | Marketplace seller verification admin |
| `client/src/pages/AdminRevenuePage.tsx` | Page | Revenue analytics | Marketplace revenue tracking |
| `client/src/pages/AdminTrafficAnalyticsPage.tsx` | Page | Traffic analytics admin | Visitor analytics admin |

---

## Data/Migration Scripts

| File | Type | Purpose | Why Project-Specific |
|------|------|---------|----------------------|
| `server/scripts/generate-slugs.js` | Script | Product slug generation | Marketplace product slug creation |
| `server/scripts/backfill-product-sellers.js` | Script | Data migration | Marketplace product data migration |
| `server/scripts/make-admin.js` | Script | Admin setup | Marketplace admin user creation |
| `server/scripts/fix-email-index.js` | Script | Data repair | Marketplace email index fix |
| `server/scripts/repair-product-text-index.js` | Script | Index repair | Marketplace text index repair |
| `scripts/migrate-notifications-to-slugs.js` | Script | Notification migration | Marketplace notification migration |
| `server/scripts/start-with-memory.js` | Script | Server startup utility | Marketplace server startup |
| `server/scripts/tmp-list-slugs.js` | Script | Slug list utility | Marketplace slug debugging |
| `server/scripts/tmp-test-sitemap.js` | Script | Sitemap test | Marketplace sitemap testing |

---

## Environment/Deployment Files

| File | Type | Purpose | Why Project-Specific |
|------|------|---------|----------------------|
| `vercel.json` (client) | Config | Vercel client config | Marketplace client deployment |
| `deploy_info.json` | Config | Deployment metadata | Marketplace deployment tracking |
| `deploy_info_id.json` | Config | Deployment ID tracking | Marketplace deployment IDs |
| `deploy_debug.txt` | Log | Deployment debug info | Marketplace deployment logs |

---

## Summary

### Total Project-Specific Files: ~120

### Categories:
1. **Models** (12) - Marketplace data schemas
2. **Controllers** (10) - Marketplace endpoint handlers
3. **Services** (11) - Marketplace business logic
4. **Routes** (10) - Marketplace API endpoints
5. **Frontend Pages** (8) - Marketplace user interface
6. **Frontend Components** (6) - Marketplace UI components
7. **Frontend API Services** (9) - Marketplace API clients
8. **Tests** (14+) - Marketplace-specific tests
9. **Utilities & Config** (4) - Marketplace helpers
10. **Scripts & Migration** (15) - Marketplace data operations
11. **App Setup** (2) - Marketplace application files
12. **Admin/Analytics** (6) - Marketplace admin functions

### Why Complete Replacement Needed

**Domain-Specific Logic:**
- Marketplace product/seller relationships → School students/teachers/subjects
- Buyer-seller chat → Student-teacher messaging
- Product reviews → Assignment/course feedback
- Favorites/wishlist → Course enrollment
- Seller analytics → Teacher/class analytics
- Promotional banners → Announcements/notices
- Search functionality → Curriculum search

**Data Model Changes:**
- Product → Course/Class/Assignment
- Category → Subject/Department
- Seller → Teacher
- Buyer → Student
- Review → Grade/Feedback
- Chat → Messages (same purpose, different context)

**UI/UX Differences:**
- Marketplace catalog → Course catalog
- Product listing page → Enrollment page
- Seller dashboard → Teacher dashboard
- Buyer notifications → Student notifications
