import * as T from 'three';
/** Same stadium geometry, ownership and roof controls; only approved map finishes. */
export function acabamentoCompacto(root: T.Object3D) { const palette: Record<string, string> = { 'estrutura-concreto-claro': '#c6c1af', 'espelhos-concreto': '#949b8b', 'passeios-e-lajes': '#cdc5b0', 'caixilhos-grafite': '#243c33', 'cobertura-cinza-curva': '#3b584b', 'juntas-cobertura': '#577062', 'interior-fachada': '#c9b999', 'acabamento-pedra-clara': '#dbd0b6', 'cadeiras-creme':'#d4cbb2', 'cadeiras-grafite':'#43584c', 'cadeiras-vermelho':'#99513d', 'madeira-camarote':'#92724c' }; root.traverse(o => { if (o instanceof T.Mesh)
    for (const m of Array.isArray(o.material) ? o.material : [o.material])
        if (m instanceof T.MeshStandardMaterial && palette[m.name]) {
            m.color.set(palette[m.name]);
            m.roughness = .84;
            m.metalness = .02;
            if(m.name==='cobertura-cinza-curva'){m.emissive.set('#334634');m.emissiveIntensity=.07}
            if(m.name==='caixilhos-grafite'){m.roughness=.7;m.metalness=.08}
        } }); }
