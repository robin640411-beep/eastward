import {cloudPalette,cloudPixels,skyBands} from './atmosphere.js';
import {lightingAt} from './journey-view-model.js';

// A native texel in a panorama occupies a square on screen, including in battle.
export function paintHorizon(ctx,sheet,region,x,y,scale){
 const [sx,sy,width,height]=region.rect;
 ctx.drawImage(sheet,sx,sy,width,height,Math.round(x),Math.round(y),width*scale,height*scale);
}

function postcardCloud(x,y,variant,palette){
 const spans=cloudPixels(variant).map(([left,top,width,shade])=>
  `<rect x="${left}" y="${top}" width="${width}" height="1" fill="${palette[shade]}"/>`).join('');
 return `<g transform="translate(${x} ${y})" opacity=".72">${spans}</g>`;
}

// The title, ending and gallery share the drive's atlas, sky ramp and cloud sprites.
export function horizonPostcard(region,label,road=false){
 const height=road?112:94,light=lightingAt(road?405:510);
 const sky=skyBands(light).map(({y,h,color})=>
  `<rect y="${Math.round(y/2)}" width="256" height="${Math.round((y+h)/2)-Math.round(y/2)}" fill="${color}"/>`).join('');
 const palette=cloudPalette(true,0,light.light);
 const clouds=[[10,18,2],[107,7,1],[184,28,0],[235,12,2]].map(([x,y,v])=>postcardCloud(x,y,v,palette)).join('');
 const ground=road?'<path fill="#788275" d="M0 94h256v2H0z"/><path fill="#3a4648" d="M0 96h256v16H0z"/><path fill="#a49d7f" d="M0 108h23v1H0zm49 0h31v1H49zm64 0h31v1h-31zm64 0h31v1h-31zm64 0h15v1h-15z"/>':'';
 return `<svg class="pixel-panorama" viewBox="0 0 256 ${height}" role="img" aria-label="${label}" shape-rendering="crispEdges" style="image-rendering:pixelated">
  ${sky}<path fill="${light.sun}" d="M208 15h5v1h2v2h1v5h-1v2h-2v1h-5v-1h-2v-2h-1v-5h1v-2h2z"/>${clouds}
  <svg y="${road?28:18}" width="256" height="76" overflow="hidden" viewBox="${region.rect.join(' ')}"><image href="assets/${region.image}" width="${region.size[0]}" height="${region.size[1]}"/></svg>
  ${ground}</svg>`;
}
