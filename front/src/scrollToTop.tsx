import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from 'src/store/hooks/redux'
import { show, sticky } from 'src/store/reducers/menuSlice'
const ScrollToTop = () => {
    const { pathname } = useLocation();
    const dispatch = useAppDispatch()
  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(show(true))
    dispatch(sticky(true))
  }, [pathname]);

  return null;
};

export default ScrollToTop;