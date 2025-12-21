"""
Import all schemas
"""
from src.schemas.order import (
    OrderBase,
    OrderCreate,
    OrderUpdate,
    OrderResponse,
    OrderListResponse,
    OrderListPaginatedResponse,
    OrderStatusUpdate,
    FinanceApprovalRequest,
    LogisticsApprovalRequest,
    OrderQueryParams,
)
from src.schemas.order_item import (
    OrderItemBase,
    OrderItemCreate,
    OrderItemUpdate,
    OrderItemResponse,
)
from src.schemas.order_document import (
    OrderDocumentBase,
    OrderDocumentCreate,
    OrderDocumentUpdate,
    OrderDocumentResponse,
    DocumentVerificationRequest,
    DocumentUploadResponse,
    DocumentListResponse,
)
from src.schemas.external import (
    Branch,
    Product,
    Customer
)

__all__ = [
    # Order schemas
    "OrderBase",
    "OrderCreate",
    "OrderUpdate",
    "OrderResponse",
    "OrderListResponse",
    "OrderListPaginatedResponse",
    "OrderStatusUpdate",
    "FinanceApprovalRequest",
    "LogisticsApprovalRequest",
    "OrderQueryParams",

    # Order item schemas
    "OrderItemBase",
    "OrderItemCreate",
    "OrderItemUpdate",
    "OrderItemResponse",

    # Order document schemas
    "OrderDocumentBase",
    "OrderDocumentCreate",
    "OrderDocumentUpdate",
    "OrderDocumentResponse",
    "DocumentVerificationRequest",
    "DocumentUploadResponse",
    "DocumentListResponse",

    # External service schemas
    "Branch",
    "Product",
    "Customer",
]
