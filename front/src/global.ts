const isDeepEqual = function (object1: any, object2: any) {

  const objKeys1 = Object.keys(object1);
  const objKeys2 = Object.keys(object2);

  if (objKeys1.length !== objKeys2.length) return false;

  for (var key of objKeys1) {
    const value1 = object1[key];
    const value2 = object2[key];

    const isObjects = isObject(value1) && isObject(value2);

    if ((isObjects && !isDeepEqual(value1, value2)) ||
      (!isObjects && value1 !== value2)
    ) {
      return false;
    }
  }
  return true;
};


const clamp = (num: number, min: number, max: number) => {
  return Math.min(Math.max(num, min), max);
};



const isObject = (object: any) => {
  return object != null && typeof object === "object";
};
const toPrice = (num) => {
  let formatedStringArr = [];
  while (num >= 1) {
    let remain = Math.floor(num % 1000);
    num = Math.floor(num / 1000);
    
    let stringData = remain.toString().padStart(3, '0');
    formatedStringArr.push(stringData);
  }
  
  // Удаляем лидирующие нули у последнего элемента (самой старшей части числа)
  if (formatedStringArr.length > 0) {
    formatedStringArr[formatedStringArr.length - 1] = 
      formatedStringArr[formatedStringArr.length - 1].replace(/^0+/, '') || '0';
  }
  
  formatedStringArr.reverse();
  return formatedStringArr.join(".") + " ₽"
};
function getCookie(name) {
  let matches = document.cookie.match(new RegExp(
    "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
  ));
  return matches ? decodeURIComponent(matches[1]) : undefined;
}

function extend(obj1: Object, obj2: Object) {
  let keys = Object.keys(obj1)
  for (let i = 0; i < keys.length; i++) {
    if (obj2[keys[i]] !== undefined) {
      obj1[keys[i]] = obj2[keys[i]]
    }
  }
}

function setGlobalScroller(active) {
  if (active) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = 'unset';
  }
}

function shuffle(array) {
  for (let i = array.length - 1; i >= 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function setCookie(name, value, options: { [key: string]: any } = {}) {

  options = {
    path: '/',
    // при необходимости добавьте другие значения по умолчанию
    ...options
  };

  if (options.expires instanceof Date) {
    options.expires = options.expires.toUTCString();
  }

  let updatedCookie = encodeURIComponent(name) + "=" + encodeURIComponent(value);

  for (let optionKey in options) {
    updatedCookie += "; " + optionKey;
    let optionValue = options[optionKey];
    if (optionValue !== true) {
      updatedCookie += "=" + optionValue;
    }
  }

  document.cookie = updatedCookie;
}


export { isDeepEqual, getCookie, setCookie, toPrice, extend, setGlobalScroller, shuffle,clamp }