from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from projects.models import Project
from users.models import User
from ai_engine.services import AiPredictionService
from ai_engine.permissions import CanAccessAiPredictionPermission

@api_view(['GET'])
@permission_classes([IsAuthenticated, CanAccessAiPredictionPermission])
def predict_project_api(request, project_id):
    try:
        project = Project.objects.get(id=project_id)
    except Project.DoesNotExist:
        return Response({"error": "Project not found."}, status=status.HTTP_404_NOT_FOUND)

    # Role permission check for Project Manager & Site Engineer
    if request.user.role == User.Role.PROJECT_MANAGER and project.assigned_manager_id != request.user.id:
        return Response(
            {"error": "Project Managers can access predictions only for assigned projects."},
            status=status.HTTP_403_FORBIDDEN
        )
    elif request.user.role == User.Role.SITE_ENGINEER and not project.assigned_engineers.filter(id=request.user.id).exists():
        return Response(
            {"error": "Site Engineers can access predictions only for assigned projects."},
            status=status.HTTP_403_FORBIDDEN
        )

    force_refresh = request.query_params.get('refresh', 'false').lower() == 'true'

    try:
        prediction = AiPredictionService.predict_project(project_id, force_refresh=force_refresh)
        return Response(prediction, status=status.HTTP_200_OK)
    except ValueError as e:
        return Response({
            "error": "Prediction unavailable because required project data is incomplete.",
            "detail": str(e)
        }, status=status.HTTP_400_BAD_REQUEST)
    except RuntimeError as e:
        return Response({
            "error": "AI Model Not Loaded",
            "detail": str(e)
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    except Exception as e:
        return Response({
            "error": "Prediction error",
            "detail": str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated, CanAccessAiPredictionPermission])
def ai_projects_list(request):
    user = request.user
    queryset = Project.objects.all()

    if user.role == User.Role.PROJECT_MANAGER:
        queryset = queryset.filter(assigned_manager=user)
    elif user.role == User.Role.SITE_ENGINEER:
        queryset = queryset.filter(assigned_engineers=user)

    data = [
        {
            "id": p.id,
            "project_code": p.project_code,
            "project_name": p.project_name,
            "building_type": p.building_type,
            "current_progress": p.current_progress,
            "status": p.status,
            "total_budget": float(p.total_budget)
        }
        for p in queryset
    ]
    return Response(data, status=status.HTTP_200_OK)
