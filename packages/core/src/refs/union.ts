import { SchemaTypes } from '../types';
import { OutputRef, outputShapeKey, parentShapeKey } from '../types/type-params';
import BaseTypeRef from './base';

export default class UnionRef<Types extends SchemaTypes, T, P = T>
  extends BaseTypeRef<Types>
  implements OutputRef, PothosSchemaTypes.UnionRef<Types, T, P>
{
  override kind = 'Union' as const;

  [outputShapeKey]!: T;
  [parentShapeKey]!: P;

  constructor(name: string) {
    super('Union', name);
  }
}
