"use strict";(self.webpackChunksamura_snikers=self.webpackChunksamura_snikers||[]).push([[3876],{53876:function(e,t,n){n.r(t);var u=n(62079),r=n.n(u),o=n(52020),i=n.n(o),c=n(73324),l=n.n(c),a=n(88546),s=n.n(a),v=n(66775),f=n.n(v),d=n(2201),h=n.n(d),m=n(57445),p=n.n(m),g=n(95266),b=n(74251),E=n(34652),k=n.n(E),w=n(67552),x=n.n(w),S=n(67294);function Z(e,t){var n=r()(e);if(i()){var u=i()(e);t&&(u=l()(u).call(u,(function(t){return s()(e,t).enumerable}))),n.push.apply(n,u)}return n}t.default=function(e){var t=function(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?Z(Object(n),!0).forEach((function(t){(0,b.Z)(e,t,n[t])})):f()?h()(e,f()(n)):Z(Object(n)).forEach((function(t){p()(e,t,s()(n,t))}))}return e}({},e),n=t.callback,u=t.kSize,r=t.kPos,o=t.isVertical,i=(0,S.useState)(r),c=(0,g.Z)(i,2),l=c[0],a=c[1],v=(0,S.useState)(!1),d=(0,g.Z)(v,2),m=d[0],E=d[1],w=(0,S.useState)(null),y=(0,g.Z)(w,2),M=(y[0],y[1],(0,S.useState)(0)),L=(0,g.Z)(M,2),W=L[0],C=L[1],H=(0,S.useState)(0),R=(0,g.Z)(H,2),D=R[0],Y=R[1],I=(0,S.useRef)(null),U=(0,S.useRef)(null),X=(0,S.useRef)(null),j=(0,S.useState)(0),z=(0,g.Z)(j,2),O=(z[0],z[1],(0,S.useState)(0)),P=(0,g.Z)(O,2),_=(P[0],P[1],(0,S.useState)(!1)),T=(0,g.Z)(_,2),V=(T[0],T[1],(0,S.useState)(!1)),q=(0,g.Z)(V,2),A=(q[0],q[1],(0,S.useRef)(null));(0,S.useRef)(null);(0,S.useEffect)((function(){return document.addEventListener("mouseup",(function(e){document.removeEventListener("mousemove",ee),E(!1)})),document.addEventListener("mousemove",ee),I.current&&X.current&&(o?(C(I.current.clientHeight*u),a(r*(I.current.clientHeight-X.current.clientHeight))):(C(I.current.clientWidth*u),a(r*(I.current.clientWidth-X.current.clientWidth)))),function(){document.removeEventListener("mousemove",ee),document.removeEventListener("mouseup",(function(e){document.removeEventListener("mousemove",ee),E(!1)}))}}),[e]);var B={zIndex:10,backgroundColor:"green",display:" flex"},F={backgroundColor:"red",width:"100%",height:"20px"},G={width:"20px",height:"100%"},J={width:"100%",height:"20px"},K={width:"100%",height:W+"px",top:l+"px"},N={width:W+"px",height:"100%",left:l+"px"},Q={position:"absolute",backgroundColor:"yellow"};o?(x()(Q,K),x()(B,G),B.position="absolute",B.right=0,B.flexDirection="column"):(x()(Q,N),x()(B,J),B.position="absolute",B.bottom=0);var $={position:"relative",width:"auto",height:"auto"};o?x()($,G):x()($,J);var ee=function(e){if(X.current&&I.current&&m){var t;if(o){var u,r,i=(null===(u=I.current)||void 0===u?void 0:u.clientHeight)-(null===(r=X.current)||void 0===r?void 0:r.clientHeight);t=(e.clientY-D)/i,Y(e.clientY)}else{var c,l,a=(null===(c=I.current)||void 0===c?void 0:c.clientWidth)-(null===(l=X.current)||void 0===l?void 0:l.clientWidth);t=(e.clientX-D)/a,Y(e.clientX)}n(t,!0)}};return S.createElement("div",{onWheel:function(e){e.stopPropagation();var t=e.deltaY>0?-10:10;n(t)},id:"Thumb",ref:A,style:B},S.createElement("button",{onMouseDown:function(e){var t=0;U.current=k()((function(){n(t-=.01,!0)}),10)},onMouseUp:function(){U.current&&(clearInterval(U.current),U.current=null)},style:F}),S.createElement("div",{ref:I,style:$},S.createElement("div",{onMouseUp:function(){E(!1)},onMouseDown:function(e){Y(o?e.clientY:e.clientX),E(!0)},onMouseMove:ee,ref:X,style:Q})),S.createElement("button",{onMouseDown:function(e){var t=0;U.current=k()((function(){n(t+=.01,!0)}),10)},onMouseUp:function(){U.current&&(clearInterval(U.current),U.current=null)},style:F}))}}}]);