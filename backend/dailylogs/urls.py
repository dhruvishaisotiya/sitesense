from django.urls import path, include
from rest_framework.routers import DefaultRouter
from dailylogs.views import DailyLogViewSet

router = DefaultRouter()
router.register(r'', DailyLogViewSet, basename='dailylog')

urlpatterns = [
    path('', include(router.urls)),
]
