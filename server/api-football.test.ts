import { describe, it, expect, beforeAll } from "vitest";
import { apiFootball } from "./api-football";

describe("API-Football Integration", () => {
  beforeAll(() => {
    // Aguarda um pouco para evitar rate limiting
    return new Promise(resolve => setTimeout(resolve, 1000));
  });

  it("should get countries", async () => {
    try {
      const countries = await apiFootball.getCountries();
      expect(Array.isArray(countries)).toBe(true);
      expect(countries.length).toBeGreaterThan(0);
      console.log(`✓ Countries API working - ${countries.length} countries found`);
    } catch (error) {
      console.error("Countries API error:", error);
      throw error;
    }
  });

  it("should get leagues", async () => {
    try {
      const leagues = await apiFootball.getLeagues({ country: "Brazil" });
      expect(Array.isArray(leagues)).toBe(true);
      console.log(`✓ Leagues API working - ${leagues.length} leagues found`);
    } catch (error) {
      console.error("Leagues API error:", error);
      throw error;
    }
  });

  it("should get cache stats", () => {
    const stats = apiFootball.getCacheStats();
    expect(stats).toHaveProperty("size");
    expect(stats).toHaveProperty("entries");
    console.log(`✓ Cache stats: ${stats.size} entries cached`);
  });

  it("should clear cache", () => {
    apiFootball.clearCache();
    const stats = apiFootball.getCacheStats();
    expect(stats.size).toBe(0);
    console.log("✓ Cache cleared successfully");
  });
});
