import { notFound } from 'next/navigation';
import BookingWizard from '@/components/booking/BookingWizard';

export const metadata = {
  title: 'Book Appointment - StudioDesk',
  description: 'Book your salon appointment online in seconds',
};

export default async function PublicBookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Ignore static assets or system files
  if (
    !slug ||
    slug === 'favicon.ico' ||
    slug === 'robots.txt' ||
    slug === 'sitemap.xml' ||
    slug.startsWith('_')
  ) {
    notFound();
  }

  return <BookingWizard slug={slug} />;
}
