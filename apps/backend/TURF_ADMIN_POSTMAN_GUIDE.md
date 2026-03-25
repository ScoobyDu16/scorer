# 🏏 TURF_ADMIN & Registration - Postman Testing Guide

## 🔐 **Authentication Setup**

### **1. SUPER_ADMIN Login** (Get tokens for testing)
```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@scorer.app",
  "password": "admin123456"
}
```

**Copy the `accessToken` from response to environment variables:**
- `accessToken`: your_super_admin_token_here
- `refreshToken`: your_refresh_token_here

---

## 🏢 **Turf Registration** (Public Endpoints)

### **2. Check Email Availability**
```http
POST http://localhost:5000/api/turf-registration/check-availability
Content-Type: application/json

{
  "email": "testturf@example.com",
  "type": "turf"
}
```

**Response:**
```json
{
  "available": true
}
```

### **3. Get Available Plans**
```http
GET http://localhost:5000/api/turf-registration/plans
```

**Response:**
```json
{
  "plans": [
    {
      "id": "plan-uuid",
      "name": "BASIC",
      "priceMonthly": "999",
      "priceYearly": "9999",
      "featuresJson": "[\"feature1\", \"feature2\"]",
      "isActive": true
    }
  ]
}
```

### **4. Register New Turf** 
```http
POST http://localhost:5000/api/turf-registration/register
Content-Type: application/json

{
  "name": "Test Cricket Ground",
  "email": "testturf@example.com",
  "phone": "+919876543210",
  "address": "123 Main Street",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "gstNumber": "27AAAPL1234C1ZV",
  "adminName": "John Doe",
  "adminEmail": "john@example.com",
  "adminPhone": "+919876543211",
  "adminPassword": "password123",
  "planId": "basic-plan-uuid"
}
```

**Response:**
```json
{
  "message": "Turf registration successful",
  "turf": {
    "id": "turf-uuid",
    "name": "Test Cricket Ground",
    "email": "testturf@example.com",
    "verificationStatus": "PENDING",
    "subscriptionStatus": "TRIAL"
  },
  "admin": {
    "id": "user-uuid",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "tokens": {
    "accessToken": "turf_admin_token_here",
    "refreshToken": "refresh_token_here"
  }
}
```

### **5. Complete Onboarding**
```http
POST http://localhost:5000/api/turf-registration/onboarding/complete
Authorization: Bearer {{turfAdminAccessToken}}
Content-Type: application/json

{
  "description": "Premium cricket facility with floodlights",
  "facilities": "Floodlights, Parking, Dressing Rooms, Canteen",
  "operatingHours": "6:00 AM - 10:00 PM",
  "rules": "No outside food, Proper cricket attire required",
  "bankAccountNumber": "1234567890",
  "bankIfsc": "HDFC0001234",
  "bankAccountName": "Test Cricket Ground",
  "website": "https://testcricket.com",
  "instagram": "@testcricket",
  "facebook": "TestCricketGround",
  "twitter": "@testcricket"
}
```

### **6. Upgrade Subscription Plan**
```http
POST http://localhost:5000/api/turf-registration/upgrade-plan
Authorization: Bearer {{turfAdminAccessToken}}
Content-Type: application/json

{
  "planId": "pro-plan-uuid"
}
```

---

## 👑 **TURF_ADMIN Dashboard** (Requires TURF_ADMIN Token)

### **7. Get Turf Dashboard Statistics**
```http
GET http://localhost:5000/api/turf-admin/dashboard/stats
Authorization: Bearer {{turfAdminAccessToken}}
```

**Response:**
```json
{
  "turf": {
    "id": "turf-uuid",
    "name": "Test Cricket Ground",
    "verificationStatus": "PENDING",
    "subscriptionStatus": "TRIAL"
  },
  "stats": {
    "matches": {
      "total": 0,
      "active": 0,
      "today": 0,
      "completed": 0
    },
    "users": {
      "total": 1,
      "active": 1
    }
  },
  "recentMatches": []
}
```

### **8. Get Turf Profile**
```http
GET http://localhost:5000/api/turf-admin/profile
Authorization: Bearer {{turfAdminAccessToken}}
```

### **9. Update Turf Profile**
```http
PATCH http://localhost:5000/api/turf-admin/profile
Authorization: Bearer {{turfAdminAccessToken}}
Content-Type: application/json

{
  "name": "Updated Cricket Ground",
  "phone": "+919876543212",
  "address": "456 Updated Street",
  "city": "Delhi",
  "state": "Delhi",
  "pincode": "110001"
}
```

