import { WpDump } from "./lib/load-json";
import { phpUnserialize } from "./lib/php-unserialize";

const dump = new WpDump("../mouldec_wp.json");
console.log("Tables:", dump.tableNames().length);
const posts = dump.table("posts");
const products = posts.filter((p) => p.post_type === "product");
const variations = posts.filter((p) => p.post_type === "product_variation");
console.log(`Products: ${products.length}, Variations: ${variations.length}`);

const pm = dump.table("postmeta");
const attrMetas = pm.filter((m) => m.meta_key === "_product_attributes");
console.log(`_product_attributes entries: ${attrMetas.length}`);
let ok = 0, fail = 0;
const failures: any[] = [];
for (const m of attrMetas) {
  try {
    phpUnserialize(m.meta_value);
    ok++;
  } catch (e: any) {
    fail++;
    failures.push({ post_id: m.post_id, error: e.message, sample: (m.meta_value || "").slice(0, 150) });
  }
}
console.log(`${ok} OK / ${fail} FAIL`);
if (failures.length) {
  console.log("\nFirst 5 failures:");
  for (const f of failures.slice(0, 5)) console.log(JSON.stringify(f, null, 2));
}
