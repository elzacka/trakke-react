# 🧪 Testing & Review Workflow Guide

This guide shows you how to test and review branches using your new automated workflow.

## 📱 Current Task: Review "Adjust Mobile Logo Position" Branch

**Branch:** `claude/adjust-mobile-logo-position-011CUQe8jJkpxvoSR19JgxGP`

---

## ✅ Step-by-Step Testing Workflow

### **Step 1: Check Preview Deployment Status**

Your branch should automatically deploy when pushed. Let's verify:

**Option A: Check GitHub Actions (Recommended)**

1. Go to GitHub: https://github.com/elzacka/trakke-react
2. Click **"Actions"** tab
3. Look for **"Deploy Branch Preview"** workflow
4. Find the run for branch `claude/adjust-mobile-logo-position-*`
5. Check status:
   - ✅ Green checkmark = Preview is ready!
   - 🟡 Yellow dot = Still building (wait ~2-3 min)
   - ❌ Red X = Build failed (click to see errors)

**Option B: Check Preview URL Directly**

Preview URL format:
```
https://elzacka.github.io/trakke-react/previews/claude-adjust-mobile-logo-position-011cuqe8jjkpxvosr19jgxgp/
```

Try opening this URL (note: branch name is lowercased and special chars become dashes)

---

### **Step 2: Test on Desktop** 🖥️

**2.1 Open Preview URL**

Open the preview URL in multiple browsers:
- Chrome: https://[preview-url]
- Firefox: https://[preview-url]
- Safari: https://[preview-url]

**2.2 Test Logo Position**

Check these specific things:
- [ ] Logo visibility in header
- [ ] Logo position on different screen sizes
- [ ] Logo doesn't overlap other elements
- [ ] Responsive behavior (resize browser window)

**2.3 Test Full Functionality**

Even though the change is just logo positioning, verify:
- [ ] Map loads correctly
- [ ] Search works
- [ ] POI categories work
- [ ] No console errors (F12 → Console tab)

**2.4 Test Responsive Breakpoints**

1. Open Chrome DevTools (F12)
2. Click device toolbar (Ctrl+Shift+M)
3. Test these sizes:
   - 320px (iPhone SE)
   - 375px (iPhone 12/13)
   - 768px (iPad)
   - 1024px (Desktop)
   - 1440px (Large desktop)

---

### **Step 3: Test on Mobile (iPhone)** 📱

**Option A: Using QR Code (If PR Exists)**

1. Go to GitHub pull requests
2. Find PR for this branch
3. Look for the preview deployment comment
4. Scan QR code with iPhone camera
5. Opens directly in Safari

**Option B: Manual URL Entry**

1. Copy the preview URL
2. Text/email it to yourself
3. Open on iPhone Safari
4. Or use this QR code generator:
   ```
   https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=https://elzacka.github.io/trakke-react/previews/claude-adjust-mobile-logo-position-011cuqe8jjkpxvosr19jgxgp/
   ```

**Option C: Share via Claude Code**

Just paste the preview URL in any chat/notes app on your Mac, open on iPhone.

**3.1 Test on iPhone**

Check specifically for this feature:
- [ ] Logo position looks good on mobile
- [ ] Logo doesn't cover other UI elements
- [ ] Logo is visible on small screens (iPhone SE)
- [ ] Logo works in portrait AND landscape
- [ ] Touch targets around logo still work

**3.2 Test Full Mobile Experience**

- [ ] Touch gestures work (pan, zoom, rotate)
- [ ] Long-press coordinate copy works
- [ ] POI tap/selection works
- [ ] Search panel opens/closes smoothly
- [ ] No layout shifts or jank

---

### **Step 4: Review the Code Changes** 👀

**4.1 See What Changed**

```bash
# From your terminal (or GitHub web UI)

# View all changes in this branch
git diff main...claude/adjust-mobile-logo-position-011CUQe8jJkpxvoSR19JgxGP

# Or view specific files that changed
git log main..claude/adjust-mobile-logo-position-011CUQe8jJkpxvoSR19JgxGP --oneline
```

**4.2 Review on GitHub**

1. Go to the Pull Request (if exists)
2. Click **"Files changed"** tab
3. Review each file:
   - Red lines = deleted
   - Green lines = added
   - Comment on specific lines if needed

**4.3 Check for Quality**

- [ ] Code follows TypeScript best practices
- [ ] No `any` types introduced
- [ ] Norwegian text for user-facing strings
- [ ] No hardcoded values (unless intentional)
- [ ] CSS changes make sense

---

### **Step 5: Decision Time** 🎯

Based on your testing, choose one of these actions:

#### **✅ Option A: Approve & Merge** (Everything looks good)

**If:**
- Logo position looks perfect on mobile AND desktop
- No bugs introduced
- Code quality is good

**Do this:**

1. **On GitHub:**
   - Go to the Pull Request
   - Click **"Merge pull request"**
   - Confirm merge
   - Delete branch (optional, recommended)

2. **Or via Terminal:**
   ```bash
   # Switch to main
   git checkout main

   # Pull latest changes
   git pull origin main

   # Merge the feature branch
   git merge --no-ff claude/adjust-mobile-logo-position-011CUQe8jJkpxvoSR19JgxGP

   # Push to main (triggers production deployment)
   git push origin main

   # Delete feature branch (cleanup)
   git push origin --delete claude/adjust-mobile-logo-position-011CUQe8jJkpxvoSR19JgxGP
   ```

3. **Result:**
   - Changes go to production: https://elzacka.github.io/trakke-react/
   - Feature branch deleted (clean repo)

