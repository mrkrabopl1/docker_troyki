export { default } from 'src/pages/admin/orderDetails/OrderDetails';
import { withMainDataServer } from 'lib/withMainData'; // 👈 Server версия

export const getServerSideProps = withMainDataServer()