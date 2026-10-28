/** Decorative representatives, never attendance, income or new purchases. */
// 🏙️ 28/10 (Diego: "a cidade está muito vazia… tem que ter ligação com o número de torcedores"): a cidade nunca fica deserta
// (clube novo já tem ~10 pessoas na rua) e cresce com a torcida — dobrou a torcida, +6 pessoas — e com cada obra pronta (+2).
// Teto pra não pesar: 48 no computador, 20 no celular
export function cityPopulation({enabled=false,supporters=0,built=0,mobile=false}={}){
 if(!enabled||!Number.isFinite(supporters)||supporters<=0)return 0;
 const growth=Math.floor(Math.log2(1+supporters/3000)*6)+2*Math.max(0,Math.floor(built));
 return Math.min(mobile?20:48,10+growth);
}
