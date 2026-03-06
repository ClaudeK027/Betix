-- Migration: Fix Admin Notifications RLS
-- Description: Allow users with 'admin' or 'super_admin' roles to view and manage admin notifications.

-- 1. Drop old restrictive select policy if needed (or just add a new one, they are OR-ed)
-- To be safe and clean, let's redefine the select policy.

DROP POLICY IF EXISTS "Users can view their own or global notifications" ON public.notifications;

CREATE POLICY "Notifications visibility policy" 
ON public.notifications FOR SELECT 
USING (
    -- User sees their own
    user_id = auth.uid() OR 
    -- User sees global broadcasts
    (user_id IS NULL AND is_for_admin = false) OR
    -- Admin sees all admin-bound notifications
    (is_for_admin = true AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    ))
);

-- 2. Allow admins to mark as read
DROP POLICY IF EXISTS "Users can mark their own notifications as read" ON public.notifications;

CREATE POLICY "Notifications update policy" 
ON public.notifications FOR UPDATE 
USING (
    user_id = auth.uid() OR 
    (is_for_admin = true AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    ))
)
WITH CHECK (
    user_id = auth.uid() OR 
    (is_for_admin = true AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    ))
);
