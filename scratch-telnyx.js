const T = require('telnyx');
console.log(typeof T);
const instance = typeof T === 'function' && !T.toString().startsWith('class') ? T('fake-key') : new T('fake-key');
console.log('Instance methods:', Object.keys(instance).slice(0, 5));
