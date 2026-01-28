# 🛡️ Unsaved Changes Protection - Feature Guide

## Overview

To prevent users from accidentally losing work, the editor now includes multiple layers of protection when there are unsaved/pending changes.

---

## 🎯 Protection Mechanisms

### 1. **Visual Warning Indicator**

**Location:** Back button (top left)

When there are pending changes:
- A **yellow pulsing dot** appears on the back button
- Tooltip shows "You have unsaved changes"
- Makes it visually clear that leaving is not recommended

```
┌─────────────────────────────────────────┐
│  [◄] 🟡  My Project   ✓ Synced          │  ← Yellow dot on back button
└─────────────────────────────────────────┘
```

---

### 2. **Beautiful Confirmation Modal**

**Trigger:** User clicks back button with pending changes

**Features:**
- Non-intrusive modal overlay
- Clear warning message
- Shows exact number of pending changes
- Two options: "Stay and Wait" or "Leave Anyway"
- Helpful tip about waiting for sync indicator

**Modal Design:**
```
┌────────────────────────────────────────────┐
│  ⚠️  Unsaved Changes               ✕       │
│                                             │
│  You have 3 pending changes that           │
│  haven't been saved yet.                   │
│                                             │
│  We'll try to save them before you         │
│  leave, but some changes might be lost.    │
│                                             │
│  ┌──────────────┐  ┌──────────────┐       │
│  │ Stay and Wait│  │ Leave Anyway │       │
│  └──────────────┘  └──────────────┘       │
│                                             │
│  💡 Tip: Wait for "Synced ✓" indicator    │
└────────────────────────────────────────────┘
```

---

### 3. **Browser Close Warning**

**Trigger:** User tries to close tab/window with pending changes

**Features:**
- Standard browser confirmation dialog
- Works on tab close, window close, or navigation
- Last line of defense against data loss

**Browser Dialog:**
```
┌─────────────────────────────────────────┐
│  Leave site?                            │
│                                         │
│  Your changes are still saving.         │
│  Are you sure you want to leave?        │
│                                         │
│         [Cancel]  [Leave]               │
└─────────────────────────────────────────┘
```

---

## 🔄 User Flows

### Flow 1: User Stays to Wait for Sync

```
1. User draws boxes
   ↓
2. Clicks back button
   ↓
3. Modal appears: "3 pending changes"
   ↓
4. User clicks "Stay and Wait"
   ↓
5. Modal closes
   ↓
6. Sync completes (indicator shows "Synced ✓")
   ↓
7. User clicks back again (no warning)
   ↓
8. Returns to projects safely
```

### Flow 2: User Leaves Despite Warning

```
1. User draws boxes
   ↓
2. Clicks back button
   ↓
3. Modal appears: "3 pending changes"
   ↓
4. User clicks "Leave Anyway"
   ↓
5. App attempts force sync
   ↓
6. Navigates to projects page
   ↓
7. Background sync continues if needed
```

### Flow 3: Trying to Close Browser

```
1. User draws boxes in offline mode
   ↓
2. Tries to close browser tab
   ↓
3. Browser warning: "Your changes are still saving"
   ↓
4a. User clicks "Cancel" → Stays in editor
4b. User clicks "Leave" → Tab closes
   ↓
5. On next visit, pending changes restored from IndexedDB
   ↓
6. Auto-sync happens when online
```

---

## 🎨 Visual States

### Back Button States

| State | Visual | Behavior |
|-------|--------|----------|
| **All Synced** | `[◄]` | Navigates immediately |
| **Syncing** | `[◄] 🟡` (pulsing) | Shows modal on click |
| **Pending** | `[◄] 🟡` (pulsing) | Shows modal on click |
| **Error** | `[◄] 🔴` | Shows modal on click |

### Sync Status Badge

| State | Badge | Back Button |
|-------|-------|-------------|
| ✓ Synced | Green | No warning |
| ↻ Syncing... | Blue | Yellow dot + modal |
| ⏱ N pending | Yellow | Yellow dot + modal |
| ! Error | Red | Red dot + modal |

---

## 💡 User Experience Benefits

### 1. **Prevents Data Loss**
- Catches accidental navigation
- Warns before closing browser
- Attempts to save before leaving

### 2. **Clear Communication**
- Visual indicator (yellow dot)
- Specific count of pending changes
- Helpful tips in modal

### 3. **User Control**
- Option to stay and wait
- Option to leave if urgent
- Non-blocking (can dismiss modal)

### 4. **Professional UX**
- Beautiful modal design
- Smooth animations
- Consistent with editor theme

---

## 🧪 Testing Scenarios

### Scenario 1: Normal Operation
```bash
✓ Draw boxes
✓ Wait for "Synced ✓"
✓ Click back → No warning
✓ Returns to projects
```

