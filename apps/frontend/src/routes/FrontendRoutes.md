# Frontend Routes - Production-Grade 4-Role System

## 🚀 **Public Routes** (No Authentication Required)

### Login Pages
```
/login                    - New unified login form for all user types
/auth                    - Legacy auth page (can be deprecated)
```

## 🔐 **Protected Routes** (Authentication Required)

### Role-Based Dashboard Routes
```
/dashboard                 - Default dashboard (routes based on user role)
/admin/dashboard           - Super Admin Dashboard (SUPER_ADMIN only)
/scorer/dashboard          - Scorer Dashboard (SCORER only)  
/player/dashboard          - Player Dashboard (PLAYER only)
```

### Existing Routes (Updated)
```
/leaderboard              - Cricket leaderboard with tabs
/players                  - Player management
/players/:playerId        - Player profile/career stats
/generate-code            - Generate match access codes
/access-code              - Join match with access code
/scoring/:matchId         - Live scoring interface
/match/:matchId/scorecard - Match scorecard view
/match-management         - Match management dashboard
/match-flow/:matchId?     - Unified match creation flow
```

## 🎯 **User Role Routing Logic**

### Automatic Role-Based Redirection
When users log in, they are automatically redirected to their role-appropriate dashboard:

- **SUPER_ADMIN** → `/admin/dashboard`
- **TURF_ADMIN** → `/dashboard` (existing)
- **SCORER** → `/scorer/dashboard`
- **PLAYER** → `/player/dashboard`

### Route Protection
Each dashboard page includes role validation:
- Users can only access their designated dashboard
- Wrong role attempts are redirected to correct dashboard
- Unauthenticated users are redirected to `/login`

## 📱 **Login Form Features**

### Tabbed Interface
```
┌─────────────────────────────────────────┐
│ Phone OTP │ Email Password │ Super Admin │
└─────────────────────────────────────────┘
```

### Phone OTP Login (Players/Scorers)
- **Input**: Phone number
- **Action**: Send OTP → Enter 6-digit code → Login
- **Redirect**: `/scorer/dashboard` or `/player/dashboard`

### Email Password Login (Turf Admins)
- **Input**: Email + Password
- **Action**: Direct login
- **Redirect**: `/dashboard`

### Super Admin Login (Platform Admins)
- **Input**: Email + Password + 2FA Code
- **Action**: Verify credentials → Login
- **Redirect**: `/admin/dashboard`

## 🔒 **Authentication Flow**

### Login Process
1. User selects login method (Phone/Email/Admin)
2. Submits credentials
3. Backend validates and returns JWT + user data
4. Frontend stores in localStorage
5. Automatic redirect to role-appropriate dashboard

### Session Management
```javascript
// Stored in localStorage
localStorage.setItem("token", JWT_TOKEN);
localStorage.setItem("user", JSON.stringify({
  id: "user-id",
  name: "User Name", 
  role: "SUPER_ADMIN|TURF_ADMIN|SCORER|PLAYER",
  turfId: "turf-id", // For non-SUPER_ADMIN
  turfName: "Turf Name"
}));
```

## 🎨 **Component Structure**

### Page Components
```
/src/pages/
├── LoginPage.tsx              - Unified login form
├── SuperAdminDashboardPage.tsx - Super admin dashboard
├── TurfAdminDashboardPage.tsx  - Turf admin dashboard  
├── ScorerDashboardPage.tsx      - Scorer dashboard
└── PlayerDashboardPage.tsx       - Player dashboard
```

### Dashboard Components
```
/src/components/dashboard/
├── SuperAdminDashboard.tsx   - Platform metrics & management
├── TurfAdminDashboard.tsx    - Turf operations & stats
├── ScorerDashboard.tsx        - Match scoring interface
└── PlayerDashboard.tsx         - Career stats & history
```

### Authentication Components
```
/src/components/auth/
└── LoginForm.tsx              - Tabbed login interface
```

## 🚦 **Navigation Examples**

### Super Admin Navigation
```
Login → /admin/dashboard → {
  "Verify Turfs" → /admin/turfs/pending
  "Manage Subscriptions" → /admin/subscriptions  
  "View Platform Stats" → /admin/analytics
  "Manage Users" → /admin/users
}
```

### Turf Admin Navigation
```
Login → /dashboard → {
  "Create Match" → /match-flow
  "Add Player" → /players/add
  "Manage Scorers" → /scorers
  "View Reports" → /reports
}
```

### Scorer Navigation
```
Login → /scorer/dashboard → {
  "Start Scoring" → /scoring/:matchId
  "View Scorecards" → /match/:matchId/scorecard
  "Match Schedule" → /matches
}
```

### Player Navigation
```
Login → /player/dashboard → {
  "View Career Stats" → /players/:playerId
  "View Scorecards" → /match/:matchId/scorecard
  "Leaderboards" → /leaderboard
}
```

## 🔄 **Route Guards**

### ProtectedRoute Component
- Checks for valid JWT token
- Redirects unauthenticated users to `/login`
- Passes user data to child components

### Role-Based Guards
Each dashboard page includes role validation:
```typescript
// Example from SuperAdminDashboardPage.tsx
const userData = JSON.parse(user);
if (userData.role !== "SUPER_ADMIN") {
  // Redirect to appropriate dashboard
  return <Navigate to="/dashboard" replace />;
}
```

## 🎯 **Usage Instructions**

### For Development
1. Start development server
2. Navigate to `http://localhost:3000/login`
3. Test different login methods:
   - Phone: `+1234567890` + OTP: `123456`
   - Email: `admin@turf.com` + Password: `password`
   - Super Admin: `admin@yourapp.com` + Password + 2FA: `123456`

### For Production
1. Configure environment variables
2. Set up proper authentication providers
3. Replace mock OTP with real SMS service
4. Configure proper 2FA for super admin

## 📱 **Mobile Responsiveness**

All components are built with Tailwind CSS and are fully responsive:
- Mobile: Single column layouts
- Tablet: Two-column grids
- Desktop: Full multi-column layouts

## 🔧 **Customization**

### Adding New Routes
1. Create page component in `/src/pages/`
2. Import in `App.tsx`
3. Add route configuration with proper protection
4. Update navigation in relevant dashboard

### Modifying Login Flow
1. Edit `LoginForm.tsx` for UI changes
2. Update `auth.service.ts` for backend logic
3. Modify role routing logic in page components

This routing system provides a complete, secure, and role-based navigation experience for all user types in the production-grade cricket scoring platform.
