// pages/index.tsx
import Main from 'src/pages/main/Main';

import { withMainData } from 'lib/withMainData';
export const getStaticProps = withMainData();



export default Main;