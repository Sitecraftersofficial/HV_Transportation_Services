export default async function run(page) {
  const results = {};
  const sizes = [
    { name: "phone", width: 360, height: 740 },
    { name: "large-phone", width: 430, height: 930 },
    { name: "tablet", width: 768, height: 1024 },
  ];

  for (const size of sizes) {
    await page.setViewportSize({ width: size.width, height: size.height });
    await page.goto("http://localhost:5199/", { waitUntil: "networkidle" });

    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      const bodyOverflow = doc.scrollWidth - doc.clientWidth;
      // find widest elements that overflow viewport
      const culprits = [];
      document.querySelectorAll("header, footer, header *, footer *").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.right > doc.clientWidth + 1 || r.left < -1) {
          culprits.push({
            tag: el.tagName.toLowerCase(),
            cls: (el.className || "").toString().slice(0, 80),
            right: Math.round(r.right),
            width: Math.round(r.width),
          });
        }
      });
      return { bodyOverflow, culprits: culprits.slice(0, 5) };
    });

    const headerH = await page.evaluate(
      () => document.querySelector("header > div")?.getBoundingClientRect().height,
    );
    const logoBox = await page.evaluate(() => {
      const img = document.querySelector("header img");
      const r = img?.getBoundingClientRect();
      return r ? { w: Math.round(r.width), h: Math.round(r.height) } : null;
    });

    await page.screenshot({ path: `qa-${size.name}.png`, fullPage: false });

    // footer screenshot: scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(600);
    await page.screenshot({ path: `qa-${size.name}-footer.png`, fullPage: false });

    results[size.name] = { overflow, headerH: Math.round(headerH), logoBox };
  }
  return results;
}
