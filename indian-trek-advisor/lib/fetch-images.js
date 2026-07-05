/**
 * fetch-images.js
 *
 * Reads treks.json, and for every trek still marked isPlaceholder: true,
 * searches for a real, high-quality landscape/landmark photo using its
 * `searchQuery`, and fills in the result.
 *
 * SOURCE PRIORITY:
 *   1. Unsplash  - best coverage for named landmarks (temples, peaks, lakes),
 *                  higher average photo quality for travel/landscape subjects.
 *   2. Pexels    - used as a fallback if Unsplash has no good match.
 *
 * SETUP:
 *   1. Free Unsplash key (instant): https://unsplash.com/developers
 *      -> create an app -> copy the "Access Key"
 *   2. Free Pexels key (instant):   https://www.pexels.com/api/
 *   3. Node 18+ has fetch built in. On older Node: npm install node-fetch
 *   4. Run:
 *        UNSPLASH_ACCESS_KEY=xxx PEXELS_API_KEY=yyy node fetch-images.js
 *      (Pexels key is optional — script still runs Unsplash-only without it)
 *
 * Output: writes treks-with-images.json (source file is left untouched)
 */

const fs = require("fs");
const path = require("path");

const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY;
const PEXELS_KEY = process.env.PEXELS_API_KEY;

if (!UNSPLASH_KEY && !PEXELS_KEY) {
  console.error(
    "Set at least one of UNSPLASH_ACCESS_KEY or PEXELS_API_KEY.\n" +
      "Unsplash (recommended, free): https://unsplash.com/developers\n" +
      "Pexels (free fallback):       https://www.pexels.com/api/"
  );
  process.exit(1);
}

const SRC = path.join(__dirname, "data", "trek-image.json");
const OUT = path.join(__dirname, "treks-with-images.json");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function searchUnsplash(query) {
  if (!UNSPLASH_KEY) return null;
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
    query
  )}&per_page=1&orientation=landscape&content_filter=high`;

  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` },
  });
  if (!res.ok) throw new Error(`Unsplash API error ${res.status} for "${query}"`);

  const data = await res.json();
  const photo = data.results && data.results[0];
  if (!photo) return null;

  return {
    image: photo.urls.regular,
    thumbnail: photo.urls.small,
    photographer: photo.user.name,
    photographerUrl: photo.user.links.html,
    sourceUrl: photo.links.html,
    source: "unsplash",
  };
}

async function searchPexels(query) {
  if (!PEXELS_KEY) return null;
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(
    query
  )}&per_page=1&orientation=landscape`;

  const res = await fetch(url, { headers: { Authorization: PEXELS_KEY } });
  if (!res.ok) throw new Error(`Pexels API error ${res.status} for "${query}"`);

  const data = await res.json();
  const photo = data.photos && data.photos[0];
  if (!photo) return null;

  return {
    image: photo.src.large2x || photo.src.large || photo.src.original,
    thumbnail: photo.src.medium,
    photographer: photo.photographer,
    photographerUrl: photo.photographer_url,
    sourceUrl: photo.url,
    source: "pexels",
  };
}

async function main() {
  const treks = JSON.parse(fs.readFileSync(SRC, "utf-8"));
  let updated = 0,
    skipped = 0,
    failed = 0;

  for (const trek of treks) {
    if (trek.isPlaceholder === false) {
      skipped++;
      continue;
    }

    try {
      let result = await searchUnsplash(trek.searchQuery);
      if (!result) result = await searchPexels(trek.searchQuery);

      if (result) {
        trek.image = result.image;
        trek.imageThumbnail = result.thumbnail;
        trek.imageCredit = `Photo by ${result.photographer} on ${
          result.source === "unsplash" ? "Unsplash" : "Pexels"
        }`;
        trek.imageCreditUrl = result.sourceUrl;
        trek.isPlaceholder = false;
        updated++;
        console.log(`✓ [${trek.id}] ${trek.name}  (${result.source})`);
      } else {
        console.warn(`✗ [${trek.id}] ${trek.name} — no result, refine searchQuery`);
        failed++;
      }
    } catch (err) {
      console.error(`✗ [${trek.id}] ${trek.name} — ${err.message}`);
      failed++;
    }

    await sleep(300); // be polite to rate limits
  }

  fs.writeFileSync(OUT, JSON.stringify(treks, null, 2));
  console.log(
    `\nDone. Updated: ${updated}, already verified (skipped): ${skipped}, failed: ${failed}`
  );
  console.log(`Output written to ${OUT}`);
}

main();