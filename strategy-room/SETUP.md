# Getting the Strategy Room running

Written for someone who is not a developer. Follow it top to bottom. It takes
about 30 minutes the first time, and you never have to do it again.

You will end up with a private website that only you and your partner can open,
with all your numbers saved so they are still there tomorrow.

There are three services involved:

| Service | What it does here | Cost |
|---|---|---|
| **Supabase** | Stores your numbers and handles sign-in | Free tier is plenty |
| **Netlify** | Puts the website online and runs the copilot | Free tier is plenty |
| **Anthropic** | The AI that answers your questions | Pay per question, pennies |

---

## Step 1 — Create the database (Supabase)

1. Go to **supabase.com** and sign up.
2. Click **New project**. Give it a name like `hati-strategy-room`.
   Choose a region near you (Stockholm or Frankfurt for Sweden).
   It will ask you to set a database password — save it somewhere safe, though
   you will not need it for this.
3. Wait about two minutes for it to finish setting up.
4. In the left sidebar click **SQL Editor**, then **New query**.
5. Open the file `supabase/schema.sql` from this project, copy **all** of it,
   paste it into the box, and click **Run**.
   You should see "Success. No rows returned." That is what you want.

**What just happened:** you created the tables that hold your numbers, the rules
about who can see them, and the automatic edit history.

### Get your two connection values

1. In the left sidebar click **Project Settings** (the gear), then **API**.
2. Copy the **Project URL** — it looks like `https://abcdefgh.supabase.co`.
3. Copy the **anon public** key — a long string starting with `eyJ`.

Keep these two open in a notepad. You will paste them in twice.

> These two values are safe to put in a website. They only work alongside a
> signed-in person and the rules you just installed. The *secret* key on that
> same page is different — never put that anywhere.

---

## Step 2 — Get an Anthropic API key

1. Go to **console.anthropic.com** and sign in.
2. Click **API keys**, then **Create key**. Name it `hati-strategy-room`.
3. Copy the key (starts with `sk-ant-`). You only get to see it once.
4. Add some credit under **Billing** — 20 USD lasts a very long time at the rate
   two people ask questions.

---

## Step 3 — Put the site online (Netlify)

1. Push this folder to a GitHub repository of its own.
2. Go to **netlify.com**, sign up, and click
   **Add new site → Import an existing project**.
3. Choose GitHub and pick that repository.
4. Netlify should fill the build settings in automatically from `netlify.toml`.
   If it asks, the values are:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`
5. **Before you click Deploy**, open **Add environment variables** and add these
   five. Get them exactly right — a stray space will break it.

| Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | your Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | your Supabase anon public key |
| `SUPABASE_URL` | the **same** Project URL again |
| `SUPABASE_ANON_KEY` | the **same** anon key again |
| `ANTHROPIC_API_KEY` | your `sk-ant-...` key |

   Yes, two of them are entered twice under different names. That is on purpose:
   the ones starting with `VITE_` go into the website itself, the plain ones stay
   on the server. The Anthropic key has **no** `VITE_` prefix, which is what keeps
   it off everyone's laptop.

6. Click **Deploy**. Wait two or three minutes.
7. Netlify gives you an address like `https://something-random.netlify.app`.
   You can rename it under **Site configuration → Change site name**.

---

## Step 4 — Let Supabase trust your new address

1. Back in Supabase, go to **Authentication → URL Configuration**.
2. Set **Site URL** to your Netlify address.
3. Under **Redirect URLs**, add your Netlify address as well.
4. Save.

Without this the sign-in email link will send you to the wrong place.

---

## Step 5 — Sign in and fill the model

1. Open your Netlify address. Enter your email, click **Send me a link**.
2. Check your email and open the link. You are now signed in — but the model is
   still empty, because it has not been created yet.
3. Go back to Supabase → **SQL Editor** → **New query**, and run:

   ```sql
   select seed_workspace();
   ```

   This creates the shared workspace and fills it with the starting numbers.
4. Refresh the website. Everything should be there.

---

## Step 6 — Add your partner

1. Ask your partner to open the site and sign in with their own email once.
   They will see a message saying they are not in a workspace yet. That is
   expected.
2. In Supabase SQL Editor, run this with their email:

   ```sql
   select add_member('partner@example.com');
   ```

3. They refresh, and now they see the same model you do. Edits by either of you
   appear on the other's screen within a second or two.

---

## Running it on your own laptop (optional)

Only needed if you want to change how it looks or works.

```bash
npm install
cp .env.example .env      # then fill in the five values
npm install -g netlify-cli
netlify dev               # opens http://localhost:8888
```

Use `netlify dev` rather than `npm run dev` — the plain Vite server does not run
the copilot function, so the copilot will not answer.

---

## When something is wrong

**"Not connected yet" on the sign-in screen**
The two `VITE_` variables are missing or misspelled in Netlify. Fix them, then
**Deploys → Trigger deploy → Clear cache and deploy site**. Environment variables
only take effect on a fresh build.

**"Your account is not in a workspace yet"**
You have not run `select seed_workspace();` yet, or the person signing in has not
been added with `select add_member('their@email');`.

**The sign-in email link goes somewhere odd**
Step 4 was skipped or the address was typed wrong.

**The copilot says it could not be reached**
Check `ANTHROPIC_API_KEY` in Netlify, and check you have credit in the Anthropic
console. Open **Netlify → Logs → Functions** to see the actual reason.

**A number will not save**
There will be a red message at the top of the page saying why. The most common
cause is being signed out in another tab — refresh and sign in again.

---

## What things cost, roughly

- Supabase free tier: fine for two people and this much data.
- Netlify free tier: fine.
- Anthropic: each copilot question costs a few US cents. Asking twenty questions
  a week is well under a dollar.
