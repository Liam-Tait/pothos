import { InputFieldMap, inputShapeKey, SchemaTypes } from '../types';
import { BaseTypeRef } from './base';

export class InputTypeRef<Types extends SchemaTypes, T> extends BaseTypeRef<Types> {
  override kind;

  [inputShapeKey]!: T;

  private fields = new Set<() => InputFieldMap>();

  constructor(kind: 'Enum' | 'InputObject' | 'Scalar', name: string) {
    super(kind, name);
    this.kind = kind;
  }

  addFields(fields: () => InputFieldMap) {
    this.fields.add(fields);
  }
}
