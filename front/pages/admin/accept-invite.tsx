export { default } from 'src/pages/admin/invite/Invite';
import { withMainDataServer } from 'lib/withMainData'; // 👈 Server версия

export const getServerSideProps = withMainDataServer()
