import { SchemaTypes } from '../types';
import { FieldBuilder } from './builder';

export class ObjectFieldBuilder<Types extends SchemaTypes, ParentShape> extends FieldBuilder<
  Types,
  ParentShape,
  'Object'
> {
  constructor() {
    super('Object', 'Object');
  }
}
