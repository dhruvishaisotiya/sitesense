from django.urls import path
from users.views import (
    CustomTokenObtainPairView,
    CustomTokenRefreshView,
    UserProfileView,
    LogoutView,
    RoleCapabilitiesView,
    AdminUserCreateView,
)

urlpatterns = [
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('me/', UserProfileView.as_view(), name='user_profile'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('capabilities/', RoleCapabilitiesView.as_view(), name='role_capabilities'),
    path('create/', AdminUserCreateView.as_view(), name='admin_user_create'),
]
