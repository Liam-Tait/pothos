import {
  FieldMap,
  outputShapeKey,
  parentShapeKey,
  PothosSubscriptionTypeConfig,
  SchemaTypes,
} from '../types';
import { BaseTypeRef } from './base';

export class SubscriptionRef<Types extends SchemaTypes> extends BaseTypeRef<
  Types,
  PothosSubscriptionTypeConfig
> {
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
