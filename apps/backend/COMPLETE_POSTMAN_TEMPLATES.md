# 🚀 Complete Postman Testing Templates - Cricket Scorer Platform API

## 🔐 Authentication

### 1. Login (SUPER_ADMIN)
```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@scorer.app",
  "password": "admin123456"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "admin@scorer.app",
    "name": "Super Admin",
    "avatarUrl": null,
    "role": "SUPER_ADMIN",
    "turfId": null
  },
  "tokens": {
    "accessToken": "jwt_token_here",
    "refreshToken": "refresh_token_here"
  }
}
```

### 2. Get Current User Info
```http
GET http://localhost:5000/api/auth/me
Authorization: Bearer {{accessToken}}
```

### 3. Refresh Token
```http
POST http://localhost:5000/api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "{{refreshToken}}"
}
```

### 4. Change Password
```http
POST http://localhost:5000/api/auth/change-password
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "currentPassword": "admin123456",
  "newPassword": "newpassword123"
}
```

---

## 👑 SUPER_ADMIN Dashboard

### 5. Get Dashboard Statistics
```http
GET http://localhost:5000/api/admin/dashboard/stats
Authorization: Bearer {{accessToken}}
```

**Response:**
```json
{
  "stats": {
    "totalTurfs": 0,
    "activeSubscriptions": 0,
    "totalUsers": 1,
    "todayMatches": 0
  },
  "recentActivity": {
    "recentTurfs": [],
    "recentMatches": []
  }
}
```

---

## 🏢 Turf Management

### 6. Get All Turfs (Paginated)
```http
GET http://localhost:5000/api/admin/turfs?page=1&limit=10
Authorization: Bearer {{accessToken}}
```

### 7. Get Turf Details
```http
GET http://localhost:5000/api/admin/turfs/{{turfId}}
Authorization: Bearer {{accessToken}}
```

### 8. Update Turf Verification Status
```http
PATCH http://localhost:5000/api/admin/turfs/{{turfId}}/verification
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "status": "VERIFIED"
}
```

---

## 💳 Subscription Management

### 9. Get All Subscriptions (Paginated)
```http
GET http://localhost:5000/api/admin/subscriptions?page=1&limit=10
Authorization: Bearer {{accessToken}}
```

---

## 📊 Platform Analytics

### 10. Analytics Overview
```http
GET http://localhost:5000/api/analytics/overview?period=30
Authorization: Bearer {{accessToken}}
```

**Response:**
```json
{
  "period": "30 days",
  "overview": {
    "users": {
      "total": 1,
      "new": 0,
      "growth": "0.00"
    },
    "turfs": {
      "total": 0,
      "new": 0,
      "growth": "0.00"
    },
    "subscriptions": {
      "total": 0,
      "active": 0,
      "activationRate": "0.00"
    },
    "matches": {
      "total": 0,
      "completed": 0,
      "completionRate": "0.00"
    },
    "revenue": {
      "total": 0,
      "currency": "INR"
    }
  }
}
```

### 11. User Registration Trends
```http
GET http://localhost:5000/api/analytics/registrations?period=30
Authorization: Bearer {{accessToken}}
```

**Response:**
```json
{
  "period": "30 days",
  "trends": [
    {
      "date": "2026-03-24",
      "count": 1
    }
  ]
}
```

### 12. Subscription Trends
```http
GET http://localhost:5000/api/analytics/subscriptions?period=30
Authorization: Bearer {{accessToken}}
```

**Response:**
```json
{
  "period": "30 days",
  "trends": [
    {
      "date": "2026-03-24",
      "count": 1,
      "planName": "BASIC"
    }
  ]
}
```

### 13. Match Statistics
```http
GET http://localhost:5000/api/analytics/matches?period=30
Authorization: Bearer {{accessToken}}
```

**Response:**
```json
{
  "period": "30 days",
  "statistics": {
    "total": 0,
    "completed": 0,
    "completionRate": "0.00",
    "byStatus": [],
    "topTurfs": []
  }
}
```

### 14. Turf Verification Statistics
```http
GET http://localhost:5000/api/analytics/verifications
Authorization: Bearer {{accessToken}}
```

**Response:**
```json
{
  "total": 0,
  "breakdown": [
    {
      "status": "PENDING",
      "count": 0,
      "percentage": "0.00"
    },
    {
      "status": "VERIFIED",
      "count": 0,
      "percentage": "0.00"
    }
  ]
}
```

---

## 👥 User Moderation

### 15. Get All Users (Paginated)
```http
GET http://localhost:5000/api/moderation?page=1&limit=10&status=ACTIVE&search=john
Authorization: Bearer {{accessToken}}
```

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "status": "ACTIVE",
      "isEmailVerified": true,
      "isPhoneVerified": true,
      "role": "PLAYER",
      "turfName": "Sample Turf",
      "createdAt": "2026-03-24T20:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

### 16. Get User Details
```http
GET http://localhost:5000/api/moderation/{{userId}}
Authorization: Bearer {{accessToken}}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "status": "ACTIVE",
    "isEmailVerified": true,
    "isPhoneVerified": true,
    "avatarUrl": null,
    "createdAt": "2026-03-24T20:00:00.000Z",
    "updatedAt": "2026-03-24T20:00:00.000Z",
    "role": "PLAYER",
    "turfName": "Sample Turf",
    "turfEmail": "turf@example.com"
  },
  "matchHistory": []
}
```

