You are designing the next look of the price check in Price of Exile, a Path of Exile price check
overlay. The project is at C:\Users\Artem\Documents\AI\poe-trade-overlay. Do not change any code: this
is a design exploration, and its result is a set of design proposals, not an implementation.

Start by reading docs/design/REDESIGN_BRIEF.md. It has the owner's own words, the windows and how they
behave, the current colours, and pointers to the screenshots. Then look at the screenshots themselves
(open the PNG files, they are images): ours in docs/screenshots/ (see its README.md for what each shows)
and the original app, Awakened PoE Trade, in docs/screenshots/apt/ (its README.md describes each and how
ours differs). Look at enough of them to understand both apps for real, not just the ones the brief
lists; the source of the current price check is in src/app/price-check/ if you want to see exactly what
it shows and when.

What the owner wants, in short: he likes the current visual style but is not tied to it; he likes our
two-column idea (filters on the left, prices, poe.ninja and wiki in a right column) more than APT's tall
single column; but he finds APT's left part more convenient: its mod list, the corrupted state as a
one-click switch, the base as a button that turns on the exact-base search, the editable item level, the
hidden filters, the Any / Prefix / Suffix choice for an empty affix.

Use Claude Design (the Artifact tool's design type: start with its quickstart for intent "design") to
make the proposals. Make several genuinely different directions, say three to five, not one design with
small variations. For example one could stay close to our current look and only rework the left column
the APT way; another could rethink the whole window; another could try a different density or a header
that carries the item, base, level and status. Those are only examples: you have a lot of freedom here, so
think about how a player uses this window in the middle of a fight, what they need to see in the first
half second, and what they change most often, and let that drive the layouts. Propose things the owner
has not thought of too.

Keep the constraints in the brief in mind: the window sits over the game without taking the keyboard
(everything is clicks and the mouse wheel; numbers are the only typed input), it must work in a 1080 px
tall game, and it has to read at a glance. Show each direction with real content from the screenshots (a
rare with many mods, a unique, a bulk item), at least the price check window, and the item check or map
check where your direction changes them.

When you are done, report back with: the link to each design, two or three sentences on the idea behind
each and what it trades off, and which one you would pick and why. Write the report in Ukrainian; the
designs themselves can be in English like the app.
