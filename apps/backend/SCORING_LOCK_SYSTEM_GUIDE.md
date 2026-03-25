# 🔒 Scoring Lock System - Postman Testing Guide

## 🎯 **Overview**

The scoring lock system prevents multiple scorers from scoring the same match simultaneously, ensuring data integrity and preventing race conditions.

## 🔐 **Authentication Required**

All scoring lock endpoints require authentication. Use your SCORER or SUPER_ADMIN tokens.

---

## 🚀 **Scoring Lock Endpoints**

### **1. Acquire Scoring Lock**
```http
POST http://localhost:5000/api/scoring-locks/acquire
Authorization: Bearer {{scorerAccessToken}}
Content-Type: application/json

{
  "matchId": "match-uuid-here"
}
```

**Success Response (200):**
```json
{
  "message": "Scoring lock acquired successfully",
  "lockId": "lock-uuid-here"
}
```

**Error Response (409):**
```json
{
  "error": "Match is currently being scored by another scorer. Lock expires in 15 minutes."
}
```

---

### **2. Release Scoring Lock**
```http
POST http://localhost:5000/api/scoring-locks/release
Authorization: Bearer {{scorerAccessToken}}
Content-Type: application/json

{
  "matchId": "match-uuid-here"
}
```

**Success Response (200):**
```json
{
  "message": "Scoring lock released successfully"
}
```

**Error Response (400):**
```json
{
  "error": "No active scoring lock found for this match"
}
```

---

### **3. Update Lock Activity**
```http
POST http://localhost:5000/api/scoring-locks/update-activity
Authorization: Bearer {{scorerAccessToken}}
Content-Type: application/json

{
  "matchId": "match-uuid-here"
}
```

**Success Response (200):**
```json
{
  "message": "Lock activity updated"
}
```

---

### **4. Check Lock Status**
```http
GET http://localhost:5000/api/scoring-locks/has-lock/{{matchId}}
Authorization: Bearer {{scorerAccessToken}}
```

**Response:**
```json
{
  "hasLock": true,
  "matchId": "match-uuid-here",
  "userId": "user-uuid-here"
}
```

---

### **5. Get Lock Information**
```http
GET http://localhost:5000/api/scoring-locks/info/{{matchId}}
Authorization: Bearer {{scorerAccessToken}}
```

**Success Response (200):**
```json
{
  "message": "Active lock found",
  "lock": {
    "id": "lock-uuid",
    "scorerId": "scorer-uuid",
    "lockAcquiredAt": "2026-03-25T10:00:00.000Z",
    "lockExpiresAt": "2026-03-25T10:30:00.000Z",
    "lastActivityAt": "2026-03-25T10:15:00.000Z",
    "userAgent": "Mozilla/5.0...",
    "ipAddress": "192.168.1.100"
  }
}
```

**No Lock Response (200):**
```json
{
  "message": "No active lock found for this match",
  "lock": null
}
```

---

### **6. Force Release Lock** (SUPER_ADMIN only)
```http
POST http://localhost:5000/api/scoring-locks/force-release/{{matchId}}
Authorization: Bearer {{superAdminAccessToken}}
```

**Success Response (200):**
```json
{
  "message": "Scoring lock force released successfully"
}
```

---

## 🎮 **Protected Scoring Operations**

All scoring operations now require an active lock:

### **Match Scoring Operations**
```http
# Start match - Requires lock
POST http://localhost:5000/api/matches/{{matchId}}/start
Authorization: Bearer {{scorerAccessToken}}

# Add ball - Requires lock
POST http://localhost:5000/api/matches/{{matchId}}/balls
Authorization: Bearer {{scorerAccessToken}}

# Undo last ball - Requires lock
DELETE http://localhost:5000/api/matches/{{matchId}}/balls/last
Authorization: Bearer {{scorerAccessToken}}

# End innings - Requires lock
POST http://localhost:5000/api/matches/{{matchId}}/end-innings
Authorization: Bearer {{scorerAccessToken}}
```

### **Protected Operations**
```http
# Delete match - Requires NO active lock
DELETE http://localhost:5000/api/matches/{{matchId}}
Authorization: Bearer {{turfAdminAccessToken}}
```

---

## ⚠️ **Lock Error Responses**

### **Lock Required Error (409):**
```json
{
  "error": "Scoring lock required",
  "code": "LOCK_REQUIRED",
  "message": "This match is currently being scored by another scorer",
  "lockInfo": {
    "lockedBy": "other-scorer-uuid",
    "lockedAt": "2026-03-25T10:00:00.000Z",
    "expiresAt": "2026-03-25T10:30:00.000Z"
  }
}
```

### **Acquire Lock Guidance (409):**
```json
{
  "error": "Scoring lock required",
  "code": "LOCK_REQUIRED",
  "message": "You must acquire a scoring lock before performing scoring operations",
  "action": "POST /api/scoring-locks/acquire"
}
```

### **Match In Progress Error (409):**
```json
{
  "error": "Match is currently being scored",
  "code": "MATCH_IN_PROGRESS",
  "message": "This operation cannot be performed while the match is being scored",
  "lockInfo": {
    "lockedBy": "scorer-uuid",
    "lockedAt": "2026-03-25T10:00:00.000Z",
    "expiresAt": "2026-03-25T10:30:00.000Z"
  }
}
```

