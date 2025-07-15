
# Technical Setup Guide for Service Provider System

## Quick Start

### 1. Environment Setup
The service provider system uses the same environment variables as the existing application:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

### 2. Authentication Flow

#### Service Provider Login:
1. User logs in through `/login`
2. Backend returns user object with `is_service_provider: true`
3. Frontend redirects to `/service-provider` dashboard
4. Service provider can now manage assigned bookings

#### Role-Based Routing:
```typescript
// In Login.tsx after successful authentication:
if (userData.is_staff) {
  navigate('/admin');
} else if (userData.is_service_provider) {
  navigate('/service-provider');
} else {
  navigate('/');
}
```

### 3. API Integration Points

#### Required Backend Endpoints:
```typescript
// Service Provider Authentication
GET /api/auth/profile
- Returns: { id, email, name, is_service_provider, service_provider_id }

// Service Provider Bookings
GET /api/service-provider/bookings
- Returns: Array of assigned bookings

PUT /api/service-provider/bookings/{id}/status
- Body: { status: 'in_progress' | 'completed' }
- Triggers notification to user when status = 'completed'

// Notifications
GET /api/service-provider/notifications
- Returns: Array of notifications for service provider

POST /api/service-provider/bookings/{id}/notify-completion
- Body: { message: string }
- Sends notification to user about service completion
```

### 4. Database Schema Updates

#### Users Table:
```sql
ALTER TABLE users ADD COLUMN is_service_provider BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN service_provider_id INTEGER REFERENCES service_providers(id);
```

#### Service Providers Table:
```sql
CREATE TABLE service_providers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  services TEXT[], -- Array of service IDs they can handle
  specialization VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Notifications Table:
```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  service_provider_id INTEGER REFERENCES service_providers(id),
  booking_id INTEGER REFERENCES bookings(id),
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'general', -- 'booking', 'completion', 'general'
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Bookings Table Updates:
```sql
ALTER TABLE bookings ADD COLUMN assigned_service_provider_id INTEGER REFERENCES service_providers(id);
ALTER TABLE bookings ADD COLUMN status_updated_at TIMESTAMP;
```

### 5. Backend Logic Implementation

#### Booking Assignment Logic:
```python
# When a booking is created
def assign_service_provider(booking):
    # Find service providers who handle this service type
    providers = ServiceProvider.objects.filter(
        services__contains=[booking.service_id]
    )
    
    # Simple round-robin assignment (can be improved with load balancing)
    assigned_provider = providers.order_by('last_assigned').first()
    
    booking.assigned_service_provider_id = assigned_provider.id
    booking.save()
    
    # Send notification to service provider
    Notification.objects.create(
        service_provider_id=assigned_provider.id,
        booking_id=booking.id,
        message=f"New booking assigned: {booking.service_name} for Room {booking.room_number}",
        type='booking'
    )
```

#### Status Update Logic:
```python
def update_booking_status(booking_id, new_status, service_provider_id):
    booking = Booking.objects.get(
        id=booking_id, 
        assigned_service_provider_id=service_provider_id
    )
    
    booking.status = new_status
    booking.status_updated_at = timezone.now()
    booking.save()
    
    # If completed, notify the user
    if new_status == 'completed':
        Notification.objects.create(
            user_id=booking.user_id,
            booking_id=booking.id,
            message=f"Your {booking.service_name} service has been completed!",
            type='completion'
        )
```

### 6. Real-time Notifications Setup

#### Option 1: WebSocket Implementation
```javascript
// In ServiceProviderDashboard.tsx
useEffect(() => {
  const ws = new WebSocket(`ws://localhost:8000/ws/service-provider/${user.service_provider_id}/`);
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'new_booking') {
      // Refresh bookings and notifications
      loadData();
      toast({
        title: 'New Booking Assigned',
        description: data.message,
      });
    }
  };
  
  return () => ws.close();
}, []);
```

#### Option 2: Server-Sent Events
```javascript
// Alternative implementation
useEffect(() => {
  const eventSource = new EventSource(`/api/service-provider/events`);
  
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    // Handle real-time updates
  };
  
  return () => eventSource.close();
}, []);
```

### 7. Testing Configuration

#### Mock Service Provider User:
```json
{
  "id": 2,
  "email": "provider@example.com",
  "name": "John Provider",
  "room_number": null,
  "is_staff": false,
  "is_service_provider": true,
  "service_provider_id": 1
}
```

#### Mock Bookings Data:
```json
[
  {
    "_id": "booking1",
    "service_name": "Room Cleaning",
    "user_name": "Alice Student",
    "room_number": "A-101",
    "date": "2024-01-15",
    "time_slot": "10:00 AM - 11:00 AM",
    "status": "confirmed",
    "special_instructions": "Please focus on bathroom cleaning",
    "created_at": "2024-01-14T10:00:00Z"
  }
]
```

### 8. Performance Considerations

#### Caching Strategy:
```typescript
// React Query configuration for caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});
```

#### Pagination for Large Datasets:
```typescript
// For service providers with many bookings
export const useServiceProviderBookings = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['service-provider', 'bookings', page],
    queryFn: () => serviceProviderAPI.getAssignedBookings({ page, limit }),
  });
};
```

### 9. Security Implementation

#### JWT Token Validation:
```python
# Backend middleware
def validate_service_provider(request):
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user = decode_jwt(token)
    
    if not user.is_service_provider:
        raise PermissionDenied("Access denied: Not a service provider")
    
    return user
```

#### Frontend Route Protection:
```typescript
// In App.tsx, routes are already protected with ProtectedRoute component
<Route path="/service-provider" element={<ServiceProviderDashboard />} />
```

### 10. Deployment Checklist

#### Frontend Deployment:
- [ ] Environment variables configured
- [ ] API endpoints pointing to production backend
- [ ] Service worker configured for notifications (optional)
- [ ] Error tracking setup (Sentry, etc.)

#### Backend Deployment:
- [ ] Database migrations applied
- [ ] Service provider endpoints implemented
- [ ] Real-time notification system setup
- [ ] JWT authentication configured
- [ ] CORS settings updated

#### Testing Checklist:
- [ ] Service provider login flow
- [ ] Booking assignment logic
- [ ] Status update functionality
- [ ] Notification delivery
- [ ] Mobile responsiveness
- [ ] Error handling scenarios

## Monitoring and Analytics

### Key Metrics to Track:
1. Service provider response time
2. Booking completion rates
3. User satisfaction ratings
4. System notification delivery rates
5. Service provider app usage patterns

### Logging Configuration:
```typescript
// Add comprehensive logging
console.log('Service provider logged in:', user.service_provider_id);
console.log('Booking status updated:', { bookingId, newStatus });
console.log('Notification sent:', { type, recipientId });
```

This technical setup provides all the necessary configuration details for implementing the service provider system in a production environment.
