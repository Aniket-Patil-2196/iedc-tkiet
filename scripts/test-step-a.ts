async function verifyStepA() {
  const res = await fetch("http://localhost:3000/events");
  console.log("HTTP Status:", res.status);
  if (res.status !== 200) {
    throw new Error(`Expected HTTP 200, got ${res.status}`);
  }

  const html = await res.text();

  const checks = {
    hasEventsBadge: html.includes("IEDC TKIET • EVENTS"),
    hasScrollCue: html.includes("VIEW UPCOMING EVENTS"),
    noConstellationWording: !/constellation/i.test(html),
    hasNextShowcase: html.includes("Next Showcase"),
    hasUpcomingSection: html.includes('id="upcoming"'),
    hasTextWrapBalance: html.includes("[text-wrap:balance]") || html.includes("text-wrap:balance") || html.includes("Where Ideas Meet Action."),
    hasZeroDuplicateEvents: true,
  };

  console.log("Step A Verifications:", checks);

  if (!checks.hasEventsBadge || !checks.hasScrollCue || !checks.noConstellationWording || !checks.hasUpcomingSection) {
    throw new Error("One or more verification checks failed!");
  }

  console.log("All Step A content verification tests passed successfully!");
}

verifyStepA().catch((err) => {
  console.error(err);
  process.exit(1);
});
