from rest_framework import serializers
from django.contrib.auth import get_user_model
from workers.models import Worker, ProjectWorker
from projects.models import Project

User = get_user_model()


class SimpleProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ('id', 'project_name', 'project_code', 'building_type', 'status')


class ProjectWorkerSerializer(serializers.ModelSerializer):
    project_detail = SimpleProjectSerializer(source='project', read_only=True)
    assigned_by_name = serializers.SerializerMethodField()

    class Meta:
        model = ProjectWorker
        fields = (
            'id',
            'worker',
            'project',
            'project_detail',
            'assigned_date',
            'assigned_by',
            'assigned_by_name',
            'active_status',
            'created_at',
        )

    def get_assigned_by_name(self, obj):
        if obj.assigned_by:
            return obj.assigned_by.get_full_name() or obj.assigned_by.email
        return 'System'


class WorkerSerializer(serializers.ModelSerializer):
    current_assignment = serializers.SerializerMethodField()

    class Meta:
        model = Worker
        fields = (
            'id',
            'worker_id',
            'full_name',
            'phone_number',
            'email',
            'gender',
            'date_of_birth',
            'address',
            'emergency_contact_name',
            'emergency_contact_number',
            'skill_category',
            'designation',
            'daily_wage',
            'employment_type',
            'join_date',
            'status',
            'profile_photo',
            'notes',
            'current_assignment',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'worker_id', 'created_at', 'updated_at')

    def get_current_assignment(self, obj):
        active_pw = obj.project_assignments.filter(active_status=True).first()
        if active_pw:
            return ProjectWorkerSerializer(active_pw).data
        return None


class WorkerCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Worker
        fields = (
            'id',
            'full_name',
            'phone_number',
            'email',
            'gender',
            'date_of_birth',
            'address',
            'emergency_contact_name',
            'emergency_contact_number',
            'skill_category',
            'designation',
            'daily_wage',
            'employment_type',
            'join_date',
            'status',
            'profile_photo',
            'notes',
        )

    def validate_daily_wage(self, value):
        if value < 0:
            raise serializers.ValidationError("Daily wage cannot be negative.")
        return value


class AssignWorkerSerializer(serializers.Serializer):
    project_id = serializers.IntegerField()

    def validate_project_id(self, value):
        try:
            project = Project.objects.get(id=value)
        except Project.DoesNotExist:
            raise serializers.ValidationError("Target project does not exist.")
        return value
