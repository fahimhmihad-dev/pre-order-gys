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

## Project rules
- All UI text lives in src/lib/strings.bn.ts; components never hardcode copy (easy translation edits).
- Public reads go through server functions in src/lib/public.functions.ts; public writes only via SECURITY DEFINER RPCs (place_order, join_waitlist, track_order) so anon never touches orders directly.
- Progress/overbooking are computed in Postgres (campaign_counted_qty, orders_guard trigger), never trusted from the client.
- Admin pages live under src/routes/_authenticated/admin.*; access is enforced by user_roles + RLS, UI checks are cosmetic.
- Images use the private "media" bucket with long-lived signed URLs (workspace blocks public buckets).
- Resolve Lovable-hosted logo paths through src/lib/asset-url.ts at every display point; third-party deployments do not serve Lovable's asset path.
