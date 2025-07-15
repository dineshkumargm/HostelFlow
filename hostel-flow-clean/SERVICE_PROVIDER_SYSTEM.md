# Service Provider System Documentation

## Overview
This document explains the Service Provider system added to the HostelFlow application. Service providers are special users who can view and manage bookings assigned to them, receive notifications about new bookings, and notify users when services are completed.

## System Components

### 1. Authentication & User Roles
- **Regular Users**: Can book services and view their bookings
- **Admins** (`is_staff: true`): Can manage users, service providers, and view all bookings
- **Service Providers** (`is_service_provider: true`): Can view assigned bookings and manage service completion

### 2. New Files Added

#### Pages
- `src/pages/ServiceProviderDashboard.tsx`: Main dashboard for service providers

#### Hooks
- `src/hooks/useServiceProvider.ts`: React Query hooks for service provider operations

#### API Integration
- Updated `src/services/api.ts` with service provider endpoints

#### Context Updates
- Updated `src/contexts/AuthContext.tsx` to handle service provider authentication

### 3. Service Provider Dashboard Features

#### Stats Overview
- Pending bookings count
- In-progress bookings count  
- Completed bookings count
- Today's total bookings

#### Bookings Management
- View all assigned bookings in a table format
- Update booking status from "confirmed" to "in_progress"
- Mark bookings as "completed"
- View user details, room numbers, and service times

#### Notifications System
- Real-time notifications about new bookings
- Mark notifications as read
- Auto-refresh every 30 seconds

### 4. API Endpoints (Mock Implementation)

#### Service Provider Endpoints
```
GET /api/service-provider/profile - Get service provider profile
GET /api/service-provider/bookings - Get assigned bookings
PUT /api/service-provider/bookings/{id}/status - Update booking status
GET /api/service-provider/notifications - Get notifications
PUT /api/service-provider/notifications/{id}/read - Mark notification as read
POST /api/service-provider/bookings/{id}/notify-completion - Send completion notification
```

#### Notification Endpoints
```
GET /api/notifications/user - Get user notifications
PUT /api/notifications/{id}/read - Mark notification as read
POST /api/notifications/booking/{id} - Send booking notification to service provider
```

### 5. User Flow

#### For Service Providers:
1. Login with service provider credentials
2. Automatically redirected to `/service-provider` dashboard
3. View assigned bookings and notifications
4. Update booking status as work progresses
5. Send completion notifications to users

#### For Regular Users:
1. Book services as usual
2. Service provider receives notification
3. Service provider updates status to "in_progress"
4. User can see status updates in their bookings
5. Service provider marks as "completed" and sends notification
6. User receives completion notification

### 6. Admin Management
Admins can create service providers through the Admin Dashboard:
- Navigate to Admin Dashboard
- Go to "Service Providers" tab
- Click "Add Service Provider"
- Fill in details (name, email, phone, services, specialization)
- Service provider account is created and linked to selected services

### 7. Notification System Flow

#### New Booking Notification:
1. User books a service
2. System identifies service providers for that service
3. Notification sent to relevant service providers
4. Service providers see notification in dashboard

#### Completion Notification:
1. Service provider marks booking as completed
2. System sends notification to the user who booked
3. User sees completion notification in their dashboard

### 8. Database Schema Considerations

#### Service Provider Table:
```sql
service_providers {
  id: primary key
  name: string
  email: string (unique)
  phone: string
  services: array of service IDs
  specialization: string
  created_at: timestamp
  updated_at: timestamp
}
```

#### Notifications Table:
```sql
notifications {
  id: primary key
  user_id: foreign key (can be regular user or service provider)
  message: text
  booking_id: foreign key (optional)
  read: boolean (default false)
  type: enum ('booking', 'completion', 'general')
  created_at: timestamp
}
```

#### User Table Updates:
```sql
users {
  // existing fields...
  is_service_provider: boolean (default false)
  service_provider_id: foreign key (nullable)
}
```

### 9. Features Implemented

#### Security Features:
- JWT token-based authentication
- Role-based access control
- Protected routes for service providers

#### Real-time Features:
- Auto-refreshing notifications (30-second intervals)
- Live booking status updates
- Instant notification marking

#### User Experience Features:
- Responsive dashboard design
- Intuitive status management
- Clear visual indicators for booking states
- Toast notifications for user feedback

### 10. Mock Data Implementation
Since this is a frontend implementation, all API calls return mock data. In a real backend implementation, you would need to:

1. Create the database tables mentioned above
2. Implement the API endpoints with proper business logic
3. Set up real-time notifications (WebSocket or Server-Sent Events)
4. Add proper authentication middleware
5. Implement role-based permissions

### 11. Next Steps for Full Implementation

1. **Backend Integration**: Replace mock API calls with real backend endpoints
2. **Real-time Notifications**: Implement WebSocket or SSE for instant notifications
3. **Push Notifications**: Add browser/mobile push notifications
4. **Analytics**: Add service provider performance metrics
5. **Mobile App**: Create mobile app for service providers
6. **GPS Tracking**: Add location tracking for service completion verification

## Usage Instructions

### For Developers:
1. The system is fully integrated into the existing codebase
2. Service provider authentication is handled automatically
3. All components use the existing design system
4. Mock data is provided for testing

### For Testing:
1. Create a user account with `is_service_provider: true` in your backend
2. Login with those credentials
3. You'll be redirected to the service provider dashboard
4. Test booking status updates and notifications

### For Deployment:
1. Ensure all environment variables are properly set
2. Update API endpoints to point to your backend
3. Configure real-time notification system
4. Set up proper database schema
5. Test all user flows thoroughly

## Troubleshooting

### Common Issues:
1. **Service provider not redirected**: Check `is_service_provider` flag in user data
2. **Notifications not updating**: Verify API endpoints and data structure
3. **Status updates failing**: Check booking ID format and API responses
4. **Dashboard not loading**: Verify authentication and protected route setup

### Debug Tips:
1. Check browser console for API errors
2. Verify JWT token is being sent with requests
3. Test mock API responses in development
4. Use React DevTools to inspect component state
