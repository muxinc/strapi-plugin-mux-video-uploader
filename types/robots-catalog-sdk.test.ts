import path from 'node:path';

import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { ROBOTS_CATALOG } from './robots-catalog';

/** Where the generated check claims to live, so `@mux/ts` resolves from this package's node_modules. */
const CHECK_FILE = path.join(__dirname, '__robots-catalog-sdk-check__.ts');

/**
 * TypeScript that assigns each v1 workflow's parameter names to the dotted paths of that workflow's
 * `create()` parameters in `@mux/ts`. The service sends parameters as a plain object, so this is what
 * notices a parameter the SDK doesn't have.
 */
function checkSource(): string {
  const assignments = ROBOTS_CATALOG.filter((definition) => !definition.legacy).map((definition) => {
    const names = definition.params.filter((field) => !field.formOnly).map((field) => JSON.stringify(field.name));
    return `export const ${definition.sdkKey}: ParamPath<V1Parameters<'${definition.sdkKey}'>>[] = [${names.join(', ')}];`;
  });

  return [
    "import type Mux from '@mux/ts';",
    "type V1Jobs = Mux['robots']['jobs'];",
    'type V1Parameters<K extends keyof V1Jobs> = V1Jobs[K] extends { create(body: infer B, ...rest: any[]): any }',
    '  ? B extends { parameters: infer P } ? P : never',
    '  : never;',
    'type ParamPath<T> = { [K in keyof T & string]-?: NonNullable<T[K]> extends readonly unknown[]',
    '  ? K',
    '  : NonNullable<T[K]> extends object ? K | `${K}.${ParamPath<NonNullable<T[K]>>}` : K }[keyof T & string];',
    ...assignments,
  ].join('\n');
}

function typeErrors(source: string): string[] {
  const options: ts.CompilerOptions = {
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    types: [],
    module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.Node10,
    target: ts.ScriptTarget.ES2020,
  };
  const host = ts.createCompilerHost(options);
  const { getSourceFile, fileExists } = host;
  host.getSourceFile = (fileName, languageVersion, ...rest) =>
    fileName === CHECK_FILE
      ? ts.createSourceFile(fileName, source, languageVersion)
      : getSourceFile.call(host, fileName, languageVersion, ...rest);
  host.fileExists = (fileName) => fileName === CHECK_FILE || fileExists.call(host, fileName);

  const program = ts.createProgram([CHECK_FILE], options, host);
  return ts
    .getPreEmitDiagnostics(program)
    .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
}

describe('the catalog against @mux/ts', () => {
  it('sends only parameters the SDK has for Robots v1', () => {
    expect(typeErrors(checkSource())).toEqual([]);
  });

  it('notices a parameter the SDK does not have', () => {
    const source = checkSource().replace('"include_transcript"', '"include_transcripts"');
    expect(typeErrors(source).join('\n')).toContain('"include_transcripts"');
  });
});
