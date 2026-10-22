
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "audit_log": {
                  Row: {
                    "action": string,"actor_id": string | null,"actor_type": string,"created_at": string,"data": Json | null,"entity": string,"entity_id": string | null,"id": number,"ip": unknown,"organization_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"actor_type": string,"created_at"?: string,"data"?: Json | null,"entity": string,"entity_id"?: string | null,"id"?: never,"ip"?: unknown,"organization_id"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"actor_type"?: string,"created_at"?: string,"data"?: Json | null,"entity"?: string,"entity_id"?: string | null,"id"?: never,"ip"?: unknown,"organization_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "audit_log_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"customer_notes": {
                  Row: {
                    "author_staff_id": string | null,"author_user_id": string | null,"created_at": string,"customer_id": string,"deleted_at": string | null,"id": string,"organization_id": string,"pinned": boolean,"text": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_staff_id"?: string | null,"author_user_id"?: string | null,"created_at"?: string,"customer_id": string,"deleted_at"?: string | null,"id"?: string,"organization_id": string,"pinned"?: boolean,"text": string,"updated_at"?: string
                  }
                  Update: {
                    "author_staff_id"?: string | null,"author_user_id"?: string | null,"created_at"?: string,"customer_id"?: string,"deleted_at"?: string | null,"id"?: string,"organization_id"?: string,"pinned"?: boolean,"text"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "customer_notes_author_staff_id_fkey"
      columns: ["author_staff_id"]
isOneToOne: false
      referencedRelation: "staff_members"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "customer_notes_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customer_stats"
      referencedColumns: ["customer_id"]
    },{
      foreignKeyName: "customer_notes_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "customer_notes_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"customer_sessions": {
                  Row: {
                    "created_at": string,"customer_id": string,"expires_at": string,"id": string,"organization_id": string,"revoked_at": string | null,"token_hash": string,"user_agent": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"customer_id": string,"expires_at": string,"id"?: string,"organization_id": string,"revoked_at"?: string | null,"token_hash": string,"user_agent"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"customer_id"?: string,"expires_at"?: string,"id"?: string,"organization_id"?: string,"revoked_at"?: string | null,"token_hash"?: string,"user_agent"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "customer_sessions_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customer_stats"
      referencedColumns: ["customer_id"]
    },{
      foreignKeyName: "customer_sessions_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "customer_sessions_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"customers": {
                  Row: {
                    "birthday": string | null,"consent_at": string | null,"consent_source": string | null,"created_at": string,"deleted_at": string | null,"first_location_id": string | null,"id": string,"last_visit_at": string | null,"locale": string,"marketing_consent": boolean,"name": string,"notes_summary": string | null,"organization_id": string,"phone_e164": string,"qr_token": string,"updated_at": string,"usual_order": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "birthday"?: string | null,"consent_at"?: string | null,"consent_source"?: string | null,"created_at"?: string,"deleted_at"?: string | null,"first_location_id"?: string | null,"id"?: string,"last_visit_at"?: string | null,"locale"?: string,"marketing_consent"?: boolean,"name": string,"notes_summary"?: string | null,"organization_id": string,"phone_e164": string,"qr_token"?: string,"updated_at"?: string,"usual_order"?: string | null
                  }
                  Update: {
                    "birthday"?: string | null,"consent_at"?: string | null,"consent_source"?: string | null,"created_at"?: string,"deleted_at"?: string | null,"first_location_id"?: string | null,"id"?: string,"last_visit_at"?: string | null,"locale"?: string,"marketing_consent"?: boolean,"name"?: string,"notes_summary"?: string | null,"organization_id"?: string,"phone_e164"?: string,"qr_token"?: string,"updated_at"?: string,"usual_order"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "customers_first_location_id_fkey"
      columns: ["first_location_id"]
isOneToOne: false
      referencedRelation: "locations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "customers_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"feature_flags": {
                  Row: {
                    "config": NonNullable<Json>,"created_at": string,"enabled": boolean,"id": string,"key": string,"organization_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "config"?: NonNullable<Json>,"created_at"?: string,"enabled"?: boolean,"id"?: string,"key": string,"organization_id": string,"updated_at"?: string
                  }
                  Update: {
                    "config"?: NonNullable<Json>,"created_at"?: string,"enabled"?: boolean,"id"?: string,"key"?: string,"organization_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "feature_flags_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"job_runs": {
                  Row: {
                    "created_at": string,"id": string,"job": string,"location_id": string | null,"run_date": string,"stats": NonNullable<Json>,"status": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"job": string,"location_id"?: string | null,"run_date": string,"stats"?: NonNullable<Json>,"status"?: string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"job"?: string,"location_id"?: string | null,"run_date"?: string,"stats"?: NonNullable<Json>,"status"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "job_runs_location_id_fkey"
      columns: ["location_id"]
isOneToOne: false
      referencedRelation: "locations"
      referencedColumns: ["id"]
    }
                  ]
                },"locations": {
                  Row: {
                    "address": string | null,"brand_color": string | null,"created_at": string,"deleted_at": string | null,"id": string,"locale": string,"logo_path": string | null,"name": string,"organization_id": string,"settings": NonNullable<Json>,"slug": string,"timezone": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string | null,"brand_color"?: string | null,"created_at"?: string,"deleted_at"?: string | null,"id"?: string,"locale"?: string,"logo_path"?: string | null,"name": string,"organization_id": string,"settings"?: NonNullable<Json>,"slug": string,"timezone"?: string,"updated_at"?: string
                  }
                  Update: {
                    "address"?: string | null,"brand_color"?: string | null,"created_at"?: string,"deleted_at"?: string | null,"id"?: string,"locale"?: string,"logo_path"?: string | null,"name"?: string,"organization_id"?: string,"settings"?: NonNullable<Json>,"slug"?: string,"timezone"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "locations_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"loyalty_programs": {
                  Row: {
                    "active": boolean,"bonus_review_enabled": boolean,"bonus_story_enabled": boolean,"created_at": string,"deleted_at": string | null,"id": string,"location_id": string | null,"organization_id": string,"reward_description": string | null,"reward_expiry_days": number | null,"reward_name": string,"stamps_required": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"bonus_review_enabled"?: boolean,"bonus_story_enabled"?: boolean,"created_at"?: string,"deleted_at"?: string | null,"id"?: string,"location_id"?: string | null,"organization_id": string,"reward_description"?: string | null,"reward_expiry_days"?: number | null,"reward_name": string,"stamps_required": number,"updated_at"?: string
                  }
                  Update: {
                    "active"?: boolean,"bonus_review_enabled"?: boolean,"bonus_story_enabled"?: boolean,"created_at"?: string,"deleted_at"?: string | null,"id"?: string,"location_id"?: string | null,"organization_id"?: string,"reward_description"?: string | null,"reward_expiry_days"?: number | null,"reward_name"?: string,"stamps_required"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "loyalty_programs_location_id_fkey"
      columns: ["location_id"]
isOneToOne: false
      referencedRelation: "locations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "loyalty_programs_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"magic_links": {
                  Row: {
                    "created_at": string,"customer_id": string,"expires_at": string,"id": string,"organization_id": string,"token_hash": string,"used_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"customer_id": string,"expires_at": string,"id"?: string,"organization_id": string,"token_hash": string,"used_at"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"customer_id"?: string,"expires_at"?: string,"id"?: string,"organization_id"?: string,"token_hash"?: string,"used_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "magic_links_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customer_stats"
      referencedColumns: ["customer_id"]
    },{
      foreignKeyName: "magic_links_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "magic_links_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"memberships": {
                  Row: {
                    "created_at": string,"deleted_at": string | null,"id": string,"location_id": string | null,"organization_id": string,"role": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"deleted_at"?: string | null,"id"?: string,"location_id"?: string | null,"organization_id": string,"role": string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"deleted_at"?: string | null,"id"?: string,"location_id"?: string | null,"organization_id"?: string,"role"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "memberships_location_id_fkey"
      columns: ["location_id"]
isOneToOne: false
      referencedRelation: "locations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "memberships_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"message_templates": {
                  Row: {
                    "body": string,"created_at": string,"deleted_at": string | null,"id": string,"locale": string,"organization_id": string | null,"type": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"created_at"?: string,"deleted_at"?: string | null,"id"?: string,"locale": string,"organization_id"?: string | null,"type": string,"updated_at"?: string
                  }
                  Update: {
                    "body"?: string,"created_at"?: string,"deleted_at"?: string | null,"id"?: string,"locale"?: string,"organization_id"?: string | null,"type"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "message_templates_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"messages": {
                  Row: {
                    "ai_generated": boolean,"approved_by": string | null,"body": string,"channel": string,"created_at": string,"customer_id": string,"error": string | null,"id": string,"kind": string,"location_id": string | null,"opportunity_id": string | null,"organization_id": string,"provider": string | null,"provider_message_id": string | null,"scheduled_at": string | null,"sent_at": string | null,"status": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "ai_generated"?: boolean,"approved_by"?: string | null,"body": string,"channel"?: string,"created_at"?: string,"customer_id": string,"error"?: string | null,"id"?: string,"kind"?: string,"location_id"?: string | null,"opportunity_id"?: string | null,"organization_id": string,"provider"?: string | null,"provider_message_id"?: string | null,"scheduled_at"?: string | null,"sent_at"?: string | null,"status"?: string,"updated_at"?: string
                  }
                  Update: {
                    "ai_generated"?: boolean,"approved_by"?: string | null,"body"?: string,"channel"?: string,"created_at"?: string,"customer_id"?: string,"error"?: string | null,"id"?: string,"kind"?: string,"location_id"?: string | null,"opportunity_id"?: string | null,"organization_id"?: string,"provider"?: string | null,"provider_message_id"?: string | null,"scheduled_at"?: string | null,"sent_at"?: string | null,"status"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "messages_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customer_stats"
      referencedColumns: ["customer_id"]
    },{
      foreignKeyName: "messages_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messages_location_id_fkey"
      columns: ["location_id"]
isOneToOne: false
      referencedRelation: "locations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messages_opportunity_id_fkey"
      columns: ["opportunity_id"]
isOneToOne: false
      referencedRelation: "opportunities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messages_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"opportunities": {
                  Row: {
                    "context": NonNullable<Json>,"created_at": string,"customer_id": string,"decided_at": string | null,"decided_by": string | null,"dedupe_key": string,"detected_for": string,"id": string,"location_id": string,"organization_id": string,"rule_id": string,"status": string,"type": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "context"?: NonNullable<Json>,"created_at"?: string,"customer_id": string,"decided_at"?: string | null,"decided_by"?: string | null,"dedupe_key": string,"detected_for": string,"id"?: string,"location_id": string,"organization_id": string,"rule_id": string,"status"?: string,"type": string,"updated_at"?: string
                  }
                  Update: {
                    "context"?: NonNullable<Json>,"created_at"?: string,"customer_id"?: string,"decided_at"?: string | null,"decided_by"?: string | null,"dedupe_key"?: string,"detected_for"?: string,"id"?: string,"location_id"?: string,"organization_id"?: string,"rule_id"?: string,"status"?: string,"type"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "opportunities_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customer_stats"
      referencedColumns: ["customer_id"]
    },{
      foreignKeyName: "opportunities_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "opportunities_location_id_fkey"
      columns: ["location_id"]
isOneToOne: false
      referencedRelation: "locations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "opportunities_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "opportunities_rule_id_fkey"
      columns: ["rule_id"]
isOneToOne: false
      referencedRelation: "opportunity_rules"
      referencedColumns: ["id"]
    }
                  ]
                },"opportunity_rules": {
                  Row: {
                    "active": boolean,"created_at": string,"deleted_at": string | null,"id": string,"location_id": string | null,"organization_id": string,"params": NonNullable<Json>,"type": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"created_at"?: string,"deleted_at"?: string | null,"id"?: string,"location_id"?: string | null,"organization_id": string,"params"?: NonNullable<Json>,"type": string,"updated_at"?: string
                  }
                  Update: {
                    "active"?: boolean,"created_at"?: string,"deleted_at"?: string | null,"id"?: string,"location_id"?: string | null,"organization_id"?: string,"params"?: NonNullable<Json>,"type"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "opportunity_rules_location_id_fkey"
      columns: ["location_id"]
isOneToOne: false
      referencedRelation: "locations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "opportunity_rules_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"organizations": {
                  Row: {
                    "country": string,"created_at": string,"currency": string,"deleted_at": string | null,"id": string,"name": string,"onboarding": NonNullable<Json>,"plan": string,"status": string,"trial_ends_at": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "country": string,"created_at"?: string,"currency": string,"deleted_at"?: string | null,"id"?: string,"name": string,"onboarding"?: NonNullable<Json>,"plan"?: string,"status"?: string,"trial_ends_at"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "country"?: string,"created_at"?: string,"currency"?: string,"deleted_at"?: string | null,"id"?: string,"name"?: string,"onboarding"?: NonNullable<Json>,"plan"?: string,"status"?: string,"trial_ends_at"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"platform_admins": {
                  Row: {
                    "created_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"rate_limits": {
                  Row: {
                    "count": number,"key": string,"window_start": string
                  }
                  ComputedFields: never
                  Insert: {
                    "count"?: number,"key": string,"window_start": string
                  }
                  Update: {
                    "count"?: number,"key"?: string,"window_start"?: string
                  }
                  Relationships: [
                    
                  ]
                },"rewards": {
                  Row: {
                    "created_at": string,"customer_id": string,"earned_event_id": string,"expires_at": string | null,"id": string,"organization_id": string,"program_id": string,"redeemed_at": string | null,"redeemed_by_staff": string | null,"redeemed_event_id": string | null,"reward_name": string,"status": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"customer_id": string,"earned_event_id": string,"expires_at"?: string | null,"id"?: string,"organization_id": string,"program_id": string,"redeemed_at"?: string | null,"redeemed_by_staff"?: string | null,"redeemed_event_id"?: string | null,"reward_name": string,"status"?: string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"customer_id"?: string,"earned_event_id"?: string,"expires_at"?: string | null,"id"?: string,"organization_id"?: string,"program_id"?: string,"redeemed_at"?: string | null,"redeemed_by_staff"?: string | null,"redeemed_event_id"?: string | null,"reward_name"?: string,"status"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "rewards_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customer_stats"
      referencedColumns: ["customer_id"]
    },{
      foreignKeyName: "rewards_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "rewards_earned_event_id_fkey"
      columns: ["earned_event_id"]
isOneToOne: true
      referencedRelation: "stamp_events"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "rewards_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "rewards_program_id_fkey"
      columns: ["program_id"]
isOneToOne: false
      referencedRelation: "loyalty_programs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "rewards_redeemed_by_staff_fkey"
      columns: ["redeemed_by_staff"]
isOneToOne: false
      referencedRelation: "staff_members"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "rewards_redeemed_event_id_fkey"
      columns: ["redeemed_event_id"]
isOneToOne: false
      referencedRelation: "stamp_events"
      referencedColumns: ["id"]
    }
                  ]
                },"staff_devices": {
                  Row: {
                    "created_at": string,"id": string,"last_seen_at": string | null,"location_id": string,"name": string,"organization_id": string,"revoked_at": string | null,"token_hash": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"last_seen_at"?: string | null,"location_id": string,"name"?: string,"organization_id": string,"revoked_at"?: string | null,"token_hash": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"last_seen_at"?: string | null,"location_id"?: string,"name"?: string,"organization_id"?: string,"revoked_at"?: string | null,"token_hash"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "staff_devices_location_id_fkey"
      columns: ["location_id"]
isOneToOne: false
      referencedRelation: "locations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "staff_devices_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"staff_members": {
                  Row: {
                    "active": boolean,"created_at": string,"deleted_at": string | null,"display_name": string,"id": string,"organization_id": string,"role": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"created_at"?: string,"deleted_at"?: string | null,"display_name": string,"id"?: string,"organization_id": string,"role"?: string,"updated_at"?: string
                  }
                  Update: {
                    "active"?: boolean,"created_at"?: string,"deleted_at"?: string | null,"display_name"?: string,"id"?: string,"organization_id"?: string,"role"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "staff_members_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"staff_pins": {
                  Row: {
                    "active": boolean,"created_at": string,"failed_attempts": number,"id": string,"location_id": string,"locked_until": string | null,"organization_id": string,"pin_hash": string,"staff_member_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"created_at"?: string,"failed_attempts"?: number,"id"?: string,"location_id": string,"locked_until"?: string | null,"organization_id": string,"pin_hash": string,"staff_member_id": string,"updated_at"?: string
                  }
                  Update: {
                    "active"?: boolean,"created_at"?: string,"failed_attempts"?: number,"id"?: string,"location_id"?: string,"locked_until"?: string | null,"organization_id"?: string,"pin_hash"?: string,"staff_member_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "staff_pins_location_id_fkey"
      columns: ["location_id"]
isOneToOne: false
      referencedRelation: "locations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "staff_pins_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "staff_pins_staff_member_id_fkey"
      columns: ["staff_member_id"]
isOneToOne: false
      referencedRelation: "staff_members"
      referencedColumns: ["id"]
    }
                  ]
                },"stamp_events": {
                  Row: {
                    "created_at": string,"created_by_customer": boolean,"created_by_staff": string | null,"created_by_user": string | null,"customer_id": string,"evidence": Json | null,"id": string,"idempotency_key": string,"location_id": string,"organization_id": string,"program_id": string,"quantity": number,"reverses_event_id": string | null,"source_event_id": string | null,"type": string,"validated_at": string | null,"validated_by_staff": string | null,"validated_by_user": string | null,"validation_status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by_customer"?: boolean,"created_by_staff"?: string | null,"created_by_user"?: string | null,"customer_id": string,"evidence"?: Json | null,"id"?: string,"idempotency_key": string,"location_id": string,"organization_id": string,"program_id": string,"quantity": number,"reverses_event_id"?: string | null,"source_event_id"?: string | null,"type": string,"validated_at"?: string | null,"validated_by_staff"?: string | null,"validated_by_user"?: string | null,"validation_status"?: string
                  }
                  Update: {
                    "created_at"?: string,"created_by_customer"?: boolean,"created_by_staff"?: string | null,"created_by_user"?: string | null,"customer_id"?: string,"evidence"?: Json | null,"id"?: string,"idempotency_key"?: string,"location_id"?: string,"organization_id"?: string,"program_id"?: string,"quantity"?: number,"reverses_event_id"?: string | null,"source_event_id"?: string | null,"type"?: string,"validated_at"?: string | null,"validated_by_staff"?: string | null,"validated_by_user"?: string | null,"validation_status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "stamp_events_created_by_staff_fkey"
      columns: ["created_by_staff"]
isOneToOne: false
      referencedRelation: "staff_members"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "stamp_events_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customer_stats"
      referencedColumns: ["customer_id"]
    },{
      foreignKeyName: "stamp_events_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "stamp_events_location_id_fkey"
      columns: ["location_id"]
isOneToOne: false
      referencedRelation: "locations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "stamp_events_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "stamp_events_program_id_fkey"
      columns: ["program_id"]
isOneToOne: false
      referencedRelation: "loyalty_programs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "stamp_events_reverses_event_id_fkey"
      columns: ["reverses_event_id"]
isOneToOne: false
      referencedRelation: "stamp_events"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "stamp_events_source_event_id_fkey"
      columns: ["source_event_id"]
isOneToOne: false
      referencedRelation: "stamp_events"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "stamp_events_validated_by_staff_fkey"
      columns: ["validated_by_staff"]
isOneToOne: false
      referencedRelation: "staff_members"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "customer_stats": {
                  Row: {
                    "balance": number | null,"customer_id": string | null,"organization_id": string | null,"rewards_available": number | null,"rewards_redeemed": number | null,"visits": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "customers_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "create_organization_with_owner":
{ Args: { "p_country": string,"p_currency": string,"p_locale": string,"p_location_name": string,"p_name": string,"p_slug": string,"p_timezone": string }; Returns: Json
                           },
"customer_card":
{ Args: { "p_customer": string,"p_location": string }; Returns: Json
                           },
"owner_customer_card":
{ Args: { "p_customer": string,"p_location": string }; Returns: Json
                           },
"rate_limit_hit":
{ Args: { "p_key": string,"p_max": number,"p_window_seconds": number }; Returns: boolean
                           },
"redeem_reward":
{ Args: { "p_idempotency_key": string,"p_location": string,"p_reward": string,"p_staff": string }; Returns: Json
                           },
"register_visit":
{ Args: { "p_customer": string,"p_idempotency_key": string,"p_location": string,"p_staff": string }; Returns: Json
                           },
"request_bonus":
{ Args: { "p_customer": string,"p_evidence": Json,"p_idempotency_key": string,"p_location": string,"p_type": string }; Returns: Json
                           },
"set_staff_pin":
{ Args: { "p_location": string,"p_pin": string,"p_staff": string }; Returns: undefined
                           },
"slug_available":
{ Args: { "p_slug": string }; Returns: boolean
                           },
"staff_day_visits":
{ Args: { "p_location": string,"p_since": string }; Returns: {
              "created_at": string,"customer_id": string,"customer_name": string,"event_id": string,"staff_name": string,"undone": boolean
            }[]
                           },
"staff_pending_bonuses":
{ Args: { "p_location": string }; Returns: {
              "created_at": string,"customer_id": string,"customer_name": string,"event_id": string,"evidence": Json,"type": string
            }[]
                           },
"undo_visit":
{ Args: { "p_event": string,"p_staff": string,"p_window_minutes"?: number }; Returns: Json
                           },
"validate_bonus":
{ Args: { "p_approve": boolean,"p_event": string,"p_staff": string }; Returns: Json
                           },
"verify_staff_pin":
{ Args: { "p_location": string,"p_pin": string,"p_staff": string }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
