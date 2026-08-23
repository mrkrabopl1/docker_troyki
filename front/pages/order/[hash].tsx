export { default } from 'src/pages/orderPage/OrderPage';
import { withMainDataServer } from 'lib/withMainData'; // 👈 Server версия

export const getServerSideProps = withMainDataServer()