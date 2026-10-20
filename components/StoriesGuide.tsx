import Link from "next/link";

// Editorial copy for /stories. The page was a bare card grid, so Mediavine's
// in-content unit (the biggest earner) had no paragraphs to sit between and the
// page served ~1 ad per view. A short intro on top and a real league-by-league
// guide below give it text to work with, and give the page SEO copy.

const A = "font-semibold text-orange hover:underline";

export function StoriesGuide() {
  return (
    <article className="max-w-[1200px] mx-auto px-5 pb-14">
      <div className="max-w-[760px] text-[16px] leading-relaxed text-[#3b4660] space-y-4">
        <h2 className="text-[22px] font-extrabold text-[#0B1F4A] pt-6">How to Find What Your Team Is Wearing</h2>
        <p>
          Every club in the four major leagues has its own uniform schedule page. Each one lists every game of the season with the
          jersey the team is wearing that night, marks which calls the team or league has confirmed, and flips each row to what was
          actually worn once the game is played. If you are searching for what your team is wearing tonight, that page is the place
          to start.
        </p>

        <h3 className="text-[18px] font-extrabold text-[#0B1F4A] pt-2">NFL</h3>
        <p>
          The <Link prefetch={false} href="/stories/nfl-uniform-schedule-2026" className={A}>NFL uniform schedule</Link> covers all 32
          teams, helmet to pants, every week. Each week also gets its own guide to every game, starting on Tuesday, and the{" "}
          <Link prefetch={false} href="/stories/nfl-uniform-tracker-2026" className={A}>NFL uniform tracker</Link> logs what both teams
          wore and grades the matchup after every game.
        </p>

        <h3 className="text-[18px] font-extrabold text-[#0B1F4A] pt-2">NBA</h3>
        <p>
          The <Link prefetch={false} href="/stories/nba-uniform-schedule-2026-27" className={A}>NBA uniform schedule</Link>{" "}has every
          jersey for every game of 2026-27 for all 30 teams, from the NBA&apos;s official uniform schedule: Association, Icon,
          Statement, City Edition, Classic and the new Specter Edition, with our grade for every matchup. Our{" "}
          <Link prefetch={false} href="/stories/nba-city-edition-jerseys-2026-27" className={A}>City Edition ranking</Link> grades all
          30 designs and lists every debut date.
        </p>

        <h3 className="text-[18px] font-extrabold text-[#0B1F4A] pt-2">MLB</h3>
        <p>
          The <Link prefetch={false} href="/stories/mlb-uniform-schedule-2026" className={A}>MLB uniform schedule</Link> explains how
          each club picks its jersey by day of the week, and the{" "}
          <Link prefetch={false} href="/stories/mlb-uniform-tracker-2026" className={A}>MLB daily uniform tracker</Link> logs every
          game, every day, through the postseason.
        </p>

        <h3 className="text-[18px] font-extrabold text-[#0B1F4A] pt-2">NHL</h3>
        <p>
          The <Link prefetch={false} href="/stories/nhl-uniform-schedule-2026-27" className={A}>NHL uniform schedule</Link> covers all
          32 teams and every third jersey night, and the{" "}
          <Link prefetch={false} href="/stories/nhl-uniform-tracker-2026-27" className={A}>NHL game-by-game tracker</Link> logs both
          sweaters from every game.
        </p>

        <h3 className="text-[18px] font-extrabold text-[#0B1F4A] pt-2">College and soccer</h3>
        <p>
          College football teams change looks more than anyone, so each program we cover gets a week-by-week uniform schedule and a
          weekly guide every Saturday. Soccer coverage follows the kits: home, away and third, and when each one is worn.
        </p>

        <h2 className="text-[22px] font-extrabold text-[#0B1F4A] pt-6">How We Confirm a Uniform</h2>
        <p>
          A call is marked confirmed only when the team or league has published it, in a schedule, an announcement or the official
          uniform feed. Everything else is labeled expected, our read from the team&apos;s pattern, and it is replaced with what was
          actually worn after the game, from game photos. Grades are ours, made on how the two uniforms look together.
        </p>
      </div>
    </article>
  );
}
