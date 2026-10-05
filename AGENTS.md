<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# AGENTS.md

- Site content (announcements, players/deaths, opening hours) lives in Lovable Cloud tables, editable only by admins via RLS — friends must share one live source of truth.
- First account to sign up claims admin via the `claim_admin()` RPC — avoids manual role setup for a small friend group.
