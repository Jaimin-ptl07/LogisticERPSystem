"""
Shared Audit Client Library
This library provides a common interface for all microservices to log audit events
"""

import httpx
from typing import Optional, Dict, Any
from datetime import datetime
import logging
import asyncio

logger = logging.getLogger(__name__)


class AuditClient:
    """
    Audit client for sending audit logs to the Company Service.
    This should be used by all microservices to log their actions.
    """

    def __init__(
        self,
        company_service_url: str = None,
        auth_token: Optional[str] = None,
        timeout: float = 5.0
    ):
        """
        Initialize the audit client.

        Args:
            company_service_url: URL of the company service (default: http://company-service:8002)
            auth_token: JWT token for authentication (if needed)
            timeout: Request timeout in seconds
        """
        self.company_service_url = company_service_url or "http://company-service:8002"
        self.auth_token = auth_token
        self.timeout = timeout
        self._background_task = None

    async def log_event(
        self,
        tenant_id: str,
        user_id: str,
        entity_type: str,
        entity_id: str,
        action: str,
        module: str,
        user_name: Optional[str] = None,
        user_role: Optional[str] = None,
        user_email: Optional[str] = None,
        entity_name: Optional[str] = None,
        sub_module: Optional[str] = None,
        old_status: Optional[str] = None,
        new_status: Optional[str] = None,
        status_changed: bool = False,
        description: Optional[str] = None,
        reason: Optional[str] = None,
        notes: Optional[str] = None,
        meta_data: Optional[Dict[str, Any]] = None,  # Renamed from metadata (reserved in SQLAlchemy)
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        request_id: Optional[str] = None,
        background: bool = True
    ) -> Optional[Dict[str, Any]]:
        """
        Log an audit event.

        Args:
            tenant_id: Tenant ID for multi-tenancy
            user_id: ID of the user performing the action
            entity_type: Type of entity (order, trip, payment, customer, etc.)
            entity_id: ID of the affected entity
            action: Action performed (created, updated, deleted, approved, rejected, etc.)
            module: Service/module where action occurred (orders, finance, tms, driver, auth, company)
            user_name: Name of the user performing the action
            user_role: Role of the user performing the action
            user_email: Email of the user performing the action
            entity_name: Human-readable name of the entity
            sub_module: Specific sub-module (e.g., deliveries, approvals)
            old_status: Previous status before the action
            new_status: New status after the action
            status_changed: Whether this action resulted in a status change
            description: Description of the action
            reason: Reason for the action (for approvals/rejections)
            notes: Additional notes
            metadata: Additional flexible data
            ip_address: IP address of the request
            user_agent: User agent string
            request_id: Request ID for tracing
            background: If True, send the audit log in background without blocking

        Returns:
            Response from audit log API if background=False, None if background=True
        """
        audit_data = {
            "tenant_id": tenant_id,
            "user_id": user_id,
            "user_name": user_name,
            "user_role": user_role,
            "user_email": user_email,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "entity_name": entity_name,
            "action": action,
            "module": module,
            "sub_module": sub_module,
            "old_status": old_status,
            "new_status": new_status,
            "status_changed": status_changed,
            "description": description,
            "reason": reason,
            "notes": notes,
            "meta_data": meta_data,  # Renamed from metadata (reserved in SQLAlchemy)
            "ip_address": ip_address,
            "user_agent": user_agent,
            "request_id": request_id
        }

        # Remove None values to keep payload clean
        audit_data = {k: v for k, v in audit_data.items() if v is not None}

        if background:
            # Send audit log in background without blocking
            asyncio.create_task(self._send_audit_log_background(audit_data))
            return None
        else:
            # Send audit log synchronously
            return await self._send_audit_log(audit_data)

    async def _send_audit_log(self, audit_data: Dict[str, Any]) -> Dict[str, Any]:
        """Send audit log to company service"""
        url = f"{self.company_service_url}/api/v1/audit-logs"

        headers = {
            "Content-Type": "application/json"
        }

        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"

        logger.info(f"DEBUG: _send_audit_log - auth_token present: {bool(self.auth_token)}")
        logger.info(f"DEBUG: _send_audit_log - headers keys: {list(headers.keys())}")
        logger.info(f"DEBUG: _send_audit_log - sending to URL: {url}")
        logger.info(f"DEBUG: _send_audit_log - audit_data entity_type: {audit_data.get('entity_type')}")

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(url, json=audit_data, headers=headers)
                logger.info(f"DEBUG: _send_audit_log - response status: {response.status_code}")
                response.raise_for_status()
                result = response.json()
                logger.info(f"DEBUG: _send_audit_log - success: {result.get('id')}")
                return result

        except httpx.HTTPStatusError as e:
            logger.error(f"Audit log API error: {e.response.status_code} - {e.response.text}")
            # Don't raise - we don't want audit logging failures to break the main flow
            return {"error": str(e)}
        except Exception as e:
            logger.error(f"Failed to send audit log: {str(e)}")
            # Don't raise - we don't want audit logging failures to break the main flow
            return {"error": str(e)}

    async def _send_audit_log_background(self, audit_data: Dict[str, Any]):
        """Send audit log in background (fire and forget)"""
        try:
            await self._send_audit_log(audit_data)
        except Exception as e:
            # Log but don't raise since this is background
            logger.error(f"Background audit log failed: {str(e)}")

    # Convenience methods for common actions

    async def log_order_created(
        self,
        tenant_id: str,
        user_id: str,
        order_id: str,
        customer_name: Optional[str] = None,
        **kwargs
    ):
        """Convenience method to log order creation"""
        return await self.log_event(
            tenant_id=tenant_id,
            user_id=user_id,
            entity_type="order",
            entity_id=order_id,
            entity_name=f"Order {order_id} for {customer_name}" if customer_name else f"Order {order_id}",
            action="created",
            module="orders",
            description=f"Order {order_id} created",
            **kwargs
        )

    async def log_order_submitted(
        self,
        tenant_id: str,
        user_id: str,
        order_id: str,
        **kwargs
    ):
        """Convenience method to log order submission"""
        return await self.log_event(
            tenant_id=tenant_id,
            user_id=user_id,
            entity_type="order",
            entity_id=order_id,
            entity_name=f"Order {order_id}",
            action="submitted",
            module="orders",
            old_status="draft",
            new_status="submitted",
            status_changed=True,
            description=f"Order {order_id} submitted for finance approval",
            **kwargs
        )

    async def log_finance_approved(
        self,
        tenant_id: str,
        user_id: str,
        order_id: str,
        amount: Optional[float] = None,
        **kwargs
    ):
        """Convenience method to log finance approval"""
        return await self.log_event(
            tenant_id=tenant_id,
            user_id=user_id,
            entity_type="order",
            entity_id=order_id,
            entity_name=f"Order {order_id}",
            action="approved",
            module="finance",
            sub_module="approval",
            old_status="submitted",
            new_status="finance_approved",
            status_changed=True,
            description=f"Order {order_id} approved by finance",
            meta_data={"amount": amount} if amount else None,
            **kwargs
        )

    async def log_finance_rejected(
        self,
        tenant_id: str,
        user_id: str,
        order_id: str,
        reason: str,
        **kwargs
    ):
        """Convenience method to log finance rejection"""
        return await self.log_event(
            tenant_id=tenant_id,
            user_id=user_id,
            entity_type="order",
            entity_id=order_id,
            entity_name=f"Order {order_id}",
            action="rejected",
            module="finance",
            sub_module="approval",
            old_status="submitted",
            new_status="finance_rejected",
            status_changed=True,
            description=f"Order {order_id} rejected by finance",
            reason=reason,
            **kwargs
        )

    async def log_trip_created(
        self,
        tenant_id: str,
        user_id: str,
        trip_id: str,
        truck_plate: Optional[str] = None,
        driver_name: Optional[str] = None,
        **kwargs
    ):
        """Convenience method to log trip creation"""
        return await self.log_event(
            tenant_id=tenant_id,
            user_id=user_id,
            entity_type="trip",
            entity_id=trip_id,
            entity_name=f"Trip {trip_id} ({truck_plate}, {driver_name})",
            action="created",
            module="tms",
            sub_module="trips",
            description=f"Trip {trip_id} created",
            meta_data={
                "truck_plate": truck_plate,
                "driver_name": driver_name
            },
            **kwargs
        )

    async def log_order_assigned_to_trip(
        self,
        tenant_id: str,
        user_id: str,
        trip_id: str,
        order_id: str,
        **kwargs
    ):
        """Convenience method to log order assignment to trip"""
        return await self.log_event(
            tenant_id=tenant_id,
            user_id=user_id,
            entity_type="trip_order",
            entity_id=f"{trip_id}:{order_id}",
            entity_name=f"Order {order_id} in Trip {trip_id}",
            action="assigned",
            module="tms",
            sub_module="trips",
            description=f"Order {order_id} assigned to trip {trip_id}",
            meta_data={"trip_id": trip_id, "order_id": order_id},
            **kwargs
        )

    async def log_trip_status_change(
        self,
        tenant_id: str,
        user_id: str,
        trip_id: str,
        old_status: str,
        new_status: str,
        **kwargs
    ):
        """Convenience method to log trip status change"""
        return await self.log_event(
            tenant_id=tenant_id,
            user_id=user_id,
            entity_type="trip",
            entity_id=trip_id,
            entity_name=f"Trip {trip_id}",
            action="status_changed",
            module="tms",
            sub_module="trips",
            old_status=old_status,
            new_status=new_status,
            status_changed=True,
            description=f"Trip {trip_id} status changed from {old_status} to {new_status}",
            **kwargs
        )

    async def log_order_delivered(
        self,
        tenant_id: str,
        user_id: str,
        trip_id: str,
        order_id: str,
        customer_name: Optional[str] = None,
        **kwargs
    ):
        """Convenience method to log order delivery"""
        return await self.log_event(
            tenant_id=tenant_id,
            user_id=user_id,
            entity_type="order",
            entity_id=order_id,
            entity_name=f"Order {order_id}",
            action="delivered",
            module="driver",
            sub_module="delivery",
            old_status="on-route",
            new_status="delivered",
            status_changed=True,
            description=f"Order {order_id} delivered",
            meta_data={
                "trip_id": trip_id,
                "customer_name": customer_name
            },
            **kwargs
        )

    async def log_trip_completed(
        self,
        tenant_id: str,
        user_id: str,
        trip_id: str,
        **kwargs
    ):
        """Convenience method to log trip completion"""
        return await self.log_event(
            tenant_id=tenant_id,
            user_id=user_id,
            entity_type="trip",
            entity_id=trip_id,
            entity_name=f"Trip {trip_id}",
            action="completed",
            module="tms",
            sub_module="trips",
            old_status="on-route",
            new_status="completed",
            status_changed=True,
            description=f"Trip {trip_id} completed",
            **kwargs
        )


# Global audit client instance (can be overridden)
_global_audit_client: Optional[AuditClient] = None


def get_audit_client() -> AuditClient:
    """Get the global audit client instance"""
    global _global_audit_client
    if _global_audit_client is None:
        _global_audit_client = AuditClient()
    return _global_audit_client


def set_audit_client(client: AuditClient):
    """Set the global audit client instance"""
    global _global_audit_client
    _global_audit_client = client
