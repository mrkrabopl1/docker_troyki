export { default } from 'src/pages/admin/resetPassword/ResetPassword';
import { withMainDataServer } from 'lib/withMainData'; // 👈 Server версия

export const getServerSideProps = withMainDataServer()