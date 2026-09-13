import { describe, it, expect } from "vitest";
import { searchPlaces, loadCityIndex } from "../placeSearch.js";

describe("placeSearch", () => {
  it("finds the golden verification chart's birthplace by name", async () => {
    const index = await loadCityIndex();
    const results = searchPlaces("Batu Pahat", index);
    expect(results.length).toBeGreaterThan(0);
    const top = results[0];
    expect(top.city).toBe("Batu Pahat");
    expect(top.country).toBe("Malaysia");
    expect(top.timezone).toBe("Asia/Kuala_Lumpur");
    expect(typeof top.lat).toBe("number");
    expect(typeof top.lng).toBe("number");
    expect(top.label).toContain("Batu Pahat");
  });

  it("ranks a prefix match above a substring match", () => {
    const index = [
      { city: "Newport", province: "", country: "United States", iso2: "US", lat: 1, lng: 1, timezone: "UTC", pop: 100 },
      { city: "Portland", province: "", country: "United States", iso2: "US", lat: 2, lng: 2, timezone: "UTC", pop: 1000 },
    ];
    const results = searchPlaces("port", index);
    expect(results[0].city).toBe("Portland");
  });

  it("returns an empty array for a too-short query", () => {
    expect(searchPlaces("a", [])).toEqual([]);
  });

  it("returns an empty array when nothing matches", async () => {
    const index = await loadCityIndex();
    expect(searchPlaces("zzzznotarealplace", index)).toEqual([]);
  });

  it("loadCityIndex returns a non-trivial, cached array", async () => {
    const first = await loadCityIndex();
    const second = await loadCityIndex();
    expect(first).toBe(second); // cached
    expect(first.length).toBeGreaterThan(1000);
  });
});
