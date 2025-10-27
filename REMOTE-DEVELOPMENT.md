# Remote Development Guide

Guide for developing and testing on iPhone when working remotely (SSH, cloud VM, Codespaces, etc.)

---

## 🚀 Quick Start - Tunnel Method (RECOMMENDED)

This is the **fastest way** to test your changes on iPhone when working remotely.

### Step 1: Start Your Dev Server

In your first terminal:
```bash
npm run dev
```

### Step 2: Create a Tunnel

In a second terminal:
```bash
npx cloudflared tunnel --url http://localhost:3000
```

This will output a URL like:
```
https://random-words-1234.trycloudflare.com
```

### Step 3: Open on iPhone

- Copy the `trycloudflare.com` URL
- Open it in Safari on your iPhone
- See your changes instantly with HMR!

**Benefits:**
- ⚡ Instant updates (< 1 second)
- 🚫 No Service Worker caching in dev mode
- 🌐 Works from anywhere (no same WiFi needed)
- 🆓 Completely free
- 🔒 Secure HTTPS tunnel

---

## 📱 Alternative: GitHub Preview (Current Method)

If you prefer the existing workflow or tunneling doesn't work:

### Optimized GitHub Preview Workflow

**1. Make your changes**

**2. Commit and push:**
```bash
git add .
git commit -m "feat: your changes"
git push
```

**3. Get the preview URL:**
```
https://elzacka.github.io/trakke-react/previews/[branch-name]/?v=X
```
(Increment `X` each time to bypass cache)

**4. On iPhone:**
- Settings → Safari → Clear History and Website Data
- Open the preview URL with new `v=X` parameter

**When to use:**
- Final validation before merge
- Sharing with others
- When tunnel isn't available

---

## 🔧 Detailed Setup

### Option 1: Cloudflare Tunnel (Easiest)

**No installation needed:**
```bash
npx cloudflared tunnel --url http://localhost:3000
```

**Or install permanently:**
```bash
# Linux
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# macOS
brew install cloudflare/cloudflare/cloudflared
```

Then use the script:
```bash
./tunnel-setup.sh
```

### Option 2: ngrok (Alternative)

```bash
# Install
npm install -g ngrok

# Start dev server
npm run dev

# In another terminal, create tunnel
ngrok http 3000
```

Use the `https://xxxxx.ngrok.io` URL on your iPhone.

### Option 3: localtunnel (Alternative)

```bash
# Install
npm install -g localtunnel

# Start dev server
npm run dev

# In another terminal, create tunnel
lt --port 3000
```

---

## 💻 Using Two Terminals

You'll need two terminal sessions to your remote machine:

### Terminal 1 - Dev Server:
```bash
npm run dev
```
Leave this running - it will show HMR updates.

### Terminal 2 - Tunnel:
```bash
npx cloudflared tunnel --url http://localhost:3000
```
Copy the URL that appears and open it on your iPhone.

### Working with SSH

If you're SSH'd in, you can:

**Option A: Use tmux/screen**
```bash
# Install tmux if needed
sudo apt-get install tmux  # or: brew install tmux

# Start tmux
tmux

# Create split panes
Ctrl+B then "   (split horizontally)
# or
Ctrl+B then %   (split vertically)

# Switch between panes
Ctrl+B then arrow keys

# In one pane: npm run dev
# In other pane: npx cloudflared tunnel --url http://localhost:3000
```

**Option B: Use two SSH sessions**
```bash
# Terminal 1
ssh user@your-server
npm run dev

# Terminal 2 (new window/tab)
ssh user@your-server
npx cloudflared tunnel --url http://localhost:3000
```

---

## 🎯 Complete Workflow Example

### Scenario: You want to change the popup button color

**1. Start dev environment:**
```bash
# Terminal 1
npm run dev

# Terminal 2
npx cloudflared tunnel --url http://localhost:3000
# Copy the URL: https://random-words-1234.trycloudflare.com
```

**2. Open URL on iPhone Safari**

**3. Edit the file:**
```bash
# Edit src/components/InstallPromptModal.css
# Change button color, save file
```

**4. See instant update on iPhone!** (< 1 second)

**5. Iterate quickly:**
- Make changes
- Save
- See results immediately
- No commit, no deploy, no cache!

**6. When satisfied, commit:**
```bash
git add .
git commit -m "feat: updated button color"
git push
```

---

## 🐛 Troubleshooting

### Tunnel URL doesn't work on iPhone

**Check:**
- Is the dev server actually running? (Check Terminal 1)
- Did you copy the full URL including `https://`?
- Try in Safari private browsing mode first
- Check if there are any errors in Terminal 1

### Changes not appearing

**Solutions:**
- Check Terminal 1 for `[vite] hmr update` messages
- Hard reload on iPhone (tap and hold refresh button)
- If Service Worker is interfering:
  - Settings → Safari → Advanced → Website Data
  - Delete the cloudflare/ngrok domain
  - Reload

### Tunnel connection drops

**Solutions:**
- The tunnel stays active as long as Terminal 2 is running
- If it drops, just restart: `npx cloudflared tunnel --url http://localhost:3000`
- You'll get a new URL - update your iPhone browser

### Can't install cloudflared

**Alternative:**
- Use `npx cloudflared` (no installation needed)
- Or use ngrok/localtunnel instead
- Or fall back to GitHub preview workflow

---

## 📊 Method Comparison

| Method | Speed | Setup | Best For |
|--------|-------|-------|----------|
| **Cloudflare Tunnel** | ⚡ < 1s | Easy | Active development |
| **ngrok** | ⚡ < 1s | Easy | Active development |
| **localtunnel** | ⚡ < 1s | Easy | Active development |
| **GitHub Preview** | 🐌 3 min | None | Final validation |

---

## 💡 Pro Tips

1. **Bookmark the tunnel URL** on your iPhone while developing
2. **Keep both terminals visible** to see updates and errors
3. **Use tmux** if you prefer single SSH session
4. **Test in Safari private mode** first to avoid cache issues
5. **The tunnel URL changes** each time you restart cloudflared
6. **No signup required** for cloudflared (unlike ngrok free tier)
7. **HTTPS is automatic** with all tunnel services

---

## 🎓 Best Practices for Remote Development

1. **Use tunnel for active development** (fastest feedback)
2. **Commit frequently** but push only when ready
3. **Use GitHub preview** for final validation before merge
4. **Keep dev server running** - only restart if needed
5. **Test on real iPhone** as early as possible
6. **Use Safari remote debugging** (if you have a Mac locally)

---

## 🔐 Security Notes

- Tunnel URLs are random and temporary
- They expire when you close the tunnel
- Don't share tunnel URLs publicly (they expose your dev server)
- For production testing, use GitHub previews instead

---

## 🚀 Next Steps

1. **Try the tunnel method now:**
   ```bash
   # Terminal 1
   npm run dev

   # Terminal 2
   npx cloudflared tunnel --url http://localhost:3000
   ```

2. **Open the tunnel URL on your iPhone**

3. **Make a small change** to test HMR

4. **Iterate quickly** without commits!

---

## Need Help?

- Cloudflare Tunnel: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
- ngrok Documentation: https://ngrok.com/docs
- localtunnel: https://github.com/localtunnel/localtunnel
- Vite HMR: https://vitejs.dev/guide/api-hmr.html
