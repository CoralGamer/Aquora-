from supabase import create_client
from app.core.config import settings

def main():
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    
    email = "test_pilot_3@aquora.org"
    password = "PilotPassword123!"
    full_name = "Piloto Prueba 3"
    role = "community_member"
    
    print("Signing up user via Supabase Auth...")
    try:
        res = supabase.auth.sign_up({"email": email, "password": password})
        user_id = res.user.id
        print("Auth signup successful! User ID:", user_id)
        
        # Now update their public profile directly
        print("Updating user profile directly...")
        profile_res = supabase.table("user_profiles").update({
            "full_name": full_name,
            "role": role
        }).eq("id", user_id).execute()
        
        print("Profile update result:", profile_res.data)
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    main()
