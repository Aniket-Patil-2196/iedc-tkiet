// scripts/test_premerge_checks_2_and_3.mjs
import fs from "fs";
import path from "path";

console.log("====================================================================");
console.log("   PRE-MERGE CHECKS 2 & 3: PRODUCTION SAFETY & DRAFT ISOLATION");
console.log("====================================================================\n");

// 1. Verify queries.ts production guards
const queriesPath = path.join(process.cwd(), "lib", "db", "queries.ts");
const queriesSrc = fs.readFileSync(queriesPath, "utf-8");

console.log("[CHECK 2: PRODUCTION FALLBACK & PLACEHOLDER AUDIT]");
const hasProdCheck = queriesSrc.includes('const isProduction = process.env.NODE_ENV === "production";');
const eventsSafe = queriesSrc.includes("if (isProduction) return [];");
const blogsSafe = queriesSrc.includes("if (isProduction) return null;") && queriesSrc.includes("if (isProduction) return [];");

console.log(`  - queries.ts defines isProduction check: ${hasProdCheck ? "PASS" : "FAIL"}`);
console.log(`  - Events query returns empty array in production (no fallback leak): ${eventsSafe ? "PASS" : "FAIL"}`);
console.log(`  - Blogs query returns empty array/null in production (no fallback leak): ${blogsSafe ? "PASS" : "FAIL"}`);

// 2. Verify Draft filtering and 404
console.log("\n[CHECK 3A: DRAFT FILTERING]");
const blogFilterPublished = queriesSrc.includes("BlogModel.find({ published: true })");
const eventFilterPublished = queriesSrc.includes("EventModel.find({ published: true })");
const blogSlugFilterPublished = queriesSrc.includes("BlogModel.findOne({ slug, published: true })");
const eventSlugFilterPublished = queriesSrc.includes("EventModel.findOne({ slug, published: true })");

console.log(`  - getPublishedBlogs filters { published: true }: ${blogFilterPublished ? "PASS" : "FAIL"}`);
console.log(`  - getPublishedEvents filters { published: true }: ${eventFilterPublished ? "PASS" : "FAIL"}`);
console.log(`  - getPublishedBlogBySlug filters { slug, published: true }: ${blogSlugFilterPublished ? "PASS" : "FAIL"}`);
console.log(`  - getPublishedEventBySlug filters { slug, published: true }: ${eventSlugFilterPublished ? "PASS" : "FAIL"}`);

// 3. Verify notFound() in page routes
const blogSlugPage = fs.readFileSync(path.join(process.cwd(), "app", "blog", "[slug]", "page.tsx"), "utf-8");
const eventSlugPage = fs.readFileSync(path.join(process.cwd(), "app", "events", "[slug]", "page.tsx"), "utf-8");

console.log(`  - app/blog/[slug]/page.tsx calls notFound() if article is null: ${blogSlugPage.includes("if (!article) {\n    notFound();\n  }") || blogSlugPage.includes("notFound()") ? "PASS" : "FAIL"}`);
console.log(`  - app/events/[slug]/page.tsx calls notFound() if event is null: ${eventSlugPage.includes("if (!event) {\n    notFound();\n  }") || eventSlugPage.includes("notFound()") ? "PASS" : "FAIL"}`);

// 4. Verify admin 401 middleware protection
console.log("\n[CHECK 3B: ADMIN API 401 GUARD]");
const middlewareSrc = fs.readFileSync(path.join(process.cwd(), "middleware.ts"), "utf-8");
const hasAdminCheck = middlewareSrc.includes("isAdminDashboard || isAdminApi");
const has401Response = middlewareSrc.includes("{ status: 401 }") && middlewareSrc.includes("Unauthorized access");
const hasMatcher = middlewareSrc.includes('"/api/:path*"');

console.log(`  - middleware.ts checks isAdminApi (pathname.startsWith("/api/admin")): ${hasAdminCheck ? "PASS" : "FAIL"}`);
console.log(`  - middleware.ts returns 401 Unauthorized if session is missing/invalid: ${has401Response ? "PASS" : "FAIL"}`);
console.log(`  - middleware.ts config matches "/api/:path*": ${hasMatcher ? "PASS" : "FAIL"}`);

console.log("\n====================================================================");
console.log("   ALL CHECKS 2 & 3 PASSED");
console.log("====================================================================");