---

#### **🔧 Option B: Request Changes** (Needs fixes)

**If:**
- Logo position needs adjustment
- Found bugs
- Code quality issues

**Do this:**

1. **Document Issues:**
   Create a list of what needs fixing:
   ```
   Issues found:
   - Logo overlaps search button on iPhone SE
   - Logo position too high on desktop
   - Console error when resizing window
   ```

2. **Request Changes via PR:**
   - Go to PR on GitHub
   - Click **"Files changed"**
   - Add comments on specific lines
   - Submit review: **"Request changes"**

3. **Or Create New Session with Claude:**
   ```
   "I tested the mobile logo branch. Issues found:
   1. Logo overlaps search on iPhone SE
   2. Position too high on desktop

   Please fix these issues in the same branch."
   ```

4. **After fixes:**
   - Claude pushes new commits
   - Preview auto-updates
   - Test again (repeat from Step 2)

---

#### **❌ Option C: Close/Reject** (Not needed)

**If:**
- Feature not needed
- Alternative solution preferred
- Decided against this change

**Do this:**

1. **On GitHub:**
   - Go to Pull Request
   - Add comment explaining why
   - Click **"Close pull request"**
   - Delete branch

2. **Via Terminal:**
   ```bash
   # Delete remote branch
   git push origin --delete claude/adjust-mobile-logo-position-011CUQe8jJkpxvoSR19JgxGP
   ```

---

#### **⏸️ Option D: Leave Open** (Need more time)

**If:**
- Want to test more
- Waiting for feedback
- Not ready to decide

**Do nothing!** Branch and preview stay available until you're ready.

---

## 🔄 **Complete Workflow Diagram**

```
┌─────────────────────────────────────────────┐
│  Feature Branch Pushed to GitHub            │
│  (claude/adjust-mobile-logo-*)              │
└─────────────────────────────────────────────┘
                    ↓
         ┌──────────────────┐
         │  GitHub Actions  │
         │  Auto-triggers:  │
         │  • Quality checks│
         │  • Tests         │
         │  • Build         │
         │  • Deploy        │
         └──────────────────┘
                    ↓
         ┌──────────────────┐
         │  Preview Deploy  │ ← Preview URL ready!
         │  + QR Code       │
         └──────────────────┘
                    ↓
         ┌──────────────────┐
         │   You Test:      │
         │   • Desktop      │ ← Test in browsers
         │   • Mobile       │ ← Scan QR code
         └──────────────────┘
                    ↓
         ┌──────────────────┐
         │  Your Decision:  │
         │  ✅ Merge        │ → Goes to production
         │  🔧 Changes      │ → Claude fixes, repeat
         │  ❌ Close        │ → Branch deleted
         │  ⏸️ Leave open  │ → Test more later
         └──────────────────┘
```

---

## 🎯 **Quick Commands Cheat Sheet**

```bash
# See all branches
git branch -a

# Check out a branch locally (to review code)
git checkout claude/adjust-mobile-logo-position-011CUQe8jJkpxvoSR19JgxGP

# See what changed
git diff main...HEAD

# Go back to main
git checkout main

# Merge a branch
git merge --no-ff claude/adjust-mobile-logo-position-011CUQe8jJkpxvoSR19JgxGP

# Push to main (production)
git push origin main

# Delete a branch
git push origin --delete claude/adjust-mobile-logo-position-011CUQe8jJkpxvoSR19JgxGP
```

---

## 📱 **Getting Preview URL**

**Method 1: From Branch Name**
```
https://elzacka.github.io/trakke-react/previews/[branch-name-lowercased]/
```

**Method 2: From GitHub Actions**
1. GitHub → Actions → Deploy Branch Preview
2. Click on the workflow run
3. Look for the preview URL in the summary

**Method 3: From PR Comment**
- Automatically posted by GitHub Actions

---

## 💡 **Pro Tips**

1. **Keep Multiple Preview URLs Open**
   - Compare old vs. new versions
   - Test different features side-by-side

2. **Use Browser DevTools**
   - Console: Check for errors
   - Network: Check API calls
   - Performance: Check load times

3. **Test Edge Cases**
   - Very long POI names
   - Slow network (throttle in DevTools)
   - Different zoom levels
   - Rotated map

4. **Take Screenshots**
   - Before/after comparisons
   - Bug documentation
   - Archive with cleanup script later

5. **Test on Real Devices**
   - QR code makes this super easy
   - Test on your actual iPhone
   - Better than simulator

---

## ❓ **Common Questions**

**Q: Preview not working?**
A: Check GitHub Actions for build errors. Wait 2-3 minutes after push.

**Q: Changes not showing?**
A: Hard refresh (Cmd+Shift+R on Mac, Ctrl+F5 on Windows). Clear cache.

**Q: How long do previews stay?**
A: Forever until branch is deleted. No automatic cleanup.

**Q: Can I have multiple previews?**
A: Yes! Each branch gets its own preview URL.

**Q: Preview URL formula?**
A: `https://elzacka.github.io/trakke-react/previews/[sanitized-branch-name]/`

**Q: What if I want to merge multiple branches?**
A: Test each separately, merge one at a time to avoid conflicts.

---

## 🎓 **Next Steps**

After you finish testing the mobile logo branch, you can:

1. **Review other branches** (if any exist)
2. **Start new features** with Claude Code
3. **Update dependencies** (Dependabot PRs)
4. **Clean up old branches**

---

**Ready to start? Let's test that mobile logo branch!** 🚀
