import type { PothosUnionTypeConfig, SchemaTypes } from '../types';
import { ObjectParam, OutputRef, outputShapeKey, parentShapeKey } from '../types/type-params';
import { BaseTypeRef } from './base';

export class UnionRef<Types extends SchemaTypes, T, P = T>
  extends BaseTypeRef<Types, PothosUnionTypeConfig>
  implements OutputRef, PothosSchemaTypes.UnionRef<Types, T, P>
{
  override kind = 'Union' as const;

  [outputShapeKey]!: T;
  [parentShapeKey]!: P;

  private types = new Set<() => ObjectParam<Types>[]>();

  constructor(name: string) {
    super('Union', name);
  }

  addTypes(types: (() => ObjectParam<Types>[]) | ObjectParam<Types>[]) {
    this.types.add(() => (Array.isArray(types) ? types : types()));
  }

  override toConfig(builder: PothosSchemaTypes.SchemaBuilder<Types>) {
    const config = super.toConfig(builder);

    return {
      ...config,
      // types: this.getTypes(config),
    };
  }

  getTypes() {
    return [...this.types].reduce<ObjectParam<SchemaTypes>[]>(
      (all, types) => [...all, ...(types() as ObjectParam<SchemaTypes>[])],
      [],
    );
  }
}
