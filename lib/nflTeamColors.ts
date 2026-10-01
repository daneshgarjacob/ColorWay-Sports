// Each club's identity colours (primary, secondary, tertiary), used to paint
// the trim on the week board's uniform drawings: numbers, number outlines,
// sleeve / pants / sock stripes and the helmet's centre stripe. The base fill
// of each piece (helmet, jersey, pants, socks) never comes from here; that
// only ever comes from the tracker card, so a figure is never guessed.
//
// Colours only: no logos, wordmarks or helmet decals anywhere on the board.

export type NflClubColors = {
  primary: string;
  secondary: string;
  tertiary?: string;
  /**
   * Number colour on a coloured (non-white) jersey when the club's convention
   * isn't plain white: Steelers gold on black, Bengals black on orange.
   */
  numberOnColor?: string;
  /** False for clubs whose helmet carries no centre stripe. */
  helmetStripe?: false;
};

/** Keyed by the team index key (lowercase nickname, "49ers" for San Francisco). */
export const NFL_TEAM_COLORS: Record<string, NflClubColors> = {
  cardinals: { primary: "#97233F", secondary: "#000000", tertiary: "#FFB612", helmetStripe: false },
  falcons: { primary: "#A71930", secondary: "#000000", tertiary: "#A5ACAF", helmetStripe: false },
  ravens: { primary: "#241773", secondary: "#000000", tertiary: "#9E7C0C", helmetStripe: false },
  bills: { primary: "#00338D", secondary: "#C60C30" },
  panthers: { primary: "#0085CA", secondary: "#101820", tertiary: "#BFC0BF", helmetStripe: false },
  bears: { primary: "#0B162A", secondary: "#C83803" },
  bengals: { primary: "#FB4F14", secondary: "#000000", numberOnColor: "#000000", helmetStripe: false },
  browns: { primary: "#311D00", secondary: "#FF3C00", numberOnColor: "#FF3C00" },
  cowboys: { primary: "#041E42", secondary: "#869397", tertiary: "#003594" },
  broncos: { primary: "#FB4F14", secondary: "#002244", helmetStripe: false },
  lions: { primary: "#0076B6", secondary: "#B0B7BC", tertiary: "#000000", helmetStripe: false },
  packers: { primary: "#203731", secondary: "#FFB612" },
  texans: { primary: "#03202F", secondary: "#A71930", helmetStripe: false },
  colts: { primary: "#002C5F", secondary: "#A2AAAD" },
  jaguars: { primary: "#006778", secondary: "#D7A22A", tertiary: "#101820", helmetStripe: false },
  chiefs: { primary: "#E31837", secondary: "#FFB81C", helmetStripe: false },
  raiders: { primary: "#000000", secondary: "#A5ACAF" },
  chargers: { primary: "#0080C6", secondary: "#FFC20E", tertiary: "#002A5E", helmetStripe: false },
  rams: { primary: "#003594", secondary: "#FFA300", tertiary: "#FFD100", helmetStripe: false },
  dolphins: { primary: "#008E97", secondary: "#FC4C02", tertiary: "#005778", helmetStripe: false },
  vikings: { primary: "#4F2683", secondary: "#FFC62F", helmetStripe: false },
  patriots: { primary: "#002244", secondary: "#C60C30", tertiary: "#B0B7BC", helmetStripe: false },
  saints: { primary: "#D3BC8D", secondary: "#101820", numberOnColor: "#D3BC8D" },
  giants: { primary: "#0B2265", secondary: "#A71930", tertiary: "#A5ACAF" },
  jets: { primary: "#125740", secondary: "#000000", helmetStripe: false },
  eagles: { primary: "#004C54", secondary: "#A5ACAF", tertiary: "#000000", helmetStripe: false },
  steelers: { primary: "#101820", secondary: "#FFB612", numberOnColor: "#FFB612", helmetStripe: false },
  "49ers": { primary: "#AA0000", secondary: "#B3995D" },
  seahawks: { primary: "#002244", secondary: "#69BE28", tertiary: "#A5ACAF", helmetStripe: false },
  buccaneers: { primary: "#D50A0A", secondary: "#34302B", tertiary: "#FF7900", helmetStripe: false },
  titans: { primary: "#0C2340", secondary: "#4B92DB", tertiary: "#C8102E", helmetStripe: false },
  commanders: { primary: "#5A1414", secondary: "#FFB612", helmetStripe: false },
};

// ---- contrast helpers -------------------------------------------------------

const HEX = /^#[0-9a-f]{6}$/i;
export const isHex = (s?: string): s is string => !!s && HEX.test(s);

export function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch((n >> 16) & 255) + 0.7152 * ch((n >> 8) & 255) + 0.0722 * ch(n & 255);
}

export function contrast(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** First candidate that stands off `bg` by at least `min`, else black or white. */
function pick(bg: string, candidates: (string | undefined)[], min: number) {
  for (const c of candidates) if (isHex(c) && contrast(c, bg) >= min) return c.toUpperCase();
  return luminance(bg) > 0.4 ? "#101820" : "#FFFFFF";
}

const isWhite = (hex: string) => luminance(hex) > 0.85;

export type UniformTrim = {
  /** Jersey number fill and its outline. */
  number: string;
  numberOutline: string;
  /** Helmet centre stripe; null when the club's helmet has none. */
  helmetStripe: string | null;
  /** Facemask colour. */
  facemask: string;
  /** Main stripe and its thin flanking stripe, per piece. */
  sleeve: [string, string];
  pants: [string, string];
  socks: [string, string];
};

function stripeOn(fill: string, c: NflClubColors): [string, string] {
  const main = isWhite(fill)
    ? pick(fill, [c.primary, c.secondary, c.tertiary], 2)
    : pick(fill, [c.secondary, "#FFFFFF", c.tertiary, c.primary], 2);
  const flank = pick(fill, ["#FFFFFF", c.primary, c.secondary, c.tertiary].filter((x) => x?.toUpperCase() !== main), 1.6);
  return [main, flank];
}

/** Trim colours for one club's look; null when the club isn't in the table. */
export function uniformTrim(
  teamKey: string,
  look: { helmet?: string; jersey?: string; pants?: string; socks?: string },
): UniformTrim | null {
  const c = NFL_TEAM_COLORS[teamKey];
  if (!c) return null;
  const jersey = isHex(look.jersey) ? look.jersey : "#FFFFFF";
  const number = isWhite(jersey)
    ? pick(jersey, [c.primary, c.secondary, c.tertiary], 2.2)
    : pick(jersey, [c.numberOnColor, "#FFFFFF", c.secondary, c.tertiary], 2.2);
  const numberOutline = pick(
    number,
    [c.secondary, c.primary, c.tertiary, "#FFFFFF", "#101820"].filter((x) => x?.toUpperCase() !== number && x?.toUpperCase() !== jersey.toUpperCase()),
    1.5,
  );
  const helmet = isHex(look.helmet) ? look.helmet : "#FFFFFF";
  return {
    number,
    numberOutline,
    helmetStripe:
      c.helmetStripe === false
        ? null
        : isWhite(helmet)
          ? pick(helmet, [c.primary, c.secondary], 1.8)
          : pick(helmet, [c.secondary, "#FFFFFF", c.tertiary], 1.8),
    facemask: luminance(helmet) > 0.5 ? pick(helmet, [c.primary, c.secondary], 1.8) : "#8E98A6",
    sleeve: stripeOn(jersey, c),
    pants: stripeOn(isHex(look.pants) ? look.pants : "#FFFFFF", c),
    socks: stripeOn(isHex(look.socks) ? look.socks : "#FFFFFF", c),
  };
}
