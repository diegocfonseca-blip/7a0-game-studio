/** Decorative representatives, never attendance, income or new purchases. */
export function cityPopulation({enabled=false,supporters=0,built=0,mobile=false}={}){
 if(!enabled||!Number.isFinite(supporters)||supporters<=0)return 0;
 const growth=Math.floor(Math.log2(1+supporters/12000)*4)+Math.max(0,Math.floor(built));
 return Math.min(mobile?10:24,Math.max(2,2+growth));
}