### **10. Get Turf Matches**
```http
GET http://localhost:5000/api/turf-admin/matches?page=1&limit=10&status=SCHEDULED
Authorization: Bearer {{turfAdminAccessToken}}
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `status`: Filter by match status (SCHEDULED, IN_PROGRESS, COMPLETED)
- `search`: Search by team names

### **11. Get Turf Users**
```http
GET http://localhost:5000/api/turf-admin/users?page=1&limit=10&role=PLAYER&search=john
Authorization: Bearer {{turfAdminAccessToken}}
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `role`: Filter by role (TURF_ADMIN, SCORER, PLAYER)
- `search`: Search by name or email

---

## 📋 **Postman Environment Setup**

### **Environment Variables:**
```json
{
  "accessToken": "super_admin_token_from_login",
  "refreshToken": "super_admin_refresh_token",
  "turfAdminAccessToken": "turf_admin_token_from_registration",
  "turfId": "your-turf-uuid",
  "planId": "your-plan-uuid"
}
```

### **Collection Structure:**
```
📁 Cricket Scorer Platform
├── 📁 Authentication
│   ├── 🔐 SUPER_ADMIN Login
│   └── 🔄 Refresh Token
├── 📁 Turf Registration
│   ├── ✅ Check Availability
│   ├── 📋 Get Plans
│   ├── 📝 Register Turf
│   ├── ✅ Complete Onboarding
│   └── 💳 Upgrade Plan
└── 📁 TURF_ADMIN Dashboard
    ├── 📊 Dashboard Stats
    ├── 👤 Turf Profile
    ├── 🏏 Turf Matches
    └── 👥 Turf Users
```

---

## 🧪 **Testing Workflow**

### **Step 1: Get SUPER_ADMIN Token**
1. **Login** as SUPER_ADMIN
2. **Save tokens** to environment variables

### **Step 2: Register New Turf**
1. **Check email availability**
2. **Get available plans**
3. **Register turf** with admin details
4. **Save TURF_ADMIN token** from response
5. **Complete onboarding** with additional details

### **Step 3: Test TURF_ADMIN Features**
1. **Get dashboard stats**
2. **View turf profile**
3. **Update turf profile**
4. **List matches** (empty initially)
5. **List users** (should show admin user)

---

## 🔍 **Expected Responses & Error Handling**

### **Success Responses:**
- **200 OK** - Data retrieved successfully
- **201 Created** - Resource created successfully
- **204 No Content** - Update successful

### **Error Responses:**
- **400 Bad Request** - Invalid data or missing fields
- **401 Unauthorized** - Missing/invalid token
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Resource doesn't exist
- **409 Conflict** - Email already exists

### **Common Error Scenarios:**
```json
// Email already exists
{
  "error": "Turf email already registered"
}

// Missing fields
{
  "error": "Missing required fields"
}

// Invalid token
{
  "error": "Authentication required"
}

// Wrong role
{
  "error": "Turf access required"
}
```

---

## 🚀 **Advanced Testing**

### **Test Pagination:**
```http
GET http://localhost:5000/api/turf-admin/matches?page=2&limit=5
Authorization: Bearer {{turfAdminAccessToken}}
```

### **Test Search:**
```http
GET http://localhost:5000/api/turf-admin/users?search=john&role=PLAYER
Authorization: Bearer {{turfAdminAccessToken}}
```

### **Test Filters:**
```http
GET http://localhost:5000/api/turf-admin/matches?status=COMPLETED
Authorization: Bearer {{turfAdminAccessToken}}
```

---

## 📱 **Postman Tips**

### **1. Use Environments:**
- Create separate environments for **Development** and **Production**
- Store tokens as environment variables
- Use `{{variableName}}` syntax in requests

### **2. Test Scripts:**
Add to **Tests** tab for auto token extraction:
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    if (response.tokens) {
        pm.environment.set("turfAdminAccessToken", response.tokens.accessToken);
        pm.environment.set("refreshToken", response.tokens.refreshToken);
    }
}
```

### **3. Pre-request Scripts:**
Add to **Pre-request Script** tab for auto token refresh:
```javascript
if (pm.environment.get("accessToken")) {
    // Check if token is expired and refresh if needed
}
```

---

## 🎯 **Success Indicators**

✅ **Registration Flow:**
- Email availability check works
- Plans are returned correctly
- Turf registration creates admin user
- TURF_ADMIN token is generated
- Onboarding completes successfully

✅ **Dashboard Access:**
- TURF_ADMIN can access dashboard
- Profile information is displayed
- Match and user listings work
- Pagination functions correctly

✅ **Data Management:**
- Profile updates save correctly
- Search and filtering work
- Error responses are appropriate
- Authentication is properly enforced

---

## 🏆 **Production Testing Checklist**

- [ ] All endpoints return proper HTTP status codes
- [ ] Authentication works for all protected routes
- [ ] Pagination works correctly
- [ ] Search and filtering function properly
- [ ] Error messages are descriptive
- [ ] Data validation works on all inputs
- [ ] Token refresh mechanism functions
- [ ] Role-based access control is enforced

🚀 **Your TURF_ADMIN system is ready for comprehensive testing!**
