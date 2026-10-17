import { registerDictionary } from '../../i18n';
import HomeObject from '../HomeObject';

export default function EnglishHomeObject({ dictionary }: { dictionary: Record<string, string> }) {
  registerDictionary(dictionary);
  return <HomeObject />;
}
