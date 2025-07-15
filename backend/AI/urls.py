from django.urls import path
from .views import *

urlpatterns = [
    path('chat/', chat_with_ai),
    path('services/by-name/<str:name>/', get_service_by_name),
]
