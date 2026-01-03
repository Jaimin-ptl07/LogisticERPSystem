-- Migration: Add Item-Level Status Tracking
-- Database: tms_db
-- This migration adds item-level status tracking to track individual item status
-- through the trip lifecycle: pending_to_assign, planning, loading, on_route, delivered

-- Step 1: Add item_status column to trip_orders table
-- This will store the overall status of items within a trip order
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'trip_orders'
        AND column_name = 'item_status'
    ) THEN
        ALTER TABLE trip_orders ADD COLUMN item_status VARCHAR(50) DEFAULT 'pending_to_assign' CHECK (
            item_status IN ('pending_to_assign', 'planning', 'loading', 'on_route', 'delivered', 'failed', 'returned')
        );

        COMMENT ON COLUMN trip_orders.item_status IS 'Item-level status: pending_to_assign (not assigned), planning (assigned to trip), loading (being loaded), on_route (in transit), delivered (completed), failed (delivery failed), returned (returned to sender)';
    END IF;
END $$;

-- Step 2: Update existing records - set item_status based on current trip status
-- For orders already assigned to trips, set to planning
DO $$
BEGIN
    -- Set item_status to 'planning' for orders assigned to trips in planning status
    UPDATE trip_orders to
    SET item_status = 'planning'
    WHERE EXISTS (
        SELECT 1 FROM trips t
        WHERE t.id = to.trip_id AND t.status = 'planning'
    ) AND to.item_status = 'pending_to_assign';

    -- Set item_status to 'loading' for orders assigned to trips in loading status
    UPDATE trip_orders to
    SET item_status = 'loading'
    WHERE EXISTS (
        SELECT 1 FROM trips t
        WHERE t.id = to.trip_id AND t.status = 'loading'
    ) AND to.item_status = 'pending_to_assign';

    -- Set item_status to 'on_route' for orders assigned to trips in on-route status
    UPDATE trip_orders to
    SET item_status = 'on_route'
    WHERE EXISTS (
        SELECT 1 FROM trips t
        WHERE t.id = to.trip_id AND t.status = 'on-route'
    ) AND to.item_status = 'pending_to_assign';

    -- Set item_status to 'delivered' for orders assigned to completed trips
    UPDATE trip_orders to
    SET item_status = 'delivered'
    WHERE EXISTS (
        SELECT 1 FROM trips t
        WHERE t.id = to.trip_id AND t.status = 'completed'
    ) AND to.item_status = 'pending_to_assign';
END $$;

-- Step 3: Add trigger to automatically update item_status when trip status changes
CREATE OR REPLACE FUNCTION update_item_status_on_trip_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Update item_status based on new trip status
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        UPDATE trip_orders
        SET item_status = CASE
            WHEN NEW.status = 'planning' THEN 'planning'
            WHEN NEW.status = 'loading' THEN 'loading'
            WHEN NEW.status = 'on-route' THEN 'on_route'
            WHEN NEW.status = 'completed' THEN 'delivered'
            WHEN NEW.status = 'cancelled' THEN 'pending_to_assign'
            ELSE item_status
        END
        WHERE trip_id = NEW.id
        AND item_status IN ('pending_to_assign', 'planning', 'loading', 'on_route', 'delivered');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic item status updates
DROP TRIGGER IF EXISTS trigger_update_item_status_on_trip_change ON trips;
CREATE TRIGGER trigger_update_item_status_on_trip_change
    AFTER UPDATE OF status ON trips
    FOR EACH ROW
    EXECUTE FUNCTION update_item_status_on_trip_status_change();

-- Step 4: Create index for faster queries on item_status
CREATE INDEX IF NOT EXISTS idx_trip_orders_item_status ON trip_orders(item_status);

-- Step 5: Add function to manually update item status (for individual item updates)
CREATE OR REPLACE FUNCTION update_trip_order_item_status(
    p_trip_id VARCHAR,
    p_order_id VARCHAR,
    p_new_status VARCHAR
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE trip_orders
    SET item_status = p_new_status
    WHERE trip_id = p_trip_id
    AND order_id = p_order_id
    AND p_new_status IN ('pending_to_assign', 'planning', 'loading', 'on_route', 'delivered', 'failed', 'returned');

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create function to update item status for all orders in a trip
CREATE OR REPLACE FUNCTION update_all_trip_orders_item_status(
    p_trip_id VARCHAR,
    p_new_status VARCHAR
) RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE trip_orders
    SET item_status = p_new_status
    WHERE trip_id = p_trip_id
    AND p_new_status IN ('pending_to_assign', 'planning', 'loading', 'on_route', 'delivered', 'failed', 'returned');

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Verification query - shows item status distribution
SELECT
    'Migration completed successfully!' as status,
    item_status,
    COUNT(*) as count
FROM trip_orders
GROUP BY item_status
ORDER BY item_status;
