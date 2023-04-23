import { PothosSchemaError } from '../errors';
import type { SchemaTypes } from '../types';

export class BaseTypeRef<Types extends SchemaTypes, T = unknown>
  implements PothosSchemaTypes.BaseTypeRef<Types, T>
{
  kind;

  name;

  association: BaseTypeRef<Types, T> | string | null = null;

  protected pendingActions: ((
    config: T,
    builder: PothosSchemaTypes.SchemaBuilder<Types>,
  ) => T | void)[] = [];

  private createConfig: ((builder: PothosSchemaTypes.SchemaBuilder<Types>) => T) | null = null;

  constructor(
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
  ) {
    this.kind = kind;
    this.name = name;
  }

  toString() {
    return `${this.kind}Ref<${this.name}>`;
  }

  associate(ref: BaseTypeRef<Types, T> | string) {
    if (this.association && typeof this.associate !== 'string') {
      throw new PothosSchemaError(`${this} is already associated with ${this.association}`);
    }

    this.association = ref;
  }

  onConfig(cb: (config: T, builder: PothosSchemaTypes.SchemaBuilder<Types>) => T | void) {
    this.pendingActions.push(cb);
  }

  toConfig(builder: PothosSchemaTypes.SchemaBuilder<Types>) {
    if (!this.createConfig) {
      throw new PothosSchemaError(`${this} has not been implemented`);
    }

    const config = this.createConfig(builder);

    return this.pendingActions.reduce((cfg, cb) => cb(cfg, builder) ?? cfg, config);
  }

  initConfig(configOrFn: T | ((builder: PothosSchemaTypes.SchemaBuilder<Types>) => T)) {
    if (this.createConfig) {
      throw new PothosSchemaError(`${this} has already been implemented`);
    }

    this.createConfig =
      typeof configOrFn === 'function' ? (configOrFn as () => T) : () => configOrFn;
  }
}
