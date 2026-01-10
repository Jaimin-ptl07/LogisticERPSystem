# Scheduler Service - Handles scheduled notifications
import logging
from datetime import datetime, timedelta
from typing import List
import asyncio

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import ScheduledNotification
from src.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)


class NotificationScheduler:
    """
    Scheduler for handling time-based notifications.

    Responsibilities:
    1. Check for due scheduled notifications every minute
    2. Process scheduled notifications and create actual notifications
    3. Check for orders due in 3 days (delivery reminders)
    4. Check for overdue orders
    5. Send daily summaries to users who enabled them
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def check_scheduled_notifications(self):
        """
        Check for and process due scheduled notifications.

        This should be called every minute by the scheduler.
        """
        try:
            # Get due scheduled notifications
            from src.services.notification_service import NotificationService

            notification_service = NotificationService(self.db)
            due_notifications = await notification_service.get_due_scheduled_notifications()

            logger.info(f"Processing {len(due_notifications)} scheduled notifications")

            for scheduled in due_notifications:
                try:
                    # Create the actual notification
                    await notification_service.create_notification(
                        user_id=scheduled.user_id,
                        tenant_id=scheduled.tenant_id,
                        type=scheduled.notification_type,
                        category="scheduled",
                        title=scheduled.title,
                        message=scheduled.message,
                        priority=scheduled.priority,
                        entity_type=scheduled.entity_type,
                        entity_id=scheduled.entity_id
                    )

                    # Mark scheduled notification as sent
                    await notification_service.mark_scheduled_sent(scheduled.id)

                    logger.info(
                        f"Sent scheduled notification {scheduled.id} "
                        f"to user {scheduled.user_id}"
                    )

                except Exception as e:
                    logger.error(
                        f"Error processing scheduled notification {scheduled.id}: {e}"
                    )

        except Exception as e:
            logger.error(f"Error in check_scheduled_notifications: {e}")

    async def check_delivery_reminders(self):
        """
        Check for orders due in 3 days and create reminder notifications.

        This should be called every hour by the scheduler.
        """
        try:
            # Query orders service for orders due in 3 days
            from src.services.notification_service import NotificationService
            import httpx

            notification_service = NotificationService(self.db)

            # Calculate the date range (3 days from now)
            three_days_from_now = datetime.utcnow() + timedelta(days=3)
            tomorrow = datetime.utcnow() + timedelta(days=1)

            # Query orders service for orders due in 3 days
            # This would typically call the orders service API
            # For now, we'll simulate the logic

            # TODO: Implement actual API call to orders service
            # async with httpx.AsyncClient() as client:
            #     response = await client.get(
            #         f"{settings.ORDERS_SERVICE_URL}/api/v1/orders/due-soon",
            #         params={
            #             "start_date": tomorrow.isoformat(),
            #             "end_date": three_days_from_now.isoformat()
            #         }
            #     )
            #     orders = response.json().get("orders", [])

            # For each order, create a reminder notification for the branch manager
            # for order in orders:
            #     # Resolve branch manager
            #     from src.services.recipient_resolver import RecipientResolver
            #     resolver = RecipientResolver()
            #     recipients = await resolver.resolve_branch_managers(order["tenant_id"])
            #
            #     for user_id in recipients:
            #         await notification_service.create_notification(
            #             user_id=user_id,
            #             tenant_id=order["tenant_id"],
            #             type="order_event",
            #             category="delivery_reminder",
            #             title=f"Delivery due in 3 days: Order #{order['order_number']}",
            #             message=f"Order #{order['order_number']} is scheduled for delivery "
            #                    f"on {order['delivery_date'].strftime('%Y-%m-%d')}",
            #             priority="normal",
            #             entity_type="order",
            #             entity_id=order["id"],
            #             action_url=f"/orders/{order['id']}"
            #         )

            logger.info("Checked delivery reminders")

        except Exception as e:
            logger.error(f"Error in check_delivery_reminders: {e}")

    async def check_overdue_orders(self):
        """
        Check for overdue orders and create alert notifications.

        This should be called every 30 minutes by the scheduler.
        """
        try:
            from src.services.notification_service import NotificationService
            import httpx

            notification_service = NotificationService(self.db)

            # Calculate overdue date (past due date)
            now = datetime.utcnow()

            # TODO: Implement actual API call to orders service
            # async with httpx.AsyncClient() as client:
            #     response = await client.get(
            #         f"{settings.ORDERS_SERVICE_URL}/api/v1/orders/overdue",
            #         params={"current_date": now.isoformat()}
            #     )
            #     orders = response.json().get("orders", [])

            # For each overdue order, create an alert notification
            # for order in orders:
            #     from src.services.recipient_resolver import RecipientResolver
            #     resolver = RecipientResolver()
            #
            #     # Notify both branch manager and finance manager
            #     branch_managers = await resolver.resolve_branch_managers(order["tenant_id"])
            #     finance_managers = await resolver.resolve_finance_managers(order["tenant_id"])
            #     recipients = list(set(branch_managers + finance_managers))
            #
            #     for user_id in recipients:
            #         await notification_service.create_notification(
            #             user_id=user_id,
            #             tenant_id=order["tenant_id"],
            #             type="alert",
            #             category="overdue_order",
            #             title=f"OVERDUE: Order #{order['order_number']}",
            #             message=f"Order #{order['order_number']} was due on "
            #                    f"{order['delivery_date'].strftime('%Y-%m-%d')} and is now overdue",
            #             priority="urgent",
            #             entity_type="order",
            #             entity_id=order["id"],
            #             action_url=f"/orders/{order['id']}"
            #         )

            logger.info("Checked overdue orders")

        except Exception as e:
            logger.error(f"Error in check_overdue_orders: {e}")

    async def send_daily_summaries(self):
        """
        Send daily summary notifications to users who enabled them.

        This should be called every minute by the scheduler (to check if any user's
        scheduled time has arrived).
        """
        try:
            from src.services.notification_service import NotificationService

            notification_service = NotificationService(self.db)
            now = datetime.utcnow()
            current_time = now.time()

            # Get users who have daily summary enabled and time matches now
            result = await self.db.execute(
                select(ScheduledNotification).where(
                    ScheduledNotification.notification_type == "daily_summary",
                    ScheduledNotification.status == "pending"
                )
            )
            scheduled_summaries = result.scalars().all()

            for scheduled in scheduled_summaries:
                # Check if scheduled time matches current time (within same minute)
                if scheduled.scheduled_for.time().hour == current_time.hour and \
                   scheduled.scheduled_for.time().minute == current_time.minute:

                    # Get notification statistics for the user
                    stats = await notification_service.get_user_stats(
                        scheduled.user_id,
                        scheduled.tenant_id
                    )

                    # Create daily summary notification
                    summary_message = self._format_daily_summary(stats)

                    await notification_service.create_notification(
                        user_id=scheduled.user_id,
                        tenant_id=scheduled.tenant_id,
                        type="system",
                        category="daily_summary",
                        title="Daily Summary",
                        message=summary_message,
                        priority="low"
                    )

                    # Mark as sent
                    await notification_service.mark_scheduled_sent(scheduled.id)

                    logger.info(
                        f"Sent daily summary to user {scheduled.user_id}"
                    )

        except Exception as e:
            logger.error(f"Error in send_daily_summaries: {e}")

    def _format_daily_summary(self, stats: dict) -> str:
        """Format daily summary message from statistics"""
        lines = [
            f"📊 Daily Summary",
            f"",
            f"Total notifications: {stats.get('total', 0)}",
            f"Unread: {stats.get('unread', 0)}",
        ]

        if stats.get('by_type'):
            lines.append(f"\nBy type:")
            for type_name, count in stats['by_type'].items():
                lines.append(f"  • {type_name}: {count}")

        if stats.get('by_priority'):
            lines.append(f"\nBy priority:")
            for priority, count in stats['by_priority'].items():
                lines.append(f"  • {priority}: {count}")

        return "\n".join(lines)


async def run_scheduler_tasks(db_factory):
    """
    Run all scheduler tasks. This is called by the APScheduler.

    Args:
        db_factory: Function that returns a new database session
    """
    # Create a new session directly from the session maker
    from src.database import async_session_maker

    async with async_session_maker() as db:
        scheduler = NotificationScheduler(db)
        # Run all scheduled tasks
        await scheduler.check_scheduled_notifications()
        # Only run these tasks on specific intervals (managed by APScheduler config)
        # await scheduler.check_delivery_reminders()
        # await scheduler.check_overdue_orders()
        # await scheduler.send_daily_summaries()
