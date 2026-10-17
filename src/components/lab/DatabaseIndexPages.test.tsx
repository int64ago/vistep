import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DiComparePlans, DiPhoneFilm } from './DatabaseIndexPages';
import { diFilm, diQuery, diShot } from '../../models/database-index';

describe('database comparison shows only completed access history', () => {
  const film = diFilm();
  const desktop = (progress: number) =>
    renderToStaticMarkup(
      <DiComparePlans
        tree={film.base}
        index={diQuery(film.base, film.point)}
        scan={diQuery(film.base, film.point, film.point, 'scan')}
        progress={progress}
      />,
    );
  const phone = (chapter: number, progress: number) =>
    renderToStaticMarkup(<DiPhoneFilm film={film} shot={diShot(film, chapter, progress)} />);
  it.each([0, 0.25, 0.5])('does not claim a final result at progress %s', (progress) => {
    for (const markup of [desktop(progress), phone(3, progress), phone(7, progress)]) {
      expect(markup).toContain('data-comparison-state="pending"');
      expect(markup).toContain('查询进行中');
      expect(markup).not.toContain('最终结果逐行一致');
    }
  });
  it('checks current row identities at completion and reconstructs an earlier seek', () => {
    for (const markup of [desktop(1), phone(3, 1), phone(7, 1)]) {
      expect(markup).toContain('data-comparison-state="equal"');
      expect(markup).toContain('最终结果逐行一致');
    }
    expect(desktop(0)).toContain('data-comparison-state="pending"');
    expect(phone(7, 0)).toContain('data-comparison-state="pending"');
  });
  it('does not report agreement when completed plans return different row identities', () => {
    const index = diQuery(film.base, film.point),
      scan = diQuery(film.base, film.point, film.point, 'scan');
    scan.steps.at(-1)!.found = [index.rows[0].rowId + 1];
    const markup = renderToStaticMarkup(
      <DiComparePlans tree={film.base} index={index} scan={scan} progress={1} />,
    );
    expect(markup).toContain('data-comparison-state="different"');
    expect(markup).not.toContain('最终结果逐行一致');
  });
});
