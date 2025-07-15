from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import *

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('email', 'password', 'username', 'room_number')

    def create(self, validated_data):
        print(validated_data)
        user = User.objects.create_user(
            email=validated_data['email'],
            username=validated_data['username'],  # required by AbstractUser
            room_number=validated_data['room_number'],
            password=validated_data['password']
        )
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):
        user = authenticate(email=data['email'], password=data['password'])
        if user:
            return user

        raise serializers.ValidationError("Invalid credentials")


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'room_number', 'is_superuser', 'is_serviceprovider')

class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ['id', 'name', 'description', 'price', 'duration', 'rating', 'availability', 'provider_name']

class ServiceProviderServiceSerializer(serializers.ModelSerializer):
    service = ServiceSerializer(read_only=True)  # nested service details

    class Meta:
        model = ServiceProviderService
        fields = ['id', 'service', 'price', 'rating', 'availability']

class ServiceProviderSerializer(serializers.ModelSerializer):
    offered_services = ServiceProviderServiceSerializer(
        many=True,
        read_only=True,
        source='serviceproviderservice_set'  # default related_name
    )
    
    # Keep service_ids to accept list of services when creating/updating
    service_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Service.objects.all(),
        write_only=True
    )

    class Meta:
        model = ServiceProvider
        fields = [
            'id', 'user', 'name', 'email', 'phone', 'specialization',
            'offered_services', 'service_ids'
        ]


class BookingSerializer(serializers.ModelSerializer):
    provider_name = serializers.CharField(source='user.username', read_only=True)
    room_number = serializers.CharField(source='user.room_number', read_only=True)
    
    service = ServiceSerializer(read_only=True)
    service_id = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.all(), source='service', write_only=True
    )

    class Meta:
        model = Booking
        fields = [
            'id', 'user', 'service', 'service_id', 'date', 'time_slot',
            'special_instructions', 'status', 'rating', 'comment', 'provider_name',
            'room_number'
        ]
        read_only_fields = ['user', 'status', 'rating', 'comment']


class BookingRescheduleSerializer(serializers.Serializer):
    date = serializers.DateField()
    time_slot = serializers.ChoiceField(choices=Booking.SERVICE_TIMES)

class BookingRateSerializer(serializers.Serializer):
    rating = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(required=False)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'username', 'room_number', 'is_superuser', 'is_serviceprovider']




class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'message', 'created_at', 'read']
