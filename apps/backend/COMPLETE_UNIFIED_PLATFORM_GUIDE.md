# 🏏 Complete Cricket Scorer Platform - Postman Testing Guide

## 🔐 **Authentication Setup**

### **1. SUPER_ADMIN Login** (Get tokens for admin operations)
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
    "id": "super-admin-uuid",
    "email": "admin@scorer.app",
    "name": "Super Admin",
    "role": "SUPER_ADMIN"
  },
  "tokens": {
    "accessToken": "jwt_token_here",
    "refreshToken": "refresh_token_here"
  }
}
```

### **2. TURF_ADMIN Login** (After turf registration)
```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "turf-admin@example.com",
  "password": "password123"
}
```

---

## 🏢 **Turf Registration** (Public Endpoints)

### **3. Register New Turf**
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
  "adminPassword": "Test@123",
  "planId": "basic-plan-uuid"
}
```

### **4. Complete Turf Onboarding**
```http
POST http://localhost:5000/api/turf-registration/onboarding/complete
Authorization: Bearer {{turfAdminAccessToken}}
Content-Type: application/json

{
  "description": "Premium cricket facility with floodlights",
  "facilities": "Floodlights, Parking, Dressing Rooms",
  "operatingHours": "6:00 AM - 10:00 PM",
  "rules": "No outside food, Proper cricket attire required"
}
```

---

## 👑 **TURF_ADMIN Dashboard**

### **5. Get Turf Dashboard Statistics**
```http
GET http://localhost:5000/api/turf-admin/dashboard/stats
Authorization: Bearer {{turfAdminAccessToken}}
```

### **6. Get Turf Profile**
```http
GET http://localhost:5000/api/turf-admin/profile
Authorization: Bearer {{turfAdminAccessToken}}
```

### **7. Update Turf Profile**
```http
PATCH http://localhost:5000/api/turf-admin/profile
Authorization: Bearer {{turfAdminAccessToken}}
Content-Type: application/json

{
  "name": "Updated Cricket Ground",
  "phone": "+919876543212"
}
```

### **8. Get Turf Matches**
```http
GET http://localhost:5000/api/turf-admin/matches?page=1&limit=10&status=SCHEDULED
Authorization: Bearer {{turfAdminAccessToken}}
```

### **9. Get Turf Users**
```http
GET http://localhost:5000/api/turf-admin/users?page=1&limit=10&role=PLAYER
Authorization: Bearer {{turfAdminAccessToken}}
```

---

## 🏏 **Match Management** (TURF_ADMIN & SCORER)

### **10. Create Match**
```http
POST http://localhost:5000/api/matches
Authorization: Bearer {{turfAdminAccessToken}}
Content-Type: application/json

{
  "teamAName": "Team A",
  "teamBName": "Team B",
  "overs": 20,
  "venue": "Main Ground",
  "playersPerTeam": 11
}
```

### **11. Get All Matches**
```http
GET http://localhost:5000/api/matches
Authorization: Bearer {{turfAdminAccessToken}}
```

### **12. Get Match Details**
```http
GET http://localhost:5000/api/matches/{{matchId}}
Authorization: Bearer {{turfAdminAccessToken}}
```

### **13. Start Match**
```http
POST http://localhost:5000/api/matches/{{matchId}}/start
Authorization: Bearer {{scorerAccessToken}}
```

### **14. Add Players to Match**
```http
POST http://localhost:5000/api/matches/{{matchId}}/players
Authorization: Bearer {{turfAdminAccessToken}}
Content-Type: application/json

{
  "players": [
    {
      "name": "Player 1",
      "jerseyNumber": 1
    },
    {
      "name": "Player 2", 
      "jerseyNumber": 2
    }
  ]
}
```

### **15. Get Match Players**
```http
GET http://localhost:5000/api/matches/{{matchId}}/players
Authorization: Bearer {{playerAccessToken}}
```

---

## 🎯 **Match Scoring** (SCORER only)

### **16. Add Ball**
```http
POST http://localhost:5000/api/matches/{{matchId}}/balls
Authorization: Bearer {{scorerAccessToken}}
Content-Type: application/json

{
  "ballNumber": 1,
  "overNumber": 1,
  "runs": 4,
  "isWide": false,
  "isNoBall": false,
  "isWicket": false,
  "batsmanId": "player-uuid",
  "bowlerId": "player-uuid"
}
```

### **17. Undo Last Ball**
```http
DELETE http://localhost:5000/api/matches/{{matchId}}/balls/last
Authorization: Bearer {{scorerAccessToken}}
```

### **18. Start Second Innings**
```http
POST http://localhost:5000/api/matches/{{matchId}}/start-second
Authorization: Bearer {{scorerAccessToken}}
```

### **19. End Innings**
```http
POST http://localhost:5000/api/matches/{{matchId}}/end-innings
Authorization: Bearer {{scorerAccessToken}}
```

### **20. Get Match Score**
```http
GET http://localhost:5000/api/matches/{{matchId}}/score
Authorization: Bearer {{playerAccessToken}}
```

### **21. Get Match Scorecard**
```http
GET http://localhost:5000/api/matches/{{matchId}}/scorecard
Authorization: Bearer {{playerAccessToken}}
```

---

## 👥 **Player Management** (TURF_ADMIN & SCORER)

### **22. Create Player**
```http
POST http://localhost:5000/api/players
Authorization: Bearer {{turfAdminAccessToken}}
Content-Type: application/json

{
  "name": "John Doe",
  "jerseyNumber": 1,
  "role": "Batsman",
  "battingStyle": "Right-handed",
  "bowlingStyle": "Right-arm fast"
}
```

### **23. Get All Players**
```http
GET http://localhost:5000/api/players
Authorization: Bearer {{playerAccessToken}}
```

