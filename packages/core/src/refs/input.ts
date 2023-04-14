import { inputShapeKey, SchemaTypes } from '../types';
import BaseTypeRef from './base';

export default class InputTypeRef<Types extends SchemaTypes, T> extends BaseTypeRef<Types> {
  override kind;

  [inputShapeKey]!: T;

  constructor(
    builder: PothosSchemaTypes.SchemaBuilder<Types>,
    kind: 'Enum' | 'InputObject' | 'Scalar',
    name: string,
  ) {
    super(builder, kind, name);
    this.kind = kind;
  }
}
