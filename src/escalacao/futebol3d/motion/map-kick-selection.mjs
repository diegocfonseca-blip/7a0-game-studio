/** Select existing captured motion from the official delivery, never a new
 * football decision. Height, force and range are separate: a long ground pass
 * is not a chip, and a high shot is not automatically a lob over the keeper. */
export function selectMapKick(cue,{quick=false,moving=false}={}){
 const d=cue.delivery??{},technique=d.technique??'',shot=d.family==='shot'||cue.tipo==='chute',high=d.heightBand==='high',low=d.heightBand==='grounded'||d.heightBand==='low';
 let clip,style,adaptation=null;
 if(shot){
  style=['cobertura','cavadinha'].includes(technique)?'chipped-shot':technique==='colocado'?'placed-shot':high?'high-shot':low?'low-shot':'mid-height-shot';
  if(style==='chipped-shot')clip='cavadinha';
  else if(quick&&moving)clip='chute_corrida';
  else if(technique==='bomba'||technique==='de_longe'||d.powerBand==='strong')clip='chute_forte';
  else clip='chute';
  if(style==='placed-shot')adaptation='captured-strike-with-official-curve';
  if(['voleio','bicicleta'].includes(technique))adaptation='aerial-technique-not-validated';
 }else if(d.family==='clearance'||cue.tipo==='corte'){
  style=d.trajectory==='air'?'high-clearance':'ground-clearance';clip=quick&&moving?'chute_corrida':'chute_forte';
 }else if(d.trajectory==='air'&&d.verticalSpeed>2){
  style=d.family==='cross'?'aerial-cross':'lofted-pass';
  // Driven crosses have a lower launch angle and a fuller instep follow-through.
  // This reuses a strike capture; there is no dedicated crossing clip in the pack.
  clip=d.family==='cross'&&d.launchAngleDegrees<26&&d.horizontalSpeed>=18?(quick?'chute_corrida':'chute'):'cavadinha';
  if(d.family==='cross')adaptation='captured-strike-for-cross';
 }else{
  style=d.family==='cross'?'low-cross':d.family==='through'?'through-pass':d.distanceBand==='long'?'long-ground-pass':'short-pass';
  // "passe_curto" is actually Low Kick To Idle Transition in the source pack.
  // Its recovery starts too early for a readable football pass. Use the real
  // Soccer Pass From Idle Pose capture for short deliveries instead.
  clip=d.distanceBand==='long'?'passe_chapa':(d.distanceBand==='short'&&d.powerBand==='soft')||quick||moving?'passe':'passe_chapa';
 }
 return{clip,style,adaptation,trajectory:d.trajectory??'unknown',heightBand:d.heightBand??'unknown',powerBand:d.powerBand??'unknown',distanceBand:d.distanceBand??'unknown'};
}
