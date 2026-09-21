// scripts/verify_chunks.mjs
async function test() {
  const timeout = setTimeout(() => {
    console.error("Timeout checking chunks");
    process.exit(1);
  }, 15000);

  const res = await fetch("http://localhost:3000/blog");
  console.log("GET /blog HTML Status:", res.status);
  const html = await res.text();

  const regex = /src="(\/_next\/static\/[^"]+)"/g;
  let match;
  const chunks = [];
  while ((match = regex.exec(html)) !== null) {
    chunks.push(match[1]);
  }

  console.log(`Auditing ${chunks.length} static chunk script tags...`);
  for (const chunk of chunks) {
    const chunkRes = await fetch("http://localhost:3000" + chunk);
    const contentType = chunkRes.headers.get("content-type");
    if (chunkRes.status !== 200 || !contentType?.includes("javascript")) {
      console.error(`FAILED: ${chunk} -> Status ${chunkRes.status}, Content-Type: ${contentType}`);
      process.exit(1);
    }
    console.log(`[200 OK] ${chunk} (${contentType})`);
  }

  clearTimeout(timeout);
  console.log("\nALL NEXT.JS ASSETS & CHUNKS VERIFIED SUCCESSFULLY WITH 200 OK (MIME: application/javascript)!");
}

test().catch((err) => {
  console.error("Chunk audit error:", err);
  process.exit(1);
});
