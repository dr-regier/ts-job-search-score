# Supabase Migration Guide

This document contains the complete setup instructions for migrating from localStorage to Supabase with authentication.

## 🚀 Quick Start

### 1. Run Database Schema

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy the contents of `/supabase/schema.sql`
5. Execute the SQL script
6. Verify tables were created in **Table Editor**

### 2. Create Storage Bucket

1. Navigate to **Storage** in your Supabase dashboard
2. Click **Create bucket**
3. Name: `resumes`
4. Set to **Private** (not public)
5. Click **Create bucket**

### 3. Configure Storage Bucket Policies

In the **Storage** → **Policies** tab for the `resumes` bucket, add these RLS policies:

**Policy 1: Allow users to upload their own resumes**
```sql
CREATE POLICY "Users can upload their own resumes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'resumes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

**Policy 2: Allow users to view their own resumes**
```sql
CREATE POLICY "Users can view their own resumes"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'resumes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

**Policy 3: Allow users to delete their own resumes**
```sql
CREATE POLICY "Users can delete their own resumes"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'resumes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### 4. Configure Google OAuth (Optional)

If you want Google sign-in:

1. Go to **Authentication** → **Providers** in Supabase dashboard
2. Enable **Google** provider
3. Follow instructions to create OAuth credentials in Google Cloud Console
4. Add the Client ID and Client Secret to Supabase
5. Add authorized redirect URLs:
   - `https://<your-project>.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (for development)

### 5. Add Environment Variables

Add to your `.env.local` file:

```bash
# Existing OpenAI, Firecrawl, Adzuna keys...

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

**Where to find these:**
- Go to **Project Settings** → **API** in Supabase dashboard
- Copy **Project URL** for `NEXT_PUBLIC_SUPABASE_URL`
- Copy **anon public** key for `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 6. Test the Setup

1. Start your development server:
   ```bash
   pnpm dev
   ```

2. Navigate to `http://localhost:3000`

3. You should be redirected to `/login`

4. Try signing up with:
   - Email/password
   - Google OAuth (if configured)

5. After sign-in, you should be redirected to `/` (home page)

6. Check that:
   - You can access `/profile`, `/jobs`, `/resumes`
   - You're redirected to `/login` when you sign out
   - Protected routes require authentication

## 📊 What Changed

### Architecture Changes

**Before (localStorage):**
- Data stored in browser localStorage
- No authentication
- All users share same data
- No server-side persistence

**After (Supabase):**
- Data stored in PostgreSQL database
- User authentication with email + Google OAuth
- Row Level Security (RLS) isolates user data
- Server-side persistence
- Resume files in Supabase Storage

### Code Changes

**New Files Created:**
- `/lib/supabase/client.ts` - Browser Supabase client
- `/lib/supabase/server.ts` - Server Supabase client
- `/lib/supabase/queries/profile.ts` - Profile database operations
- `/lib/supabase/queries/jobs.ts` - Jobs database operations
- `/lib/supabase/queries/resumes.ts` - Resumes database + Storage operations
- `/components/auth/AuthButton.tsx` - Sign in/out button
- `/app/login/page.tsx` - Login page with Auth UI
- `/app/auth/callback/route.ts` - OAuth callback handler
- `/middleware.ts` - Route protection middleware
- `/app/api/profile/route.ts` - GET profile API
- `/app/api/profile/save/route.ts` - POST save profile API
- `/app/api/jobs/route.ts` - GET jobs API
- `/app/api/jobs/save/route.ts` - POST save jobs API (used by agent)
- `/app/api/jobs/score/route.ts` - POST score jobs API (used by agent)
- `/app/api/jobs/[id]/status/route.ts` - PATCH job status API
- `/app/api/jobs/[id]/route.ts` - DELETE/PATCH job API
- `/app/api/resumes/upload/route.ts` - POST upload resume API
- `/app/api/resumes/[id]/route.ts` - GET/PATCH/DELETE resume API
- `/supabase/schema.sql` - Database schema

**Files Modified:**
- `/lib/context/ChatContext.tsx` - Uses Supabase instead of localStorage
- `/components/agent/tools/save-jobs.ts` - Calls `/api/jobs/save`
- `/components/agent/tools/score-jobs.ts` - Calls `/api/jobs/score`
- `/app/api/match/route.ts` - Fetches jobs + profile from Supabase

**Files Updated (Complete):**
- ✅ Pages: `/app/profile/page.tsx`, `/app/jobs/page.tsx`, `/app/resumes/page.tsx`
- ✅ Components: All profile, jobs, and resumes components migrated
- ✅ Layout: `/components/layout/Header.tsx` - AuthButton added
- ✅ API Routes: `/app/api/resumes/route.ts` - GET endpoint created

## 🔒 Security Features

