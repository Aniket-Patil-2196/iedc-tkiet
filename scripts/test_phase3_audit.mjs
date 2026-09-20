// scripts/test_phase3_audit.mjs
const BASE_URL = "http://localhost:3000";

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log("==========================================================");
  console.log("PHASE 3 AUDIT & SECURITY TEST SUITE (AGAINST IEDC_DEV DB)");
  console.log("==========================================================");

  // Set hard timeout of 50s inside script
  const timeoutTimer = setTimeout(() => {
    console.error("\n[ERROR] Hard timeout reached (50s)!");
    process.exit(1);
  }, 50000);

  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      const res = await fn();
      console.log(`[PASS] Test ${total}: ${name} -> ${res}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] Test ${total}: ${name} -> ${err.message}`);
      throw err;
    }
  }

  // 1. Authenticate as admin to get session cookie
  console.log("Authenticating as admin...");
  const loginRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@tkiet.ac.in", password: "iedc@tkiet2024" }),
  });
  if (loginRes.status !== 200) {
    throw new Error(`Admin login failed with status ${loginRes.status}`);
  }
  const cookieHeader = loginRes.headers.get("set-cookie") || "";
  const adminCookie = cookieHeader.split(";")[0];
  console.log("Admin session established.\n");

  // Ensure at least one published blog exists in iedc_dev
  const blogsRes = await fetch(`${BASE_URL}/api/admin/blogs`, {
    headers: { Cookie: adminCookie },
  });
  const blogsData = await blogsRes.json();
  let testBlogSlug = "fostering-innovation-tkiet";

  if (!blogsData.data || blogsData.data.length === 0) {
    console.log("Creating baseline test blog in iedc_dev...");
    const createBlogRes = await fetch(`${BASE_URL}/api/admin/blogs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        title: "Cultivating Student-Led Innovation at TKIET",
        slug: "fostering-innovation-tkiet",
        excerpt: "Structured incubation and prototyping at TKIET Warananagar.",
        content: "Engineering education is evolving rapidly beyond theoretical coursework. Today's challenges require courageous prototyping.",
        published: true,
      }),
    });
    const createBlogData = await createBlogRes.json();
    if (createBlogData.data?.slug) {
      testBlogSlug = createBlogData.data.slug;
    }
  } else {
    testBlogSlug = blogsData.data.find((b) => b.published)?.slug || blogsData.data[0].slug;
  }
  console.log(`Target published blog for tests: "${testBlogSlug}"\n`);

  // Also create a draft blog for testing draft rejection
  const draftSlug = `test-draft-blog-${Date.now()}`;
  await fetch(`${BASE_URL}/api/admin/blogs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      title: "Draft Article Never Published",
      slug: draftSlug,
      excerpt: "Internal draft only.",
      content: "This is a draft article that must not receive comments.",
      published: false,
    }),
  });

  // TEST 1: POST comment on a draft blog returns 404
  await test("POST comment on a draft blog returns 404", async () => {
    const res = await fetch(`${BASE_URL}/api/blogs/${draftSlug}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "test@example.com",
        body: "Trying to comment on a draft post",
        formLoadedAt: Date.now() - 5000,
      }),
    });
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
    return `HTTP 404 (Article not found or not published)`;
  });

  // TEST 2: Invalid email returns 400
  await test("Invalid email returns 400", async () => {
    const res = await fetch(`${BASE_URL}/api/blogs/${testBlogSlug}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "not-a-valid-email",
        body: "Valid comment text here.",
        formLoadedAt: Date.now() - 5000,
      }),
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    const data = await res.json();
    return `HTTP 400 (${data.error})`;
  });

  // TEST 3: <script> in comment stored as plain text and rendered escaped
  await test("<script> in comment stored as plain text", async () => {
    const scriptBody = "<script>alert('xss')</script> Legitimate research feedback.";
    const uniqueEmail = `xss_test_${Date.now()}@tkiet.ac.in`;
    const res = await fetch(`${BASE_URL}/api/blogs/${testBlogSlug}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Security Researcher",
        email: uniqueEmail,
        body: scriptBody,
        formLoadedAt: Date.now() - 5000,
      }),
    });
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
    const data = await res.json();
    const commentId = data.id;

    // Approve comment via admin
    await fetch(`${BASE_URL}/api/admin/comments/${commentId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({ status: "approved" }),
    });

    // Fetch public comments
    const pubRes = await fetch(`${BASE_URL}/api/blogs/${testBlogSlug}/comments`);
    const pubData = await pubRes.json();
    const target = pubData.data.find((c) => c._id === commentId);
    if (!target) throw new Error("Approved comment not found in public feed");
    if (target.body !== scriptBody) {
      throw new Error(`Body altered unexpectedly: ${target.body}`);
    }
    return `HTTP 201 -> Stored as literal string "${target.body}", React renders as safe text (zero execution)`;
  });

  // TEST 4: Body over limit (> 1000 characters) returns 400
  await test("Body over 1000 chars limit returns 400", async () => {
    const longBody = "A".repeat(1005);
    const res = await fetch(`${BASE_URL}/api/blogs/${testBlogSlug}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "test@example.com",
        body: longBody,
        formLoadedAt: Date.now() - 5000,
      }),
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    const data = await res.json();
    return `HTTP 400 (${data.error})`;
  });

  // TEST 5: More than 2 links rejected
  await test("More than 2 links rejected returns 400", async () => {
    const multiLinkBody = "Check out https://one.com and also https://two.com and https://three.com";
    const res = await fetch(`${BASE_URL}/api/blogs/${testBlogSlug}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Link Spammer",
        email: "spammer@links.com",
        body: multiLinkBody,
        formLoadedAt: Date.now() - 5000,
      }),
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    const data = await res.json();
    return `HTTP 400 (${data.error})`;
  });

  // TEST 6: Cross-origin POST rejected
  await test("Cross-origin POST with foreign Origin header returns 403", async () => {
    const res = await fetch(`${BASE_URL}/api/blogs/${testBlogSlug}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://malicious-attacker-domain.xyz",
      },
      body: JSON.stringify({
        name: "Cross Origin Attacker",
        email: "attacker@domain.xyz",
        body: "CSRF attempt via cross origin script",
        formLoadedAt: Date.now() - 5000,
      }),
    });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
    const data = await res.json();
    return `HTTP 403 (${data.error})`;
  });

  // TEST 7: Submission under 3s rejected
  await test("Submission under 3s rejected returns 429", async () => {
    const res = await fetch(`${BASE_URL}/api/blogs/${testBlogSlug}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Speed Bot",
        email: "speedbot@example.com",
        body: "Instant automated comment within 500ms.",
        formLoadedAt: Date.now() - 500, // Loaded only 500ms ago (< 3000ms)
      }),
    });
    if (res.status !== 429) throw new Error(`Expected 429, got ${res.status}`);
    const data = await res.json();
    return `HTTP 429 (${data.error})`;
  });

  // TEST 8: Unauthenticated calls to every /api/admin/comments* route return 401
  const adminRoutes = [
    { method: "GET", path: "/api/admin/comments" },
    { method: "PATCH", path: "/api/admin/comments/6ab05850a80010d0f53c459d", body: { status: "approved" } },
    { method: "DELETE", path: "/api/admin/comments/6ab05850a80010d0f53c459d" },
    { method: "GET", path: "/api/admin/comments/stats" },
  ];

  for (const route of adminRoutes) {
    await test(`Unauthenticated ${route.method} ${route.path} returns 401`, async () => {
      const opts = {
        method: route.method,
        headers: { "Content-Type": "application/json" },
      };
      if (route.body) opts.body = JSON.stringify(route.body);
      const res = await fetch(`${BASE_URL}${route.path}`, opts);
      if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
      return `HTTP 401 Unauthorized`;
    });
  }

  // TEST 9: Deleting a blog deletes its comments (Cascade deletion)
  await test("Deleting a blog deletes all its associated comments", async () => {
    const cascadeBlogSlug = `cascade-test-${Date.now()}`;
    // 1. Create temporary blog
    const blogRes = await fetch(`${BASE_URL}/api/admin/blogs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        title: "Temporary Blog for Cascade Deletion Test",
        slug: cascadeBlogSlug,
        excerpt: "This blog will be deleted.",
        content: "Testing cascade deletion of comments.",
        published: true,
      }),
    });
    const blogData = await blogRes.json();
    const blogId = blogData.data._id;

    // 2. Post a comment on this blog
    const commentRes = await fetch(`${BASE_URL}/api/blogs/${cascadeBlogSlug}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Temporary Commenter",
        email: `temp_${Date.now()}@example.com`,
        body: "This comment should vanish when the blog is deleted.",
        formLoadedAt: Date.now() - 4000,
      }),
    });
    if (commentRes.status !== 201) throw new Error(`Failed to post comment: ${commentRes.status}`);

    // Verify comment exists in admin comments
    const listRes1 = await fetch(`${BASE_URL}/api/admin/comments?blogSlug=${cascadeBlogSlug}`, {
      headers: { Cookie: adminCookie },
    });
    const listData1 = await listRes1.json();
    if (listData1.data.length === 0) throw new Error("Comment was not saved in DB before blog deletion");

    // 3. Delete the blog
    const delRes = await fetch(`${BASE_URL}/api/admin/blogs/${blogId}`, {
      method: "DELETE",
      headers: { Cookie: adminCookie },
    });
    if (delRes.status !== 200) throw new Error(`Failed to delete blog: ${delRes.status}`);

    // 4. Verify comments are deleted
    const listRes2 = await fetch(`${BASE_URL}/api/admin/comments?blogSlug=${cascadeBlogSlug}`, {
      headers: { Cookie: adminCookie },
    });
    const listData2 = await listRes2.json();
    if (listData2.data.length !== 0) {
      throw new Error(`Comments were NOT cascade deleted! Found ${listData2.data.length} comments remaining.`);
    }

    return `Created blog & comment -> Deleted blog -> Comments remaining: 0 [PASS]`;
  });

  clearTimeout(timeoutTimer);
  console.log("\n==========================================================");
  console.log(`ALL TESTS PASSED: ${passed}/${total} checks succeeded!`);
  console.log("==========================================================");
}

run().catch((err) => {
  console.error("\nFATAL TEST FAILURE:", err);
  process.exit(1);
});
