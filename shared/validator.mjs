import { readFileSync } from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validators = new Map();
export function validateContract(name, data) {
  if (!/^[A-Za-z]+$/.test(name)) throw new Error('Invalid contract name');
  if (!validators.has(name)) {
    const schema = JSON.parse(readFileSync(new URL(`./contracts/${name}.json`, import.meta.url), 'utf8'));
    validators.set(name, ajv.compile(schema));
  }
  const validate = validators.get(name);
  if (!validate(data)) throw new Error(`Invalid ${name}: ${ajv.errorsText(validate.errors)}`);
  return data;
}
