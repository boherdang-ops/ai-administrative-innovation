import {beginOrResume as originalBeginOrResume} from './session-flow.mjs?v=20261019-5';
export {setupDefaults} from './session-flow.mjs?v=20261019-5';
export const REVIEW_VERSION='review-20261019-1';
export function beginOrResume(definition,target,context,previous,resume=false){const next=originalBeginOrResume(definition,target,context,previous,resume);if(!resume||previous?.target!==target)next.reviewVersion=REVIEW_VERSION;return next;}