---

## 🔄 **Complete Scoring Workflow**

### **Step 1: Acquire Lock**
```http
POST http://localhost:5000/api/scoring-locks/acquire
Authorization: Bearer {{scorerAccessToken}}
Content-Type: application/json

{
  "matchId": "match-uuid"
}
```

### **Step 2: Start Scoring**
```http
POST http://localhost:5000/api/matches/{{matchId}}/start
Authorization: Bearer {{scorerAccessToken}}
```

### **Step 3: Add Balls (Continuous)**
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
  "isWicket": false
}
```

### **Step 4: Update Activity (Periodic)**
```http
POST http://localhost:5000/api/scoring-locks/update-activity
Authorization: Bearer {{scorerAccessToken}}
Content-Type: application/json

{
  "matchId": "match-uuid"
}
```

### **Step 5: Release Lock**
```http
POST http://localhost:5000/api/scoring-locks/release
Authorization: Bearer {{scorerAccessToken}}
Content-Type: application/json

{
  "matchId": "match-uuid"
}
```

---

## ⏰ **Lock Management**

### **Automatic Lock Extension**
- Lock automatically extends when scoring operations are performed
- Activity timeout: 5 minutes of inactivity
- Maximum lock duration: 30 minutes

### **Lock Expiration**
- Locks expire after 30 minutes of inactivity
- Expired locks are automatically cleaned up
- Users must re-acquire locks if expired

### **Conflict Resolution**
- Only one scorer can lock a match at a time
- Other scorers see who has the lock and when it expires
- SUPER_ADMIN can force release stuck locks

---

## 🔧 **Testing Scenarios**

### **Scenario 1: Normal Scoring**
1. Acquire lock ✅
2. Start match ✅
3. Add balls ✅
4. Release lock ✅

### **Scenario 2: Concurrent Scoring**
1. Scorer A acquires lock ✅
2. Scorer B tries to acquire lock ❌ (409 error)
3. Scorer B sees lock info ✅
4. Scorer A releases lock ✅
5. Scorer B acquires lock ✅

### **Scenario 3: Lock Timeout**
1. Scorer acquires lock ✅
2. Scorer stops activity for 30+ minutes ⏰
3. Lock expires automatically 🧹
4. Scorer tries to score ❌ (409 error)
5. Scorer re-acquires lock ✅

### **Scenario 4: Admin Intervention**
1. Scorer A has lock but crashes 💥
2. SUPER_ADMIN force releases lock ✅
3. Scorer B acquires lock ✅

---

## 📊 **Lock Monitoring**

### **Check All Active Locks**
```sql
SELECT 
  sl.match_id,
  sl.scorer_id,
  sl.lock_acquired_at,
  sl.lock_expires_at,
  sl.last_activity_at,
  u.name as scorer_name,
  u.email as scorer_email,
  m.team_a_name,
  m.team_b_name
FROM scoring_locks sl
JOIN users u ON sl.scorer_id = u.id
JOIN matches m ON sl.match_id = m.id
WHERE sl.is_active = true
  AND sl.lock_expires_at > NOW()
ORDER BY sl.lock_acquired_at DESC;
```

---

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **"Lock Required" Error**
   - Solution: Acquire lock first using `/acquire` endpoint

2. **"Match is currently being scored" Error**
   - Solution: Wait for lock to expire or contact admin

3. **Lock expires too quickly**
   - Solution: Call `/update-activity` periodically during long scoring sessions

4. **Stuck lock**
   - Solution: SUPER_ADMIN can force release using `/force-release`

### **Best Practices:**

1. **Always acquire lock before scoring**
2. **Update activity during long scoring sessions**
3. **Release lock when finished scoring**
4. **Handle lock errors gracefully**
5. **Show lock status to users in UI**

---

## 🎯 **Success Indicators**

✅ **Lock System Working:**
- Only one scorer can score at a time
- Locks automatically extend on activity
- Expired locks are cleaned up
- Clear error messages for conflicts
- Admin override capability

🏆 **Your cricket scoring platform now has enterprise-grade concurrent scoring protection!**

---

## 📱 **Postman Collection Structure**

```
📁 Cricket Scorer Platform
├── 🔐 Authentication
├── 🔒 Scoring Locks
│   ├── 🔐 Acquire Lock
│   ├── 🔓 Release Lock
│   ├── 🔄 Update Activity
│   ├── 👀 Check Lock Status
│   ├── 📋 Lock Information
│   └── 🔨 Force Release (Admin)
├── 🏏 Match Management
│   ├── 📝 Create Match
│   ├── ▶️ Start Match (Protected)
│   ├── 🎾 Add Ball (Protected)
│   ├── ↩️ Undo Ball (Protected)
│   ├── 🏁 End Innings (Protected)
│   └── 🗑️ Delete Match (Protected)
└── 📊 Analytics & Dashboard
```

🚀 **Ready for production use with complete concurrent scoring protection!**
