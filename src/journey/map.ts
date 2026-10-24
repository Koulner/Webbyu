import { networkConnections, stations } from './data';

/** Shared composition for the static overview and its accessible HTML station links. */
export function mapProjection(x:number,z:number,y=0):[number,number] {
  return [500+x*20.4+z*5.2,285+z*35-y*24];
}

let illustrationId=0;
export function landscapeSvg():string {
  const prefix=`journey-network-${++illustrationId}`;
  const points=stations.map(station=>mapProjection(...station.position));
  const colors={content:'#9fbeb7',design:'#c0cbb4',function:'#85b4c6'};
  const definitions=stations.map((station,index)=>`<radialGradient id="${prefix}-field-${index}"><stop stop-color="${station.visual.color}" stop-opacity=".6"/><stop offset=".48" stop-color="${station.visual.color}" stop-opacity=".22"/><stop offset="1" stop-color="${station.visual.color}" stop-opacity="0"/></radialGradient>`).join('');
  const paths=networkConnections.map((edge,index)=>{
    const a=points[edge.from],b=points[edge.to],bend=(index%2?1:-1)*(24+Math.abs(edge.to-edge.from)*6);
    const middle=[(a[0]+b[0])/2,(a[1]+b[1])/2+bend];
    return `<g stroke="${colors[edge.strand]}" fill="none" stroke-linecap="round"><path d="M${a[0]},${a[1]} C${a[0]+(b[0]-a[0])*.25},${a[1]+bend} ${b[0]-(b[0]-a[0])*.25},${b[1]+bend} ${b[0]},${b[1]}" stroke-width="1.4" opacity=".54"/><path d="M${middle[0]-18},${middle[1]-2}q18,3 31,${bend*.45}t27,${bend*.15}" stroke-width=".8" opacity=".3"/></g>`;
  }).join('');
  const fields=stations.map((station,index)=>{
    const [x,y]=points[index];
    return `<g data-field="${station.id}" transform="translate(${x} ${y}) rotate(${index%2?14:-12})"><ellipse rx="114" ry="91" fill="url(#${prefix}-field-${index})"/><ellipse cx="-24" cy="13" rx="88" ry="67" fill="url(#${prefix}-field-${index})" opacity=".5"/></g>`;
  }).join('');
  const previews=stations.map((station,index)=>{
    const [x,y]=points[index];let form='';
    if(station.landmark==='room')form='<path d="M-32,11v-34h60v34M-32,-23l-10,8v34l10-8M-23,11v-14h40v14M-23,-3v-8h40v8M25,-21v32m8-35v32"/>';
    else if(station.landmark==='technical')form='<path d="M-25,17v-49h20v49zm29,0v-34h23v34M9,-9h13M9,-3h13M9,3h13M9,9h13M-21,-21h12M-21,-10h12M-21,1h12M28,11h12l7-10m-7,10 7,10"/>';
    else if(station.landmark==='garden')form='<path d="M0,20V-9M0,-9C-27,-29-21,-44-3,-18M0,-9C25,-28 24,-44 3,-18M0,-9C-10,-41 11,-42 0,-9M-16,24q11-15 12-25m21,25Q6,8 5,-2"/>';
    else if(station.landmark==='furniture')form='<path d="M-25,-3q25-12 50,0q-25,13-50,0M0,3v22M-33,19V1h-12v18m0-18v-18h12V1M33,19V1h12v18m0-18v-18H33V1M-29,-30h58v-11"/>';
    else if(station.landmark==='atelier')form='<path d="M-36,11l18-10 18,9-18,11zm24-18 18-10L24,-8 6,3zm24,18L30,1l18,9-18,11M-18,-9v-17H30v17M6,-17v-15"/>';
    else if(station.landmark==='future')form='<path d="M-38,15l38-18 38,18L0,32zM-27,-1v-27h18v20M-1,-9v-25h18v25M25,-4v-23h18V4"/>';
    else form='<path d="M-35,7l15-7 18,8-15,7zm25-16 15-7 18,8-15,7zm24,16 15-7 18,8-15,7M-22,-16v-11h44v11"/>';
    return `<g transform="translate(${x} ${y-9})" stroke="#e8eee3" stroke-width="1.7" fill="none" opacity=".7" stroke-linejoin="round">${form}</g>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 580" fill="none" aria-hidden="true" focusable="false"><defs>${definitions}</defs>${fields}${paths}${previews}</svg>`;
}
