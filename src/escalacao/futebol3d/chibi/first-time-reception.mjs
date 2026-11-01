/** A quick two-touch exchange is still a reception followed by a pass. Only
 * a near-immediate release may share a strike pose; never erase 0.4 seconds
 * of actual possession to stretch the incoming ball flight to the next kick. */
export function isFirstTimeReception(receive,release,{maxDelay=.16}={}){
 if(!receive||!release||receive.key!==release.key||receive.kind!=='recebe'||release.kind!=='toque'||receive.disabled||release.disabled||receive.hands||receive.goleiro||receive.pickup||release.hands)return false;
 const delay=release.t-receive.t;
 return Number.isFinite(delay)&&delay>=-1e-7&&delay<=maxDelay+1e-7;
}
