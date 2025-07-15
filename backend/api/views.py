from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import *
from .models import *
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from bson import ObjectId
from rest_framework.permissions import IsAdminUser
from datetime import datetime, timedelta

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

class RegisterView(APIView):
    def post(self, request):
        print(request.data)
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': ProfileSerializer(user).data,
                'access_token': str(refresh.access_token)
            }, status=201)
        else:
            print(serializer.errors)
        return Response(serializer.errors, status=400)


class LoginView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data
            print(user)
            tokens = get_tokens_for_user(user)
            profile = ProfileSerializer(user)
            print(profile.data)
            return Response({
                'user': profile.data,
                'access_token': tokens['access'],
            }, status=200)
        print(serializer)
        return Response(serializer.errors, status=400)


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = ProfileSerializer(request.user)
        return Response(serializer.data)


class ServiceListView(APIView):
    def get(self, request):
        try:
            services = Service.objects.all()
            services = [s for s in services if s.availability is True]
            serializer = ServiceSerializer(services, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error': str(e)}, status=500)


from django.db import IntegrityError

class BookingCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = BookingSerializer(data=request.data)
        if serializer.is_valid():
            try:
                print("request", request.data)
                booking = serializer.save(user=request.user)
                # Send notification to service providers
                service = booking.service
                service_providers = service.provider_links.all()
                for sp_link in service_providers:
                    service_provider = sp_link.serviceprovider
                    Notification.objects.create(
                        user=service_provider.user,
                        message=f'New booking for {service.name} on {booking.date} at {booking.time_slot}.'
                    )


                return Response(serializer.data, status=201)

            except IntegrityError:
                return Response(
                    {'error': 'This time slot is already booked for the selected service. Please choose another slot.'},
                    status=400
                )
        else:
            print(serializer.errors)
            return Response(serializer.errors, status=400)



class MyBookingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        bookings = Booking.objects.filter(user=request.user)
        serializer = BookingSerializer(bookings, many=True)
        return Response(serializer.data)


class CancelBookingView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, booking_id):
        print(booking_id)
        try:
            booking = Booking.objects.get(id=booking_id, user=request.user)
        except Booking.DoesNotExist:
            print("error")
            return Response({'error': 'Booking not found'}, status=404)

        booking.status = 'Cancelled'
        booking.save()
        return Response({'message': 'Booking cancelled'})


class RescheduleBookingView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, booking_id):
        try:
            booking = Booking.objects.get(id=booking_id, user=request.user)
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found'}, status=404)

        serializer = BookingRescheduleSerializer(data=request.data)
        if serializer.is_valid():
            booking.date = serializer.validated_data['date']
            booking.time_slot = serializer.validated_data['time_slot']
            booking.save()
            return Response({'message': 'Booking rescheduled'})
        return Response(serializer.errors, status=400)


