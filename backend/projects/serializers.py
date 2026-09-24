from rest_framework import serializers
from django.contrib.auth import get_user_model
from projects.models import Project

User = get_user_model()

class ProjectManagerUserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'full_name', 'role', 'avatar_url', 'phone_number', 'department')

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.email


class ProjectSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    building_type_display = serializers.CharField(source='get_building_type_display', read_only=True)
    assigned_manager_detail = ProjectManagerUserSerializer(source='assigned_manager', read_only=True)
    assigned_engineers_detail = ProjectManagerUserSerializer(source='assigned_engineers', many=True, read_only=True)
    created_by_detail = ProjectManagerUserSerializer(source='created_by', read_only=True)

    class Meta:
        model = Project
        fields = (
            'id',
            'project_name',
            'project_code',
            'building_type',
            'building_type_display',
            'blocks',
            'floors',
            'area_sqft',
            'total_budget',
            'start_date',
            'planned_end_date',
            'current_progress',
            'status',
            'status_display',
            'assigned_manager',
            'assigned_manager_detail',
            'assigned_engineers',
            'assigned_engineers_detail',
            'description',
            'created_by',
            'created_by_detail',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'project_code', 'current_progress', 'created_by', 'created_at', 'updated_at')


class ProjectCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = (
            'id',
            'project_name',
            'building_type',
            'blocks',
            'floors',
            'area_sqft',
            'total_budget',
            'current_progress',
            'start_date',
            'planned_end_date',
            'status',
            'assigned_manager',
            'assigned_engineers',
            'description',
        )

    def validate_assigned_manager(self, value):
        if value and value.role != User.Role.PROJECT_MANAGER:
            raise serializers.ValidationError("Assigned user must have the Project Manager role.")
        return value

    def validate_assigned_engineers(self, value):
        if value:
            for eng in value:
                if eng.role != User.Role.SITE_ENGINEER:
                    raise serializers.ValidationError(f"User {eng.email} is not a Site Engineer.")
        return value

    def validate(self, data):
        start_date = data.get('start_date') or (self.instance.start_date if self.instance else None)
        planned_end_date = data.get('planned_end_date') or (self.instance.planned_end_date if self.instance else None)

        if start_date and planned_end_date and start_date > planned_end_date:
            raise serializers.ValidationError({"planned_end_date": "Planned end date cannot be earlier than start date."})

        if 'total_budget' in data and data['total_budget'] < 0:
            raise serializers.ValidationError({"total_budget": "Budget cannot be negative."})

        if 'area_sqft' in data and data['area_sqft'] < 0:
            raise serializers.ValidationError({"area_sqft": "Area cannot be negative."})

        return data
