from decimal import Decimal
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db.models import Sum
from materials.models import MaterialCatalog, MaterialPurchase, Expense
from projects.models import Project

User = get_user_model()

class SimpleUserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'full_name', 'role')

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.email


class SimpleProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ('id', 'project_code', 'project_name', 'total_budget', 'building_type')


class MaterialCatalogSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaterialCatalog
        fields = ('id', 'name', 'category', 'default_unit', 'is_active', 'created_at', 'updated_at')


class ExpenseSerializer(serializers.ModelSerializer):
    project_detail = SimpleProjectSerializer(source='project', read_only=True)
    created_by_detail = SimpleUserSerializer(source='created_by', read_only=True)

    class Meta:
        model = Expense
        fields = (
            'id',
            'expense_id',
            'project',
            'project_detail',
            'expense_category',
            'description',
            'amount',
            'linked_material_purchase',
            'created_by',
            'created_by_detail',
            'created_at',
        )
        read_only_fields = ('id', 'expense_id', 'created_by', 'created_at')


class MaterialPurchaseSerializer(serializers.ModelSerializer):
    material_detail = MaterialCatalogSerializer(source='material', read_only=True)
    project_detail = SimpleProjectSerializer(source='project', read_only=True)
    purchased_by_detail = SimpleUserSerializer(source='purchased_by', read_only=True)
    material_name = serializers.SerializerMethodField()
    linked_expense_id = serializers.SerializerMethodField()

    class Meta:
        model = MaterialPurchase
        fields = (
            'id',
            'purchase_id',
            'project',
            'project_detail',
            'material',
            'material_detail',
            'material_name',
            'custom_material_name',
            'quantity',
            'unit',
            'unit_price',
            'total_cost',
            'supplier',
            'purchase_date',
            'purchased_by',
            'purchased_by_detail',
            'invoice_number',
            'notes',
            'linked_expense_id',
            'created_at',
        )
        read_only_fields = ('id', 'purchase_id', 'total_cost', 'purchased_by', 'created_at')

    def get_material_name(self, obj):
        return obj.get_material_display_name()

    def get_linked_expense_id(self, obj):
        if hasattr(obj, 'linked_expense') and obj.linked_expense:
            return obj.linked_expense.expense_id
        return None

    def validate_quantity(self, value):
        if value <= Decimal('0'):
            raise serializers.ValidationError("Quantity must be greater than zero.")
        return value

    def validate_unit_price(self, value):
        if value <= Decimal('0'):
            raise serializers.ValidationError("Unit price must be greater than zero.")
        return value

    def validate(self, data):
        project = data.get('project')
        quantity = data.get('quantity')
        unit_price = data.get('unit_price')
        material = data.get('material')
        custom_name = data.get('custom_material_name', '')

        if not material and not custom_name:
            raise serializers.ValidationError("Either select a material from the catalog or provide a custom material name.")

        if project and quantity and unit_price:
            calculated_cost = quantity * unit_price

            # Calculate total existing project expenses
            total_spent = Expense.objects.filter(project=project).aggregate(total=Sum('amount'))['total'] or Decimal('0')
            remaining_budget = project.total_budget - total_spent

            if calculated_cost > remaining_budget:
                raise serializers.ValidationError({
                    "total_cost": f"Purchase total cost (${calculated_cost:,.2f}) exceeds remaining project budget (${remaining_budget:,.2f}). Remaining budget cannot be negative."
                })

        return data
