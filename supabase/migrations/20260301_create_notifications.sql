-- Migration: Create Notifications Table
-- Description: Unified table for system notifications, user requests, and admin broadcasts.

CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE, -- Recipient (null = broadcast to all if not for admin)
    is_for_admin boolean NOT NULL DEFAULT false, -- True if this is a message/request FOR the admin
    sender_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL, -- Sender (null = system)
    type text NOT NULL, -- e.g., 'system', 'cancellation_request', 'support_message', 'broadcast'
    title text NOT NULL,
    message text NOT NULL,
    severity text DEFAULT 'info', -- 'info', 'warning', 'critical'
    is_read boolean NOT NULL DEFAULT false,
    action_url text, -- Optional deep link
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_for_admin ON public.notifications(is_for_admin);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own notifications (where they are the recipient) or public broadcasts (user_id is null AND not for admin)
CREATE POLICY "Users can view their own or global notifications" 
ON public.notifications FOR SELECT 
USING (
    user_id = auth.uid() OR 
    (user_id IS NULL AND is_for_admin = false)
);

-- Policy: Users can insert notifications ONLY if they are the sender AND it is directed to the admin
CREATE POLICY "Users can send messages/requests to admin" 
ON public.notifications FOR INSERT 
WITH CHECK (
    sender_id = auth.uid() AND 
    is_for_admin = true
);

-- Policy: Users can update ONLY the "is_read" status of their own notifications
CREATE POLICY "Users can mark their own notifications as read" 
ON public.notifications FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid()); -- Note: Ideally we restrict to only updating 'is_read', but RLS is whole-row. Server actions provide safety.

-- Note: Admin access (bypass RLS) is done via service_role key in server actions.
