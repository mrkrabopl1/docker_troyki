// pages/admin/index.tsx
import { GetServerSideProps } from 'next';
import { withMainDataServer } from 'lib/withMainData';

export const getServerSideProps = withMainDataServer(async () => {
  return {
    redirect: {
      destination: '/admin/login',
      permanent: false,
    },
  };
});

export default function AdminIndex() {
  return null;
}