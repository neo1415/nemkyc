# Enhanced Events Log UI - Features Guide

## Overview
The Enhanced Events Log page provides a comprehensive SIEM-like interface for monitoring and analyzing security events in your application.

## Main Interface

### Header Section
```
┌─────────────────────────────────────────────────────────────┐
│ Security Events Log                                          │
│ Comprehensive SIEM-like logging and monitoring              │
└─────────────────────────────────────────────────────────────┘
```

### Action Bar
```
┌─────────────────────────────────────────────────────────────┐
│ [Events] [Analytics]    [Auto-refresh] [Export CSV] [Filters]│
└─────────────────────────────────────────────────────────────┘
```

## View Modes

### 1. Table View (Default)

#### Table Structure
```
┌──┬──────────────┬────────┬──────────┬──────┬─────────────┬─────────┬─────────┐
│▼ │ Timestamp    │ Action │ Severity │ Risk │ Actor       │ Details │ Actions │
├──┼──────────────┼────────┼──────────┼──────┼─────────────┼─────────┼─────────┤
│▼ │ Dec 10, 2025 │ login  │ INFO     │ 15   │ John Doe    │ 🌍 IP   │ [👁]    │
│  │ 14:30:25     │        │          │      │ john@ex.com │ 📱 Mobile│         │
│  │              │        │          │      │ [admin]     │ ⏱ 120ms │         │
└──┴──────────────┴────────┴──────────┴──────┴─────────────┴─────────┴─────────┘
```

#### Severity Badge Colors
- **CRITICAL**: Dark Red background, white text
- **ERROR**: Red background, white text
- **WARNING**: Orange background, white text
- **INFO**: Blue background, white text

#### Risk Score Colors
- **0-30**: Green (Low risk)
- **31-60**: Yellow (Medium risk)
- **61-80**: Orange (High risk)
- **81-100**: Red (Critical risk)

#### Expandable Row Details
When you click the chevron (▼), the row expands to show:
```
┌─────────────────────────────────────────────────────────────┐
│ Request Details              │ Device Info                  │
│ Method: POST                 │ Browser: Chrome 120          │
│ Path: /api/login             │ OS: Windows 11               │
│ Status: 200                  │ Location: Lagos, Nigeria     │
│ Session ID: abc123...        │ IP Hash: 5f4dcc3b...         │
│                                                              │
│ Additional Details                                           │
│ {                                                            │
│   "loginMethod": "email",                                    │
│   "mfaEnabled": true                                         │
│ }                                                            │
└─────────────────────────────────────────────────────────────┘
```

### 2. Analytics View

#### Summary Cards
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Total Events │ │Critical Events│ │Failed Logins │ │ Suspicious   │
│              │ │               │ │              │ │  Activity    │
│    1,234     │ │      12       │ │      45      │ │      8       │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

#### Charts Section
```
┌─────────────────────────────┐ ┌─────────────────────────────┐
│ Events by Type              │ │ Events by Severity          │
│                             │ │                             │
│     [Pie Chart]             │ │     [Bar Chart]             │
│                             │ │                             │
│ • login: 45%                │ │ INFO    ████████ 800        │
│ • submit: 30%               │ │ WARNING ████ 300            │
│ • view: 15%                 │ │ ERROR   ██ 100              │
│ • update: 10%               │ │ CRITICAL █ 34               │
└─────────────────────────────┘ └─────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│ Events Timeline                                               │
│                                                               │
│     [Line Chart]                                              │
│                                                               │
│ 100 │     ╱╲                                                  │
│  80 │    ╱  ╲    ╱╲                                           │
│  60 │   ╱    ╲  ╱  ╲                                          │
│  40 │  ╱      ╲╱    ╲                                         │
│  20 │ ╱              ╲                                        │
│   0 └─────────────────────────────────────────────────       │
│     00:00  04:00  08:00  12:00  16:00  20:00                 │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│ Top Active Users                                              │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐  │
│ │ John Doe                              [125 events]      │  │
│ │ john@example.com                                        │  │
│ └─────────────────────────────────────────────────────────┘  │
│ ┌─────────────────────────────────────────────────────────┐  │
│ │ Jane Smith                            [98 events]       │  │
│ │ jane@example.com                                        │  │
│ └─────────────────────────────────────────────────────────┘  │
│ ...                                                           │
└───────────────────────────────────────────────────────────────┘
```

## Advanced Filters Panel

```
┌───────────────────────────────────────────────────────────────┐
│ Advanced Filters                                          [X] │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│ Search                  Date Range              Quick Dates  │
│ [Search events...]      [Start] [End]          [Today]       │
│                                                 [Week]        │
│                                                 [Month]       │
│                                                 [Clear]       │
│                                                               │
│ [Save Filter Preset]  [Load preset... ▼]                     │
└───────────────────────────────────────────────────────────────┘
```

### Filter Features
- **Search**: Real-time search across all event fields
- **Date Range**: Custom start and end dates
- **Quick Dates**: One-click presets for common ranges
- **Save Preset**: Save current filter combination
- **Load Preset**: Quick access to saved filters

## Detail Modal

When you click the eye icon (👁) on any event:

