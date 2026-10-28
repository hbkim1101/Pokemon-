# User-authored basic moves · v50

`user-drafts/` preserves the three JSON files exported from the user's editor on
2026-10-26 before completion. These are intentionally unmodified backups.

`completed/` contains importable editor documents. Ember keeps the small first
frame and the full flame keyframe, connects their growth and decay over 14
frames, and removes the blank frame. ThunderShock preserves the angular bolt
with an eight-frame highlight/spark cycle. Water Gun preserves the small water
drop and adds an eight-frame short trailing-drop cycle. All run at 16 FPS.

Regenerate JSON and `pixel-presets.js` with `python scripts/finish-user-moves.py`.
The presets are shared defaults for battle, studio and editor. Browser-local
applied edits always take precedence, and existing drafts are never migrated
or overwritten automatically. To restore a backup, import its JSON in the
editor and choose Apply to Battle.

Validate with `node tests/smoke.cjs` and `node tests/pixel-art.cjs`.
