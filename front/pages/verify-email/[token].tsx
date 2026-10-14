export { default } from 'src/pages/verification/Verification';
import { withMainDataServer } from 'lib/withMainData'; // 👈 Server версия

export const getServerSideProps = withMainDataServer()