import { redirect } from 'next/navigation'

// Landing page — redirect to /products for MVP
export default function Home() {
  redirect('/products')
}
