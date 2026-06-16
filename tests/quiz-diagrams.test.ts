import { describe, expect, it } from "vitest";
import {
  questionNeedsDiagramPlaceholder,
  resolveOptionDiagram,
  resolveQuestionDiagram,
  stripQuestionDiagramMarkers,
  isTrustedStoredDiagram,
} from "@/lib/quiz/quiz-diagrams";

describe("quiz-diagrams", () => {
  it("maps SSC physics charge sphere stimulus", () => {
    const text =
      "নিচের উদ্দীপকের আলোকে প্রশ্নের উত্তর দাও : [চিত্র: $100\\text{ cm}$ দূরত্বে অবস্থিত দুটি গোলক A ও B। A এর আধান $+10\\text{ C}$]";
    const resolved = resolveQuestionDiagram(text);
    expect(resolved?.slug).toBe("ssc-charge-spheres");
  });

  it("maps biology paren chitra labels", () => {
    expect(resolveQuestionDiagram("(চিত্র: প্লাজমিড)")?.slug).toBe("plasmid");
  });

  it("maps optics ray diagrams instead of bio-eye", () => {
    expect(
      resolveQuestionDiagram(
        "অবতল দর্পণের বক্রতার কেন্দ্রে (C বিন্দুতে) রাখলে প্রতিবিম্ব হবে— (চিত্রভিত্তিক)",
      )?.slug,
    ).toBe("ssc-concave-mirror");
    expect(
      resolveQuestionDiagram(
        "(চিত্রভিত্তিক) উপরের চিত্রের আলোকে— লেন্সটিতে লক্ষ্যবস্তুর সৃষ্ট প্রতিবিম্ব",
      )?.slug,
    ).toBe("ssc-convex-lens");
    expect(
      resolveQuestionDiagram("চিত্রে O কেন্দ্র হলে নিচের কোনটি সঠিক?"),
    ).toBeNull();
  });

  it("does NOT inject generic parabola for function questions", () => {
    expect(resolveQuestionDiagram("$y = x^2 + 4x + 1$ ফাংশনের লেখচিত্র কীরূপ?")).toBeNull();
  });

  it("maps lekhochitro options only for explicit graph MCQ stems", () => {
    const q = "তড়িৎ প্রাবল্য বনাম দূরত্বের লেখচিত্র কোনটি?";
    expect(resolveOptionDiagram("[লেখচিত্র ১]", q)?.slug).toBe("electric-field-1");
    expect(resolveOptionDiagram("[লেখচিত্র ১]", "x এর প্রাবল্য কত?")).toBeNull();
  });

  it("maps SHM and ideal-gas graph option families", () => {
    const shm = "সরলদোলকের সরণ বনাম সময়ের লেখচিত্র কোনটি সঠিক?";
    expect(resolveOptionDiagram("[লেখচিত্র ২]", shm)?.slug).toBe("shm-graph-2");
    const vt = "স্থির চাপে আদর্শ গ্যাসের আয়তন-তাপমাত্রা লেখচিত্র কোনটি?";
    expect(resolveOptionDiagram("[লেখচিত্র ৩]", vt)?.slug).toBe("vt-graph-3");
  });

  it("maps myopia eye defect", () => {
    expect(
      resolveQuestionDiagram("চোখ দূরের বস্তু দেখতে পায় না কারণ— (উদ্দীপক)")?.slug,
    ).toBe("ssc-myopia-eye");
  });

  it("flags vague chitre questions for missing-diagram notice", () => {
    expect(questionNeedsDiagramPlaceholder("চিত্রে O কেন্দ্র হলে কোনটি সঠিক?")).toBe(true);
    expect(questionNeedsDiagramPlaceholder("নেফ্রনের কাজ কী?")).toBe(false);
  });

  it("strips bracket chitra blocks from stem", () => {
    const text = "প্রশ্ন [চিত্র: গোলক A ও B আধান] শেষ";
    expect(stripQuestionDiagramMarkers(text)).not.toContain("[চিত্র:");
  });

  it("trusts stored paths under /images/quiz/", () => {
    expect(isTrustedStoredDiagram("/images/quiz/ssc-charge-spheres.svg")).toBe(true);
    expect(isTrustedStoredDiagram("/images/quiz/geo-circle-center-o.svg")).toBe(true);
    expect(isTrustedStoredDiagram("/images/quiz/generated/foo-bar.svg")).toBe(true);
    expect(isTrustedStoredDiagram("/images/quiz/premium/foo-bar.svg")).toBe(true);
    expect(isTrustedStoredDiagram("/images/quiz/premium/options/foo-bar_option_ka.svg")).toBe(
      true,
    );
    expect(isTrustedStoredDiagram("/images/other/x.svg")).toBe(false);
  });
});
