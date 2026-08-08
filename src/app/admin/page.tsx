import { Metadata } from 'next';
import AdminClient from '@/components/AdminClient';

export const metadata: Metadata = {
  title: 'Admin - Attendance System',
  description: 'Admin panel for attendance system',
};

export default function AdminPage() {
  return <AdminClient />;
}
