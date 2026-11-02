const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};

/** Blend the approach into the already captured foot action, then release a
 * reception into running when the ball rolls away. The ball stays read-only.
 * Exact impact and striking follow-through must never be faded by distance. */
export function footActionProximity({kind,region,time,contactAt,distance,reach=.4}){
 if(!['left','right'].includes(region)||!['recebe','toque'].includes(kind)||![time,contactAt,distance,reach].every(Number.isFinite))return 1;
 const near=Math.max(.75,reach+.25),proximity=1-smooth((distance-near)/.7);
 if(time<contactAt)return 1-(1-proximity)*smooth((contactAt-time-.04)/.12);
 if(kind==='recebe')return 1-(1-proximity)*smooth((time-contactAt-.06)/.12);
 return 1;
}
