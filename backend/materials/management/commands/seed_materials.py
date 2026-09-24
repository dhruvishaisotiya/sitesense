from decimal import Decimal
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from materials.models import MaterialCatalog, MaterialPurchase, Expense
from projects.models import Project

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds 15 predefined material catalog items, sample material purchases, and auto-created expenses.'

    def handle(self, *args, **options):
        engineer_user = User.objects.filter(email='engineer@sitesense.ai').first() or User.objects.filter(role=User.Role.ADMIN).first()
        pm_user = User.objects.filter(email='manager@sitesense.ai').first()
        proj1 = Project.objects.filter(project_code='PRJ-2026-001').first()

        # 1. Seed 15 Predefined Catalog Materials
        catalog_items = [
            {'name': 'Cement', 'category': 'Structural', 'default_unit': 'Bags'},
            {'name': 'Steel', 'category': 'Structural', 'default_unit': 'Tons'},
            {'name': 'Sand', 'category': 'Raw Aggregate', 'default_unit': 'Cubic Meters'},
            {'name': 'Aggregate', 'category': 'Raw Aggregate', 'default_unit': 'Tons'},
            {'name': 'Bricks', 'category': 'Masonry', 'default_unit': 'Pieces'},
            {'name': 'Concrete', 'category': 'Structural', 'default_unit': 'Cubic Meters'},
            {'name': 'Paint', 'category': 'Finishing', 'default_unit': 'Liters'},
            {'name': 'Tiles', 'category': 'Finishing', 'default_unit': 'Sq Meters'},
            {'name': 'Glass', 'category': 'Finishing', 'default_unit': 'Panels'},
            {'name': 'Wood', 'category': 'Carpentry', 'default_unit': 'Planks'},
            {'name': 'PVC Pipe', 'category': 'Plumbing', 'default_unit': 'Meters'},
            {'name': 'Electrical Wire', 'category': 'Electrical', 'default_unit': 'Rolls'},
            {'name': 'Plumbing Fixtures', 'category': 'Plumbing', 'default_unit': 'Sets'},
            {'name': 'Reinforcement Bar', 'category': 'Structural', 'default_unit': 'Tons'},
            {'name': 'Bitumen', 'category': 'Paving & Waterproofing', 'default_unit': 'Drums'},
        ]

        created_cat_count = 0
        for item in catalog_items:
            obj, created = MaterialCatalog.objects.get_or_create(
                name=item['name'],
                defaults=item
            )
            if created:
                created_cat_count += 1

        self.stdout.write(self.style.SUCCESS(f"Seeded {created_cat_count} new material catalog items (Total: {MaterialCatalog.objects.count()})."))

        if not proj1:
            self.stdout.write(self.style.WARNING("Sample project PRJ-2026-001 not found. Skipping purchases seed."))
            return

        # 2. Seed Sample Purchases with Auto Linked Expense Creation
        cement_obj = MaterialCatalog.objects.filter(name='Cement').first()
        steel_obj = MaterialCatalog.objects.filter(name='Steel').first()
        rebar_obj = MaterialCatalog.objects.filter(name='Reinforcement Bar').first()

        sample_purchases = [
            {
                'project': proj1,
                'material': cement_obj,
                'quantity': Decimal('500.00'),
                'unit': 'Bags',
                'unit_price': Decimal('12.50'),
                'supplier': 'Apex Building Supplies Corp.',
                'invoice_number': 'INV-2026-8812',
                'notes': '500 bags Portland 50MPa grade cement for foundation pour.',
                'purchase_date': timezone.now().date() - timedelta(days=2),
                'purchased_by': engineer_user,
            },
            {
                'project': proj1,
                'material': steel_obj,
                'quantity': Decimal('15.00'),
                'unit': 'Tons',
                'unit_price': Decimal('850.00'),
                'supplier': 'Vanguard Structural Metals',
                'invoice_number': 'INV-2026-9041',
                'notes': 'Grade 60 structural steel columns for Level 3 framework.',
                'purchase_date': timezone.now().date() - timedelta(days=1),
                'purchased_by': engineer_user,
            },
            {
                'project': proj1,
                'material': None,
                'custom_material_name': 'High-Tensile Underground Trench Conduit',
                'quantity': Decimal('200.00'),
                'unit': 'Meters',
                'unit_price': Decimal('35.00'),
                'supplier': 'Polymer Pipe Direct',
                'invoice_number': 'INV-2026-9110',
                'notes': 'Custom heavy-duty HDPE cable protection conduit.',
                'purchase_date': timezone.now().date(),
                'purchased_by': engineer_user,
            }
        ]

        created_pur_count = 0
        for pdata in sample_purchases:
            invoice = pdata['invoice_number']
            if not MaterialPurchase.objects.filter(invoice_number=invoice).exists():
                purchase = MaterialPurchase(**pdata)
                purchase.save()

                # Create auto expense
                mat_name = purchase.get_material_display_name()
                Expense.objects.create(
                    project=purchase.project,
                    expense_category='Material Purchase',
                    description=f"Purchase of {mat_name} ({purchase.quantity} {purchase.unit} @ ${purchase.unit_price:,.2f})",
                    amount=purchase.total_cost,
                    linked_material_purchase=purchase,
                    created_by=engineer_user
                )
                created_pur_count += 1
                self.stdout.write(self.style.SUCCESS(f"[CREATED] Purchase '{purchase.purchase_id}' ({mat_name} - ${purchase.total_cost:,.2f}) & Auto Expense"))

        self.stdout.write(self.style.SUCCESS(f"\nSuccessfully seeded {created_pur_count} material purchases and linked expenses!"))
