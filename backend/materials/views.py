from decimal import Decimal
from django.db import transaction, models
from django.db.models import Q, Sum, Count
from django.utils import timezone
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from materials.models import MaterialCatalog, MaterialPurchase, Expense
from projects.models import Project
from materials.serializers import (
    MaterialCatalogSerializer,
    MaterialPurchaseSerializer,
    ExpenseSerializer,
)
from materials.permissions import CanManageMaterialsPermission
from users.models import User


class MaterialCatalogViewSet(viewsets.ModelViewSet):
    permission_classes = [CanManageMaterialsPermission]
    queryset = MaterialCatalog.objects.all()
    serializer_class = MaterialCatalogSerializer

    def get_queryset(self):
        queryset = MaterialCatalog.objects.all()
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(category__icontains=search))
        return queryset.order_by('name')


class MaterialPurchaseViewSet(viewsets.ModelViewSet):
    permission_classes = [CanManageMaterialsPermission]
    serializer_class = MaterialPurchaseSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = MaterialPurchase.objects.all()

        if user.role == User.Role.PROJECT_MANAGER:
            queryset = queryset.filter(project__assigned_manager=user)
        elif user.role == User.Role.SITE_ENGINEER:
            queryset = queryset.filter(project__assigned_engineers=user)

        project_id = self.request.query_params.get('project_id', None)
        if project_id:
            queryset = queryset.filter(project_id=project_id)

        material_id = self.request.query_params.get('material_id', None)
        if material_id:
            queryset = queryset.filter(material_id=material_id)

        search_query = self.request.query_params.get('search', None)
        if search_query:
            queryset = queryset.filter(
                Q(purchase_id__icontains=search_query) |
                Q(supplier__icontains=search_query) |
                Q(invoice_number__icontains=search_query) |
                Q(custom_material_name__icontains=search_query) |
                Q(material__name__icontains=search_query)
            )

        return queryset.order_by('-purchase_date', '-created_at')

    @transaction.atomic
    def perform_create(self, serializer):
        purchase = serializer.save(purchased_by=self.request.user)

        # AUTOMATIC WORKFLOW: Create linked Expense record
        mat_name = purchase.get_material_display_name()
        Expense.objects.create(
            project=purchase.project,
            expense_category='Material Purchase',
            description=f"Purchase of {mat_name} ({purchase.quantity} {purchase.unit} @ ${purchase.unit_price:,.2f})",
            amount=purchase.total_cost,
            linked_material_purchase=purchase,
            created_by=self.request.user
        )

    @action(detail=False, methods=['get'], url_path='budget-summary')
    def budget_summary(self, request):
        project_id = request.query_params.get('project_id', None)
        user = request.user

        if project_id:
            try:
                projects = Project.objects.filter(id=project_id)
            except Project.DoesNotExist:
                return Response({"error": "Project not found."}, status=status.HTTP_404_NOT_FOUND)
        else:
            projects = Project.objects.all()
            if user.role == User.Role.PROJECT_MANAGER:
                projects = projects.filter(assigned_manager=user)
            elif user.role == User.Role.SITE_ENGINEER:
                projects = projects.filter(assigned_engineers=user)

        total_budget = projects.aggregate(total=Sum('total_budget'))['total'] or Decimal('0')

        expense_qs = Expense.objects.filter(project__in=projects)
        total_expenses = expense_qs.aggregate(total=Sum('amount'))['total'] or Decimal('0')

        remaining_budget = max(Decimal('0'), total_budget - total_expenses)
        used_percentage = round(float((total_expenses / total_budget) * 100), 1) if total_budget > 0 else 0.0

        purchase_qs = MaterialPurchase.objects.filter(project__in=projects)
        total_purchases_count = purchase_qs.count()

        today = timezone.now().date()
        today_purchases_count = purchase_qs.filter(purchase_date=today).count()
        today_spend = purchase_qs.filter(purchase_date=today).aggregate(total=Sum('total_cost'))['total'] or Decimal('0')

        # Material category breakdown
        material_distribution = []
        purchases = purchase_qs.select_related('material')
        cat_totals = {}
        for p in purchases:
            cat = p.material.category if p.material else 'Custom / Other'
            cat_totals[cat] = cat_totals.get(cat, Decimal('0')) + p.total_cost

        for cat, amt in cat_totals.items():
            material_distribution.append({
                "category": cat,
                "amount": float(amt)
            })

        return Response({
            "total_budget": float(total_budget),
            "total_expenses": float(total_expenses),
            "remaining_budget": float(remaining_budget),
            "budget_used_percentage": min(used_percentage, 100.0),
            "total_purchases_count": total_purchases_count,
            "today_purchases_count": today_purchases_count,
            "today_spend": float(today_spend),
            "material_distribution": material_distribution,
        })


class ExpenseViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [CanManageMaterialsPermission]
    serializer_class = ExpenseSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Expense.objects.all()

        if user.role == User.Role.PROJECT_MANAGER:
            queryset = queryset.filter(project__assigned_manager=user)
        elif user.role == User.Role.SITE_ENGINEER:
            queryset = queryset.filter(project__assigned_engineers=user)

        project_id = self.request.query_params.get('project_id', None)
        if project_id:
            queryset = queryset.filter(project_id=project_id)

        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(expense_category=category)

        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(expense_id__icontains=search) |
                Q(description__icontains=search) |
                Q(expense_category__icontains=search)
            )

        return queryset.order_by('-created_at')
