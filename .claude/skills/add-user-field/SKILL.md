---
name: add-user-field
description: Add a new field to every user in the team directory (data, card, test). Use when asked to add a property like email, timezone or team to the users.
---

# Add a field to every user

1. In `scripts/seed-users.mjs`, add the field to the first three users and to the generated ones (realistic values, same key order for everyone), then run `npm run seed` to rewrite `api/users.json`.
2. In `src/UserCard.jsx`, show the field on its own line under role and city, in a `<p className="detail">`.
3. In `src/index.css`, add a `.detail` rule if there isn't one: smaller text, muted color.
4. In `src/UserCard.test.jsx`, add the field to the test user and assert that it's shown.
5. Run `npm test` and `npm run lint`. Fix anything that fails.
6. Reply with the field name and one line per file you changed.
