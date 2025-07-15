from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Service, Booking

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    model = User
    list_display = ['email', 'name', 'room_number', 'is_staff']
    search_fields = ['email', 'name']
    ordering = ['email']
    fieldsets = BaseUserAdmin.fieldsets + (
        (None, {'fields': ('name', 'room_number')}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        (None, {'fields': ('name', 'room_number')}),
    )

admin.site.register(Service)
admin.site.register(Booking)
