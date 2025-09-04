import { redirect } from 'next/navigation';

export default function Page() {
  // Redirect to the main auth page
  redirect('/auth');
}