class RateBookingView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, booking_id):
        try:
            booking = Booking.objects.get(id=booking_id, user=request.user)
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found'}, status=404)

        serializer = BookingRateSerializer(data=request.data)
        if serializer.is_valid():
            booking.rating = serializer.validated_data['rating']
            booking.comment = serializer.validated_data.get('comment', '')
            booking.save()
            return Response({'message': 'Rating submitted'})
        return Response(serializer.errors, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_student_notifications(request):
    notifications = Notification.objects.filter(user=request.user).order_by('-created_at')
    print(notifications)
    serializer = NotificationSerializer(notifications, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    total_services = Service.objects.count()
    total_bookings = Booking.objects.count()
    user_bookings = Booking.objects.filter(user=request.user).count()

    res= Response({
        'total_services': total_services,
        'total_bookings': total_bookings,
        'your_bookings': user_bookings
    })
    print(res.data)
    return res

def parse_date_string(date_str):
    """
    Convert 'Today', 'Tomorrow', or ISO 'YYYY-MM-DD' string into a datetime.
    Returns datetime object or None if invalid.
    """
    today = datetime.now().date()

    if date_str.lower() == 'today':
        return datetime.combine(today, datetime.min.time())
    elif date_str.lower() == 'tomorrow':
        return datetime.combine(today + timedelta(days=1), datetime.min.time())
    else:
        try:
            dt = datetime.strptime(date_str, '%Y-%m-%d')
            return datetime.combine(dt.date(), datetime.min.time())
        except ValueError:
            return None
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_unavailable_slots(request):
    service_id = request.GET.get('service_id')
    date_str = request.GET.get('date')
    print(date_str)

    parsed_date = parse_date_string(date_str)
    if not parsed_date:
        return Response({'error': 'Invalid date format'}, status=400)

    # Corrected: no __date since date is DateField
    bookings = Booking.objects.filter(service_id=service_id, date=parsed_date.date())
    print(bookings)
    unavailable = set(bookings.values_list('time_slot', flat=True))

    all_time_slots = [
        '08:00-10:00',
        '10:00-12:00',
        '12:00-14:00',
        '14:00-16:00',
        '16:00-18:00',
    ]

    today_str = datetime.now().date().isoformat()
    if parsed_date.date().isoformat() == today_str:
        current_time = datetime.now().time()
        for slot in all_time_slots:
            _, end_time_str = slot.split('-')
            end_time = datetime.strptime(end_time_str, '%H:%M').time()
            if current_time > end_time:
                unavailable.add(slot)

    return Response({'unavailable_slots': list(unavailable)})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_booking(request, booking_id):
    try:
        booking = Booking.objects.get(id=booking_id, user=request.user)
        booking.delete()
        return Response({'message': 'Booking deleted successfully.'}, status=status.HTTP_200_OK)
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found.'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_all_bookings(request):
    bookings = Booking.objects.select_related('user', 'service').all()
    serializer = BookingSerializer(bookings, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_all_users(request):
    users = get_user_model().objects.all()
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_service_providers(request):
    providers = ServiceProvider.objects.prefetch_related('service_links__service').all()
    serializer = ServiceProviderSerializer(providers, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def create_service_provider(request):
    predefined_services = {
        1: 'Laundry',
        2: 'Room Cleaning',
        3: 'Study Spaces',
        4: 'Room Repairs',
        5: 'Tech Support',
        6: 'AI Booking Assistant'
    }

    name = request.data.get('name')
    email = request.data.get('email')
    phone = request.data.get('phone')
    specialization = request.data.get('specialization')
    service_ids = request.data.get('services', [])

    if not name or not email:
        return Response({'error': 'Name and email are required.'}, status=status.HTTP_400_BAD_REQUEST)

    default_password = "serviceprovider"
    user = User.objects.create_user(
        username=name,
        email=email,
        password=default_password
    )
    user.is_serviceprovider = True
    user.save()

    service_provider = ServiceProvider.objects.create(
        user=user,
        name=user.username,
        email=user.email,
        phone=phone,
        specialization=specialization
    )

    new_services = []
    created_services = []

    for sid in service_ids:
        service_name = predefined_services.get(sid)
        if service_name:
            service, created = Service.objects.get_or_create(
                name=service_name,
                defaults={
                    'description': get_default_description(service_name),
                    'price': 100.00,
                    'duration': '2 hours',
                    'rating': 0.0,
                    'availability': True,
                    'provider_name': name
                }
            )
            created_services.append(service.id)
            if created:
                new_services.append(ServiceSerializer(service).data)
            else:
                # optionally update provider_name if needed
                service.provider_name = name
                service.save()

            ServiceProviderService.objects.create(
                serviceprovider=service_provider,
                service=service,
            )

    response_data = {
        'service_provider': {
            'id': service_provider.id,
            'user_id': user.id,
            'name': name,
            'email': email
        },
        'newly_created_services': new_services
    }

    return Response(response_data, status=status.HTTP_201_CREATED)


def get_default_description(service_name):
    descriptions = {
        'Laundry': "Professional laundry services including washing, drying, and ironing.",
        'Room Cleaning': "Complete room cleaning with dusting, mopping, and sanitization.",
        'Study Spaces': "Well-maintained study spaces for focused and quiet study sessions.",
        'Room Repairs': "On-demand maintenance and repair services for hostel rooms.",
        'Tech Support': "Technical assistance for your devices, connectivity, and software.",
        'AI Booking Assistant': "Smart AI-powered assistant to help you schedule services easily."
    }
    return descriptions.get(service_name, "General service provided by the hostel.")


@api_view(['PUT'])
@permission_classes([IsAdminUser])
def update_service_provider(request, provider_id):
    try:
        provider = ServiceProvider.objects.get(id=provider_id)
    except ServiceProvider.DoesNotExist:
        return Response({"detail": "Provider not found."}, status=status.HTTP_404_NOT_FOUND)

    serializer = ServiceProviderSerializer(provider, data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def delete_service_provider(request, provider_id):
    try:
        provider = ServiceProvider.objects.get(id=provider_id)
    except ServiceProvider.DoesNotExist:
        return Response({"detail": "Provider not found."}, status=status.HTTP_404_NOT_FOUND)

    provider.delete()
    return Response({"detail": "Provider deleted."}, status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def service_provider_profile(request):
    if not request.user.is_serviceprovider:
        return Response({'error': 'Not a service provider'}, status=403)
    print("Request", request.data)
    profile = ServiceProvider.objects.filter(user=request.user).first()
    if not profile:
        return Response({'error': 'Service provider profile not found'}, status=404)
    
    data = {
        'id': profile.id,
        'user': {
            'id': request.user.id,
            'email': request.user.email,
            'username': request.user.username,
        },
        # optionally add specialization, phone, services etc.
    }
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_assigned_bookings(request):
    if not getattr(request.user, 'is_serviceprovider', False):
        return Response({'error': 'Not a service provider'}, status=403)

    try:
        service_provider = request.user.provider_profile 
        service_ids = service_provider.service_links.values_list('service_id', flat=True)
        bookings = Booking.objects.filter(service_id__in=service_ids)

        serializer = BookingSerializer(bookings, many=True)
        return Response(serializer.data)

    except AttributeError:
        return Response({'error': 'No service provider profile found.'}, status=400)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_booking_status(request, booking_id):
    if not request.user.is_serviceprovider:
        return Response({'error': 'Not a service provider'}, status=403)
    
    status_value = request.data.get('status')
    if status_value not in ['in_progress', 'completed']:
        return Response({'error': 'Invalid status'}, status=400)
    
    try:
        booking = Booking.objects.get(id=booking_id, service__in=request.user.serviceprovider.services.all())
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found'}, status=404)
    
    booking.status = status_value
    booking.save()
    return Response({'message': 'Status updated'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_completion_notification(request, booking_id):
    if not request.user.is_serviceprovider:
        return Response({'error': 'Not a service provider'}, status=403)
    
    message = request.data.get('message', 'Service completed')
    try:
        booking = Booking.objects.get(id=booking_id, service__in=request.user.serviceprovider.services.all())
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found'}, status=404)
    
    # Assuming you have a Notification model
    Notification.objects.create(
        user=booking.user,
        message=message
    )
    return Response({'message': 'Notification sent'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_service_provider_notifications(request):
    if not getattr(request.user, 'is_serviceprovider', False):
        return Response({'error': 'Not a service provider'}, status=403)

    notifications = Notification.objects.filter(user=request.user)
    serializer = NotificationSerializer(notifications, many=True)
    return Response(serializer.data)  # empty list [] if no notifications


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def mark_service_provider_notification_read(request, notification_id):
    try:
        notif = Notification.objects.get(id=notification_id, user=request.user)
        notif.read = True
        notif.save()
        return Response({'message': 'Marked as read'})
    except Notification.DoesNotExist:
        return Response({'error': 'Notification not found'}, status=404)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_notifications(request):
    notifications = Notification.objects.filter(user=request.user)
    serializer = NotificationSerializer(notifications, many=True)
    return Response(serializer.data)



@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, notification_id):
    try:
        notification = Notification.objects.get(id=notification_id, user=request.user)
        notification.read = True
        notification.save()
        print(notification.user)
        if notification.user:
            try:
                from .models import Booking 
                booking = Booking.objects.get(email=notification.user)
                # create a new notification for the booking user
                Notification.objects.create(
                    user=booking.user,
                    message="Booking successfully submitted",
                    read=False
                )
            except Booking.DoesNotExist:
                pass  # optionally log or handle this case

        return Response({'status': 'marked as read'})
    except Notification.DoesNotExist:
        return Response({'error': 'Notification not found'}, status=404)




@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_booking_notification(request, booking_id):
    try:
        booking = Booking.objects.get(id=booking_id)
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found'}, status=404)
    
    Notification.objects.create(
        user=booking.user,
        message='Booking update notification'
    )
    return Response({'message': 'Notification sent'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ask_if_completed(request, booking_id):
    print("REQUEST: ", request.data)
    try:
        booking = Booking.objects.get(id=booking_id, user=request.user)
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found'}, status=404)

    providers = booking.service.provider_links.all()
    for link in providers:
        Notification.objects.create(
            user=link.serviceprovider.user,
            message=f'User asked if booking {booking.id} for service \"{booking.service.name}\" on {booking.date} at {booking.time_slot} has been completed.'
        )
    return Response({'message': 'Notification sent to service provider(s)'})
