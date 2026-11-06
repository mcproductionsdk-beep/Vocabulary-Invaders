import {attachInvadersSession} from './session.mjs';
import {buildId} from './build-id.mjs';

let shellOrigin;
try { shellOrigin = new URL(document.referrer).origin; } catch {}
if (parent !== window && (shellOrigin === location.origin ||
    /^https:\/\/(?:[a-z0-9-]+\.)?bt-vocabulary-platform-staging\.pages\.dev$/.test(shellOrigin))) {
  attachInvadersSession({engine:window.BTInvaders, policy:{shellOrigin,engineOrigin:location.origin,buildId}});
}
