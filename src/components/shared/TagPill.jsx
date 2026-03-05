import { TAG_COLORS } from '../../data/constants';
function lighten(hex) {
  try { const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return `rgb(${Math.min(255,r+90)},${Math.min(255,g+90)},${Math.min(255,b+90)})`; }
  catch { return '#aaa'; }
}
export default function TagPill({ tag, small }) {
  const bg = TAG_COLORS[tag]||'#333';
  return (
    <span style={{ background:bg+'28', color:lighten(bg), border:`1px solid ${bg}50`, borderRadius:6, padding: small?'1px 7px':'2px 10px', fontSize: small?10:11, fontWeight:600, letterSpacing:'0.03em', whiteSpace:'nowrap' }}>
      {tag}
    </span>
  );
}