### Scenario 2: Quick Navigation
```bash
✓ Draw several boxes rapidly
✓ Immediately click back
✓ Modal appears with count
✓ Click "Stay and Wait"
✓ Wait for sync
✓ Click back again → Success
```

### Scenario 3: Forced Navigation
```bash
✓ Draw boxes
✓ Click back before sync
✓ Modal appears
✓ Click "Leave Anyway"
✓ App tries to sync
✓ Returns to projects
✓ Changes saved in background
```

### Scenario 4: Browser Close
```bash
✓ Draw boxes offline
✓ Try to close tab
✓ Browser warning appears
✓ Click "Cancel"
✓ Stay in editor
✓ Changes still queued
```

### Scenario 5: Data Recovery
```bash
✓ Draw boxes offline
✓ Force close browser (crash simulation)
✓ Reopen browser
✓ Navigate to editor
✓ Changes restored from IndexedDB
✓ Auto-sync when online
```

---

## 🔧 Implementation Details

### Code Location

1. **`ProjectEditor.jsx`**
   - `handleBackClick()` - Checks sync status, shows modal
   - `handleConfirmLeave()` - Force sync attempt before navigation
   - `beforeunload` event listener - Browser close warning

2. **`EditorHeader.jsx`**
   - Yellow dot indicator on back button
   - Tooltip showing unsaved changes
   - Pass sync status to parent

3. **`UnsavedChangesModal.jsx`**
   - Beautiful modal component
   - Backdrop with blur effect
   - Two action buttons
   - Helpful tip text

### State Management

```javascript
// In ProjectEditor.jsx
const [showUnsavedModal, setShowUnsavedModal] = useState(false)

// From useDetections hook
const { syncStatus } = useDetections(pageId)
// syncStatus = { syncing: false, pendingCount: 3 }
```

### Event Handlers

```javascript
// Browser close warning
window.addEventListener("beforeunload", (e) => {
  if (syncStatus.syncing || syncStatus.pendingCount > 0) {
    e.preventDefault()
    e.returnValue = "Your changes are still saving..."
    return e.returnValue
  }
})

// Back button with confirmation
async function handleBackClick() {
  if (syncStatus.syncing || syncStatus.pendingCount > 0) {
    setShowUnsavedModal(true) // Show beautiful modal
    return
  }
  navigate("/projects")
}
```

---

## 📊 Decision Tree

```
User clicks BACK button
         │
         ▼
    Check sync status
         │
    ┌────┴────┐
    │         │
    ▼         ▼
All synced  Has pending
    │         │
    │         ▼
    │    Show modal
    │         │
    │    ┌────┴────┐
    │    │         │
    │    ▼         ▼
    │  Stay    Leave Anyway
    │    │         │
    │    ▼         ▼
    │  Close    Force sync
    │  modal    (try to save)
    │             │
    ▼             ▼
Navigate ◄────Navigate
to projects   to projects
```

---

## 🎓 Best Practices

### For Users:
1. ✅ Watch the sync indicator before leaving
2. ✅ Wait for "Synced ✓" when possible
3. ✅ Read the modal message carefully
4. ✅ Use "Stay and Wait" for important changes

### For Developers:
1. ✅ Always check sync status before navigation
2. ✅ Attempt force sync when user confirms leave
3. ✅ Use beautiful modal instead of browser confirm
4. ✅ Provide visual indicators (dots, badges)
5. ✅ Give helpful tips in warnings

---

## 🚨 Edge Cases Handled

### 1. Rapid Clicks
- Modal prevents multiple instances
- Click "Stay" then click back again → Shows modal again
- No navigation spam

### 2. Sync During Modal
- User sees "3 pending"
- Sync completes while modal is open
- Count updates in real-time
- If all synced, user can close modal and leave

### 3. Force Sync Failure
- User clicks "Leave Anyway"
- Force sync attempt fails
- Navigation still proceeds
- Background sync continues
- Changes preserved in IndexedDB

### 4. Network Restoration
- User in offline mode with pending changes
- Tries to leave (modal shown)
- Network comes back during modal
- Auto-sync kicks in
- Count decreases in modal
- User sees progress

---

## ✨ Future Enhancements

1. **Progress Bar in Modal**
   - Show "Saving 2 of 5 changes..."
   - Real-time progress updates

2. **Smart Wait Time**
   - Estimate sync completion time
   - Show "~3 seconds remaining"

3. **Sync and Leave Button**
   - Third option: "Wait for Sync Then Leave"
   - Auto-navigate when complete

4. **Offline Indicator**
   - Show "Offline - Changes Will Sync Later"
   - Different message for offline state

---

## 📈 Success Metrics

- ✅ Zero accidental data loss
- ✅ Users understand pending changes
- ✅ Clear visual feedback
- ✅ Non-intrusive warnings
- ✅ Professional user experience

---

**This feature ensures users never lose work accidentally!** 🛡️
