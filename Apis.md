# VertexPortal LMS — API Documentation

> **Base URL:** `http://localhost:<PORT>/api`
> **Authentication:** Cookie-based JWT (`token` cookie set on login)

---

## Table of Contents

1. [Auth APIs](#1-auth-apis)
2. [User APIs](#2-user-apis)
3. [Category APIs](#3-category-apis)
4. [Course APIs](#4-course-apis)
5. [Module APIs](#5-module-apis)
6. [Lecture APIs](#6-lecture-apis)
7. [Enrollment APIs](#7-enrollment-apis)
8. [Lecture Progress APIs](#8-lecture-progress-apis)
9. [Review APIs](#9-review-apis)
10. [Wishlist APIs](#10-wishlist-apis)
11. [Cart APIs](#11-cart-apis)
12. [Coupon APIs (Student-facing)](#12-coupon-apis-student-facing)
13. [Checkout APIs](#13-checkout-apis)
14. [Order APIs](#14-order-apis)
15. [Student APIs](#15-student-apis)
16. [Certificate APIs (Student)](#16-certificate-apis-student)
17. [Notification APIs](#17-notification-apis)
18. [Student Quiz APIs](#18-student-quiz-apis)
19. [Student Assignment APIs](#19-student-assignment-apis)
20. [Student Announcement APIs](#20-student-announcement-apis)
21. [Student Live Class APIs](#21-student-live-class-apis)
22. [Instructor Quiz APIs](#22-instructor-quiz-apis)
23. [Instructor Assignment APIs](#23-instructor-assignment-apis)
24. [Instructor Announcement APIs](#24-instructor-announcement-apis)
25. [Instructor Live Class APIs](#25-instructor-live-class-apis)
26. [Admin — General APIs](#26-admin--general-apis)
27. [Admin — Coupon APIs](#27-admin--coupon-apis)
28. [Admin — Analytics APIs](#28-admin--analytics-apis)
29. [Admin — Audit Log APIs](#29-admin--audit-log-apis)
30. [Admin — Certificate APIs](#30-admin--certificate-apis)
31. [Admin — Live Class APIs](#31-admin--live-class-apis)
32. [Discussion APIs](#32-discussion-apis)
33. [Discussion Report APIs](#33-discussion-report-apis)
34. [Admin — Discussion Report APIs](#34-admin--discussion-report-apis)
35. [Student Notes APIs](#35-student-notes-apis)
36. [Instructor Dashboard APIs](#36-instructor-dashboard-apis)
37. [Admin Dashboard APIs](#37-admin-dashboard-apis)
38. [Admin — Users APIs](#38-admin--users-apis)
39. [Admin — Orders APIs](#39-admin--orders-apis)
40. [Admin — Courses APIs](#40-admin--courses-apis)
41. [AI Assistant APIs](#41-ai-assistant-apis)
42. [RAG — Knowledge Search APIs](#42-rag--knowledge-search-apis)
43. [RAG — Indexing APIs](#43-rag--indexing-apis)

---

## 1. Auth APIs

> Base: `/api/auth`

---

### POST `/api/auth/register`

**Access:** Public

**Request Body:**
```json
{
  "fullName": "string (required)",
  "email": "string (required)",
  "password": "string (required)",
  "role": "student | instructor | admin (optional, default: student)"
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "data": {
    "user": {
      "id": "string",
      "fullName": "string",
      "email": "string",
      "role": "string",
      "avatarUrl": "string | null",
      "status": "string",
      "isActive": true,
      "isEmailVerified": false,
      "createdAt": "ISO date"
    }
  }
}
```

---

### POST `/api/auth/login`

**Access:** Public

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response `200`:** Sets `token` cookie.
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "string",
      "fullName": "string",
      "email": "string",
      "role": "string",
      "status": "string",
      "isEmailVerified": true,
      "isActive": true,
      "lastLoginAt": "ISO date",
      "createdAt": "ISO date",
      "updatedAt": "ISO date",
      "avatarUrl": "string | null"
    }
  }
}
```

---

### GET `/api/auth/me`

**Access:** Private (any authenticated user)

**Request:** No body required.

**Response `200`:**
```json
{
  "success": true,
  "message": "User fetched successfully",
  "data": {
    "user": {
      "id": "string",
      "fullName": "string",
      "email": "string",
      "role": "string",
      "status": "string",
      "avatarUrl": "string | null",
      "isEmailVerified": true,
      "isActive": true,
      "lastLoginAt": "ISO date",
      "createdAt": "ISO date",
      "updatedAt": "ISO date"
    }
  }
}
```

---

### POST `/api/auth/logout`

**Access:** Private

**Request:** No body required.

**Response `200`:** Clears `token` cookie.
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### GET `/api/auth/verify-email/:userId/:token`

**Access:** Public (link sent via email)

**URL Params:** `userId`, `token`

**Response `200`:**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "user": {
      "id": "string",
      "fullName": "string",
      "email": "string",
      "isEmailVerified": true
    }
  }
}
```

---

## 2. User APIs

> Base: `/api/users`

---

### PATCH `/api/users/me`

**Access:** Private

**Request Body:**
```json
{
  "fullName": "string (required)"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": { "...full user object (no password)..." }
}
```

---

### PATCH `/api/users/me/password`

**Access:** Private

**Request Body:**
```json
{
  "oldPassword": "string (required)",
  "newPassword": "string (required, min 8 chars)",
  "confirmPassword": "string (required)"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

---

### PATCH `/api/users/me/avatar`

**Access:** Private

**Request:** `multipart/form-data` — field name: `avatar` (image file)

**Response `200`:**
```json
{
  "success": true,
  "message": "Profile image updated successfully",
  "avatar": {
    "url": "string",
    "fileId": "string"
  }
}
```

---

## 3. Category APIs

> Base: `/api/categories`

---

### POST `/api/categories`

**Access:** Admin

**Request Body:**
```json
{
  "name": "string (required)",
  "description": "string (optional)",
  "icon": "string (optional)"
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Category created successfully",
  "data": { "category": { "...category object..." } }
}
```

---

### GET `/api/categories`

**Access:** Public

**Query Params (optional):** `search`, `page`, `limit`

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "categories": [ { "...category objects..." } ]
  }
}
```

---

### GET `/api/categories/:slug`

**Access:** Public

**URL Params:** `slug`

**Response `200`:**
```json
{
  "success": true,
  "data": { "category": { "...category object..." } }
}
```

---

### PATCH `/api/categories/:categoryId`

**Access:** Admin

**URL Params:** `categoryId`

**Request Body:**
```json
{
  "name": "string (optional)",
  "description": "string (optional)",
  "icon": "string (optional)"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Category updated successfully",
  "data": { "category": { "...category object..." } }
}
```

---

### DELETE `/api/categories/:categoryId`

**Access:** Admin

**URL Params:** `categoryId`

**Response `200`:**
```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

---

## 4. Course APIs

> Base: `/api/courses`

---

### GET `/api/courses`

**Access:** Public

**Query Params (optional):** `page`, `limit`, `search`, `category`, `level`, `sort`

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "courses": [ { "...course objects..." } ],
    "total": 0,
    "page": 1,
    "pages": 1
  }
}
```

---

### POST `/api/courses`

**Access:** Admin, Instructor

**Request Body:**
```json
{
  "title": "string (required)",
  "description": "string (optional)",
  "category": "categoryId (required)",
  "level": "beginner | intermediate | advanced",
  "price": "number",
  "language": "string",
  "tags": ["string"]
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Course created successfully",
  "data": { "course": { "...course object..." } }
}
```

---

### GET `/api/courses/:slug`

**Access:** Public

**URL Params:** `slug`

**Response `200`:**
```json
{
  "success": true,
  "data": { "course": { "...full course object with reviews, modules..." } }
}
```

---

### PATCH `/api/courses/:courseId`

**Access:** Admin, Instructor

**URL Params:** `courseId`

**Request Body:** Any updatable course fields (title, description, price, level, etc.)

**Response `200`:**
```json
{
  "success": true,
  "message": "Course updated successfully",
  "data": { "course": { "...updated course object..." } }
}
```

---

### PATCH `/api/courses/:courseId/publish`

**Access:** Admin, Instructor

**URL Params:** `courseId`

**Request:** No body required.

**Response `200`:**
```json
{
  "success": true,
  "message": "Course published successfully",
  "data": { "course": { "...course object..." } }
}
```

---

### PATCH `/api/courses/:courseId/thumbnail`

**Access:** Admin, Instructor

**URL Params:** `courseId`

**Request:** `multipart/form-data` — field name: `thumbnail` (image file)

**Response `200`:**
```json
{
  "success": true,
  "message": "Course thumbnail updated successfully",
  "data": { "course": { "...course object..." } }
}
```

---

### DELETE `/api/courses/:courseId`

**Access:** Admin, Instructor (owner)

**URL Params:** `courseId`

**Response `200`:**
```json
{
  "success": true,
  "message": "Course archived successfully"
}
```

---

## 5. Module APIs

> Base: `/api/modules`

---

### POST `/api/modules/:courseId/modules`

**Access:** Admin, Instructor

**URL Params:** `courseId`

**Request Body:**
```json
{
  "title": "string (required)",
  "description": "string (optional)"
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Module created successfully",
  "data": { "module": { "...module object..." } }
}
```

---

### GET `/api/modules/:courseId/modules`

**Access:** Public / Enrolled students (locked content differs)

**URL Params:** `courseId`

**Response `200`:**
```json
{
  "success": true,
  "data": { "modules": [ { "...module objects..." } ] }
}
```

---

### GET `/api/modules/:courseId/modules/manage`

**Access:** Admin, Instructor

**URL Params:** `courseId`

**Response `200`:**
```json
{
  "success": true,
  "data": { "modules": [ { "...all modules including unpublished..." } ] }
}
```

---

### PATCH `/api/modules/updatemodule/:moduleId`

**Access:** Admin, Instructor

**URL Params:** `moduleId`

**Request Body:**
```json
{
  "title": "string (optional)",
  "description": "string (optional)"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Module updated successfully",
  "data": { "module": { "...updated module object..." } }
}
```

---

### PATCH `/api/modules/:moduleId/publish`

**Access:** Admin, Instructor

**URL Params:** `moduleId`

**Request:** No body required.

**Response `200`:**
```json
{
  "success": true,
  "message": "Module published successfully",
  "data": { "module": { "...module object..." } }
}
```

---

### PATCH `/api/modules/:moduleId/reorder`

**Access:** Admin, Instructor

**URL Params:** `moduleId`

**Request Body:**
```json
{
  "newOrder": "number (required)"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Module reordered successfully"
}
```

---

### DELETE `/api/modules/deletemodule/:moduleId`

**Access:** Admin, Instructor

**URL Params:** `moduleId`

**Response `200`:**
```json
{
  "success": true,
  "message": "Module archived successfully"
}
```

---

## 6. Lecture APIs

> Base: `/api/lectures`

---

### POST `/api/lectures/:moduleId/create-lecture`

**Access:** Admin, Instructor

**URL Params:** `moduleId`

**Request Body:**
```json
{
  "title": "string (required)",
  "description": "string (optional)",
  "content": "string (optional)",
  "isPublished": "boolean (optional)"
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Lecture created successfully",
  "data": { "lecture": { "...lecture object..." } }
}
```

---

### GET `/api/lectures/:moduleId/lectures`

**Access:** Public / Enrolled students

**URL Params:** `moduleId`

**Response `200`:**
```json
{
  "success": true,
  "data": { "lectures": [ { "...lecture objects..." } ] }
}
```

---

### GET `/api/lectures/:moduleId/manage`

**Access:** Admin, Instructor

**URL Params:** `moduleId`

**Response `200`:**
```json
{
  "success": true,
  "data": { "lectures": [ { "...all lectures including unpublished..." } ] }
}
```

---

### PATCH `/api/lectures/:lectureId/update-lecture`

**Access:** Admin, Instructor

**URL Params:** `lectureId`

**Request Body:**
```json
{
  "title": "string (optional)",
  "description": "string (optional)",
  "content": "string (optional)",
  "isPublished": "boolean (optional)"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Lecture updated successfully",
  "data": { "lecture": { "...updated lecture object..." } }
}
```

---

### PATCH `/api/lectures/:lectureId/publish`

**Access:** Admin, Instructor

**URL Params:** `lectureId`

**Response `200`:**
```json
{
  "success": true,
  "message": "Lecture published successfully",
  "data": { "lecture": { "...lecture object..." } }
}
```

---

### PATCH `/api/lectures/:lectureId/upload-video`

**Access:** Admin, Instructor

**URL Params:** `lectureId`

**Request:** `multipart/form-data` — field name: `video` (video file)

**Response `200`:**
```json
{
  "success": true,
  "message": "Video uploaded successfully",
  "data": { "lecture": { "...lecture object with videoUrl..." } }
}
```

---

### PATCH `/api/lectures/:lectureId/upload-document`

**Access:** Admin, Instructor

**URL Params:** `lectureId`

**Request:** `multipart/form-data` — field name: `document` (file)

**Response `200`:**
```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "data": { "lecture": { "...lecture object with documentUrl..." } }
}
```

---

### PATCH `/api/lectures/:lectureId/update-media-url`

**Access:** Admin, Instructor

**URL Params:** `lectureId`

**Request Body:**
```json
{
  "mediaUrl": "string (CDN URL from ImageKit)",
  "fileId": "string (ImageKit fileId)"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Media URL updated successfully",
  "data": { "lecture": { "...lecture object..." } }
}
```

---

### PATCH `/api/lectures/:lectureId/reorder`

**Access:** Admin, Instructor

**URL Params:** `lectureId`

**Request Body:**
```json
{
  "newOrder": "number (required)"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Lecture reordered successfully"
}
```

---

### DELETE `/api/lectures/:lectureId`

**Access:** Admin, Instructor

**URL Params:** `lectureId`

**Response `200`:**
```json
{
  "success": true,
  "message": "Lecture archived successfully"
}
```

---

### GET `/api/lectures/media/:type/:filename`

**Access:** Public / Enrolled (optional auth)

**URL Params:** `type` (video | document), `filename`

**Response:** Streams the media file directly.

---

### GET `/api/lectures/upload-auth-token`

**Access:** Admin, Instructor

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "token": "string",
    "expire": "number",
    "signature": "string",
    "publicKey": "string"
  }
}
```

---

## 7. Enrollment APIs

> Base: `/api/enrollments`

---

### POST `/api/enrollments/:courseId`

**Access:** Student

**URL Params:** `courseId`

**Request:** No body required (free enrollment).

**Response `201`:**
```json
{
  "success": true,
  "message": "Enrolled successfully",
  "data": { "enrollment": { "...enrollment object..." } }
}
```

---

### GET `/api/enrollments/me`

**Access:** Student

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "enrollments": [ { "...enrollment objects with course details..." } ]
  }
}
```

---

### GET `/api/enrollments/:courseId`

**Access:** Student

**URL Params:** `courseId`

**Response `200`:**
```json
{
  "success": true,
  "data": { "enrollment": { "...enrollment object..." } }
}
```

---

## 8. Lecture Progress APIs

> Base: `/api`

---

### POST `/api/lectures/:lectureId/complete`

**Access:** Student

**URL Params:** `lectureId`

**Request:** No body required.

**Response `200`:**
```json
{
  "success": true,
  "message": "Lecture marked as completed",
  "data": { "lectureProgress": { "...progress object..." } }
}
```

---

### GET `/api/courses/:courseId/progress`

**Access:** Private (any authenticated user)

**URL Params:** `courseId`

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "courseProgress": {
      "completedLectures": ["lectureId"],
      "totalLectures": 10,
      "progressPercentage": 50
    }
  }
}
```

---

### PATCH `/api/lectures/:lectureId/watch-time`

**Access:** Student

**URL Params:** `lectureId`

**Request Body:**
```json
{
  "watchedDurationInSeconds": "number (required)"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Watch time updated",
  "data": { "lectureProgress": { "...progress object..." } }
}
```

---

### GET `/api/me/continue-learning`

**Access:** Private

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "continueLearning": [ { "...course with last watched lecture..." } ]
  }
}
```

---

## 9. Review APIs

> Base: `/api`

---

### POST `/api/courses/:courseId/reviews`

**Access:** Private (enrolled student)

**URL Params:** `courseId`

**Request Body:**
```json
{
  "rating": "number (1-5, required)",
  "comment": "string (optional)"
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Review created successfully",
  "data": { "review": { "...review object..." } }
}
```

---

### GET `/api/courses/:courseId/reviews`

**Access:** Public

**URL Params:** `courseId`

**Response `200`:**
```json
{
  "success": true,
  "data": { "reviews": [ { "...review objects..." } ] }
}
```

---

### GET `/api/courses/:courseId/my-review`

**Access:** Private

**URL Params:** `courseId`

**Response `200`:**
```json
{
  "success": true,
  "data": { "review": { "...user's own review..." } }
}
```

---

### PATCH `/api/reviews/:reviewId`

**Access:** Private (review owner)

**URL Params:** `reviewId`

**Request Body:**
```json
{
  "rating": "number (1-5, optional)",
  "comment": "string (optional)"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Review updated successfully",
  "data": { "review": { "...updated review object..." } }
}
```

---

### DELETE `/api/reviews/:reviewId`

**Access:** Private (review owner or admin)

**URL Params:** `reviewId`

**Response `200`:**
```json
{
  "success": true,
  "message": "Review deleted successfully"
}
```

---

## 10. Wishlist APIs

> Base: `/api`

---

### POST `/api/wishlist/:courseId`

**Access:** Private

**URL Params:** `courseId`

**Response `200`:**
```json
{
  "success": true,
  "message": "Course added to wishlist",
  "data": { "wishlist": ["courseId"] }
}
```

---

### DELETE `/api/wishlist/:courseId`

**Access:** Private

**URL Params:** `courseId`

**Response `200`:**
```json
{
  "success": true,
  "message": "Course removed from wishlist",
  "data": { "wishlist": ["courseId"] }
}
```

---

### GET `/api/wishlist`

**Access:** Private

**Response `200`:**
```json
{
  "success": true,
  "data": { "wishlist": [ { "...course objects..." } ] }
}
```

---

### GET `/api/wishlist/:courseId/status`

**Access:** Private

**URL Params:** `courseId`

**Response `200`:**
```json
{
  "success": true,
  "data": { "isInWishlist": true }
}
```

---

## 11. Cart APIs

> Base: `/api/cart`

---

### POST `/api/cart/:courseId`

**Access:** Private

**URL Params:** `courseId`

**Response `200`:**
```json
{
  "success": true,
  "message": "Course added to cart",
  "data": { "cart": { "...cart object..." } }
}
```

---

### GET `/api/cart/get-cart`

**Access:** Private

**Response `200`:**
```json
{
  "success": true,
  "data": { "cart": { "items": [ { "...course objects..." } ], "total": 0 } }
}
```

---

### DELETE `/api/cart/cart/:courseId`

**Access:** Private

**URL Params:** `courseId`

**Response `200`:**
```json
{
  "success": true,
  "message": "Course removed from cart",
  "data": { "cart": { "...cart object..." } }
}
```

---

### GET `/api/cart/cart/:courseId/status`

**Access:** Private

**URL Params:** `courseId`

**Response `200`:**
```json
{
  "success": true,
  "data": { "isInCart": true }
}
```

---

### DELETE `/api/cart/cart`

**Access:** Private

**Response `200`:**
```json
{
  "success": true,
  "message": "Cart cleared successfully"
}
```

---

## 12. Coupon APIs (Student-facing)

> Base: `/api`

---

### POST `/api/admin/coupons`

**Access:** Admin

**Request Body:**
```json
{
  "code": "string (required)",
  "discountType": "percentage | flat",
  "discountValue": "number (required)",
  "maxUses": "number",
  "expiresAt": "ISO date",
  "minOrderAmount": "number",
  "applicableCourses": ["courseId"]
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Coupon created successfully",
  "data": { "coupon": { "...coupon object..." } }
}
```

---

### GET `/api/admin/coupons`

**Access:** Admin

**Query Params (optional):** `page`, `limit`, `search`, `status`

**Response `200`:**
```json
{
  "success": true,
  "data": { "coupons": [ { "...coupon objects..." } ], "total": 0 }
}
```

---

### GET `/api/admin/coupons/:couponId`

**Access:** Admin

**URL Params:** `couponId`

**Response `200`:**
```json
{
  "success": true,
  "data": { "coupon": { "...coupon object..." } }
}
```

---

### PATCH `/api/admin/coupons/:couponId`

**Access:** Admin

**URL Params:** `couponId`

**Request Body:** Any updatable coupon fields.

**Response `200`:**
```json
{
  "success": true,
  "message": "Coupon updated successfully",
  "data": { "coupon": { "...updated coupon object..." } }
}
```

---

### PATCH `/api/admin/coupons/:couponId/status`

**Access:** Admin

**URL Params:** `couponId`

**Response `200`:**
```json
{
  "success": true,
  "message": "Coupon status toggled",
  "data": { "coupon": { "...coupon object..." } }
}
```

---

### DELETE `/api/admin/coupons/:couponId`

**Access:** Admin

**URL Params:** `couponId`

**Response `200`:**
```json
{
  "success": true,
  "message": "Coupon deleted successfully"
}
```

---

## 13. Checkout APIs

> Base: `/api`

---

### POST `/api/checkout/preview`

**Access:** Student

**Request Body:**
```json
{
  "courseIds": ["courseId"],
  "couponCode": "string (optional)"
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "items": [ { "courseId": "string", "title": "string", "price": 0 } ],
    "subtotal": 0,
    "discount": 0,
    "total": 0,
    "coupon": { "...coupon object if applied..." }
  }
}
```

---

## 14. Order APIs

> Base: `/api/orders`

---

### POST `/api/orders/create`

**Access:** Student

**Request Body:**
```json
{
  "courseIds": ["courseId"],
  "couponCode": "string (optional)"
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "orderId": "string (Razorpay order ID)",
    "amount": 0,
    "currency": "INR",
    "key": "string (Razorpay public key)"
  }
}
```

---

### POST `/api/orders/verify`

**Access:** Student

**Request Body:**
```json
{
  "razorpay_order_id": "string (required)",
  "razorpay_payment_id": "string (required)",
  "razorpay_signature": "string (required)"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Payment verified and order confirmed",
  "data": { "order": { "...order object..." } }
}
```

---

## 15. Student APIs

> Base: `/api/student`

---

### GET `/api/student/my-courses`

**Access:** Student

**Response `200`:**
```json
{
  "success": true,
  "message": "Courses fetched successfully",
  "count": 3,
  "data": { "courses": [ { "...enrolled course objects..." } ] }
}
```

---

### GET `/api/student/continue-learning`

**Access:** Student

**Response `200`:**
```json
{
  "success": true,
  "count": 2,
  "data": { "courses": [ { "...course with progress info..." } ] }
}
```

---

### GET `/api/student/course/:courseId/resume`

**Access:** Student

**URL Params:** `courseId`

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "resume": {
      "lastWatchedLecture": { "...lecture object..." },
      "progressPercentage": 50
    }
  }
}
```

---

### GET `/api/student/course/:courseId/player`

**Access:** Student

**URL Params:** `courseId`

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "course": { "...course details..." },
    "modules": [ { "...modules with lectures..." } ],
    "progress": { "...progress object..." }
  }
}
```

---

## 16. Certificate APIs (Student)

> Base: `/api/certificates`

---

### GET `/api/certificates/verify/:verificationCode`

**Access:** Public

**URL Params:** `verificationCode`

**Response `200`:**
```json
{
  "success": true,
  "data": { "certificate": { "...certificate object with student and course info..." } }
}
```

---

### GET `/api/certificates/me`

**Access:** Student

**Response `200`:**
```json
{
  "success": true,
  "data": { "certificates": [ { "...certificate objects..." } ] }
}
```

---

### GET `/api/certificates/me/:certificateId`

**Access:** Student

**URL Params:** `certificateId`

**Response `200`:**
```json
{
  "success": true,
  "data": { "certificate": { "...certificate object..." } }
}
```

---

### GET `/api/certificates/me/:certificateId/download`

**Access:** Student

**URL Params:** `certificateId`

**Response:** PDF file stream (`application/pdf`).

---

## 17. Notification APIs

> Base: `/api/notifications`

---

### GET `/api/notifications`

**Access:** Private

**Query Params (optional):** `page`, `limit`, `status` (read | unread | archived)

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "notifications": [ { "...notification objects..." } ],
    "unreadCount": 5
  }
}
```

---

### GET `/api/notifications/preferences`

**Access:** Private

**Response `200`:**
```json
{
  "success": true,
  "data": { "preferences": { "email": true, "push": true } }
}
```

---

### PATCH `/api/notifications/preferences`

**Access:** Private

**Request Body:**
```json
{
  "email": "boolean",
  "push": "boolean"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Preferences updated",
  "data": { "preferences": { "...updated preferences..." } }
}
```

---

### PATCH `/api/notifications/read-all`

**Access:** Private

**Response `200`:**
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

---

### PATCH `/api/notifications/:notificationId/read`

**Access:** Private

**URL Params:** `notificationId`

**Response `200`:**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

---

### PATCH `/api/notifications/:notificationId/archive`

**Access:** Private

**URL Params:** `notificationId`

**Response `200`:**
```json
{
  "success": true,
  "message": "Notification archived"
}
```

---

### PATCH `/api/notifications/:notificationId/restore`

**Access:** Private

**URL Params:** `notificationId`

**Response `200`:**
```json
{
  "success": true,
  "message": "Notification restored"
}
```

---

### DELETE `/api/notifications/:notificationId`

**Access:** Private

**URL Params:** `notificationId`

**Response `200`:**
```json
{
  "success": true,
  "message": "Notification deleted"
}
```

---

## 18. Student Quiz APIs

> Base: `/api/student/quizzes`

---

### GET `/api/student/quizzes`

**Access:** Student

**Response `200`:**
```json
{
  "success": true,
  "data": { "quizzes": [ { "...quiz objects..." } ] }
}
```

---

### GET `/api/student/quizzes/:quizId`

**Access:** Student

**URL Params:** `quizId`

**Response `200`:**
```json
{
  "success": true,
  "data": { "quiz": { "...quiz with questions (no correct answers exposed)..." } }
}
```

---

### POST `/api/student/quizzes/:quizId/attempts/start`

**Access:** Student

**URL Params:** `quizId`

**Response `201`:**
```json
{
  "success": true,
  "data": { "attempt": { "attemptId": "string", "startedAt": "ISO date", "timeLimit": 30 } }
}
```

---

### PUT `/api/student/quizzes/:quizId/attempts/:attemptId/answers/:questionId`

**Access:** Student

**URL Params:** `quizId`, `attemptId`, `questionId`

**Request Body:**
```json
{
  "selectedOption": "string | number",
  "textAnswer": "string (for text questions)"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Answer saved"
}
```

---

### POST `/api/student/quizzes/:quizId/attempts/:attemptId/submit`

**Access:** Student

**URL Params:** `quizId`, `attemptId`

**Response `200`:**
```json
{
  "success": true,
  "message": "Quiz submitted",
  "data": { "result": { "score": 8, "total": 10, "passed": true } }
}
```

---

### GET `/api/student/quizzes/:quizId/attempts`

**Access:** Student

**URL Params:** `quizId`

**Response `200`:**
```json
{
  "success": true,
  "data": { "attempts": [ { "...attempt objects..." } ] }
}
```

---

### GET `/api/student/quizzes/:quizId/attempts/:attemptId`

**Access:** Student

**URL Params:** `quizId`, `attemptId`

**Response `200`:**
```json
{
  "success": true,
  "data": { "attempt": { "...attempt details with answers..." } }
}
```

---

### GET `/api/student/quizzes/:quizId/attempts/:attemptId/result`

**Access:** Student

**URL Params:** `quizId`, `attemptId`

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "result": {
      "score": 8,
      "total": 10,
      "percentage": 80,
      "passed": true,
      "answers": [ { "...answer details with correctness..." } ]
    }
  }
}
```

---

## 19. Student Assignment APIs

> Base: `/api/student/assignments`

---

### GET `/api/student/assignments`

**Access:** Student

**Response `200`:**
```json
{
  "success": true,
  "data": { "assignments": [ { "...assignment objects..." } ] }
}
```

---

### GET `/api/student/assignments/:assignmentId`

**Access:** Student

**URL Params:** `assignmentId`

**Response `200`:**
```json
{
  "success": true,
  "data": { "assignment": { "...assignment details..." } }
}
```

---

### POST `/api/student/assignments/:assignmentId/submissions`

**Access:** Student

**URL Params:** `assignmentId`

**Request:** `multipart/form-data` — field name: `files` (up to 5 files) + optional:
```json
{
  "notes": "string (optional)"
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Assignment submitted successfully",
  "data": { "submission": { "...submission object..." } }
}
```

---

### GET `/api/student/assignments/:assignmentId/submissions`

**Access:** Student

**URL Params:** `assignmentId`

**Response `200`:**
```json
{
  "success": true,
  "data": { "submissions": [ { "...submission objects..." } ] }
}
```

---

### GET `/api/student/assignments/:assignmentId/submissions/:submissionId`

**Access:** Student

**URL Params:** `assignmentId`, `submissionId`

**Response `200`:**
```json
{
  "success": true,
  "data": { "submission": { "...submission details with grade..." } }
}
```

---

## 20. Student Announcement APIs

> Base: `/api/student/announcements`

---

### GET `/api/student/announcements`

**Access:** Student

**Response `200`:**
```json
{
  "success": true,
  "data": { "announcements": [ { "...announcement objects..." } ] }
}
```

---

### GET `/api/student/announcements/:announcementId`

**Access:** Student

**URL Params:** `announcementId`

**Response `200`:**
```json
{
  "success": true,
  "data": { "announcement": { "...announcement details..." } }
}
```

---

### PATCH `/api/student/announcements/read-all`

**Access:** Student

**Response `200`:**
```json
{
  "success": true,
  "message": "All announcements marked as read"
}
```

---

### PATCH `/api/student/announcements/:announcementId/read`

**Access:** Student

**URL Params:** `announcementId`

**Response `200`:**
```json
{
  "success": true,
  "message": "Announcement marked as read"
}
```

---

## 21. Student Live Class APIs

> Base: `/api/student/live-classes`

---

### GET `/api/student/live-classes`

**Access:** Student

**Response `200`:**
```json
{
  "success": true,
  "data": { "liveClasses": [ { "...live class objects..." } ] }
}
```

---

### GET `/api/student/live-classes/:liveClassId`

**Access:** Student

**URL Params:** `liveClassId`

**Response `200`:**
```json
{
  "success": true,
  "data": { "liveClass": { "...live class details..." } }
}
```

---

### POST `/api/student/live-classes/:liveClassId/join`

**Access:** Student

**URL Params:** `liveClassId`

**Response `200`:**
```json
{
  "success": true,
  "data": { "joinUrl": "string", "token": "string" }
}
```

---

### POST `/api/student/live-classes/:liveClassId/leave`

**Access:** Student

**URL Params:** `liveClassId`

**Request:** No body required.

**Response `200`:**
```json
{
  "success": true,
  "message": "Left live class successfully"
}
```

---

### GET `/api/student/live-classes/:liveClassId/resources`

**Access:** Student

**URL Params:** `liveClassId`

**Response `200`:**
```json
{
  "success": true,
  "data": { "resources": [ { "title": "string", "url": "string", "type": "string" } ] }
}
```

---

### GET `/api/student/live-classes/attendance/history`

**Access:** Student

**Response `200`:**
```json
{
  "success": true,
  "data": { "history": [ { "liveClassId": "string", "joinedAt": "ISO date", "leftAt": "ISO date" } ] }
}
```

---

## 22. Instructor Quiz APIs

> Base: `/api/instructor/quizzes`

---

### POST `/api/instructor/quizzes`

**Access:** Instructor, Admin

**Request Body:**
```json
{
  "title": "string (required)",
  "courseId": "string (required)",
  "moduleId": "string (optional)",
  "description": "string (optional)",
  "timeLimit": "number (minutes)",
  "passingScore": "number",
  "maxAttempts": "number"
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": { "quiz": { "...quiz object..." } }
}
```

---

### GET `/api/instructor/quizzes`

**Access:** Instructor, Admin

**Response `200`:**
```json
{
  "success": true,
  "data": { "quizzes": [ { "...quiz objects..." } ] }
}
```

---

### GET `/api/instructor/quizzes/:quizId`

**Access:** Instructor, Admin

**URL Params:** `quizId`

**Response `200`:**
```json
{
  "success": true,
  "data": { "quiz": { "...quiz with all questions and answers..." } }
}
```

---

### PATCH `/api/instructor/quizzes/:quizId`

**Access:** Instructor, Admin

**URL Params:** `quizId`

**Request Body:** Any updatable quiz fields.

**Response `200`:**
```json
{
  "success": true,
  "data": { "quiz": { "...updated quiz..." } }
}
```

---

### PATCH `/api/instructor/quizzes/:quizId/status`

**Access:** Instructor, Admin

**URL Params:** `quizId`

**Request Body:**
```json
{
  "status": "draft | published | archived"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Quiz status updated"
}
```

---

### DELETE `/api/instructor/quizzes/:quizId`

**Access:** Instructor, Admin

**URL Params:** `quizId`

**Response `200`:**
```json
{
  "success": true,
  "message": "Quiz deleted"
}
```

---

### PATCH `/api/instructor/quizzes/:quizId/restore`

**Access:** Instructor, Admin

**URL Params:** `quizId`

**Response `200`:**
```json
{
  "success": true,
  "message": "Quiz restored"
}
```

---

### POST `/api/instructor/quizzes/:quizId/questions`

**Access:** Instructor, Admin

**URL Params:** `quizId`

**Request Body:**
```json
{
  "questionText": "string (required)",
  "questionType": "mcq | true-false | short-answer",
  "options": [ { "text": "string", "isCorrect": true } ],
  "marks": "number",
  "explanation": "string (optional)"
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": { "question": { "...question object..." } }
}
```

---

### PATCH `/api/instructor/quizzes/:quizId/questions/:questionId`

**Access:** Instructor, Admin

**URL Params:** `quizId`, `questionId`

**Request Body:** Any updatable question fields.

**Response `200`:**
```json
{
  "success": true,
  "data": { "question": { "...updated question..." } }
}
```

---

### DELETE `/api/instructor/quizzes/:quizId/questions/:questionId`

**Access:** Instructor, Admin

**URL Params:** `quizId`, `questionId`

**Response `200`:**
```json
{
  "success": true,
  "message": "Question deleted"
}
```

---

### PATCH `/api/instructor/quizzes/:quizId/questions/:questionId/restore`

**Access:** Instructor, Admin

**URL Params:** `quizId`, `questionId`

**Response `200`:**
```json
{
  "success": true,
  "message": "Question restored"
}
```

---

### GET `/api/instructor/quizzes/:quizId/attempts`

**Access:** Instructor, Admin

**URL Params:** `quizId`

**Response `200`:**
```json
{
  "success": true,
  "data": { "attempts": [ { "...student attempt objects..." } ] }
}
```

---

### GET `/api/instructor/quizzes/:quizId/attempts/:attemptId`

**Access:** Instructor, Admin

**URL Params:** `quizId`, `attemptId`

**Response `200`:**
```json
{
  "success": true,
  "data": { "attempt": { "...full attempt with student answers..." } }
}
```

---

### PATCH `/api/instructor/quizzes/:quizId/attempts/:attemptId/answers/:answerId/evaluate`

**Access:** Instructor, Admin

**URL Params:** `quizId`, `attemptId`, `answerId`

**Request Body:**
```json
{
  "marksAwarded": "number",
  "feedback": "string (optional)"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Answer evaluated"
}
```

---

### POST `/api/instructor/quizzes/:quizId/attempts/:attemptId/submit`

**Access:** Instructor, Admin

**URL Params:** `quizId`, `attemptId`

**Response `200`:**
```json
{
  "success": true,
  "message": "Attempt submitted by instructor"
}
```

---

### PATCH `/api/instructor/quizzes/:quizId/results/settings`

**Access:** Instructor, Admin

**URL Params:** `quizId`

**Request Body:**
```json
{
  "showResultsImmediately": "boolean",
  "showCorrectAnswers": "boolean"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Result settings updated"
}
```

---

### GET `/api/instructor/quizzes/:quizId/analytics`

**Access:** Instructor, Admin

**URL Params:** `quizId`

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "totalAttempts": 50,
    "averageScore": 75,
    "passRate": 80,
    "questionBreakdown": [ { "...per question stats..." } ]
  }
}
```

---

## 23. Instructor Assignment APIs

> Base: `/api/instructor/assignments`

---

### POST `/api/instructor/assignments`

**Access:** Instructor

**Request Body:**
```json
{
  "title": "string (required)",
  "courseId": "string (required)",
  "description": "string (optional)",
  "dueDate": "ISO date (optional)",
  "maxMarks": "number"
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": { "assignment": { "...assignment object..." } }
}
```

---

### GET `/api/instructor/assignments`

**Access:** Instructor

**Response `200`:**
```json
{
  "success": true,
  "data": { "assignments": [ { "...assignment objects..." } ] }
}
```

---

### GET `/api/instructor/assignments/:assignmentId`

**Access:** Instructor

**URL Params:** `assignmentId`

**Response `200`:**
```json
{
  "success": true,
  "data": { "assignment": { "...assignment details..." } }
}
```

---

### PATCH `/api/instructor/assignments/:assignmentId`

**Access:** Instructor

**URL Params:** `assignmentId`

**Request Body:** Any updatable assignment fields.

**Response `200`:**
```json
{
  "success": true,
  "data": { "assignment": { "...updated assignment..." } }
}
```

---

### PATCH `/api/instructor/assignments/:assignmentId/status`

**Access:** Instructor

**URL Params:** `assignmentId`

**Request Body:**
```json
{
  "status": "draft | published | closed"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Assignment status updated"
}
```

---

### DELETE `/api/instructor/assignments/:assignmentId`

**Access:** Instructor

**URL Params:** `assignmentId`

**Response `200`:**
```json
{
  "success": true,
  "message": "Assignment deleted"
}
```

---

### PATCH `/api/instructor/assignments/:assignmentId/restore`

**Access:** Instructor

**URL Params:** `assignmentId`

**Response `200`:**
```json
{
  "success": true,
  "message": "Assignment restored"
}
```

---

### GET `/api/instructor/assignments/:assignmentId/submissions`

**Access:** Instructor

**URL Params:** `assignmentId`

**Response `200`:**
```json
{
  "success": true,
  "data": { "submissions": [ { "...student submission objects..." } ] }
}
```

---

### GET `/api/instructor/assignments/:assignmentId/submissions/:submissionId`

**Access:** Instructor

**URL Params:** `assignmentId`, `submissionId`

**Response `200`:**
```json
{
  "success": true,
  "data": { "submission": { "...submission with files and student info..." } }
}
```

---

### PATCH `/api/instructor/assignments/:assignmentId/submissions/:submissionId/grade`

**Access:** Instructor

**URL Params:** `assignmentId`, `submissionId`

**Request Body:**
```json
{
  "grade": "number (required)",
  "feedback": "string (optional)"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Submission graded successfully"
}
```

---

### PATCH `/api/instructor/assignments/:assignmentId/submissions/:submissionId/return`

**Access:** Instructor

**URL Params:** `assignmentId`, `submissionId`

**Request Body:**
```json
{
  "returnNote": "string (optional)"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Submission returned to student"
}
```

---

### GET `/api/instructor/assignments/:assignmentId/analytics`

**Access:** Instructor

**URL Params:** `assignmentId`

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "totalSubmissions": 30,
    "gradedCount": 20,
    "averageGrade": 75,
    "pendingGrade": 10
  }
}
```

---

## 24. Instructor Announcement APIs

> Base: `/api/instructor/announcements`

---

### POST `/api/instructor/announcements`

**Access:** Instructor

**Request Body:**
```json
{
  "title": "string (required)",
  "content": "string (required)",
  "courseId": "string (required)"
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": { "announcement": { "...announcement object..." } }
}
```

---

### GET `/api/instructor/announcements`

**Access:** Instructor

**Response `200`:**
```json
{
  "success": true,
  "data": { "announcements": [ { "...announcement objects..." } ] }
}
```

---

### GET `/api/instructor/announcements/:announcementId`

**Access:** Instructor

**URL Params:** `announcementId`

**Response `200`:**
```json
{
  "success": true,
  "data": { "announcement": { "...announcement details..." } }
}
```

---

### PATCH `/api/instructor/announcements/:announcementId`

**Access:** Instructor

**URL Params:** `announcementId`

**Request Body:**
```json
{
  "title": "string (optional)",
  "content": "string (optional)"
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": { "announcement": { "...updated announcement..." } }
}
```

---

### PATCH `/api/instructor/announcements/:announcementId/status`

**Access:** Instructor

**URL Params:** `announcementId`

**Request Body:**
```json
{
  "status": "draft | published | archived"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Announcement status updated"
}
```

---

## 25. Instructor Live Class APIs

> Base: `/api/instructor/live-classes`

---

### POST `/api/instructor/live-classes`

**Access:** Instructor, Admin

**Request Body:**
```json
{
  "title": "string (required)",
  "courseId": "string (required)",
  "scheduledAt": "ISO date (required)",
  "duration": "number (minutes)",
  "meetingLink": "string (optional)",
  "description": "string (optional)"
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": { "liveClass": { "...live class object..." } }
}
```

---

### GET `/api/instructor/live-classes`

**Access:** Instructor, Admin

**Response `200`:**
```json
{
  "success": true,
  "data": { "liveClasses": [ { "...live class objects..." } ] }
}
```

---

### GET `/api/instructor/live-classes/:liveClassId`

**Access:** Instructor, Admin

**URL Params:** `liveClassId`

**Response `200`:**
```json
{
  "success": true,
  "data": { "liveClass": { "...live class details..." } }
}
```

---

### PATCH `/api/instructor/live-classes/:liveClassId`

**Access:** Instructor, Admin

**URL Params:** `liveClassId`

**Request Body:** Any updatable live class fields.

**Response `200`:**
```json
{
  "success": true,
  "data": { "liveClass": { "...updated live class..." } }
}
```

---

### PATCH `/api/instructor/live-classes/:liveClassId/status`

**Access:** Instructor, Admin

**URL Params:** `liveClassId`

**Request Body:**
```json
{
  "status": "scheduled | live | completed | cancelled"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Live class status updated"
}
```

---

### PATCH `/api/instructor/live-classes/:liveClassId/cancel`

**Access:** Instructor, Admin

**URL Params:** `liveClassId`

**Response `200`:**
```json
{
  "success": true,
  "message": "Live class cancelled"
}
```

---

### GET `/api/instructor/live-classes/:liveClassId/analytics`

**Access:** Instructor, Admin

**URL Params:** `liveClassId`

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "totalAttendees": 0,
    "avgDuration": 0,
    "peakConcurrentUsers": 0
  }
}
```

---

### GET `/api/instructor/live-classes/:liveClassId/attendance`

**Access:** Instructor, Admin

**URL Params:** `liveClassId`

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "attendance": [
      { "studentId": "string", "studentName": "string", "joinedAt": "ISO date", "leftAt": "ISO date" }
    ]
  }
}
```

---

### GET `/api/instructor/live-classes/:liveClassId/attendance/analytics`

**Access:** Instructor, Admin

**URL Params:** `liveClassId`

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "totalJoined": 0,
    "avgSessionDuration": 0,
    "dropOffRate": 0
  }
}
```

---

### PATCH `/api/instructor/live-classes/:liveClassId/resources`

**Access:** Instructor, Admin

**URL Params:** `liveClassId`

**Request Body:**
```json
{
  "resources": [
    { "title": "string (required)", "url": "string (required)", "type": "string (optional)" }
  ]
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Resources updated successfully",
  "liveClass": { "...updated live class with resources..." }
}
```

---

## 26. Admin — General APIs

> Base: `/api/admin`

---

### GET `/api/admin/dashboard`

**Access:** Admin

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "totalStudents": 0,
    "totalCourses": 0,
    "totalRevenue": 0,
    "totalOrders": 0,
    "recentOrders": [],
    "recentStudents": []
  }
}
```

---

### GET `/api/admin/orders`

**Access:** Admin

**Query Params (optional):** `page`, `limit`, `status`, `search`

**Response `200`:**
```json
{
  "success": true,
  "data": { "orders": [ { "...order objects..." } ], "total": 0 }
}
```

---

### GET `/api/admin/orders/:orderId`

**Access:** Admin

**URL Params:** `orderId`

**Response `200`:**
```json
{
  "success": true,
  "data": { "order": { "...full order with student and course info..." } }
}
```

---

### GET `/api/admin/students`

**Access:** Admin

**Query Params (optional):** `page`, `limit`, `search`, `status`

**Response `200`:**
```json
{
  "success": true,
  "data": { "students": [ { "...student objects..." } ], "total": 0 }
}
```

---

### GET `/api/admin/students/:studentId`

**Access:** Admin

**URL Params:** `studentId`

**Response `200`:**
```json
{
  "success": true,
  "data": { "student": { "...full student profile with enrollments..." } }
}
```

---

### PATCH `/api/admin/students/:studentId/status`

**Access:** Admin

**URL Params:** `studentId`

**Request Body:**
```json
{
  "status": "active | suspended | banned"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Student status updated"
}
```

---

### GET `/api/admin/courses`

**Access:** Admin

**Query Params (optional):** `page`, `limit`, `search`, `status`, `category`

**Response `200`:**
```json
{
  "success": true,
  "data": { "courses": [ { "...course objects..." } ], "total": 0 }
}
```

---

### GET `/api/admin/courses/:courseId`

**Access:** Admin

**URL Params:** `courseId`

**Response `200`:**
```json
{
  "success": true,
  "data": { "course": { "...full course details..." } }
}
```

---

### PATCH `/api/admin/courses/:courseId/status`

**Access:** Admin

**URL Params:** `courseId`

**Request Body:**
```json
{
  "status": "draft | published | archived"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Course status updated"
}
```

---

### DELETE `/api/admin/courses/:courseId`

**Access:** Admin

**URL Params:** `courseId`

**Response `200`:**
```json
{
  "success": true,
  "message": "Course deleted"
}
```

---

### PATCH `/api/admin/courses/:courseId/restore`

**Access:** Admin

**URL Params:** `courseId`

**Response `200`:**
```json
{
  "success": true,
  "message": "Course restored"
}
```

---

### GET `/api/admin/reviews`

**Access:** Admin

**Query Params (optional):** `page`, `limit`, `status`

**Response `200`:**
```json
{
  "success": true,
  "data": { "reviews": [ { "...review objects..." } ], "total": 0 }
}
```

---

### PATCH `/api/admin/reviews/:reviewId/status`

**Access:** Admin

**URL Params:** `reviewId`

**Request Body:**
```json
{
  "status": "approved | rejected | pending"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Review status updated"
}
```

---

## 27. Admin — Coupon APIs

> Base: `/api/admin/coupons`

---

### POST `/api/admin/coupons`

**Access:** Admin

**Request Body:**
```json
{
  "code": "string (required)",
  "discountType": "percentage | flat",
  "discountValue": "number (required)",
  "maxUses": "number",
  "expiresAt": "ISO date",
  "minOrderAmount": "number",
  "applicableCourses": ["courseId"]
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": { "coupon": { "...coupon object..." } }
}
```

---

### GET `/api/admin/coupons`

**Access:** Admin

**Query Params (optional):** `page`, `limit`, `status`, `search`

**Response `200`:**
```json
{
  "success": true,
  "data": { "coupons": [ { "...coupon objects..." } ], "total": 0 }
}
```

---

### GET `/api/admin/coupons/:couponId`

**Access:** Admin

**URL Params:** `couponId`

**Response `200`:**
```json
{
  "success": true,
  "data": { "coupon": { "...coupon details..." } }
}
```

---

### PATCH `/api/admin/coupons/:couponId`

**Access:** Admin

**URL Params:** `couponId`

**Request Body:** Any updatable coupon fields.

**Response `200`:**
```json
{
  "success": true,
  "data": { "coupon": { "...updated coupon..." } }
}
```

---

### PATCH `/api/admin/coupons/:couponId/status`

**Access:** Admin

**URL Params:** `couponId`

**Response `200`:**
```json
{
  "success": true,
  "message": "Coupon status toggled"
}
```

---

### DELETE `/api/admin/coupons/:couponId`

**Access:** Admin

**URL Params:** `couponId`

**Response `200`:**
```json
{
  "success": true,
  "message": "Coupon deleted"
}
```

---

### PATCH `/api/admin/coupons/:couponId/restore`

**Access:** Admin

**URL Params:** `couponId`

**Response `200`:**
```json
{
  "success": true,
  "message": "Coupon restored"
}
```

---

## 28. Admin — Analytics APIs

> Base: `/api/admin/analytics`

---

### GET `/api/admin/analytics/overview`

**Access:** Admin

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "totalRevenue": 0,
    "totalStudents": 0,
    "totalCourses": 0,
    "totalOrders": 0,
    "totalReviews": 0
  }
}
```

---

### GET `/api/admin/analytics/revenue`

**Access:** Admin

**Query Params (optional):** `period` (daily | weekly | monthly | yearly)

**Response `200`:**
```json
{
  "success": true,
  "data": { "revenue": [ { "date": "string", "amount": 0 } ] }
}
```

---

### GET `/api/admin/analytics/students`

**Access:** Admin

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "totalStudents": 0,
    "newStudentsThisMonth": 0,
    "activeStudents": 0
  }
}
```

---

### GET `/api/admin/analytics/orders`

**Access:** Admin

**Response `200`:**
```json
{
  "success": true,
  "data": { "orders": [ { "...order analytics data..." } ] }
}
```

---

### GET `/api/admin/analytics/courses`

**Access:** Admin

**Response `200`:**
```json
{
  "success": true,
  "data": { "courses": [ { "...course performance data..." } ] }
}
```

---

### GET `/api/admin/analytics/reviews`

**Access:** Admin

**Response `200`:**
```json
{
  "success": true,
  "data": { "averageRating": 4.5, "totalReviews": 100, "ratingDistribution": {} }
}
```

---

### GET `/api/admin/analytics/live-classes`

**Access:** Admin

**Response `200`:**
```json
{
  "success": true,
  "data": { "liveClasses": [ { "...live class analytics..." } ] }
}
```

---

### GET `/api/admin/analytics/coupons`

**Access:** Admin

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "totalCouponsUsed": 0,
    "totalDiscount": 0,
    "topCoupons": [ { "...coupon usage stats..." } ]
  }
}
```

---

## 29. Admin — Audit Log APIs

> Base: `/api/admin/audit-logs`

---

### GET `/api/admin/audit-logs`

**Access:** Admin

**Query Params (optional):** `page`, `limit`, `action`, `userId`, `from`, `to`

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "logs": [ { "action": "string", "userId": "string", "details": {}, "createdAt": "ISO date" } ],
    "total": 0
  }
}
```

---

### GET `/api/admin/audit-logs/:auditLogId`

**Access:** Admin

**URL Params:** `auditLogId`

**Response `200`:**
```json
{
  "success": true,
  "data": { "log": { "...full audit log entry..." } }
}
```

---

## 30. Admin — Certificate APIs

> Base: `/api/admin/certificates`

---

### POST `/api/admin/certificates/issue`

**Access:** Admin

**Request Body:**
```json
{
  "enrollmentId": "string (required)"
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Certificate issued successfully",
  "data": { "certificate": { "...certificate object..." } }
}
```

---

### GET `/api/admin/certificates`

**Access:** Admin

**Query Params (optional):** `page`, `limit`, `status`, `search`

**Response `200`:**
```json
{
  "success": true,
  "data": { "certificates": [ { "...certificate objects..." } ], "total": 0 }
}
```

---

### GET `/api/admin/certificates/issue-queue`

**Access:** Admin

**Response `200`:**
```json
{
  "success": true,
  "data": { "queue": [ { "...failed/pending certificate issue items..." } ] }
}
```

---

### POST `/api/admin/certificates/retry/:enrollmentId`

**Access:** Admin

**URL Params:** `enrollmentId`

**Response `200`:**
```json
{
  "success": true,
  "message": "Certificate issue retried"
}
```

---

### POST `/api/admin/certificates/retry-bulk`

**Access:** Admin

**Response `200`:**
```json
{
  "success": true,
  "message": "Bulk certificate retry initiated",
  "data": { "retriedCount": 5 }
}
```

---

### GET `/api/admin/certificates/:certificateId/download`

**Access:** Admin

**URL Params:** `certificateId`

**Response:** PDF file stream (`application/pdf`).

---

### PATCH `/api/admin/certificates/:certificateId/revoke`

**Access:** Admin

**URL Params:** `certificateId`

**Request Body:**
```json
{
  "reason": "string (optional)"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Certificate revoked"
}
```

---

### PATCH `/api/admin/certificates/:certificateId/restore`

**Access:** Admin

**URL Params:** `certificateId`

**Response `200`:**
```json
{
  "success": true,
  "message": "Certificate restored"
}
```

---

### POST `/api/admin/certificates/:certificateId/regenerate-pdf`

**Access:** Admin

**URL Params:** `certificateId`

**Response `200`:**
```json
{
  "success": true,
  "message": "Certificate PDF regenerated",
  "data": { "certificate": { "...updated certificate object..." } }
}
```

---

## 31. Admin — Live Class APIs

> Base: `/api/admin/live-classes`

---

### GET `/api/admin/live-classes`

**Access:** Admin

**Query Params (optional):** `page`, `limit`, `status`, `courseId`

**Response `200`:**
```json
{
  "success": true,
  "data": { "liveClasses": [ { "...live class objects..." } ], "total": 0 }
}
```

---

### GET `/api/admin/live-classes/:liveClassId`

**Access:** Admin

**URL Params:** `liveClassId`

**Response `200`:**
```json
{
  "success": true,
  "data": { "liveClass": { "...full live class details..." } }
}
```

---

### PATCH `/api/admin/live-classes/:liveClassId/status`

**Access:** Admin

**URL Params:** `liveClassId`

**Request Body:**
```json
{
  "status": "scheduled | live | completed | cancelled"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Live class status updated"
}
```

---

### DELETE `/api/admin/live-classes/:liveClassId`

**Access:** Admin

**URL Params:** `liveClassId`

**Response `200`:**
```json
{
  "success": true,
  "message": "Live class cancelled/deleted"
}
```

---

### PATCH `/api/admin/live-classes/:liveClassId/restore`

**Access:** Admin

**URL Params:** `liveClassId`

**Response `200`:**
```json
{
  "success": true,
  "message": "Live class restored"
}
```

---

## 32. Discussion APIs

> Base: `/api/discussions`

---

### POST `/api/discussions`

**Access:** Student, Instructor, Admin

**Request Body:**
```json
{
  "title": "string (required)",
  "body": "string (required)",
  "courseId": "string (required)",
  "lectureId": "string (optional)",
  "tags": ["string (optional)"]
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Discussion created successfully",
  "discussion": { "...discussion object..." }
}
```

---

### GET `/api/discussions`

**Access:** Student, Instructor, Admin

**Query Params (optional):** `courseId`, `lectureId`, `page`, `limit`, `search`, `tag`, `resolved`

**Response `200`:**
```json
{
  "success": true,
  "message": "Discussions fetched successfully",
  "discussions": [ { "...discussion objects..." } ],
  "pagination": { "page": 1, "limit": 20, "total": 0, "pages": 1 }
}
```

---

### GET `/api/discussions/:discussionId`

**Access:** Student, Instructor, Admin

**URL Params:** `discussionId`

**Response `200`:**
```json
{
  "success": true,
  "message": "Discussion fetched successfully",
  "discussion": { "...discussion object with replies..." }
}
```

---

### PATCH `/api/discussions/:discussionId`

**Access:** Discussion owner, Instructor, Admin

**URL Params:** `discussionId`

**Request Body:**
```json
{
  "title": "string (optional)",
  "body": "string (optional)",
  "tags": ["string (optional)"]
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Discussion updated successfully",
  "discussion": { "...updated discussion object..." }
}
```

---

### DELETE `/api/discussions/:discussionId`

**Access:** Discussion owner, Instructor, Admin

**URL Params:** `discussionId`

**Response `200`:**
```json
{
  "success": true,
  "message": "Discussion deleted successfully",
  "discussionId": "string"
}
```

---

### POST `/api/discussions/:discussionId/replies`

**Access:** Student, Instructor, Admin

**URL Params:** `discussionId`

**Request Body:**
```json
{
  "content": "string (required)"
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Reply created successfully",
  "reply": { "...reply object..." },
  "discussion": { "...updated discussion..." }
}
```

---

### PATCH `/api/discussions/:discussionId/replies/:replyId`

**Access:** Reply owner, Instructor, Admin

**URL Params:** `discussionId`, `replyId`

**Request Body:**
```json
{
  "content": "string (required)"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Reply updated successfully",
  "reply": { "...updated reply object..." }
}
```

---

### DELETE `/api/discussions/:discussionId/replies/:replyId`

**Access:** Reply owner, Instructor, Admin

**URL Params:** `discussionId`, `replyId`

**Response `200`:**
```json
{
  "success": true,
  "message": "Reply deleted successfully",
  "replyId": "string",
  "discussion": { "...updated discussion..." }
}
```

---

### PATCH `/api/discussions/:discussionId/replies/:replyId/accept`

**Access:** Discussion owner, Instructor, Admin

**URL Params:** `discussionId`, `replyId`

**Request:** No body required.

**Response `200`:**
```json
{
  "success": true,
  "message": "Answer accepted successfully",
  "changed": true,
  "reply": { "...reply object..." },
  "discussion": { "...updated discussion..." }
}
```

---

### PATCH `/api/discussions/:discussionId/resolved`

**Access:** Discussion owner, Instructor, Admin

**URL Params:** `discussionId`

**Request Body:**
```json
{
  "isResolved": "boolean (required)"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Discussion status updated",
  "discussion": { "...updated discussion..." }
}
```

---

### PATCH `/api/discussions/:discussionId/moderation`

**Access:** Instructor, Admin

**URL Params:** `discussionId`

**Request Body:**
```json
{
  "isPinned": "boolean (optional)",
  "isLocked": "boolean (optional)"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Discussion moderation updated",
  "discussion": { "...updated discussion..." }
}
```

---

### POST `/api/discussions/:discussionId/upvote`

**Access:** Student, Instructor, Admin

**URL Params:** `discussionId`

**Request:** No body required.

**Response `200`:**
```json
{
  "success": true,
  "message": "Vote toggled",
  "upvoted": true,
  "upvoteCount": 5
}
```

---

### POST `/api/discussions/:discussionId/replies/:replyId/upvote`

**Access:** Student, Instructor, Admin

**URL Params:** `discussionId`, `replyId`

**Request:** No body required.

**Response `200`:**
```json
{
  "success": true,
  "message": "Vote toggled",
  "upvoted": true,
  "upvoteCount": 3
}
```

---

### GET `/api/discussions/:discussionId/votes`

**Access:** Student, Instructor, Admin

**URL Params:** `discussionId`

**Response `200`:**
```json
{
  "success": true,
  "discussionUpvoted": true,
  "replyVotes": { "replyId": true }
}
```

---

## 33. Discussion Report APIs

> Base: `/api/discussion-reports`

---

### POST `/api/discussion-reports`

**Access:** Student, Instructor, Admin

**Request Body:**
```json
{
  "discussionId": "string (required, OR replyId)",
  "replyId": "string (optional)",
  "reason": "spam | harassment | inappropriate | misinformation | other (required)",
  "details": "string (optional)"
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Report submitted successfully",
  "report": { "...report object..." }
}
```

---

### GET `/api/discussion-reports/my`

**Access:** Student, Instructor, Admin

**Response `200`:**
```json
{
  "success": true,
  "reports": [ { "...report objects submitted by current user..." } ]
}
```

---

## 34. Admin — Discussion Report APIs

> Base: `/api/admin/discussion-reports`

---

### GET `/api/admin/discussion-reports`

**Access:** Admin

**Query Params (optional):** `page`, `limit`, `status` (pending | reviewing | resolved | rejected)

**Response `200`:**
```json
{
  "success": true,
  "reports": [ { "...all report objects..." } ],
  "pagination": { "page": 1, "limit": 20, "total": 0 }
}
```

---

### GET `/api/admin/discussion-reports/:reportId`

**Access:** Admin

**URL Params:** `reportId`

**Response `200`:**
```json
{
  "success": true,
  "report": { "...full report with discussion/reply and reporter info..." }
}
```

---

### PATCH `/api/admin/discussion-reports/:reportId/review`

**Access:** Admin

**URL Params:** `reportId`

**Request:** No body required.

**Response `200`:**
```json
{
  "success": true,
  "message": "Report review started",
  "report": { "...updated report..." }
}
```

---

### PATCH `/api/admin/discussion-reports/:reportId/resolve`

**Access:** Admin

**URL Params:** `reportId`

**Request Body:**
```json
{
  "resolution": "resolved | rejected (required)",
  "adminNote": "string (optional)"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Report resolved successfully",
  "report": { "...updated report..." }
}
```

---

## 35. Student Notes APIs

> Base: `/api/notes`

---

### POST `/api/notes`

**Access:** Student

**Request Body:**
```json
{
  "lectureId": "string (required)",
  "title": "string (optional)",
  "content": "string (required)",
  "isPinned": "boolean (optional)"
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Note created successfully",
  "note": { "...note object..." }
}
```

---

### GET `/api/notes/course/:courseId`

**Access:** Student

**URL Params:** `courseId`

**Query Params (optional):** `page`, `limit`, `lectureId`, `moduleId`, `pinned`, `search`

**Response `200`:**
```json
{
  "success": true,
  "notes": [ { "...note objects for the course..." } ],
  "pagination": { "page": 1, "limit": 20, "total": 0 }
}
```

---

### GET `/api/notes/lecture/:lectureId`

**Access:** Student

**URL Params:** `lectureId`

**Response `200`:**
```json
{
  "success": true,
  "notes": [ { "...note objects for the lecture..." } ]
}
```

---

### GET `/api/notes/:noteId`

**Access:** Student (note owner)

**URL Params:** `noteId`

**Response `200`:**
```json
{
  "success": true,
  "note": { "...note object..." }
}
```

---

### PATCH `/api/notes/:noteId`

**Access:** Student (note owner)

**URL Params:** `noteId`

**Request Body:**
```json
{
  "title": "string (optional)",
  "content": "string (optional)",
  "isPinned": "boolean (optional)"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Note updated successfully",
  "note": { "...updated note object..." }
}
```

---

### DELETE `/api/notes/:noteId`

**Access:** Student (note owner)

**URL Params:** `noteId`

**Response `200`:**
```json
{
  "success": true,
  "message": "Note deleted successfully"
}
```

---

## 36. Instructor Dashboard APIs

> Base: `/api/instructor/dashboard`

---

### GET `/api/instructor/dashboard`

**Access:** Instructor

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "totalCourses": 5,
    "totalStudents": 120,
    "totalRevenue": 50000,
    "avgRating": 4.5,
    "recentEnrollments": [ { "...enrollment objects..." } ]
  }
}
```

---

### GET `/api/instructor/dashboard/courses`

**Access:** Instructor

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "courses": [
      {
        "courseId": "string",
        "title": "string",
        "enrollments": 50,
        "revenue": 10000,
        "avgRating": 4.3
      }
    ]
  }
}
```

---

### GET `/api/instructor/dashboard/revenue`

**Access:** Instructor

**Query Params (optional):** `days` (default: 30)

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "revenue": [ { "date": "string", "amount": 0 } ],
    "total": 0,
    "period": "30 days"
  }
}
```

---

### GET `/api/instructor/dashboard/live-classes`

**Access:** Instructor

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "upcoming": [ { "...live class objects..." } ],
    "past": [ { "...live class objects..." } ]
  }
}
```

---

## 37. Admin Dashboard APIs

> Base: `/api/admin/dashboard`

---

### GET `/api/admin/dashboard`

**Access:** Admin

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "totalStudents": 0,
    "totalCourses": 0,
    "totalRevenue": 0,
    "totalOrders": 0,
    "recentOrders": [],
    "recentStudents": []
  }
}
```

---

## 38. Admin — Users APIs

> Base: `/api/admin/users`

---

### GET `/api/admin/users/analytics`

**Access:** Admin

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 0,
    "activeUsers": 0,
    "suspendedUsers": 0,
    "newUsersThisMonth": 0,
    "roleBreakdown": { "student": 0, "instructor": 0, "admin": 0 }
  }
}
```

---

### GET `/api/admin/users`

**Access:** Admin

**Query Params (optional):** `page`, `limit`, `search`, `role`, `status`

**Response `200`:**
```json
{
  "success": true,
  "data": { "users": [ { "...user objects..." } ], "total": 0 }
}
```

---

### GET `/api/admin/users/:userId`

**Access:** Admin

**URL Params:** `userId`

**Response `200`:**
```json
{
  "success": true,
  "data": { "user": { "...full user profile..." } }
}
```

---

### PATCH `/api/admin/users/:userId/activate`

**Access:** Admin

**URL Params:** `userId`

**Request:** No body required.

**Response `200`:**
```json
{
  "success": true,
  "message": "User activated successfully"
}
```

---

### PATCH `/api/admin/users/:userId/deactivate`

**Access:** Admin

**URL Params:** `userId`

**Request:** No body required.

**Response `200`:**
```json
{
  "success": true,
  "message": "User deactivated successfully"
}
```

---

### PATCH `/api/admin/users/:userId/suspend`

**Access:** Admin

**URL Params:** `userId`

**Request:** No body required.

**Response `200`:**
```json
{
  "success": true,
  "message": "User suspended successfully"
}
```

---

### PATCH `/api/admin/users/:userId/status`

**Access:** Admin

**URL Params:** `userId`

**Request Body:**
```json
{
  "status": "active | inactive | suspended | banned (required)"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "User status updated"
}
```

---

### PATCH `/api/admin/users/:userId/role`

**Access:** Admin

**URL Params:** `userId`

**Request Body:**
```json
{
  "role": "student | instructor | admin (required)"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "User role updated"
}
```

---

## 39. Admin — Orders APIs

> Base: `/api/admin/orders`

---

### GET `/api/admin/orders/analytics`

**Access:** Admin

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "totalOrders": 0,
    "totalRevenue": 0,
    "pendingOrders": 0,
    "refundedOrders": 0
  }
}
```

---

### GET `/api/admin/orders`

**Access:** Admin

**Query Params (optional):** `page`, `limit`, `status`, `search`

**Response `200`:**
```json
{
  "success": true,
  "data": { "orders": [ { "...order objects..." } ], "total": 0 }
}
```

---

### GET `/api/admin/orders/:orderId`

**Access:** Admin

**URL Params:** `orderId`

**Response `200`:**
```json
{
  "success": true,
  "data": { "order": { "...full order with student and course info..." } }
}
```

---

### PATCH `/api/admin/orders/:orderId/cancel`

**Access:** Admin

**URL Params:** `orderId`

**Request:** No body required.

**Response `200`:**
```json
{
  "success": true,
  "message": "Order cancelled successfully"
}
```

---

### PATCH `/api/admin/orders/:orderId/failed`

**Access:** Admin

**URL Params:** `orderId`

**Request:** No body required.

**Response `200`:**
```json
{
  "success": true,
  "message": "Order marked as failed"
}
```

---

### PATCH `/api/admin/orders/:orderId/refunded`

**Access:** Admin

> **Note:** This does NOT execute a Razorpay refund. Use after a successful refund verification.

**URL Params:** `orderId`

**Request:** No body required.

**Response `200`:**
```json
{
  "success": true,
  "message": "Order marked as refunded"
}
```

---

## 40. Admin — Courses APIs

> Base: `/api/admin/courses`

---

### GET `/api/admin/courses/analytics`

**Access:** Admin

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "totalCourses": 0,
    "publishedCourses": 0,
    "draftCourses": 0,
    "archivedCourses": 0,
    "topCourses": [ { "...course with enrollment count..." } ]
  }
}
```

---

### GET `/api/admin/courses`

**Access:** Admin

**Query Params (optional):** `page`, `limit`, `search`, `status`, `category`

**Response `200`:**
```json
{
  "success": true,
  "data": { "courses": [ { "...course objects..." } ], "total": 0 }
}
```

---

### GET `/api/admin/courses/:courseId`

**Access:** Admin

**URL Params:** `courseId`

**Response `200`:**
```json
{
  "success": true,
  "data": { "course": { "...full course details..." } }
}
```

---

### PATCH `/api/admin/courses/:courseId/publish`

**Access:** Admin

**URL Params:** `courseId`

**Request:** No body required.

**Response `200`:**
```json
{
  "success": true,
  "message": "Course published successfully"
}
```

---

### PATCH `/api/admin/courses/:courseId/unpublish`

**Access:** Admin

**URL Params:** `courseId`

**Request:** No body required.

**Response `200`:**
```json
{
  "success": true,
  "message": "Course unpublished successfully"
}
```

---

### PATCH `/api/admin/courses/:courseId/activate`

**Access:** Admin

**URL Params:** `courseId`

**Request:** No body required.

**Response `200`:**
```json
{
  "success": true,
  "message": "Course activated successfully"
}
```

---

### PATCH `/api/admin/courses/:courseId/deactivate`

**Access:** Admin

**URL Params:** `courseId`

**Request:** No body required.

**Response `200`:**
```json
{
  "success": true,
  "message": "Course deactivated successfully"
}
```

---

### PATCH `/api/admin/courses/:courseId/archive`

**Access:** Admin

**URL Params:** `courseId`

**Request:** No body required.

**Response `200`:**
```json
{
  "success": true,
  "message": "Course archived successfully"
}
```

---

## 41. AI Assistant APIs

> Base: `/api/ai`

---

### POST `/api/ai/conversations`

**Access:** Student, Instructor, Admin

**Request Body:**
```json
{
  "title": "string (optional)",
  "courseId": "string (optional — scopes conversation to a course)"
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "AI conversation created successfully",
  "conversation": {
    "id": "string",
    "title": "string",
    "courseId": "string | null",
    "createdAt": "ISO date"
  }
}
```

---

### GET `/api/ai/conversations`

**Access:** Student, Instructor, Admin

**Query Params (optional):** `page`, `limit`, `archived`

**Response `200`:**
```json
{
  "success": true,
  "message": "AI conversations fetched successfully",
  "conversations": [ { "...conversation objects..." } ],
  "pagination": { "page": 1, "limit": 20, "total": 0 }
}
```

---

### GET `/api/ai/conversations/:conversationId`

**Access:** Student, Instructor, Admin (conversation owner)

**URL Params:** `conversationId`

**Query Params (optional):** `page`, `limit`

**Response `200`:**
```json
{
  "success": true,
  "message": "AI conversation fetched successfully",
  "conversation": { "...conversation object..." },
  "messages": [ { "role": "user | assistant", "content": "string", "createdAt": "ISO date" } ],
  "pagination": { "page": 1, "limit": 50, "total": 0 }
}
```

---

### POST `/api/ai/conversations/:conversationId/messages`

**Access:** Student, Instructor, Admin (conversation owner)

**URL Params:** `conversationId`

**Request Body:**
```json
{
  "message": "string (required)",
  "lectureId": "string (optional — provides context)"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "AI response generated",
  "userMessage": { "role": "user", "content": "string" },
  "aiMessage": { "role": "assistant", "content": "string" }
}
```

---

### PATCH `/api/ai/conversations/:conversationId/title`

**Access:** Student, Instructor, Admin (conversation owner)

**URL Params:** `conversationId`

**Request Body:**
```json
{
  "title": "string (required)"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "AI conversation renamed successfully",
  "conversation": { "...updated conversation..." }
}
```

---

### PATCH `/api/ai/conversations/:conversationId/archive`

**Access:** Student, Instructor, Admin (conversation owner)

**URL Params:** `conversationId`

**Request Body:**
```json
{
  "isArchived": "boolean (required)"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "AI conversation archived/restored successfully",
  "conversation": { "...updated conversation..." }
}
```

---

### DELETE `/api/ai/conversations/:conversationId`

**Access:** Student, Instructor, Admin (conversation owner)

**URL Params:** `conversationId`

**Response `200`:**
```json
{
  "success": true,
  "message": "AI conversation deleted",
  "conversationId": "string"
}
```

---

## 42. RAG — Knowledge Search APIs

> Base: `/api/ai/rag`

---

### POST `/api/ai/rag/courses/:courseId/search`

**Access:** Student, Instructor, Admin

**URL Params:** `courseId`

**Request Body:**
```json
{
  "query": "string (required)",
  "topK": "number (optional, default: 5)"
}
```

**Response `200`:**
```json
{
  "success": true,
  "results": [
    {
      "score": 0.95,
      "text": "string",
      "metadata": { "lectureId": "string", "moduleId": "string" }
    }
  ]
}
```

---

### GET `/api/ai/rag/courses/:courseId/chunks`

**Access:** Student, Instructor, Admin

**URL Params:** `courseId`

**Response `200`:**
```json
{
  "success": true,
  "chunks": [ { "id": "string", "text": "string", "metadata": {} } ],
  "total": 0
}
```

---

### POST `/api/ai/rag/resources`

**Access:** Instructor, Admin

**Request Body:**
```json
{
  "resourceType": "lecture | module | course (required)",
  "resourceId": "string (required)",
  "content": "string (required)"
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Resource ingested into RAG index",
  "jobId": "string"
}
```

---

### POST `/api/ai/rag/courses/:courseId/index`

**Access:** Instructor, Admin

**URL Params:** `courseId`

**Request:** No body required.

**Response `201`:**
```json
{
  "success": true,
  "message": "Course indexing started",
  "jobId": "string"
}
```

---

### POST `/api/ai/rag/modules/:moduleId/index`

**Access:** Instructor, Admin

**URL Params:** `moduleId`

**Request:** No body required.

**Response `201`:**
```json
{
  "success": true,
  "message": "Module indexing started",
  "jobId": "string"
}
```

---

### POST `/api/ai/rag/lectures/:lectureId/index`

**Access:** Instructor, Admin

**URL Params:** `lectureId`

**Request:** No body required.

**Response `201`:**
```json
{
  "success": true,
  "message": "Lecture indexing started",
  "jobId": "string"
}
```

---

### DELETE `/api/ai/rag/courses/:courseId/resources/:resourceType/:resourceId`

**Access:** Instructor, Admin

**URL Params:** `courseId`, `resourceType` (lecture | module | course), `resourceId`

**Response `200`:**
```json
{
  "success": true,
  "message": "Resource removed from RAG index"
}
```

---

## 43. RAG — Indexing APIs

> Base: `/api/ai/indexing`

---

### GET `/api/ai/indexing/course/:courseId`

**Access:** Instructor, Admin

**URL Params:** `courseId`

**Response `200`:**
```json
{
  "success": true,
  "jobs": [
    {
      "jobId": "string",
      "resourceType": "string",
      "resourceId": "string",
      "status": "pending | processing | completed | failed",
      "createdAt": "ISO date"
    }
  ]
}
```

---

### GET `/api/ai/indexing/:jobId`

**Access:** Instructor, Admin

**URL Params:** `jobId`

**Response `200`:**
```json
{
  "success": true,
  "job": {
    "jobId": "string",
    "status": "pending | processing | completed | failed",
    "error": "string | null",
    "completedAt": "ISO date | null"
  }
}
```

---

### POST `/api/ai/indexing/:jobId/retry`

**Access:** Instructor, Admin

**URL Params:** `jobId`

**Request:** No body required.

**Response `200`:**
```json
{
  "success": true,
  "message": "Indexing job retried",
  "job": { "...updated job object..." }
}
```

---

*Last updated: August 2026 | VertexPortal LMS Backend*

