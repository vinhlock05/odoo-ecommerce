const B = 'https://images.unsplash.com/photo-'
const P = '?w=440&h=586&fit=crop&q=75&auto=format'
const HP = '?w=1400&h=820&fit=crop&q=80&auto=format'

// Curated, high-confidence Unsplash photo IDs for each product category.
// Products in the same category rotate deterministically by (id % length).
const PHOTOS: Record<string, string[]> = {
  'Áo Thun': [
    `${B}1521572163474-6864f9cf17ab${P}`, // Emil Séguin — white crew-neck tee (iconic)
    `${B}1503341504253-dff4815485f1${P}`, // man casual tshirt
    `${B}1583743814966-8d20eb5be2a5${P}`, // man in grey tshirt
    `${B}1576566588028-4147f3842f27${P}`, // lifestyle tee
  ],
  'Áo Polo': [
    `${B}1620799140408-edc6dcb6d633${P}`,
    `${B}1503341504253-dff4815485f1${P}`,
  ],
  'Áo Ba Lỗ': [
    `${B}1571019613454-1cb2f99b2d8b${P}`, // woman sportswear
    `${B}1518611012144-c628e24b2c1f${P}`, // athletic crop
  ],
  'Áo Sơ Mi': [
    `${B}1617720098840-cf0e88e5b6c8${P}`, // dress shirt men
    `${B}1515886657613-9f3515b0c78f${P}`, // casual shirt women
  ],
  'Quần Short': [
    `${B}1591195853828-11db59a44f43${P}`,
    `${B}1518611012144-c628e24b2c1f${P}`,
  ],
  'Quần Jogger': [
    `${B}1594938298870-5f00a993b9de${P}`,
    `${B}1568702846914-96b305d2aaeb${P}`,
  ],
  'Quần Dài': [
    `${B}1491553895911-0055eca6402d${P}`,
    `${B}1529139574466-a303027c1d8b${P}`,
  ],
  'Hoodie & Sweatshirt': [
    `${B}1568702846914-96b305d2aaeb${P}`, // gray hoodie on wall (iconic)
    `${B}1543087903-8d127ce64eda${P}`,    // oversized hoodie women
    `${B}1614680376573-df3480f0c6b8${P}`, // dark zip hoodie
  ],
  'Áo Khoác': [
    `${B}1551028719-00167b16eac8${P}`,    // colorful windbreaker
    `${B}1539109136881-3be0616acf4b${P}`, // leather jacket women
  ],
  'Váy & Đầm': [
    `${B}1515886657613-9f3515b0c78f${P}`, // women white fashion
    `${B}1529139574466-a303027c1d8b${P}`, // street style skirt
    `${B}1485230895905-ec40ba36b9bc${P}`, // midi dress
  ],
  'Đồ Lót & Sports Bra': [
    `${B}1571019613454-1cb2f99b2d8b${P}`,
    `${B}1538805060514-2d2d9f194e3c${P}`,
  ],
  'Đồ Bộ Thể Thao': [
    `${B}1539794830467-1f1755804d13${P}`,
    `${B}1571019613454-1cb2f99b2d8b${P}`,
  ],
}

const DEFAULT = `${B}1521572163474-6864f9cf17ab${P}`

export function getProductPhoto(category: string | undefined, productId: number): string {
  const photos = PHOTOS[category?.trim() ?? '']
  if (!photos?.length) return DEFAULT
  return photos[productId % photos.length]
}

// Hero photos for the CategoryBento section
export const CATEGORY_HERO: Record<string, string> = {
  nam:    `${B}1490114538077-0a7f8cb49891${HP}`, // men urban fashion editorial
  nu:     `${B}1483985988355-763728e1935b${HP}`, // women fashion street
  unisex: `${B}1529139574466-a303027c1d8b${HP}`, // unisex street style
  sale:   `${B}1607082348824-0a96f2a4b9da${HP}`, // colorful clothes rack
}
