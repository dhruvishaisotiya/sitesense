from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import datetime, date
from projects.models import Project

class MaterialCatalog(models.Model):
    name = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=100, default='General')
    default_unit = models.CharField(max_length=50, default='Units')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.category})"


class MaterialPurchase(models.Model):
    purchase_id = models.CharField(max_length=50, unique=True, blank=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='material_purchases')
    material = models.ForeignKey(
        MaterialCatalog,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='purchases'
    )
    custom_material_name = models.CharField(max_length=150, blank=True, default='')
    quantity = models.DecimalField(max_digits=12, decimal_places=2)
    unit = models.CharField(max_length=50)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    total_cost = models.DecimalField(max_digits=14, decimal_places=2)
    supplier = models.CharField(max_length=200)
    purchase_date = models.DateField(default=date.today)
    purchased_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='material_purchases'
    )
    invoice_number = models.CharField(max_length=100, blank=True, default='')
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-purchase_date', '-created_at']

    def save(self, *args, **kwargs):
        # Auto calculate total_cost
        if self.quantity and self.unit_price:
            self.total_cost = self.quantity * self.unit_price

        # Auto generate purchase_id
        if not self.purchase_id:
            current_year = datetime.now().year
            last_p = MaterialPurchase.objects.order_by('-id').first()
            next_num = 1
            if last_p and last_p.id:
                next_num = last_p.id + 1
            self.purchase_id = f"PUR-{current_year}-{next_num:03d}"
        super().save(*args, **kwargs)

    def get_material_display_name(self):
        if self.material:
            return self.material.name
        return self.custom_material_name or "Custom Material"

    def __str__(self):
        return f"{self.purchase_id} - {self.get_material_display_name()} (${self.total_cost}) @ {self.project.project_code}"


class Expense(models.Model):
    expense_id = models.CharField(max_length=50, unique=True, blank=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='expenses')
    expense_category = models.CharField(max_length=100, default='Material Purchase')
    description = models.TextField(blank=True, default='')
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    linked_material_purchase = models.OneToOneField(
        MaterialPurchase,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='linked_expense'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_expenses'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.expense_id:
            current_year = datetime.now().year
            last_exp = Expense.objects.order_by('-id').first()
            next_num = 1
            if last_exp and last_exp.id:
                next_num = last_exp.id + 1
            self.expense_id = f"EXP-{current_year}-{next_num:03d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.expense_id} - {self.expense_category} (${self.amount}) @ {self.project.project_code}"
