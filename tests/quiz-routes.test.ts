import { describe, expect, it } from "vitest";
import {
  normalizeRouteLevel,
  toQuizLevel,
  levelHubPath,
  levelModelTestsPath,
  parseUnifiedSubjectSlug,
} from "@/lib/quiz/unified-routes";

describe("Unified Routes Core", () => {
  describe("normalizeRouteLevel", () => {
    it("returns correctly normalized level string", () => {
      expect(normalizeRouteLevel("ssc")).toBe("ssc");
      expect(normalizeRouteLevel("HSC")).toBe("hsc");
      expect(normalizeRouteLevel("invalid")).toBeNull();
    });
  });

  describe("toQuizLevel", () => {
    it("converts route level to API QuizLevel", () => {
      expect(toQuizLevel("ssc")).toBe("SSC");
      expect(toQuizLevel("hsc")).toBe("HSC");
    });
  });

  describe("Path Generators", () => {
    it("generates hub path", () => {
      expect(levelHubPath("ssc")).toBe("/ssc");
      expect(levelHubPath("hsc")).toBe("/hsc");
    });

    it("generates model tests path with and without queries", () => {
      expect(levelModelTestsPath("ssc")).toBe("/ssc/model-tests");
      expect(levelModelTestsPath("hsc", "tab=paper")).toBe("/hsc/model-tests?tab=paper");
    });
  });

  describe("parseUnifiedSubjectSlug", () => {
    it("parses SSC subject slugs", () => {
      expect(parseUnifiedSubjectSlug("ssc", "physics")).toEqual({
        registrySubject: "physics",
        apiSubjectSlug: "physics",
        routeSubject: "physics",
      });
      // Math is mapped correctly
      expect(parseUnifiedSubjectSlug("ssc", "math")).toEqual({
        registrySubject: "math",
        apiSubjectSlug: "math",
        routeSubject: "math",
      });
    });

    it("parses HSC subject slugs with papers", () => {
      expect(parseUnifiedSubjectSlug("hsc", "physics-1st-paper")).toEqual({
        registrySubject: "physics",
        paper: "1st-paper",
        apiSubjectSlug: "physics-1st-paper",
        routeSubject: "physics",
        routePaper: "1st-paper",
      });
    });
  });
});
