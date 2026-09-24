from decimal import Decimal
from rest_framework import serializers
from django.contrib.auth import get_user_model
from dailylogs.models import ProjectDailyProgress
from projects.models import Project

User = get_user_model()

class SimpleUserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'full_name', 'role', 'avatar_url')

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.email


class SimpleProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ('id', 'project_code', 'project_name', 'building_type', 'total_budget')


class ProjectDailyProgressSerializer(serializers.ModelSerializer):
    project_detail = SimpleProjectSerializer(source='project', read_only=True)
    created_by_detail = SimpleUserSerializer(source='created_by', read_only=True)

    class Meta:
        model = ProjectDailyProgress
        fields = (
            'id',
            'progress_id',
            'project',
            'project_detail',
            'day_number',
            'building_type',
            'blocks',
            'floors',
            'area_sqft',
            'total_budget',
            'expected_workers',
            'current_workers',
            'attendance_percentage',
            'rainfall_mm',
            'rain_affected_work',
            'construction_stage',
            'progress_percentage',
            'budget_used',
            'created_by',
            'created_by_detail',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'progress_id', 'created_by', 'created_at', 'updated_at')


class ProjectDailyProgressCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectDailyProgress
        fields = (
            'id',
            'progress_id',
            'project',
            'day_number',
            'building_type',
            'blocks',
            'floors',
            'area_sqft',
            'total_budget',
            'expected_workers',
            'current_workers',
            'attendance_percentage',
            'rainfall_mm',
            'rain_affected_work',
            'construction_stage',
            'progress_percentage',
            'budget_used',
        )
        read_only_fields = ('id', 'progress_id')

    def validate_rainfall_mm(self, value):
        if value < Decimal('0.00'):
            raise serializers.ValidationError("Rainfall amount cannot be negative.")
        return value

    def validate(self, data):
        project = data.get('project') or (self.instance.project if self.instance else None)
        day_number = data.get('day_number') or (self.instance.day_number if self.instance else None)

        if project and day_number:
            existing = ProjectDailyProgress.objects.filter(project=project, day_number=day_number)
            if self.instance:
                existing = existing.exclude(pk=self.instance.pk)
            if existing.exists():
                raise serializers.ValidationError({
                    "day_number": f"A progress record already exists for project '{project.project_name}' on Day {day_number}. Duplicate entries are not allowed."
                })

        return data
