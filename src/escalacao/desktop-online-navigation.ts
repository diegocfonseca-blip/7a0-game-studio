/** A tab request accompanies the existing “back to menu” action. No room is left. */
export type OnlineDestination='open'|'create'|'join'|'leagues'
let pending:OnlineDestination|null=null
export function requestOnlineDestination(destination:OnlineDestination){pending=destination}
export function peekOnlineDestination(){return pending}
export function clearOnlineDestination(){pending=null}
