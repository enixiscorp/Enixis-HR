// Database types based on schema.sql

export type UserRole = 'collaborator' | 'admin' | 'super_admin'

export type UserStatus =
    | 'active'
    | 'on_leave'
    | 'sick_leave'
    | 'personal_emergency'
    | 'terminated'
    | 'collaboration_ended'
    | 'paid_weekly'
    | 'paid_biweekly'
    | 'paid_monthly'
    | 'suspended'

export type PeriodType = 'daily' | 'monthly' | 'quarterly' | 'yearly'

export type ScheduleStatus = 'scheduled' | 'completed' | 'cancelled' | 'off' | 'sick' | 'absent'

export type PaymentType = 'weekly' | 'biweekly' | 'monthly'

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refused'

export interface Profile {
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
    address: string | null
    avatar_url: string | null
    role: UserRole
    status: UserStatus
    created_at: string
    updated_at: string
}

export interface Revenue {
    id: string
    user_id: string
    amount: number
    date: string
    period_type: PeriodType
    description: string | null
    created_at: string
}

export interface Schedule {
    id: string
    user_id: string
    date: string
    start_time: string
    end_time: string
    status: ScheduleStatus
    breaks?: { type: '15' | '30' | '60', time: string }[]
    created_by: string | null
    created_at: string
    updated_at: string
}

export interface Payment {
    id: string
    user_id: string
    amount: number
    payment_date: string
    payment_type: PaymentType
    status: PaymentStatus
    description?: string | null
    created_by: string | null
    created_at: string
}

export interface StatusHistory {
    id: string
    user_id: string
    old_status: string | null
    new_status: string | null
    changed_by: string | null
    changed_at: string
    reason: string | null
}

export type AbsenceType = 'repos' | 'sick_leave' | 'on_leave'
export type RequestStatus = 'pending' | 'approved' | 'rejected'

export interface AbsenceRequest {
    id: string
    user_id: string
    date: string
    type: AbsenceType
    status: RequestStatus
    reason: string | null
    created_at: string
    updated_at: string
    processed_by: string | null
    processed_at: string | null
}