### **24. Get Player Details**
```http
GET http://localhost:5000/api/players/{{playerId}}
Authorization: Bearer {{playerAccessToken}}
```

### **25. Update Player**
```http
PUT http://localhost:5000/api/players/{{playerId}}
Authorization: Bearer {{turfAdminAccessToken}}
Content-Type: application/json

{
  "name": "Updated Name",
  "jerseyNumber": 2
}
```

### **26. Get Player Statistics**
```http
GET http://localhost:5000/api/players/{{playerId}}/stats
Authorization: Bearer {{playerAccessToken}}
```

### **27. Get Player Career**
```http
GET http://localhost:5000/api/players/{{playerId}}/career
Authorization: Bearer {{playerAccessToken}}
```

---

## 🔗 **Access Code System**

### **28. Generate Access Code** (TURF_ADMIN only)
```http
POST http://localhost:5000/api/access-codes/generate
Authorization: Bearer {{turfAdminAccessToken}}
Content-Type: application/json

{
  "matchId": "match-uuid",
  "maxUses": 10,
  "expiresIn": "24h"
}
```

### **29. Validate Access Code** (Public)
```http
POST http://localhost:5000/api/access-codes/validate
Content-Type: application/json

{
  "code": "ABC123",
  "playerName": "John Doe"
}
```

---

## 📊 **Dashboard & Analytics**

### **30. Get Dashboard Stats** (All authenticated users)
```http
GET http://localhost:5000/api/dashboard
Authorization: Bearer {{playerAccessToken}}
```

### **31. Get Top Players** (All authenticated users)
```http
GET http://localhost:5000/api/dashboard/top-players
Authorization: Bearer {{playerAccessToken}}
```

---

## 🔐 **SUPER_ADMIN Platform Management**

### **32. Get Platform Analytics**
```http
GET http://localhost:5000/api/analytics/overview?period=30
Authorization: Bearer {{superAdminAccessToken}}
```

### **33. User Moderation**
```http
GET http://localhost:5000/api/moderation?page=1&limit=10
Authorization: Bearer {{superAdminAccessToken}}
```

### **34. Update User Status**
```http
PATCH http://localhost:5000/api/moderation/{{userId}}/status
Authorization: Bearer {{superAdminAccessToken}}
Content-Type: application/json

{
  "status": "SUSPENDED"
}
```

---

## 📋 **Postman Environment Setup**

### **Environment Variables:**
```json
{
  "superAdminAccessToken": "super_admin_token_here",
  "turfAdminAccessToken": "turf_admin_token_here", 
  "scorerAccessToken": "scorer_token_here",
  "playerAccessToken": "player_token_here",
  "matchId": "match_uuid_here",
  "playerId": "player_uuid_here"
}
```

---

## 🎯 **Role-Based Access Control**

### **SUPER_ADMIN** (Platform Level):
- ✅ Analytics & moderation
- ✅ User management
- ✅ All turf operations
- ✅ Platform configuration

### **TURF_ADMIN** (Turf Level):
- ✅ Turf profile management
- ✅ Match creation & management
- ✅ Player management
- ✅ Access code generation
- ✅ Dashboard statistics

### **SCORER** (Match Level):
- ✅ Start/end innings
- ✅ Add balls & undo
- ✅ Match scoring
- ✅ Scorecard management
- ✅ Live scoring operations

### **PLAYER** (Participant Level):
- ✅ View matches & scorecards
- ✅ View player statistics
- ✅ Access match details
- ✅ Career statistics
- ✅ Validate access codes

---

## 🚀 **Testing Workflows**

### **Workflow 1: Turf Setup**
1. **SUPER_ADMIN login** → Get admin token
2. **Register turf** → Creates TURF_ADMIN automatically
3. **Complete onboarding** → Add turf details
4. **TURF_ADMIN login** → Get turf-specific token
5. **Create players** → Add team members
6. **Create match** → Schedule first match

### **Workflow 2: Match Day**
1. **TURF_ADMIN login** → Generate access code
2. **Players validate code** → Get match access
3. **SCORER starts match** → Begin live scoring
4. **Add balls** → Record each delivery
5. **View scorecard** → Track match progress
6. **End innings** → Complete first innings

### **Workflow 3: Analytics**
1. **View dashboard** → Match statistics
2. **Check player stats** → Performance metrics
3. **Platform analytics** → SUPER_ADMIN insights

---

## 📱 **Advanced Features**

### **Real-time Scoring:**
- Live ball-by-ball updates
- Automatic score calculation
- Innings management
- Wicket tracking

### **Access Control:**
- Role-based permissions
- Turf-specific data isolation
- Secure token authentication

### **Data Management:**
- Player statistics tracking
- Match history
- Career statistics
- Performance analytics

---

## 🏆 **Production Ready Features**

✅ **Complete Authentication System**
- JWT token management
- Multi-role support
- Secure access control

✅ **Comprehensive Match Management**
- Create, start, score matches
- Player management
- Access code system

✅ **Advanced Scoring System**
- Ball-by-ball scoring
- Innings management
- Scorecard generation
- Undo functionality

✅ **Player Analytics**
- Statistics tracking
- Career data
- Performance metrics

✅ **Platform Administration**
- SUPER_ADMIN dashboard
- User moderation
- Analytics & insights

---

## 🎯 **Success Indicators**

🏆 **Your cricket scoring platform is now fully integrated and production-ready!**

All modules work together with unified authentication:
- **SUPER_ADMIN** → Platform management
- **TURF_ADMIN** → Turf operations  
- **SCORER** → Match scoring
- **PLAYER** → Match participation

🚀 **Ready for comprehensive testing and deployment!**
