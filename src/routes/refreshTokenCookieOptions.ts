// if a cookie isn't secure, it can't be cross-site according to Chrome
const isLocal = true || process.env.TTRPGZ_LOCAL === 'true';

let sameSite: 'none' | 'strict';
let secure: boolean;
if (isLocal) {
  // when running local, we want secure to be false so we can use http
  secure = false;
  // Chrome says we also can't have sameSite set to none if secure is false
  sameSite = 'strict';
} else {
  // if we're running on the internet, we want secure to be true (https only)
  secure = true;
  // now we can send the cookie cross-site
  sameSite = 'none';
}

// this means we can't access the cookie on the frontend using javascript
//   such as document.cookie, but it can still be sent with requests
const httpOnly = true;

// cookie will only be sent to /tokens to use refresh token to get new access token
const path = '/';

// if we don't set a cookie expiration, it expires with the session
const maxAge = 1000 * 60 * 60 * 24 * 30; // cookie will expire in 30 days

export default {
  httpOnly,
  secure,
  sameSite,
  path,
  maxAge,
};
