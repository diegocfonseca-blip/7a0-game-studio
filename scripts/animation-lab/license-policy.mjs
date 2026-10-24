// A positive flag cannot override a conflicting license identifier. This is
// a consistency check, not a substitute for reading the actual source terms.
export function assertCommercialLicense(license){
  if(license?.commercial!==true||typeof license.id!=='string'||!license.id.trim())throw Error('Origem e permissão comercial obrigatórias');
  const restricted=/\b(?:NC|ND)\b|non[\s_-]*commercial|non[\s_-]*derivative|research[\s_-]*only|evaluation/i;
  if(restricted.test(license.id))throw Error('Licença incompatível com uso comercial e retargeting: '+license.id);
}
