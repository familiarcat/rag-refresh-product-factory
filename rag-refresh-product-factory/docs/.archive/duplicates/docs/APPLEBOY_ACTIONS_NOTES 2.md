# Why do we use `appleboy/*` in GitHub Actions?

In GitHub Actions, `uses: owner/repo@ref` references an action published from a GitHub repository.

`appleboy` is the GitHub username/organization that maintains popular deployment actions, including:
- `appleboy/ssh-action` (run remote SSH commands)
- `appleboy/scp-action` (copy files over SSH/SCP)

So the "appleboy" name is not invented by this project—it's the upstream maintainer namespace.

## Supply-chain best practice
Pin third-party actions to a commit SHA (or a tagged release you trust) rather than a floating tag,
and consider scanning with tools like StepSecurity Action Advisor.

This repo currently uses tagged versions for readability; you can harden by pinning SHAs.
