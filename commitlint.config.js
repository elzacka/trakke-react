export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // ✨ New feature
        'fix',      // 🐛 Bug fix
        'docs',     // 📝 Documentation
        'style',    // 🎨 Formatting, missing semicolons, etc.
        'refactor', // ♻️ Code change that neither fixes a bug nor adds a feature
        'perf',     // ⚡️ Performance improvement
        'test',     // ✅ Adding tests
        'chore',    // 🔧 Updating build tasks, package manager configs, etc.
        'revert',   // ⏪ Reverting changes
        'ci',       // 👷 CI/CD changes
        'build',    // 🏗️ Build system changes
        'security'  // 🔒 Security fixes
      ]
    ],
    'subject-case': [0] // Allow any case for flexibility with emojis
  }
};
