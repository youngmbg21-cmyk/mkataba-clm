## Bug Fix Rules

1. DUPLICATION WARNING: This app draws the same UI in several places
   (example: three card layouts, five separate paths for filing a change).
   Never assume a fix in one place fixes them all.

2. Before fixing any bug or changing any feature:
   - Search the ENTIRE codebase for every place that feature, layout,
     or logic appears.
   - Write out the full list of locations found before touching any code.

3. Fix ALL locations, or explicitly state which ones you are skipping
   and why, and ask me before skipping.

4. Testing rule: test where the USER looks, not where you edited.
   After a fix, verify the change is visible in the actual browser view
   for EVERY affected location, not just the file you changed.

5. At the end of every fix, list: (a) all locations changed,
   (b) all locations tested, (c) anything deliberately left alone.
