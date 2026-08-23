export { default } from 'src/pages/admin/productForm/AdminProductForm';
import { withMainDataServer } from 'lib/withMainData'; // 👈 Server версия

export const getServerSideProps = withMainDataServer()