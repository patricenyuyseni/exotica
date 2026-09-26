-- Seed categories
INSERT INTO categories (id, name, slug, description)
VALUES
  (gen_random_uuid(), 'Exotic Botanicals', 'exotic-botanicals', 'Rare botanicals and plant extracts'),
  (gen_random_uuid(), 'Herbal Blends', 'herbal-blends', 'Curated herbal blends'),
  (gen_random_uuid(), 'Aromatic Products', 'aromatic-products', 'Premium aromatic products'),
  (gen_random_uuid(), 'Lifestyle Accessories', 'lifestyle-accessories', 'Luxury lifestyle accessories')
ON CONFLICT DO NOTHING;

-- Seed products
INSERT INTO products (id, name, slug, description, category_id, price, compare_at_price, image, images, stock_quantity, sku, rating, review_count, featured, active)
VALUES
  (gen_random_uuid(), 'Moonlight', 'moonlight', 'A luminous exotic botanical blend.', (SELECT id FROM categories WHERE slug='exotic-botanicals'), 129.99, 159.99, '/images/products/moonlight.jpg', ARRAY['/images/products/moonlight.jpg'], 50, 'EX-MOON-001', 4.8, 24, true, true),
  (gen_random_uuid(), 'Purple Nebula', 'purple-nebula', 'Fragrant nebula-inspired aroma.', (SELECT id FROM categories WHERE slug='aromatic-products'), 89.99, NULL, '/images/products/purple-nebula.jpg', ARRAY['/images/products/purple-nebula.jpg'], 30, 'EX-PURP-002', 4.6, 12, false, true),
  (gen_random_uuid(), 'Golden Mirage', 'golden-mirage', 'Golden notes of luxury and warmth.', (SELECT id FROM categories WHERE slug='lifestyle-accessories'), 199.99, 249.99, '/images/products/golden-mirage.jpg', ARRAY['/images/products/golden-mirage.jpg'], 15, 'EX-GOLD-003', 4.9, 8, true, true),
  (gen_random_uuid(), 'Tropical Mist', 'tropical-mist', 'Refreshing tropical botanical mist.', (SELECT id FROM categories WHERE slug='herbal-blends'), 59.99, NULL, '/images/products/tropical-mist.jpg', ARRAY['/images/products/tropical-mist.jpg'], 100, 'EX-TROP-004', 4.5, 5, false, true),
  (gen_random_uuid(), 'Velvet Sunset', 'velvet-sunset', 'Velvet-smooth exotic extract.', (SELECT id FROM categories WHERE slug='exotic-botanicals'), 149.99, 179.99, '/images/products/velvet-sunset.jpg', ARRAY['/images/products/velvet-sunset.jpg'], 20, 'EX-VELV-005', 4.7, 16, true, true),
  (gen_random_uuid(), 'Cosmic Dream', 'cosmic-dream', 'Dreamlike aromatic experience.', (SELECT id FROM categories WHERE slug='aromatic-products'), 119.99, NULL, '/images/products/cosmic-dream.jpg', ARRAY['/images/products/cosmic-dream.jpg'], 40, 'EX-COSM-006', 4.4, 6, false, true);