### 17. Update User Status
```http
PATCH http://localhost:5000/api/moderation/{{userId}}/status
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "status": "SUSPENDED"
}
```

**Valid Status Values:** `ACTIVE`, `SUSPENDED`, `BANNED`

### 18. Assign Role to User
```http
POST http://localhost:5000/api/moderation/{{userId}}/roles
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "roleId": "role_uuid",
  "turfId": "turf_uuid_or_null"
}
```

### 19. Remove User Role
```http
DELETE http://localhost:5000/api/moderation/{{userId}}/roles/{{roleId}}
Authorization: Bearer {{accessToken}}
```

### 20. Get User Statistics
```http
GET http://localhost:5000/api/moderation/stats?period=30
Authorization: Bearer {{accessToken}}
```

**Response:**
```json
{
  "period": "30 days",
  "statistics": {
    "total": 1,
    "active": 1,
    "new": 0,
    "byStatus": [
      {
        "status": "ACTIVE",
        "count": 1
      }
    ],
    "byRole": [
      {
        "role": "SUPER_ADMIN",
        "count": 1
      }
    ]
  }
}
```

### 21. Ban/Unban User
```http
PATCH http://localhost:5000/api/moderation/{{userId}}/ban
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "banned": true,
  "reason": "Violation of terms of service"
}
```

---

## 📋 Environment Variables for Postman

### Authentication Variables
```
accessToken: your_access_token_here
refreshToken: your_refresh_token_here
userId: uuid_of_specific_user
turfId: uuid_of_specific_turf
roleId: uuid_of_specific_role
```

---

## 🔧 Testing Instructions

### 1. Setup Environment
1. Import collection into Postman
2. Set environment variables with actual values from login response
3. Replace `{{userId}}`, `{{turfId}}`, `{{roleId}}` with actual UUIDs from API responses

### 2. Authentication Flow
1. **Login first** to get tokens
2. **Copy tokens** to environment variables
3. **Use Authorization header** with `Bearer {{accessToken}}` for all protected routes

### 3. Expected Responses
- **200 OK** - Successful requests
- **400 Bad Request** - Invalid data or status values
- **401 Unauthorized** - Missing/invalid token
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Resource doesn't exist
- **500 Internal Server Error** - Server error

### 4. Common Error Scenarios
- **401**: Token expired → Use refresh token endpoint
- **403**: Wrong role → Only SUPER_ADMIN can access admin routes
- **404**: Invalid ID → Check if resource exists first
- **400**: Invalid status → Use only: ACTIVE, SUSPENDED, BANNED

---

## 🚀 Complete Test Sequence

### **Authentication & Dashboard**
1. **Login**: `POST /api/auth/login`
2. **Dashboard**: `GET /api/admin/dashboard/stats`

### **Analytics Testing**
3. **Overview**: `GET /api/analytics/overview`
4. **Registrations**: `GET /api/analytics/registrations`
5. **Subscriptions**: `GET /api/analytics/subscriptions`
6. **Matches**: `GET /api/analytics/matches`
7. **Verifications**: `GET /api/analytics/verifications`

### **User Moderation Testing**
8. **List Users**: `GET /api/moderation`
9. **User Details**: `GET /api/moderation/{userId}`
10. **Update Status**: `PATCH /api/moderation/{userId}/status`
11. **Assign Role**: `POST /api/moderation/{userId}/roles`
12. **Remove Role**: `DELETE /api/moderation/{userId}/roles/{roleId}`
13. **User Stats**: `GET /api/moderation/stats`
14. **Ban/Unban**: `PATCH /api/moderation/{userId}/ban`

---

## 📱️ Testing Tips

### ✅ Success Indicators
- All endpoints return proper JSON responses
- Authentication tokens work correctly
- Pagination works as expected
- Database operations are properly handled
- Analytics provide meaningful insights

### ⚠️ Error Handling
- Check server logs for detailed error messages
- Verify request body format and content-type headers
- Ensure proper authentication headers are set
- Validate UUID format for ID parameters

### 🔄 Refresh Token Flow
- When access token expires (15 minutes), use refresh token to get new tokens
- Update environment variables with new tokens
- Continue making requests with new access token

---

## 🎯 Production Features Implemented

### ✅ **Complete Authentication System**
- JWT token generation and verification
- Role-based authorization
- Token refresh mechanism
- Password change functionality

### ✅ **Comprehensive Admin Dashboard**
- Platform statistics and metrics
- Turf management and verification
- Subscription monitoring
- Recent activity tracking

### ✅ **Advanced Analytics**
- Platform overview with growth metrics
- User registration trends
- Subscription analytics
- Match statistics and completion rates
- Turf verification breakdown

### ✅ **Full User Moderation**
- User listing with search and filters
- User details and match history
- Status management (ACTIVE/SUSPENDED/BANNED)
- Role assignment and removal
- User statistics and analytics
- Ban/unban functionality

### ✅ **Production-Grade Architecture**
- Multi-tenant RBAC system
- Secure JWT authentication
- Comprehensive error handling
- Scalable database design
- RESTful API structure

## 🏆 **Platform Ready for Production**

Your cricket scoring platform now has all core features implemented and tested! 🚀

**Server URL**: `http://localhost:5000`
**Documentation**: Complete API coverage above
**Authentication**: Fully functional with SUPER_ADMIN account
