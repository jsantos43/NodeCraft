import React from 'react';

/**
 * NodeCraft brand mark — pixel-art diamond pickaxe.
 * Ported from the Claude Design "NodeCraft Logo" `nc-pick` symbol.
 * Rendered on a 16×16 grid with crisp edges so it scales to any size.
 */

// palette
const O = '#1B2430'; // outline
const H = '#BDEBF7'; // highlight
const D = '#63C2E6'; // diamond
const M = '#46A6D4'; // mid diamond
const K = '#2E7FB0'; // dark diamond
const W = '#8A5E32'; // wood mid
const w = '#A9763F'; // wood light
const d = '#5E3F20'; // wood dark
const s = '#EAFBFF'; // sparkle

// [x, y, color]
const PIXELS = [
  // outline
  [5,2,O],[6,1,O],[5,1,O],[7,1,O],[8,1,O],[9,1,O],[10,1,O],[11,2,O],[11,1,O],
  [4,3,O],[5,4,O],[4,2,O],[4,4,O],[12,2,O],[13,2,O],[14,3,O],[14,4,O],[14,2,O],
  [6,5,O],[7,5,O],[5,5,O],[8,5,O],[9,5,O],[14,5,O],[8,6,O],[11,7,O],[15,6,O],
  [15,7,O],[15,5,O],[7,7,O],[7,6,O],[10,8,O],[11,8,O],[15,8,O],[6,8,O],[6,7,O],
  [9,9,O],[10,9,O],[11,9,O],[15,9,O],[5,9,O],[5,8,O],[8,10,O],[9,10,O],[11,10,O],
  [15,10,O],[4,10,O],[4,9,O],[7,11,O],[8,11,O],[12,11,O],[11,11,O],[14,11,O],
  [15,11,O],[3,11,O],[3,10,O],[6,12,O],[7,12,O],[13,12,O],[14,12,O],[12,12,O],
  [2,12,O],[2,11,O],[5,13,O],[6,13,O],[1,13,O],[1,12,O],[1,14,O],[4,14,O],[5,14,O],
  [2,15,O],[3,15,O],[1,15,O],[4,15,O],
  // diamond head + wood handle
  [6,2,H],[7,2,H],[8,2,H],[9,2,H],[10,2,D],[5,3,D],[6,3,M],[7,3,D],[8,3,M],[9,3,D],
  [10,3,M],[11,3,H],[12,3,w],[13,3,d],[6,4,D],[7,4,K],[8,4,K],[9,4,K],[10,4,D],
  [11,4,M],[12,4,W],[13,4,d],[10,5,w],[11,5,D],[12,5,M],[13,5,K],[9,6,w],[10,6,W],
  [11,6,K],[12,6,D],[13,6,M],[14,6,D],[8,7,w],[9,7,w],[10,7,d],[12,7,H],[13,7,D],
  [14,7,K],[7,8,w],[8,8,W],[9,8,d],[12,8,H],[13,8,M],[14,8,K],[6,9,w],[7,9,w],
  [8,9,d],[12,9,H],[13,9,D],[14,9,K],[5,10,w],[6,10,W],[7,10,d],[12,10,D],[13,10,M],
  [14,10,K],[4,11,w],[5,11,w],[6,11,d],[13,11,D],[3,12,w],[4,12,W],[5,12,d],
  [2,13,w],[3,13,w],[4,13,d],[2,14,d],[3,14,d],
  // sparkles
  [7,3,s],[13,6,s],
];

export default function PickaxeIcon({ size = 24, className = '', style, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      className={className}
      style={style}
      aria-hidden="true"
      {...props}
    >
      {PIXELS.map(([x, y, fill], i) => (
        <rect key={i} x={x} y={y} width={1} height={1} fill={fill} />
      ))}
    </svg>
  );
}
