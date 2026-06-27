import { Metadata } from 'next';
import HomeClient from '@/components/HomeClient';

export const metadata: Metadata = {
  title: 'Attendance System',
  description: 'Record and track attendance for events',
};

export default function Home() {
  return <HomeClient />;
}