import { outputShapeKey, parentShapeKey, SchemaTypes } from '../types';
import BaseTypeRef from './base';

export default class OutputTypeRef<Types extends SchemaTypes, T, P = T> extends BaseTypeRef<Types> {
  override kind;

  [outputShapeKey]!: T;
  [parentShapeKey]!: P;

  constructor(
    builder: PothosSchemaTypes.SchemaBuilder<Types>,
    kind: 'Enum' | 'Interface' | 'Object' | 'Scalar' | 'Union',
    name: string,
  ) {
    super(builder, kind, name);
    this.kind = kind;
  }
}