### Row Level Security (RLS)

All tables have RLS policies ensuring:
- Users can only read their own data
- Users can only insert their own data
- Users can only update their own data
- Users can only delete their own data

### Storage Security

Resume files in Supabase Storage:
- Private bucket (not publicly accessible)
- RLS policies on storage objects
- Files organized by user ID: `{user_id}/{resume_id}.{ext}`

### Middleware Protection

Routes protected by middleware:
- `/` (home/chat)
- `/profile`
- `/jobs`
- `/resumes`

Unauthenticated users redirected to `/login`.

## 📝 Database Schema

### Tables

**profiles**
- `id` (UUID, references auth.users)
- `name` (TEXT)
- `professional_background` (TEXT)
- `skills` (TEXT[])
- `salary_min`, `salary_max` (INTEGER)
- `preferred_locations` (TEXT[])
- `job_preferences` (TEXT[])
- `deal_breakers` (TEXT)
- `scoring_weights` (JSONB)
- `created_via` (TEXT)
- `created_at`, `updated_at` (TIMESTAMPTZ)

**jobs**
- `id` (UUID)
- `user_id` (UUID, references auth.users)
- Job fields: `title`, `company`, `location`, `salary`, `description`, `requirements`, `url`, `source`, `discovered_at`
- Scoring fields: `score`, `score_breakdown` (JSONB), `reasoning`, `gaps`, `priority`
- Tracking fields: `application_status`, `status_updated_at`, `notes`
- `tailored_resume` (JSONB) - Stores generated resume data
- `created_at`, `updated_at` (TIMESTAMPTZ)

**resumes**
- `id` (UUID)
- `user_id` (UUID, references auth.users)
- `name` (TEXT)
- `file_path` (TEXT) - Path in Storage
- `file_size` (INTEGER)
- `format` (TEXT) - 'markdown' or 'text'
- `is_master` (BOOLEAN)
- `sections` (JSONB) - Parsed sections
- `created_at`, `updated_at` (TIMESTAMPTZ)

### Triggers

- Auto-update `updated_at` on all tables
- Auto-create profile on user signup

## 🎯 Migration Status

✅ **MIGRATION COMPLETE** - All components have been successfully migrated to Supabase:

1. ✅ Database schema created
2. ✅ Authentication system working
3. ✅ API routes for CRUD operations
4. ✅ Agent tools integrated with Supabase
5. ✅ ChatContext using Supabase
6. ✅ Updated existing pages (profile, jobs, resumes)
7. ✅ Updated UI components
8. ✅ AuthButton added to Header

### What Changed in UI Components

**Pages Updated:**
- `/app/profile/page.tsx` - Server-side rendering, no changes needed
- `/app/jobs/page.tsx` - Replaced localStorage with API calls, added loading/error states
- `/app/resumes/page.tsx` - Replaced localStorage with API calls, added content fetching

**Components Updated:**
- `/components/profile/ProfileForm.tsx` - API calls for GET/POST profile
- `/components/resumes/ResumeUpload.tsx` - FormData upload to Supabase Storage API
- `/components/resumes/ResumeEditDialog.tsx` - Fetch content from API, PATCH updates
- `/components/jobs/ScoreJobsDialog.tsx` - Fetch jobs/profile from API
- `/components/layout/Header.tsx` - Added AuthButton with sign-in/out

## 🐛 Troubleshooting

### Authentication Issues

**Problem:** Not redirected to login page
**Solution:** Check middleware is running and environment variables are set

**Problem:** Login page shows but can't sign in
**Solution:** Verify Supabase project URL and anon key in `.env.local`

### Database Issues

**Problem:** Error inserting data
**Solution:** Check RLS policies are created correctly

**Problem:** Can't find data after login
**Solution:** Verify user ID matches between auth.users and your tables

### Storage Issues

**Problem:** Resume upload fails
**Solution:** Check storage bucket exists and RLS policies are set

**Problem:** Can't download resume
**Solution:** Verify file_path in database matches actual file in Storage

## 📚 Resources

- [Supabase Next.js Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

✅ **Migration Status:** COMPLETE - All infrastructure and UI components migrated to Supabase.

## 🎉 Post-Migration Benefits

**For Users:**
- ✅ Secure authentication with email/password or Google OAuth
- ✅ Data accessible from any device
- ✅ Persistent data (survives browser refresh/clear)
- ✅ Multi-device synchronization
- ✅ Secure file storage for resumes

**For Developers:**
- ✅ Type-safe database queries with TypeScript
- ✅ Row Level Security for automatic data isolation
- ✅ Server-side rendering support
- ✅ Real-time capabilities (not yet implemented but available)
- ✅ Automatic backups and scaling
- ✅ No localStorage limitations (size, security, etc.)
