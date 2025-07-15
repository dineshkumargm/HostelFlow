from django.urls import path
from .views import *

urlpatterns = [
    path('auth/register', RegisterView.as_view()),
    path('auth/login', LoginView.as_view()),
    path('auth/profile', ProfileView.as_view()),
    path('services', ServiceListView.as_view()),
    path('bookings', BookingCreateView.as_view()),
    path('bookings/my', MyBookingsView.as_view()),
    path('bookings/availability', get_unavailable_slots),
    path('bookings/<int:booking_id>/cancel', CancelBookingView.as_view()),
    path('bookings/<int:booking_id>/reschedule', RescheduleBookingView.as_view()),
    path('bookings/<int:booking_id>/rate', RateBookingView.as_view()),
    path('bookings/<int:booking_id>/delete', delete_booking, name='delete-booking'),
    path('bookings/<int:booking_id>/ask-if-completed/', ask_if_completed, name='ask_if_completed'),

    path('stats/dashboard', dashboard_stats),
    path('student/notifications', get_student_notifications),
    
    path('admin/bookings', get_all_bookings),
    path('admin/users', get_all_users),
    path('admin/service-providers', get_service_providers),
    path('admin/service-providers/create', create_service_provider),
    path('admin/service-providers/<str:provider_id>', update_service_provider),
    path('admin/service-providers/<str:provider_id>/delete/', delete_service_provider),
    
    path('service-provider/profile', service_provider_profile),
    path('service-provider/bookings', get_assigned_bookings),
    path('service-provider/bookings/<int:booking_id>/status', update_booking_status),
    path('service-provider/bookings/<int:booking_id>/notify-completion', send_completion_notification),
    path('service-provider/notifications', get_service_provider_notifications),
    path('service-provider/notifications/<int:notification_id>/read', mark_service_provider_notification_read),
    
    path('notifications/user', get_user_notifications),
    path('notifications/<int:notification_id>/read', mark_notification_read),
    path('notifications/booking/<int:booking_id>', send_booking_notification),
]
