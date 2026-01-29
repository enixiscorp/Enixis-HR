-- Create messages table for chat functionality
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_read BOOLEAN DEFAULT FALSE,
    -- Add indexes for performance
    CONSTRAINT sender_receiver_not_same CHECK (sender_id <> receiver_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view messages they sent or received
DROP POLICY IF EXISTS "Users can view own messages" ON messages;
CREATE POLICY "Users can view own messages" ON messages
    FOR SELECT
    TO authenticated
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Policy: Users can insert messages where they are the sender
DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages" ON messages
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = sender_id);

-- Policy: Receivers can mark messages as read
DROP POLICY IF EXISTS "Receivers can update read status" ON messages;
CREATE POLICY "Receivers can update read status" ON messages
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = receiver_id)
    WITH CHECK (auth.uid() = receiver_id);

-- Force schema reload
NOTIFY pgrst, 'reload schema';
