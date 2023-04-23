import {
  FieldMap,
  outputShapeKey,
  parentShapeKey,
  PothosQueryTypeConfig,
  SchemaTypes,
} from '../types';
import { BaseTypeRef } from './base';

export class QueryRef<Types extends SchemaTypes> extends BaseTypeRef<Types, PothosQueryTypeConfig> {
  override kind = 'Object' as const;

  [outputShapeKey]!: Types['Root'];
  [parentShapeKey]!: Types['Root'];

  fields = new Set<() => FieldMap>();

  constructor(name: string) {
    super('Object', name);
  }

  addFields(fields: () => FieldMap) {
    this.fields.add(fields);
  }
}
