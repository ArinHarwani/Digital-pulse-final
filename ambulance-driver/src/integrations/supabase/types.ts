export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string
                    created_at: string
                    username: string
                    name: string | null
                    phone: string | null
                    family_phone: string | null
                    current_latitude: number | null
                    current_longitude: number | null
                    current_address: string | null
                    last_location_update: string | null
                    profile_complete: boolean | null
                }
                Insert: {
                    id?: string
                    created_at?: string
                    username: string
                    name?: string | null
                    phone?: string | null
                    family_phone?: string | null
                    current_latitude?: number | null
                    current_longitude?: number | null
                    current_address?: string | null
                    last_location_update?: string | null
                    profile_complete?: boolean | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    username?: string
                    name?: string | null
                    phone?: string | null
                    family_phone?: string | null
                    current_latitude?: number | null
                    current_longitude?: number | null
                    current_address?: string | null
                    last_location_update?: string | null
                    profile_complete?: boolean | null
                }
            }
            emergency_requests: {
                Row: {
                    id: string
                    created_at: string
                    patient_name: string | null
                    contact_number: string | null
                    emergency_type: string
                    latitude: number
                    longitude: number
                    status: string
                    assigned_hospital_id: string | null
                    request_id: string | null
                }
                Insert: {
                    id?: string
                    created_at?: string
                    patient_name?: string | null
                    contact_number?: string | null
                    emergency_type: string
                    latitude: number
                    longitude: number
                    status?: string
                    assigned_hospital_id?: string | null
                    request_id?: string | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    patient_name?: string | null
                    contact_number?: string | null
                    emergency_type?: string
                    latitude?: number
                    longitude?: number
                    status?: string
                    assigned_hospital_id?: string | null
                    request_id?: string | null
                }
            }
            emergencies: {
                Row: Record<string, any>
                Insert: Record<string, any>
                Update: Record<string, any>
            }
            hospitals: {
                Row: Record<string, any>
                Insert: Record<string, any>
                Update: Record<string, any>
            }
            patients: {
                Row: Record<string, any>
                Insert: Record<string, any>
                Update: Record<string, any>
            }
        }
    }
}
