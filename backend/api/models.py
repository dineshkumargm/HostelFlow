from django.contrib.auth.models import AbstractUser
from django.db import models
from django.contrib.auth import get_user_model

class User(AbstractUser):
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=100, blank=True, null=True)
    room_number = models.CharField(max_length=10, blank=True, null=True)
    is_serviceprovider = models.BooleanField(default=False)
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username'] 

    def __str__(self):
        return self.email


class Service(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    duration = models.CharField(max_length=50, blank=True)
    rating = models.FloatField(default=0.0)
    availability = models.BooleanField(default=True)
    provider_name = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return self.name


class Booking(models.Model):
    
    SERVICE_TIMES = [
        ('08:00-10:00', '8 AM - 10 AM'),
        ('10:00-12:00', '10 AM - 12 PM'),
        ('12:00-14:00', '12 PM - 2 PM'),
        ('14:00-16:00', '2 PM - 4 PM'),
        ('16:00-18:00', '4 PM - 6 PM'),
    ]

    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
    service = models.ForeignKey(Service, on_delete=models.CASCADE)
    date = models.DateField()
    time_slot = models.CharField(max_length=20, choices=SERVICE_TIMES)
    special_instructions = models.TextField(blank=True)
    status = models.CharField(max_length=20, default='Booked')
    rating = models.IntegerField(null=True, blank=True)
    comment = models.TextField(blank=True)

    def __str__(self):
        return f"{self.user} - {self.service} - {self.date}"
    
    class Meta:
        unique_together = ('service', 'date', 'time_slot')

# models.py

class ServiceProvider(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='provider_profile')
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15)
    specialization = models.CharField(max_length=100)
    
    def __str__(self):
        return self.name
    
class ServiceProviderService(models.Model):
    serviceprovider = models.ForeignKey(ServiceProvider, on_delete=models.CASCADE, related_name='service_links')
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='provider_links')

    class Meta:
        unique_together = ('serviceprovider', 'service')

    def __str__(self):
        return f"{self.serviceprovider.name} offers {self.service.name}"

class Notification(models.Model):
    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    read = models.BooleanField(default=False)

    def __str__(self):
        return f'Notification for {self.user.username}: {self.message[:30]}'