import { PothosSchemaError } from '../errors';
import type { SchemaTypes } from '../types';

export default class BaseTypeRef<Types extends SchemaTypes, T = unknown>
  implements PothosSchemaTypes.BaseTypeRef<Types, T>
{
  builder: PothosSchemaTypes.SchemaBuilder<Types>;

  kind;

  name;

  config: T | null;

  protected pendingActions: ((config: T) => T | void)[] = [];
  private refs: (typeof this)[] = [];

  constructor(
    builder: PothosSchemaTypes.SchemaBuilder<Types>,
    kind:
      | 'Enum'
      | 'InputObject'
      | 'Interface'
      | 'Object'
      | 'Scalar'
      | 'Union'
      | 'List'
      | 'InputList',
    name: string,
    config: T | null = null,
  ) {
    this.builder = builder;
    this.kind = kind;
    this.name = name;
    this.config = config ?? null;
  }

  toString() {
    return `${this.kind}Ref<${this.name}>`;
  }

  onConfig(cb: (config: T) => T | void) {
    this.pendingActions.push(cb);
  }

  toConfig() {
    const { config, refs } = this.allRefs();

    if (!config) {
      throw new PothosSchemaError(`${this} has not been implemented`);
    }

    let merged = config;

    for (const ref of refs) {
      for (const cb of ref.pendingActions) {
        const next = cb(merged);

        if (next) {
          merged = next;
        }
      }
    }

    return merged;
  }

  private allRefs = (
    refs = new Set<BaseTypeRef<Types, T>>(),
  ): RefCollection<BaseTypeRef<Types, T>, T> => {
    const config: T | null = null;

    if (!refs.has(this)) {
      refs.add(this);
      this.refs.forEach((ref) => ref.allRefs(refs));
    }

    return {
      refs,
      config,
    };
  };
}

interface RefCollection<T, C> {
  refs: Set<T>;
  config: C | null;
}
