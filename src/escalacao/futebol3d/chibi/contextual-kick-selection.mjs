/** Select existing captured motion from the official delivery, never a new
 * football decision. Height, force and range are separate: a long ground pass
 * is not a chip, and a high shot is not automatically a lob over the keeper. */
export function selectMapKick(cue,{quick=false,moving=false,availablePreparation=Infinity,actorSpeed=3.4}={}){
 const d=cue.delivery??{},technique=d.technique??'',shot=d.family==='shot'||cue.tipo==='chute',high=d.heightBand==='high',low=d.heightBand==='grounded'||d.heightBand==='low';
 let clip,style,adaptation=null,locomotion='planted',contactSpeed=0;
 if(shot){
  style=['cobertura','cavadinha'].includes(technique)?'chipped-shot':technique==='colocado'?'placed-shot':high?'high-shot':low?'low-shot':'mid-height-shot';
  if(style==='chipped-shot')clip='cavadinha';
  else if(quick&&moving||moving&&availablePreparation<.45)clip='chute_corrida';
  else if(style==='placed-shot')clip='passe_chapa';
  else if(technique==='bomba'||technique==='de_longe'||d.powerBand==='strong')clip='chute_forte';
  else clip='chute';
  if(style==='placed-shot')adaptation=clip==='passe_chapa'?'existing-side-foot-capture-with-official-curve':'running-capture-no-dedicated-placed-shot';
  if(['voleio','bicicleta'].includes(technique))adaptation='aerial-technique-not-validated';
 }else if(d.family==='clearance'||cue.tipo==='corte'){
  style=d.trajectory==='air'?'high-clearance':'ground-clearance';clip=quick&&moving?'chute_corrida':'chute_forte';
 }else if(d.trajectory==='air'&&d.verticalSpeed>2){
  style=d.family==='cross'?'aerial-cross':'lofted-pass';
  // Driven crosses have a lower launch angle and a fuller instep follow-through.
  // This reuses a strike capture; there is no dedicated crossing clip in the pack.
  const driven=d.launchAngleDegrees<30&&d.horizontalSpeed>=18;
  clip=driven?(quick&&moving?'chute_corrida':d.powerBand==='strong'?'chute_forte':'chute'):'cavadinha';
  if(d.family==='cross')adaptation='captured-strike-for-cross';
 }else{
  style=d.family==='cross'?'low-cross':d.family==='through'?'through-pass':d.distanceBand==='long'?'long-ground-pass':'short-pass';
  // Continuous ground passes use the existing inside-foot capture with a
  // moving root and a compact timing profile, rather than the running SHOT.
  // The alias shares the source tracks; it is not another imported asset.
  const driven=d.distanceBand==='long'&&d.powerBand==='strong';
  const continuous=moving&&(!driven||quick||availablePreparation<.8);
  clip=continuous?'passe_movimento':d.distanceBand==='long'&&d.powerBand==='strong'?'chute_forte':'passe_chapa';
  if(continuous){adaptation='existing-side-foot-capture-with-continuous-root';locomotion='continuous';contactSpeed=Math.max(1.8,Math.min(3.4,actorSpeed))}
 }
 const preparation=clip==='chute_forte'?'loaded':quick?'first-time':style==='placed-shot'?'side-foot':'balanced';
 return{clip,style,adaptation,preparation,locomotion,contactSpeed,trajectory:d.trajectory??'unknown',heightBand:d.heightBand??'unknown',powerBand:d.powerBand??'unknown',distanceBand:d.distanceBand??'unknown',curve:d.curve??'none',curveRate:d.curveRate??0};
}
