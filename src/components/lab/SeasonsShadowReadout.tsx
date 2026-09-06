import { t } from '../../i18n';
import type { SeasonsState } from '../../models/seasons';

/** The plate clips only the drawing; this reading always uses the original model length. */
export default function SeasonsShadowReadout({
  shadow,
}: {
  shadow: SeasonsState['solar']['shadow'];
}) {
  const clipped = !!shadow && shadow.length > 3.1;
  return (
    <div className="seasons-phone-shadow-reading" data-clipped={clipped}>
      <span>
        {t('完整影长')}{' '}
        <b>
          {shadow
            ? `${shadow.length > 10000 ? shadow.length.toExponential(1) : shadow.length.toFixed(2)} m`
            : '—'}
        </b>
      </span>
      <span
        className="seasons-phone-shadow-clip"
        aria-hidden={!clipped}
        title={clipped ? t('影子超出刻度盘；读数保留完整长度。') : undefined}
      >
        {t('图示截短')}
      </span>
    </div>
  );
}
