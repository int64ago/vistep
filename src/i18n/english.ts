import english from './en.json';
import { registerDictionary } from './index';
registerDictionary(english as Record<string, string>);
