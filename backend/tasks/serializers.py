from decimal import Decimal
from rest_framework import serializers
from django.contrib.auth import get_user_model
from tasks.models import Task
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
        fields = ('id', 'project_code', 'project_name', 'building_type', 'status', 'assigned_manager')


class TaskSerializer(serializers.ModelSerializer):
    project_detail = SimpleProjectSerializer(source='project', read_only=True)
    assigned_engineer_detail = SimpleUserSerializer(source='assigned_engineer', read_only=True)
    created_by_detail = SimpleUserSerializer(source='created_by', read_only=True)
    is_overdue = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = (
            'id',
            'task_id',
            'project',
            'project_detail',
            'assigned_engineer',
            'assigned_engineer_detail',
            'title',
            'description',
            'priority',
            'status',
            'due_date',
            'estimated_hours',
            'actual_hours',
            'completion_percentage',
            'manager_review_comments',
            'engineer_notes',
            'completion_photo',
            'created_by',
            'created_by_detail',
            'is_overdue',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'task_id', 'created_by', 'created_at', 'updated_at')

    def get_is_overdue(self, obj):
        from django.utils import timezone
        if obj.status not in [Task.Status.COMPLETED, Task.Status.APPROVED] and obj.due_date:
            return obj.due_date < timezone.now().date()
        return False


class TaskCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = (
            'id',
            'task_id',
            'project',
            'assigned_engineer',
            'title',
            'description',
            'priority',
            'status',
            'due_date',
            'estimated_hours',
        )
        read_only_fields = ('id', 'task_id')

    def validate_assigned_engineer(self, value):
        if value and value.role != User.Role.SITE_ENGINEER:
            raise serializers.ValidationError("Assigned user must have the Site Engineer role.")
        return value

    def validate_estimated_hours(self, value):
        if value < 0:
            raise serializers.ValidationError("Estimated hours cannot be negative.")
        return value


class TaskProgressUpdateSerializer(serializers.Serializer):
    completion_percentage = serializers.FloatField(min_value=0.0, max_value=100.0)
    actual_hours = serializers.DecimalField(max_digits=7, decimal_places=2, min_value=Decimal('0'), required=False)
    engineer_notes = serializers.CharField(required=False, allow_blank=True, default='')
    completion_photo = serializers.CharField(required=False, allow_blank=True, allow_null=True, default=None)


class TaskReviewSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=[Task.Status.APPROVED, Task.Status.REJECTED])
    manager_review_comments = serializers.CharField(required=False, allow_blank=True, default='')
