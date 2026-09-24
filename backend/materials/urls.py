from django.urls import path, include
from rest_framework.routers import DefaultRouter
from materials.views import (
    MaterialCatalogViewSet,
    MaterialPurchaseViewSet,
    ExpenseViewSet,
)

router = DefaultRouter()
router.register(r'catalog', MaterialCatalogViewSet, basename='material-catalog')
router.register(r'purchases', MaterialPurchaseViewSet, basename='material-purchase')
router.register(r'expenses', ExpenseViewSet, basename='expense')

urlpatterns = [
    path('', include(router.urls)),
]
