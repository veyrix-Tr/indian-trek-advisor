# Guide Booking System Implementation Plan

This plan implements a complete guide booking system with user authentication, guide dashboards, admin verification, real-time updates, and SMS notifications using Supabase.

## Database Schema Extensions

### New Tables Required

**bookings table**
- id (uuid, primary key)
- trek_id (text, references treks)
- trekker_id (uuid, references profiles)
- guide_id (uuid, references guides)
- booking_date (date)
- status (enum: pending, guide_approved, admin_approved, confirmed, completed, cancelled)
- payment_status (enum: pending, paid)
- payment_amount (decimal)
- created_at (timestamptz)
- updated_at (timestamptz)
- trek_completion_date (date)

**guide_availability table**
- id (uuid, primary key)
- guide_id (uuid, references guides)
- date (date)
- status (enum: available, booked, unavailable)
- booking_id (uuid, references bookings, nullable)

**guide_ratings table**
- id (uuid, primary key)
- guide_id (uuid, references guides)
- trekker_id (uuid, references profiles)
- booking_id (uuid, references bookings)
- rating (int, 1-5)
- review (text)
- created_at (timestamptz)

**guide_trek_associations table**
- id (uuid, primary key)
- guide_id (uuid, references guides)
- trek_id (text)
- base_rate (decimal)
- created_at (timestamptz)

### Schema Updates to Existing Tables

**guides table additions**
- rating (decimal, default 4.5)
- total_ratings (int, default 5)
- available_dates (date[])

## API Endpoints

### Booking Flow APIs

**POST /api/bookings/create**
- Create booking request
- Check guide availability for date
- Set status to 'pending'
- Send SMS notification to guide

**GET /api/bookings/trek/:trekId/guides**
- Get available guides for specific trek
- Filter by date availability
- Include guide profiles with ratings

**POST /api/bookings/:id/approve-guide**
- Guide approves booking
- Update status to 'guide_approved'
- Send SMS to admin for verification

**POST /api/bookings/:id/approve-admin**
- Admin approves booking
- Update status to 'admin_approved'
- Send SMS to trekker for payment

**POST /api/bookings/:id/confirm-payment**
- Trekker confirms payment (popup)
- Update status to 'confirmed'
- Share guide contact with trekker
- Send SMS confirmation to both parties

**POST /api/bookings/:id/cancel**
- Guide or admin cancels booking
- Update status to 'cancelled'
- Send SMS notifications

**POST /api/bookings/:id/complete**
- Mark booking as completed
- Allow trekker to rate guide
- Update trek completion date

### Guide Dashboard APIs

**GET /api/guide/profile**
- Get guide profile with ratings
- Include associated treks and rates

**PUT /api/guide/profile**
- Update guide profile
- Update experience, certifications, known treks

**GET /api/guide/bookings**
- Get guide's bookings
- Filter by status
- Include trek details

**POST /api/guide/availability**
- Set guide availability dates
- Mark unavailable dates

**GET /api/guide/earnings**
- Get guide earnings summary
- Filter by date range

### Trekker APIs

**GET /api/trekker/bookings**
- Get trekker's bookings
- Filter by status
- Include guide details

**POST /api/trekker/rate-guide**
- Submit rating for completed trek
- Update guide average rating

### Admin APIs

**GET /api/admin/bookings/pending**
- Get pending bookings for admin approval

**GET /api/admin/guides/pending**
- Get pending guide verifications

**POST /api/admin/booking/:id/approve**
- Admin approves booking

**POST /api/admin/booking/:id/reject**
- Admin rejects booking with reason

## Frontend Components

### User Flow Components

**Guide Selection Page** (`/treks/:slug/guides`)
- Display available guides for selected trek
- Show guide profiles with ratings, experience
- Date picker for trekking date
- Filter guides by availability on selected date

**Guide Profile Card**
- Guide photo, name, rating
- Experience, languages spoken
- Known treks list
- Base rate per trek
- "Book this Guide" button

**Booking Request Modal**
- Selected guide details
- Trekking date confirmation
- Additional notes field
- Submit booking request

**Booking Status Dashboard** (`/dashboard/bookings`)
- List of user's bookings
- Status indicators
- Payment button for approved bookings
- Rate guide button for completed treks

### Guide Dashboard Components

**Guide Dashboard** (`/guide/dashboard`)
- Overview stats (bookings, earnings, rating)
- Upcoming bookings list
- Booking requests to approve/reject
- Profile management section

**Guide Profile Editor**
- Edit personal information
- Upload ID proof, certifications
- Set known treks and base rates
- Manage availability calendar

**Booking Management**
- View booking requests
- Approve/reject with reason
- View confirmed bookings
- Cancel if unavailable

### Admin Components

**Admin Booking Review** (`/admin/bookings`)
- Pending guide approvals
- Pending admin verifications
- Booking details with trekker/guide info
- Approve/reject actions

**Admin Guide Verification** (extend existing)
- Pending guide registrations
- Review documents
- Approve/reject verification

## Real-time Implementation

### Supabase Real-time Subscriptions

**Booking status updates**
- Subscribe to bookings table for guide_id
- Update UI when status changes
- Show notifications for new requests

**Guide availability**
- Subscribe to guide_availability table
- Update date picker availability in real-time

**Rating updates**
- Subscribe to guide_ratings table
- Update guide average rating display

## SMS Integration (Brevo)

### Notification Triggers

**New booking request** → Guide
- Trekker name, trek name, date
- Link to approve/reject

**Guide approved** → Admin
- Guide name, trekker name, trek details
- Link to admin approval

**Admin approved** → Trekker
- Payment instructions
- Link to confirm payment

**Payment confirmed** → Guide & Trekker
- Contact information shared
- Trek details confirmation

**Booking cancelled** → All parties
- Cancellation reason
- Refund information if applicable

**Booking completed** → Trekker
- Request to rate guide
- Link to rating form

## Implementation Phases

### Phase 1: Database & Core APIs
1. Extend Supabase schema with new tables
2. Implement booking CRUD APIs
3. Implement guide availability APIs
4. Set up Brevo SMS integration

### Phase 2: Guide Dashboard
1. Create guide dashboard layout
2. Implement profile management
3. Build booking management interface
4. Add availability calendar

### Phase 3: User Booking Flow
1. Build guide selection page
2. Create booking request modal
3. Implement booking status dashboard
4. Add payment confirmation popup

### Phase 4: Admin Extensions
1. Extend admin panel for booking approvals
2. Add booking statistics
3. Implement admin notifications

### Phase 5: Ratings & Real-time
1. Implement rating system
2. Add real-time subscriptions
3. Build rating UI
4. Update guide average calculations

### Phase 6: Polish & Testing
1. Add loading states and error handling
2. Implement proper RLS policies
3. Test complete booking flow
4. SMS notification testing

## Security Considerations

1. **Row Level Security**: Ensure users can only access their own bookings
2. **Admin Verification**: Only admins can approve bookings
3. **Guide Verification**: Only verified guides can receive bookings
4. **Payment Security**: Payment popup should be secure (even if fake for now)
5. **Contact Sharing**: Only share contact info after payment confirmation

## Additional Notes

- Initial guide ratings: Set to 4.5 with 5 total ratings for new guides
- Rating calculation: Average of last 5 actual user ratings
- Availability check: Query guide_availability table for date conflicts
- Cancellation: Guides can cancel up to 48 hours before trek date
- Payment: Use popup modal, store payment_status in database
- Brevo API: Use existing Brevo account or new setup
