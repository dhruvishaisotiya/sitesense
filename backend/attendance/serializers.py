from rest_framework import serializers
from django.utils import timezone
from datetime import date as datetime_date
from attendance.models import Attendance
from workers.models import Worker, ProjectWorker
from projects.models import Project

class SimpleWorkerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Worker
        fields = ('id', 'worker_id', 'full_name', 'skill_category', 'designation', 'daily_wage', 'profile_photo')


class SimpleProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ('id', 'project_code', 'project_name', 'building_type')


class AttendanceSerializer(serializers.ModelSerializer):
    worker_detail = SimpleWorkerSerializer(source='worker', read_only=True)
    project_detail = SimpleProjectSerializer(source='project', read_only=True)
    recorded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Attendance
        fields = (
            'id',
            'worker',
            'worker_detail',
            'project',
            'project_detail',
            'date',
            'status',
            'check_in_time',
            'check_out_time',
            'overtime_hours',
            'remarks',
            'recorded_by',
            'recorded_by_name',
            'created_at',
            'updated_at',
        )

    def get_recorded_by_name(self, obj):
        if obj.recorded_by:
            return obj.recorded_by.get_full_name() or obj.recorded_by.email
        return 'System'

    def validate_date(self, value):
        today = timezone.now().date()
        if value > today:
            raise serializers.ValidationError("Future attendance dates are not allowed.")
        return value

    def validate(self, data):
        worker = data.get('worker') or (self.instance.worker if self.instance else None)
        project = data.get('project') or (self.instance.project if self.instance else None)

        if worker and project:
            # Check worker is actively assigned to this project
            is_assigned = ProjectWorker.objects.filter(worker=worker, project=project, active_status=True).exists()
            if not is_assigned:
                raise serializers.ValidationError(
                    {"worker": f"Worker '{worker.full_name}' is not actively assigned to project '{project.project_name}'."}
                )

        return data


class BulkAttendanceItemSerializer(serializers.Serializer):
    worker_id = serializers.IntegerField()
    status = serializers.ChoiceField(choices=Attendance.Status.choices, default=Attendance.Status.PRESENT)
    check_in_time = serializers.TimeField(required=False, allow_null=True)
    check_out_time = serializers.TimeField(required=False, allow_null=True)
    overtime_hours = serializers.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    remarks = serializers.CharField(required=False, allow_blank=True, default='')


class BulkAttendanceSerializer(serializers.Serializer):
    project_id = serializers.IntegerField()
    date = serializers.DateField()
    items = BulkAttendanceItemSerializer(many=True)

    def validate_date(self, value):
        today = timezone.now().date()
        if value > today:
            raise serializers.ValidationError("Future attendance dates are not allowed.")
        return value

    def validate_project_id(self, value):
        try:
            Project.objects.get(id=value)
        except Project.DoesNotExist:
            raise serializers.ValidationError("Target project not found.")
        return value
