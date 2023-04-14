import type { PothosUnionTypeConfig, SchemaTypes } from '../types';
import { OutputRef, outputShapeKey, parentShapeKey } from '../types/type-params';
import BaseTypeRef from './base';

export default class UnionRef<Types extends SchemaTypes, T, P = T>
  extends BaseTypeRef<Types, PothosUnionTypeConfig>
  implements OutputRef, PothosSchemaTypes.UnionRef<Types, T, P>
{
  override kind = 'Union' as const;

  [outputShapeKey]!: T;
  [parentShapeKey]!: P;

  constructor(builder: PothosSchemaTypes.SchemaBuilder<Types>, name: string) {
    super(builder, 'Union', name);
  }
}
