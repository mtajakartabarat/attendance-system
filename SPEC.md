# Attendance System Specification

## 1. Project Overview
- **Project Name**: Attendance Recording System
- **Type**: Web Application (Next.js)
- **Core Functionality**: Record attendance via access code and view real-time attendance dashboard
- **Target Users**: Event attendees recording their presence

## 2. UI/UX Specification

### Layout Structure
- **Header**: Fixed top navigation with logo/title and navigation tabs
- **Main Content**: Centered container (max-w-4xl) with padding
- **Footer**: Simple footer with copyright

### Visual Design

#### Color Palette
- **Background**: `#0a0a0f` (deep dark)
- **Surface**: `#12121a` (card background)
- **Surface Elevated**: `#1a1a24` (hover states)
- **Border**: `#2a2a3a` (subtle borders)
- **Primary**: `#6366f1` (indigo-500)
- **Primary Hover**: `#818cf8` (indigo-400)
- **Success**: `#10b981` (emerald-500) - for "hadir"
- **Warning**: `#f59e0b` (amber-500) - for "izin"
- **Danger**: `#ef4444` (red-500) - for "sakit"
- **Info**: `#3b82f6` (blue-500) - for "kerja"
- **Neutral**: `#6b7280` (gray-500) - for others
- **Text Primary**: `#f8fafc` (slate-50)
- **Text Secondary**: `#94a3b8` (slate-400)
- **Text Muted**: `#64748b` (slate-500)

#### Typography
- **Font Family**: "Plus Jakarta Sans", sans-serif
- **Heading (h1)**: 2.5rem, font-bold
- **Heading (h2)**: 1.75rem, font-semibold
- **Body**: 1rem, font-normal
- **Small**: 0.875rem, font-medium

#### Spacing
- **Container Padding**: 24px (mobile), 48px (desktop)
- **Card Padding**: 24px
- **Section Gap**: 32px
- **Element Gap**: 16px

#### Visual Effects
- **Card Shadow**: `0 4px 24px rgba(0, 0, 0, 0.3)`
- **Border Radius**: 16px (cards), 12px (buttons), 8px (inputs)
- **Transitions**: 200ms ease-out

### Components

#### Navigation Tabs
- Two tabs: "Record Attendance" and "Dashboard"
- Active state: Primary color background with glow effect
- Inactive state: Transparent with muted text

#### Input Fields
- Full width with icon prefix
- Dark background (#1a1a24)
- Border on focus (primary color)
- Placeholder text in muted color

#### Buttons
- Primary: Indigo background, white text, hover glow
- Secondary: Transparent with border
- Full width on mobile

#### Cards
- Rounded corners (16px)
- Subtle border
- Shadow effect
- Hover lift animation

#### Status Badges
- Colored pills for each status
- Consistent padding and border-radius

#### Confirmation Dialog
- Modal overlay with blur backdrop
- Centered card with all attendee details
- Action buttons

#### Result Cards
- Grid layout (1 col mobile, 2 cols desktop)
- Clickable with hover effect
- Show name, perwakilan, cabang

#### Dashboard Stats
- Grid of stat cards (2 cols mobile, 4 cols desktop)
- Large number display
- Icon and label
- Color-coded by type

## 3. Functionality Specification

### Data Model
```typescript
interface Attendee {
  id: string;
  nama: string;
  perwakilan: string;
  cabang: string;
  gender: 'laki-laki' | 'perempuan';
  status?: AttendanceStatus;
  eventId: string;
}

interface Event {
  id: string;
  name: string;
  event_month: string;
  event_year: string;
  access_code: string;
  access_code_expiration: string;
}

type AttendanceStatus = 'hadir' | 'izin' | 'sakit' | 'kerja' | 'pulang_kampung' | 'tanpa_keterangan';
```

### Page 1: Record Attendance

#### Step 1: Enter Access Code
- Input field for access code
- Validate against events
- Show error if invalid/expired
- On success, show search interface

#### Step 2: Search by Name
- Input field for name search
- Debounced search (300ms)
- Show matching results in grid
- Show "no results" if empty

#### Step 3: Select & Confirm
- Click result card to select
- Show confirmation modal with:
  - Attendee name
  - Perwakilan
  - Cabang
  - Gender
  - Current status (if recorded)
- Status selection dropdown
- Submit and Cancel buttons

#### Step 4: Submit
- Show success toast
- Reset to search or show updated results

### Page 2: Dashboard

#### Step 1: Enter Access Code
- Input field for access code
- Validate against events
- Show error if invalid/expired
- On success, show dashboard

#### Dashboard Display
- **Header**: Event name, month/year
- **Total Attendance Card**: Total count with icon
- **By Gender Section**:
  - Male count with icon
  - Female count with icon
- **By Status Section**: Grid of status cards
  - Each with count, status name, color

### Mock Data
- 3 events with different access codes
- 30+ attendees distributed across events
- Various attendance statuses

## 4. Acceptance Criteria

### Record Attendance Flow
- [ ] User can enter access code
- [ ] Invalid code shows error message
- [ ] Valid code reveals search interface
- [ ] Search filters attendees by name
- [ ] Clicking result shows confirmation modal
- [ ] User can select attendance status
- [ ] Submit shows success and updates data
- [ ] Status persists in session

### Dashboard Flow
- [ ] User can enter access code
- [ ] Invalid code shows error message
- [ ] Valid code reveals dashboard
- [ ] Total attendance shown correctly
- [ ] Male/female breakdown shown
- [ ] Status breakdown shown with colors
- [ ] Stats reflect actual recorded data

### Visual
- [ ] Dark theme applied consistently
- [ ] Responsive on mobile and desktop
- [ ] Smooth animations
- [ ] Accessible colors
- [ ] Professional and modern design