// ==UserScript==
// @name         Toast Utility
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  显示提醒
// @author       noname
// @run-at       document-start
// @license      MIT
// @grant        GM_addStyle
// ==/UserScript==

(() => {
// from bilibili
GM_addStyle(`
.link-toast {
  position: absolute;
  padding: 12px 24px;
  font-size: 14px;
  border-radius: 8px;
  white-space: nowrap;
  color: #fff;
  -webkit-animation: link-msg-move-in-top cubic-bezier(0.22, 0.58, 0.12, 0.98) 0.4s;
          animation: link-msg-move-in-top cubic-bezier(0.22, 0.58, 0.12, 0.98) 0.4s;
  z-index: 10000;
}
.link-toast.fixed {
  position: fixed;
}
.link-toast.success {
  background-color: #47d279;
  -webkit-box-shadow: 0 0.2em 0.1em 0.1em rgba(71,210,121,0.2);
          box-shadow: 0 0.2em 0.1em 0.1em rgba(71,210,121,0.2);
}
.link-toast.caution {
  background-color: #ffb243;
  -webkit-box-shadow: 0 0.2em 0.1em 0.1em rgba(255,190,68,0.2);
          box-shadow: 0 0.2em 0.1em 0.1em rgba(255,190,68,0.2);
}
.link-toast.error {
  background-color: #ff6464;
  -webkit-box-shadow: 0 0.2em 1em 0.1em rgba(255,100,100,0.2);
          box-shadow: 0 0.2em 1em 0.1em rgba(255,100,100,0.2);
}
.link-toast.info {
  background-color: #48bbf8;
  -webkit-box-shadow: 0 0.2em 0.1em 0.1em rgba(72,187,248,0.2);
          box-shadow: 0 0.2em 0.1em 0.1em rgba(72,187,248,0.2);
}
.link-toast.out {
  -webkit-animation: link-msg-fade-out cubic-bezier(0.22, 0.58, 0.12, 0.98) 0.4s;
          animation: link-msg-fade-out cubic-bezier(0.22, 0.58, 0.12, 0.98) 0.4s;
}
@-webkit-keyframes link-msg-move-in-top {
  from {
    opacity: 0;
    -webkit-transform: translate(0, 5em);
            transform: translate(0, 5em);
  }
  to {
    opacity: 1;
    -webkit-transform: translate(0, 0);
            transform: translate(0, 0);
  }
}
@keyframes link-msg-move-in-top {
  from {
    opacity: 0;
    -webkit-transform: translate(0, 5em);
            transform: translate(0, 5em);
  }
  to {
    opacity: 1;
    -webkit-transform: translate(0, 0);
            transform: translate(0, 0);
  }
}
@-webkit-keyframes link-msg-fade-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
@keyframes link-msg-fade-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
`);
})();

function toast(msg, type='info', timeout=5e3) {
    if (this.lst === undefined) {
        this.lst = [];
    }
    const lst = this.lst;
    switch (type) {
        case 'success':
        case 'info':
        case 'caution':
        case 'error':
            break;
        default:
            type = 'info';
    }
    const body = document.body;
    const ABS_MARGIN = 10, HEIGHT = 48;
    const div = document.createElement('div');
    const span = document.createElement('span');
    span.innerText = msg;
    div.appendChild(span);
    ['link-toast', type, 'fixed'].forEach(c => div.classList.add(c));
    div.style.top = (body.scrollTop + lst.length * HEIGHT + ABS_MARGIN) + 'px';
    body.appendChild(div);
    div.style.left = (body.offsetWidth + body.scrollLeft - div.offsetWidth - ABS_MARGIN) + 'px';
    lst.push(div);
    setTimeout(() => {
        div.classList.add('out');
        setTimeout(() => {
            lst.shift();
            lst.forEach(div => {
                div.style.top = (parseInt(div.style.top, 10) - HEIGHT) + 'px';
            });
            div.parentElement.removeChild(div);
        }, 200);
    }, timeout);
}