/**
 * Fail the build if Qianhai mapped places leave Shenzhen or lack verified coords.
 * This is the guard against invented offsets / Osaka fallbacks.
 */
import { assertQianhaiPlaces, inShenzhenBbox, QIANHAI_PLACES } from "../universal/src/data/places/qianhaiPlaces.js";
import { QIANHAI_DAY_ITINERARY, QIANHAI_HOTEL, QIANHAI_NEARBY_SPOTS, QIANHAI_TRIP } from "../universal/src/data/qianhaiTrip.js";

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

if (QIANHAI_TRIP.startDate !== "2026-10-12" || QIANHAI_TRIP.endDate !== "2026-10-13") {
  errors.push(`trip dates must be 2026-10-12 to 2026-10-13, got ${QIANHAI_TRIP.startDate} → ${QIANHAI_TRIP.endDate}`);
}
if (QIANHAI_HOTEL.checkOutDate !== "2026-10-13" || QIANHAI_HOTEL.checkInDate !== "2026-10-12") {
  errors.push(`hotel stay must be 10/12 check-in to 10/13 checkout`);
}
if (QIANHAI_HOTEL.nights !== 1) {
  errors.push(`hotel nights must be 1, got ${QIANHAI_HOTEL.nights}`);
}
if (QIANHAI_HOTEL.earliestCheckIn !== "08:00") {
  errors.push(`earliest check-in must stay 08:00`);
}
if (Object.keys(QIANHAI_DAY_ITINERARY).some((dateId) => dateId === "2026-10-14")) {
  errors.push("itinerary still contains Day 3 / 2026-10-14");
}
if (Object.keys(QIANHAI_DAY_ITINERARY).join(",") !== "2026-10-12,2026-10-13") {
  errors.push(`itinerary days must be only 12 and 13, got ${Object.keys(QIANHAI_DAY_ITINERARY).join(",")}`);
}

const leftoverThreeDay = /10\/14|10 月 14|2026-10-14|三日兩夜|過夜 · 唔係住桂灣/;

Object.entries(QIANHAI_DAY_ITINERARY).forEach(([dateId, items]) => {
  items.forEach((item) => {
    if (!item.placeId || !QIANHAI_PLACES[item.placeId]) {
      errors.push(`${dateId} ${item.id}: missing verified placeId`);
    }
    if (leftoverThreeDay.test(`${item.text} ${item.id}`)) {
      errors.push(`${dateId} ${item.id}: leftover 3-day copy`);
    }
  });
});

for (const spot of QIANHAI_NEARBY_SPOTS) {
  if (leftoverThreeDay.test(`${spot.note || ""} ${spot.dayId || ""}`)) {
    errors.push(`${spot.id}: leftover 3-day copy`);
  }
}

if (errors.length) {
  console.error("[assert-qianhai-places] FAILED");
  errors.forEach((line) => console.error(`  - ${line}`));
  process.exit(1);
}

console.log(
  `[assert-qianhai-places] ${Object.keys(QIANHAI_PLACES).length} catalog POIs, ${QIANHAI_NEARBY_SPOTS.length} footprints, itinerary dates=${Object.keys(QIANHAI_DAY_ITINERARY).length} inside Shenzhen bbox`,
);
