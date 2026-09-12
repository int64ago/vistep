import { memo } from 'react';
import { t } from '../../i18n';
import { helicopterArtwork, HELICOPTER_COVER_VISUAL } from '../../models/helicopter-cover';
const artwork = helicopterArtwork(160, 95, { ...HELICOPTER_COVER_VISUAL, phase: 0 }, true);
/** Fixed location guide, explicitly distinct from the live magnified camera. */
export default memo(function HelicopterLocator({ section }: { section: boolean }) {
  return (
    <div className="helicopter-locator">
      <span>{t(section ? '桨叶剖切近看' : '桨根近看')}</span>
      <svg viewBox="0 0 160 95" aria-hidden="true">
        {artwork.paths.map((p) => (
          <path key={p.part} d={p.d} fill={p.fill} stroke={p.fill} strokeWidth=".2" />
        ))}
        <circle
          cx={(section ? artwork.sectionLocation : artwork.rootLocation)[0]}
          cy={(section ? artwork.sectionLocation : artwork.rootLocation)[1]}
          r={section ? 13 : 18}
          fill="none"
          stroke="#a96e39"
          strokeWidth="1.3"
          strokeDasharray="3 3"
        />
      </svg>
      <small>{t('观察部位')}</small>
    </div>
  );
});
