from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model

from users.serializers import (
    CustomTokenObtainPairSerializer,
    UserSerializer,
)
from users.permissions import IsAdminRole

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class CustomTokenRefreshView(TokenRefreshView):
    pass


class UserProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response(
                {"message": "Successfully logged out."},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {"error": "Invalid or expired token.", "details": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class RoleCapabilitiesView(APIView):
    permission_classes = [IsAuthenticated]

    ROLE_CAPABILITIES = {
        'ADMIN': {
            'role': 'ADMIN',
            'title': 'Administrator',
            'description': 'Full System Control & Operational Monitoring',
            'permissions': [
                'Create, Edit, Archive Projects',
                'Assign Project Managers',
                'View All Workers & Attendance Across All Projects',
                'View All Expenses & Material Purchases',
                'Manage System Users & Access Control',
                'Download Enterprise Analytical Reports',
                'Access Full AI Predictive Engine Dashboard',
                'System-wide Audit & Activity Logging'
            ]
        },
        'PROJECT_MANAGER': {
            'role': 'PROJECT_MANAGER',
            'title': 'Project Manager',
            'description': 'Project Operational Lead & Progress Controller',
            'permissions': [
                'Access Assigned Projects Only',
                'Manage & Assign Construction Workers',
                'Create & Assign Tasks to Engineers',
                'Review Completed Tasks & Milestones',
                'MANUALLY Update Overall Project Progress',
                'View Project Attendance & Expense Logs',
                'View AI Delay & Budget Risk Predictions',
                'Receive Real-Time Project Alerts'
            ]
        },
        'SITE_ENGINEER': {
            'role': 'SITE_ENGINEER',
            'title': 'Site Engineer',
            'description': 'Field Execution & Site Data Recorder',
            'permissions': [
                'View Assigned Site Projects & Daily Tasks',
                'Mark Tasks as Completed with Field Notes',
                'Record Daily Worker Attendance',
                'Purchase Materials (Select or Custom Entry)',
                'Auto-trigger Expense Creation on Material Purchase',
                'Log Daily Rainfall, Machine Downtime & Site Status',
                'View AI Project Risk & Weather Forecast Predictions',
                'Receive Immediate Field Notifications'
            ]
        }
    }

    def get(self, request):
        role = request.user.role
        caps = self.ROLE_CAPABILITIES.get(role, {})
        return Response({
            "user": UserSerializer(request.user).data,
            "capabilities": caps
        })


class AdminUserCreateView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password') or 'password123'
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        role = request.data.get('role', User.Role.SITE_ENGINEER)
        phone_number = request.data.get('phone_number', '')
        department = request.data.get('department', '')
        employee_id = request.data.get('employee_id', '')

        if not email:
            return Response({"error": "A unique email address is required for user account creation."}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({"error": f"An account with email '{email}' already exists. Please use a different email address."}, status=status.HTTP_400_BAD_REQUEST)

        if role not in [User.Role.PROJECT_MANAGER, User.Role.SITE_ENGINEER, User.Role.ADMIN]:
            return Response({"error": "Invalid user role specified."}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role=role,
            phone_number=phone_number,
            department=department,
            employee_id=employee_id
        )

        return Response({
            "message": f"Successfully created user '{user.get_full_name() or user.email}' as {user.get_role_display()}.",
            "user": UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)

