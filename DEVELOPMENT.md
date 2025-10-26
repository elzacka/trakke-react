# Development Workflow Guide

This guide explains the most efficient ways to develop and test the Tråkke app.

## 🚀 Quick Start

```bash
npm run dev          # Desktop development only
npm run dev:network  # Development with iPhone/mobile testing
```

---

## Development Tiers (Use Based on Your Needs)

### ⚡️ Tier 1: Local Development with Live Mobile Testing (RECOMMENDED)

**Best for:** UI changes, component development, rapid iteration
**Speed:** Instant (changes appear in < 1 second)
**Service Worker:** Disabled (no cache issues)

#### Setup:

1. **On your development machine:**
   ```bash
   npm run dev:network
   ```

2. **Note your local IP address** from the terminal output:
   ```
   ➜  Local:   http://localhost:3000/
   ➜  Network: http://192.168.1.XXX:3000/
   ```

3. **On your iPhone:**
   - Connect to the **same WiFi network** as your dev machine
   - Open Safari
   - Navigate to: `http://192.168.1.XXX:3000/` (use your actual IP)
   - **Bookmark it** for quick access

#### Benefits:
- ✅ **Instant updates** - Hot Module Replacement (HMR) shows changes in < 1 second
- ✅ **No caching issues** - Service Worker disabled in development
- ✅ **No deployment wait** - Test immediately on your iPhone
- ✅ **Console debugging** - See errors in browser DevTools

#### Tips:
- Keep your iPhone on the same WiFi
- Use Safari Developer mode for remote debugging (Settings → Safari → Advanced → Web Inspector)
- If IP changes (after restart), just update the bookmark

---

### 🔧 Tier 2: Production Preview with Service Worker

**Best for:** Testing PWA features, offline mode, install prompts
**Speed:** Fast (~30 seconds for build + preview)
**Service Worker:** Enabled

```bash
npm run build:preview
```

Then on iPhone: Navigate to the Network URL shown (e.g., `http://192.168.1.XXX:4173`)

#### When to use:
- Testing the actual install popup behavior
- Testing offline functionality
- Verifying production build works correctly
- Testing Service Worker caching strategy

#### Clearing Service Worker cache:
1. Settings → Safari → Advanced → Website Data
2. Find and delete your local IP
3. Reload the page

---

### 🌐 Tier 3: GitHub Preview Deployment

**Best for:** Final testing, sharing with others, testing on different networks
**Speed:** Slow (2-3 minutes for CI/CD + deploy)
**Service Worker:** Enabled + aggressive caching

```bash
git add .
git commit -m "feat: your changes"
git push
```

Preview URL: `https://elzacka.github.io/trakke-react/previews/[branch-name]/`

#### When to use:
- Final verification before merging to main
- Sharing with team members or stakeholders
- Testing from different locations/networks
- CI/CD validation

#### Cache busting:
- Add `?v=X` to URL (increment X for each test)
- Or clear Safari website data (Settings → Safari → Advanced → Website Data)

---

## 📱 iPhone Safari Tips

### Remote Debugging (Inspect Element on iPhone)

1. **On iPhone:**
   - Settings → Safari → Advanced → Enable "Web Inspector"

2. **On Mac:**
   - Open Safari
   - Develop menu → [Your iPhone Name] → [Your page]
   - Full console access, inspect elements, etc.

### Force Reload
- Tap and hold the refresh button → Select "Request Desktop Website" → Switch back

### Clear Site Data Quickly
- Tap "aA" in address bar → Website Settings → Clear History and Data

---

## 🛠️ Common Development Commands

```bash
# Development
npm run dev                # Local development (desktop only)
npm run dev:network        # Local development (accessible on network)

# Building & Preview
npm run build              # Build for production
npm run build:preview      # Build + preview with network access
npm run preview            # Preview last build (local only)

# Code Quality
npm run lint               # Check for linting issues
npm run lint:fix           # Auto-fix linting issues
npm run typecheck          # Type checking without build
npm run format             # Format code with Prettier
npm test                   # Run tests in watch mode
npm run test:coverage      # Run tests with coverage report

# Deployment
git push                   # Auto-deploys preview for feature branches
```

---

## 🎯 Recommended Workflow for UI Changes

This is the **fastest and most efficient** workflow:

1. **Start dev server with network access:**
   ```bash
   npm run dev:network
   ```

2. **Note the Network URL** (e.g., `http://192.168.1.100:3000`)

3. **Open on iPhone Safari** and bookmark it

4. **Make your changes** in your editor

5. **See changes instantly** on iPhone (< 1 second via HMR)

6. **Iterate quickly** - no commit, no deploy, no cache issues

7. **When satisfied**, commit and push for CI/CD validation:
   ```bash
   git add .
   git commit -m "feat: improved popup design"
   git push
   ```

---

## 🐛 Troubleshooting

### "Can't connect to dev server from iPhone"

**Check:**
- Are both devices on the same WiFi network?
- Is your firewall blocking port 3000?
  ```bash
  # macOS: Allow in System Preferences → Security & Privacy → Firewall
  # Linux: sudo ufw allow 3000
  # Windows: Add exception in Windows Firewall
  ```
- Try the actual IP, not `localhost` or `127.0.0.1`

### "Changes not showing on iPhone"

**Solutions:**
- Check terminal - did HMR reload? Look for "[vite] hmr update"
- Hard reload: Tap and hold refresh button
- If using Tier 3 (GitHub): Wait for deployment + clear Safari cache
- If using Tier 2 (preview): Rebuild with `npm run build:preview`

### "Service Worker is caching old version"

**If in development (Tier 1):**
- Service Worker should be disabled - restart dev server

**If in preview/production (Tier 2/3):**
- Settings → Safari → Advanced → Website Data → Delete site
- Or add `?v=X` to URL (increment X)

### "HMR not working"

**Solutions:**
- Check that you're using `npm run dev:network`, not `npm run dev`
- Ensure ports 3000 and 3001 are open
- Restart the dev server
- Check console for HMR connection errors

---

## 📊 Development Tier Comparison

| Aspect | Tier 1 (Local) | Tier 2 (Preview) | Tier 3 (GitHub) |
|--------|----------------|------------------|-----------------|
| **Speed** | < 1 second | ~30 seconds | 2-3 minutes |
| **Service Worker** | Disabled | Enabled | Enabled |
| **Caching Issues** | None | Minimal | High |
| **Network Required** | Same WiFi | Same WiFi | Internet |
| **Best For** | Development | PWA testing | Final validation |
| **HMR** | ✅ Yes | ❌ No | ❌ No |

---

## 🎓 Best Practices

1. **Use Tier 1** (local dev) for 90% of your work
2. **Use Tier 2** (preview) when testing PWA-specific features
3. **Use Tier 3** (GitHub) only for final validation or sharing
4. **Commit often** but push only when satisfied with changes
5. **Test on real device** early and often (use Tier 1)
6. **Use remote debugging** to inspect issues on iPhone
7. **Disable Service Worker** during active development

---

## 💡 Pro Tips

- **Bookmark the local network URL** on your iPhone for quick access
- **Use split screen**: Editor on left, iPhone simulator/browser on right
- **Enable Safari Developer menu** on Mac for remote debugging
- **Use Chrome DevTools Device Mode** for quick mobile testing before iPhone
- **Keep terminal visible** to see HMR updates and errors in real-time
- **Use `?v=X` parameter** when sharing preview URLs to bypass cache

---

## Need Help?

- Check the [Vite documentation](https://vitejs.dev)
- Review [PWA configuration](https://vite-pwa-org.netlify.app/)
- See GitHub Actions logs for deployment issues