```
┌───────────────────────────────────────────────────────────────┐
│ Event Details                                             [X] │
│ Complete information about this security event                │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│ Event Information          │ Actor Information               │
│ ID: evt_abc123...          │ UID: user_xyz789...             │
│ Timestamp: Dec 10, 2025    │ Name: John Doe                  │
│ Action: [login]            │ Email: john@example.com         │
│ Severity: [INFO]           │ Phone: +234...                  │
│ Risk Score: 15             │ Role: admin                     │
│                            │                                 │
│ Request Details            │ Device & Location               │
│ Method: POST               │ IP (Masked): 192.168.*.*        │
│ Path: /api/login           │ IP Hash: 5f4dcc3b...            │
│ Status: 200                │ Location: Lagos, Nigeria        │
│ Response Time: 120ms       │ Device: Mobile                  │
│ Session ID: abc123...      │ Browser: Chrome 120             │
│ Correlation ID: xyz789...  │ OS: Android 13                  │
│                                                               │
│ Additional Details                                            │
│ ┌───────────────────────────────────────────────────────┐    │
│ │ ▼ Object{3}                                      [📋] │    │
│ │   ├─ loginMethod: "email"                             │    │
│ │   ├─ mfaEnabled: true                                 │    │
│ │   └─ deviceFingerprint: "abc123..."                   │    │
│ └───────────────────────────────────────────────────────┘    │
│                                                               │
│ Metadata                                                      │
│ ┌───────────────────────────────────────────────────────┐    │
│ │ ▼ Object{2}                                      [📋] │    │
│ │   ├─ source: "web"                                    │    │
│ │   └─ version: "1.0.0"                                 │    │
│ └───────────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────────┘
```

### Modal Features
- **Complete Event Data**: All available information
- **JSON Viewer**: Expandable/collapsible nested data
- **Copy to Clipboard**: Click 📋 to copy any JSON object
- **Scrollable**: Large events can be scrolled
- **Responsive**: Works on mobile devices

## Pagination

```
┌───────────────────────────────────────────────────────────────┐
│ Showing 25 of 1,234 events                                    │
│                                                               │
│                    [◄ Previous] Page 1 of 50 [Next ►]        │
└───────────────────────────────────────────────────────────────┘
```

## Auto-Refresh Feature

When enabled:
```
[🔄 Auto-refresh] ← Spinning icon indicates active refresh
```
- Refreshes every 30 seconds
- Maintains current filters
- Shows toast notification on errors
- Can be toggled on/off

## Export Feature

Click "Export CSV" to download:
```
Timestamp,Action,Severity,Risk Score,Actor Name,Actor Email,...
"Dec 10, 2025 14:30:25","login","info",15,"John Doe","john@example.com",...
```

Filename format: `events-log-2025-12-10.csv`

## Mobile Responsive Design

### Mobile View (< 768px)
- Stacked layout
- Touch-friendly buttons
- Simplified table view
- Bottom sheet modals
- Swipe-friendly cards

### Tablet View (768px - 1024px)
- Condensed table
- 2-column analytics
- Responsive charts

### Desktop View (> 1024px)
- Full table view
- 4-column analytics
- Large charts

## Keyboard Shortcuts (Future Enhancement)

Potential shortcuts:
- `F` - Toggle filters
- `R` - Refresh events
- `E` - Export CSV
- `A` - Switch to analytics
- `T` - Switch to table
- `Esc` - Close modal

## Color Scheme

### Severity Colors
- **INFO**: #2196F3 (Blue)
- **WARNING**: #FF9800 (Orange)
- **ERROR**: #F44336 (Red)
- **CRITICAL**: #B71C1C (Dark Red)

### Risk Score Colors
- **Low (0-30)**: #10B981 (Green)
- **Medium (31-60)**: #F59E0B (Yellow)
- **High (61-80)**: #FF9800 (Orange)
- **Critical (81-100)**: #EF4444 (Red)

### UI Colors
- **Primary**: Blue (#3B82F6)
- **Secondary**: Gray (#6B7280)
- **Success**: Green (#10B981)
- **Danger**: Red (#EF4444)
- **Warning**: Orange (#F59E0B)

## Usage Tips

### Best Practices
1. **Use Date Presets**: Quick access to common time ranges
2. **Save Filters**: Save frequently used filter combinations
3. **Enable Auto-refresh**: For real-time monitoring
4. **Expand Rows**: Quick inline details without opening modal
5. **Use Analytics**: Visual overview of security posture

### Performance Tips
1. **Limit Date Range**: Smaller ranges load faster
2. **Use Specific Filters**: Reduce result set size
3. **Disable Auto-refresh**: When not actively monitoring
4. **Export Filtered Data**: Only export what you need

### Security Tips
1. **Review Critical Events**: Check red-highlighted events first
2. **Monitor Failed Logins**: Watch for brute force attempts
3. **Check Suspicious Activity**: Investigate anomalies
4. **Track Top Users**: Identify unusual activity patterns

## Summary

The Enhanced Events Log UI provides a powerful, intuitive interface for security event monitoring with:
- ✅ Dual view modes (Table & Analytics)
- ✅ Advanced filtering with saved presets
- ✅ Visual analytics with charts
- ✅ Detailed event inspection
- ✅ Real-time updates
- ✅ CSV export
- ✅ Mobile responsive design
- ✅ Color-coded severity and risk indicators
