/**
 * Fail the build if Qianhai mapped places leave Shenzhen or lack verified coords.
 * This is the guard against invented offsets / Osaka fallbacks.
 */
import { assertQianhaiPlaces, inShenzhenBbox, QIANHAI_PLACES } from "../universal/src/data/places/qianhaiPlaces.js";
import { QIANHAI_DAY_ITINERARY, QIANHAI_NEARBY_SPOTS } from "../universal/src/data/qianhaiTrip.js";

const catalogErrors = assertQianhaiPlaces();
const errors = [...catalogErrors];

for (const spot of QIANHAI_NEARBY_SPOTS) {
  if (!spot.placeId || !QIANHAI_PLACES[spot.placeId]) {
    errors.push(`${spot.id}: missing catalog placeId`);
    continue;
  }
  if (!inShenzhenBbox(spot.lat, spot.lng)) {
    errors.push(`${spot.id}: coords outside Shenzhen (${spot.lat}, ${spot.lng})`);
  }
  if (Math.abs(spot.lat - 34.6819) < 0.01 && Math.abs(spot.lng - 135.5068) < 0.01) {
    errors.push(`${spot.id}: Osaka fallback coords`);
  }
}

Object.entries(QIANHAI_DAY_ITINERARY).forEach(([dateId, items]) => {
  items.forEach((item) => {
    if (!item.placeId || !QIANHAI_PLACES[item.placeId]) {
      errors.push(`${dateId} ${item.id}: missing verified placeId`);
    }
  });
});

if (errors.length) {
  console.error("[assert-qianhai-places] FAILED");
  errors.forEach((line) => console.error(`  - ${line}`));
  process.exit(1);
}

console.log(
  `[assert-qianhai-places] ${Object.keys(QIANHAI_PLACES).length} catalog POIs, ${QIANHAI_NEARBY_SPOTS.length} footprints, itinerary dates=${Object.keys(QIANHAI_DAY_ITINERARY).length} inside Shenzhen bbox`,
);
