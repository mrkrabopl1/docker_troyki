"use strict";(self.webpackChunksamura_snikers=self.webpackChunksamura_snikers||[]).push([[2027],{72027:function(e,t,r){r.r(t);var n=r(62079),u=r.n(n),c=r(52020),i=r.n(c),l=r(73324),a=r.n(l),o=r(88546),s=r.n(o),f=r(66775),d=r.n(f),h=r(2201),v=r.n(h),p=r(57445),k=r.n(p),g=r(95266),m=r(74251),b=r(67294),W=r(53876);function E(e,t){var r=u()(e);if(i()){var n=i()(e);t&&(n=a()(n).call(n,(function(t){return s()(e,t).enumerable}))),r.push.apply(r,n)}return r}t.default=function(e){var t=function(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?E(Object(r),!0).forEach((function(t){(0,m.Z)(e,t,r[t])})):d()?v()(e,d()(r)):E(Object(r)).forEach((function(t){k()(e,t,s()(r,t))}))}return e}({},e),r=t.className,n=t.children,u=(0,b.useState)(0),c=(0,g.Z)(u,2),i=c[0],l=c[1],a=(0,b.useState)(0),o=(0,g.Z)(a,2),f=o[0],h=o[1],p=((0,b.useRef)(null),(0,b.useRef)(0)),R=(0,b.useRef)(0),S=(0,b.useRef)(0),H=(0,b.useRef)(0),w=(0,b.useState)(!1),Z=(0,g.Z)(w,2),y=Z[0],P=Z[1],j=(0,b.useState)(!1),x=(0,g.Z)(j,2),z=x[0],C=x[1],N=(0,b.useRef)(null),O=(0,b.useRef)(null);(0,b.useEffect)((function(){N.current&&O.current&&(O.current.clientWidth>N.current.clientWidth&&(S.current=N.current.clientWidth/O.current.clientWidth,P(!0)),O.current.clientHeight>N.current.clientHeight&&(p.current=N.current.clientHeight/O.current.clientHeight,C(!0)))}),[]);var V={position:"absolute",top:i+"px",left:f+"px",width:"inherit"},_=function(e){var t=arguments.length>1&&void 0!==arguments[1]&&arguments[1];if(O.current&&N.current){var r,n,u=(null===(r=N.current)||void 0===r?void 0:r.clientHeight)-(null===(n=O.current)||void 0===n?void 0:n.clientHeight);u<0&&(t&&(e*=u),e+i>0?(R.current=0,l(0)):e+i<u?(R.current=1,l(u)):(R.current=(i+e)/u,l(i+e)))}};return b.createElement("div",{className:r,id:"Scroller",onWheel:function(e){e.stopPropagation();var t=e.deltaY>0?-10:10;_(t)},ref:N,style:{position:"relative",width:"100%",height:"100%",overflow:"hidden"}},b.createElement("div",{id:"Wrap",ref:O,style:V},n),z?b.createElement(W.default,{callback:_,isVertical:!0,kSize:p.current,kPos:R.current}):null,y?b.createElement(W.default,{callback:function(e){var t=arguments.length>1&&void 0!==arguments[1]&&arguments[1];if(O.current&&N.current){var r,n,u=(null===(r=N.current)||void 0===r?void 0:r.clientWidth)-(null===(n=O.current)||void 0===n?void 0:n.clientWidth);t&&(e*=u),e+f>0?(H.current=0,h(0)):e+f<u?(H.current=1,h(u)):(H.current=(f+e)/u,h(f+e))}},isVertical:!1,kSize:S.current,kPos:H.current}):null)}}}]);