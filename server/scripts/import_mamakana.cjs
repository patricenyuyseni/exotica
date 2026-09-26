const fs = require("fs");
const { Client } = require("pg");
require("dotenv").config({ path: ".env" });

const csvPath = "mamakana_fleurs_cbd.csv";

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());

  return result;
}

function slugify(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parsePrice(value) {
  if (!value) return 0;

  const cleaned = value
    .replace(/[€$]/g, "")
    .replace(",", ".")
    .trim();

  const price = Number.parseFloat(cleaned);

  return Number.isFinite(price) ? price : 0;
}

async function main() {
  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV file not found: ${csvPath}`);
  }

  const content = fs.readFileSync(csvPath, "utf8");
  const lines = content
    .split(/\r?\n/)
    .filter((line) => line.trim());

  const headers = parseCSVLine(lines[0]);

  console.log("CSV columns:", headers);

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  console.log("Connected to PostgreSQL.");

  try {
    const categoryResult = await client.query(
      "SELECT id FROM categories WHERE slug = 'fleurs-cbd' LIMIT 1"
    );

    if (categoryResult.rows.length === 0) {
      throw new Error("Fleurs CBD category does not exist.");
    }

    const categoryId = categoryResult.rows[0].id;

    let imported = 0;
    let skipped = 0;

    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVLine(lines[i]);

      if (row.length < 7) {
        console.log(`Skipping invalid row ${i + 1}`);
        skipped++;
        continue;
      }

      const [
        category,
        title,
        priceEUR,
        priceUSD,
        inStock,
        productURL,
        imageURL,
      ] = row;

      if (!title || !priceEUR || !imageURL) {
        console.log(`Skipping incomplete row ${i + 1}: ${title}`);
        skipped++;
        continue;
      }

      const slugBase = slugify(title);
      const slug = `mamakana-${slugBase}`;
      const sku = `MK-${slugBase.toUpperCase()}`;

      const price = parsePrice(priceEUR);

      const existing = await client.query(
        "SELECT id FROM products WHERE sku = $1 OR slug = $2 LIMIT 1",
        [sku, slug]
      );

      if (existing.rows.length > 0) {
        console.log(`Skipping existing product: ${title}`);
        skipped++;
        continue;
      }

      await client.query(
        `
        INSERT INTO products (
          name,
          slug,
          description,
          category_id,
          price,
          compare_at_price,
          image,
          images,
          stock_quantity,
          sku,
          rating,
          review_count,
          featured,
          active
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          NULL,
          $6,
          ARRAY[$6],
          0,
          $7,
          0,
          0,
          false,
          false
        )
        `,
        [
          title,
          slug,
          `Mama Kana product. Original product: ${productURL}`,
          categoryId,
          price,
          imageURL,
          sku,
        ]
      );

      imported++;

      console.log(`Imported: ${title}`);
    }

    console.log("");
    console.log("Import complete.");
    console.log(`Imported: ${imported}`);
    console.log(`Skipped: ${skipped}`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Import failed:");
  console.error(error);
  process.exit(1);
});
