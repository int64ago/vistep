import type { ComponentProps } from 'react';
import { registerDictionary } from '../../i18n';
import Experiment from '../Experiment';

export default function EnglishExperiment({
  dictionary,
  ...props
}: ComponentProps<typeof Experiment> & { dictionary: Record<string, string> }) {
  registerDictionary(dictionary);
  return <Experiment {...props} />;
}
